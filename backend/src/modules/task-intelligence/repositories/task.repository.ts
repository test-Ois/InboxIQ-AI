import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma, Task } from '@prisma/client';

@Injectable()
export class TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Checks if a task is a duplicate based on:
   * 1. Same emailId (or existing task already linked to the same email)
   * OR
   * 2. Same normalized title + dueDate
   */
  async findDuplicate(
    userId: string,
    emailId?: string | null,
    title?: string,
    dueDate?: Date | null,
  ): Promise<Task | null> {
    // Condition 1 & 3: Check if there's already a task linked to this email
    if (emailId) {
      const existingEmailTask = await this.prisma.task.findFirst({
        where: {
          userId,
          emailId,
        },
      });
      if (existingEmailTask) {
        return existingEmailTask;
      }
    }

    // Condition 2: Same normalized title + dueDate
    if (title) {
      const normalizedTitle = title.trim().toLowerCase();
      // Fetch candidate tasks for same user and dueDate
      const candidateTasks = await this.prisma.task.findMany({
        where: {
          userId,
          dueDate: dueDate
            ? {
                equals: dueDate,
              }
            : null,
        },
      });

      for (const task of candidateTasks) {
        if (task.title.trim().toLowerCase() === normalizedTitle) {
          return task;
        }
      }
    }

    return null;
  }

  /**
   * Saves a new task after performing repository-level duplicate check.
   */
  async create(data: Prisma.TaskUncheckedCreateInput): Promise<Task> {
    const isDuplicate = await this.findDuplicate(
      data.userId,
      data.emailId,
      data.title,
      data.dueDate ? new Date(data.dueDate) : null,
    );

    if (isDuplicate) {
      throw new Error(`Duplicate task detected: already exists for user ${data.userId}`);
    }

    return this.prisma.task.create({ data });
  }

  /**
   * Retrieves a task by its unique ID.
   */
  async findUnique(id: string): Promise<Task | null> {
    return this.prisma.task.findUnique({
      where: { id },
    });
  }

  /**
   * Retrieves a task by criteria, optionally including related entities.
   */
  async findFirst(where: Prisma.TaskWhereInput, include?: Prisma.TaskInclude): Promise<Task | null> {
    return this.prisma.task.findFirst({
      where,
      include,
    });
  }

  /**
   * Queries paginated, sorted, and filtered task records.
   */
  async findMany(params: {
    where: Prisma.TaskWhereInput;
    orderBy?: Prisma.TaskOrderByWithRelationInput;
    skip?: number;
    take?: number;
    include?: Prisma.TaskInclude;
  }): Promise<Task[]> {
    return this.prisma.task.findMany(params);
  }

  /**
   * Counts tasks matching filter parameters.
   */
  async count(where: Prisma.TaskWhereInput): Promise<number> {
    return this.prisma.task.count({ where });
  }

  /**
   * Updates task details.
   */
  async update(id: string, data: Prisma.TaskUpdateInput): Promise<Task> {
    return this.prisma.task.update({
      where: { id },
      data,
    });
  }

  /**
   * Deletes a task by ID.
   */
  async delete(id: string): Promise<Task> {
    return this.prisma.task.delete({
      where: { id },
    });
  }
}
