import { Injectable, Logger } from '@nestjs/common';
import { TaskRepository } from '../repositories/task.repository';
import { TaskStatus, TaskSource } from '@prisma/client';

@Injectable()
export class TaskAnalyticsService {
  private readonly logger = new Logger(TaskAnalyticsService.name);

  constructor(private readonly repository: TaskRepository) {}

  /**
   * Aggregates productivity analytics for a specific user.
   */
  async getTaskStats(userId: string) {
    const now = new Date();

    // 1. Total tasks created
    const totalCreated = await this.repository.count({ userId });

    // 2. Total completed tasks
    const totalCompleted = await this.repository.count({
      userId,
      status: TaskStatus.COMPLETED,
    });

    // 3. Completion percentage
    const completionPercentage = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;

    // 4. Average completion time (milliseconds)
    const completedTasks = await this.repository.findMany({
      where: {
        userId,
        status: TaskStatus.COMPLETED,
        completedAt: { not: null },
      },
    });

    let averageCompletionTimeMs = 0;
    if (completedTasks.length > 0) {
      const sumDiffMs = completedTasks.reduce((sum, task) => {
        const diff = task.completedAt!.getTime() - task.createdAt.getTime();
        return sum + diff;
      }, 0);
      averageCompletionTimeMs = Math.round(sumDiffMs / completedTasks.length);
    }

    // 5. Overdue rate
    const overdueCount = await this.repository.count({
      userId,
      status: { not: TaskStatus.COMPLETED },
      dueDate: { lt: now },
    });

    const overdueRate = totalCreated > 0 ? Math.round((overdueCount / totalCreated) * 100) : 0;

    // 6. AI generated tasks today (UTC)
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const aiGeneratedToday = await this.repository.count({
      userId,
      source: { in: [TaskSource.EMAIL, TaskSource.AI_GENERATED] },
      createdAt: { gte: startOfToday },
    });

    // Other counts for widgets:
    // Due Today: pending/in_progress tasks with dueDate within today's range
    const startOfTodayLocal = new Date();
    startOfTodayLocal.setHours(0, 0, 0, 0);
    const endOfTodayLocal = new Date();
    endOfTodayLocal.setHours(23, 59, 59, 999);

    const dueToday = await this.repository.count({
      userId,
      status: { not: TaskStatus.COMPLETED },
      dueDate: {
        gte: startOfTodayLocal,
        lte: endOfTodayLocal,
      },
    });

    // Upcoming Deadlines (due tomorrow or later, not completed)
    const upcomingDeadlines = await this.repository.count({
      userId,
      status: { not: TaskStatus.COMPLETED },
      dueDate: {
        gt: endOfTodayLocal,
      },
    });

    // High Priority Tasks (HIGH or CRITICAL, not completed)
    const highPriorityTasks = await this.repository.count({
      userId,
      status: { not: TaskStatus.COMPLETED },
      priority: { in: ['HIGH', 'CRITICAL'] },
    });

    return {
      metrics: {
        totalCreated,
        totalCompleted,
        completionPercentage,
        averageCompletionTimeMs,
        overdueCount,
        overdueRate,
        aiGeneratedToday,
      },
      widgets: {
        myTasks: await this.repository.count({ userId, status: { not: TaskStatus.COMPLETED } }),
        dueToday,
        upcomingDeadlines,
        overdueTasks: overdueCount,
        completedTasks: totalCompleted,
        highPriorityTasks,
        aiGeneratedToday,
      },
    };
  }
}
