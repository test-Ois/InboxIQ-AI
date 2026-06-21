import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { TaskRepository } from '../repositories/task.repository';
import { Task, TaskStatus, TaskPriority, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaskUpdatedEvent, TaskCompletedEvent } from '../events/task-events';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    private readonly repository: TaskRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Simple regex-based HTML/script tag stripping for input sanitization.
   */
  private sanitize(str?: string | null): string | null {
    if (str === undefined || str === null) return null;
    return str.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Retrieves paginated, sorted, and filtered tasks for a user.
   */
  async getTasks(
    userId: string,
    filters: {
      page?: number;
      limit?: number;
      search?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.TaskWhereInput = {
      userId,
    };

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.priority) {
      whereClause.priority = filters.priority;
    }

    if (filters.search) {
      whereClause.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Determine sorting field and order
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    const orderBy: Prisma.TaskOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [tasks, total] = await Promise.all([
      this.repository.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limit,
        include: {
          email: {
            select: {
              subject: true,
              sender: true,
              receivedAt: true,
            },
          },
        },
      }),
      this.repository.count(whereClause),
    ]);

    return {
      tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves a single task and verifies user authorization.
   */
  async getTaskById(userId: string, taskId: string): Promise<Task> {
    const task = await this.repository.findUnique(taskId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('You are not authorized to access this task');
    }

    return task;
  }

  /**
   * Updates task details, handles completedAt transitions, and emits appropriate events.
   */
  async updateTask(
    userId: string,
    taskId: string,
    data: {
      title?: string;
      description?: string;
      priority?: TaskPriority;
      status?: TaskStatus;
      dueDate?: Date | string | null;
    },
  ): Promise<Task> {
    const task = await this.getTaskById(userId, taskId);

    const updateData: Prisma.TaskUpdateInput = {};

    if (data.title !== undefined) {
      updateData.title = this.sanitize(data.title) || 'Untitled Task';
    }

    if (data.description !== undefined) {
      updateData.description = this.sanitize(data.description);
    }

    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }

    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;

      // Handle Completed state transitions
      if (data.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
        const completedAt = new Date();
        updateData.completedAt = completedAt;

        // Emit completion event
        this.eventEmitter.emit('task.completed', new TaskCompletedEvent(userId, taskId, completedAt));
      } else if (data.status !== TaskStatus.COMPLETED && task.status === TaskStatus.COMPLETED) {
        updateData.completedAt = null;
      }
    }

    const updatedTask = await this.repository.update(taskId, updateData);

    // Emit general task updated event
    if (data.status) {
      this.eventEmitter.emit('task.updated', new TaskUpdatedEvent(userId, taskId, data.status));
    }

    return updatedTask;
  }

  /**
   * Deletes a task after verifying user authorization.
   */
  async deleteTask(userId: string, taskId: string): Promise<Task> {
    await this.getTaskById(userId, taskId);
    return this.repository.delete(taskId);
  }
}
