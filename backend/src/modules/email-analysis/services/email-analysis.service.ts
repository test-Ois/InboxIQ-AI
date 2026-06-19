import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EmailAnalysisRepository } from '../repositories/email-analysis.repository';

@Injectable()
export class EmailAnalysisService {
  private readonly logger = new Logger(EmailAnalysisService.name);

  // In-memory monitoring metrics
  private totalAnalysesCount = 0;
  private failedAnalysesCount = 0;
  private totalProcessingTimeMs = 0;

  constructor(private readonly repository: EmailAnalysisRepository) {}

  /**
   * Tracks a successful analysis event.
   */
  trackSuccess(processingTimeMs: number) {
    this.totalAnalysesCount++;
    this.totalProcessingTimeMs += processingTimeMs;
  }

  /**
   * Tracks a failed analysis event.
   */
  trackFailure() {
    this.failedAnalysesCount++;
  }

  /**
   * Returns internal monitoring statistics.
   */
  getMonitoringStats() {
    const avgTime = this.totalAnalysesCount > 0 ? Math.round(this.totalProcessingTimeMs / this.totalAnalysesCount) : 0;

    return {
      totalAnalyses: this.totalAnalysesCount,
      failedAnalyses: this.failedAnalysesCount,
      averageProcessingTimeMs: avgTime,
    };
  }

  /**
   * Retrieves paginated, filtered analysis records for a user.
   */
  async getAnalyses(
    userId: string,
    filters: {
      page?: number;
      limit?: number;
      category?: string;
      priority?: string;
      actionRequired?: boolean;
    },
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      email: {
        userId,
      },
    };

    if (filters.category) {
      whereClause.category = filters.category;
    }

    if (filters.priority) {
      whereClause.priority = filters.priority;
    }

    if (typeof filters.actionRequired === 'boolean') {
      whereClause.actionRequired = filters.actionRequired;
    }

    const [analyses, total] = await Promise.all([
      this.repository.findMany({
        where: whereClause,
        orderBy: { analyzedAt: 'desc' },
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
      analyses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves single email analysis record.
   */
  async getAnalysisByEmailId(userId: string, emailId: string) {
    const analysis = await this.repository.findFirst(
      {
        emailId,
        email: {
          userId,
        },
      },
      {
        email: true,
      },
    );

    if (!analysis) {
      throw new NotFoundException('Analysis record for this email not found');
    }

    return analysis;
  }

  /**
   * Aggregates AI stats for the UI Dashboard widgets.
   */
  async getAnalysisStats(userId: string) {
    const whereClause = {
      email: {
        userId,
      },
    };

    // Calculate critical count
    const criticalCount = await this.repository.count({
      ...whereClause,
      priority: 'Critical',
    });

    // Calculate high count
    const highCount = await this.repository.count({
      ...whereClause,
      priority: 'High',
    });

    // Calculate action required count
    const actionRequiredCount = await this.repository.count({
      ...whereClause,
      actionRequired: true,
    });

    // Calculate upcoming deadlines (e.g. deadline >= today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingDeadlinesCount = await this.repository.count({
      ...whereClause,
      deadline: {
        gte: today,
      },
    });

    return {
      criticalEmails: criticalCount,
      highPriorityEmails: highCount,
      actionRequiredEmails: actionRequiredCount,
      upcomingDeadlines: upcomingDeadlinesCount,
    };
  }
}
