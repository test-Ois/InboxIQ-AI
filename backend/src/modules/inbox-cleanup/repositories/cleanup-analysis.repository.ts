import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma, CleanupAnalysis, CleanupCategory } from '@prisma/client';

@Injectable()
export class CleanupAnalysisRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Saves a new cleanup analysis report.
   */
  async create(data: Prisma.CleanupAnalysisUncheckedCreateInput): Promise<CleanupAnalysis> {
    return this.prisma.cleanupAnalysis.create({ data });
  }

  /**
   * Finds the latest cleanup analysis report for a user.
   */
  async findLatestByUserId(userId: string): Promise<CleanupAnalysis | null> {
    return this.prisma.cleanupAnalysis.findFirst({
      where: { userId },
      orderBy: { analyzedAt: 'desc' },
    });
  }

  /**
   * Finds paginated historical cleanup analysis reports for a user.
   */
  async findManyAndCount(params: {
    userId: string;
    skip?: number;
    take?: number;
  }): Promise<[CleanupAnalysis[], number]> {
    const { userId, skip = 0, take = 10 } = params;
    const where: Prisma.CleanupAnalysisWhereInput = { userId };

    return Promise.all([
      this.prisma.cleanupAnalysis.findMany({
        where,
        orderBy: { analyzedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.cleanupAnalysis.count({ where }),
    ]);
  }

  /**
   * Finds an email by ID.
   */
  async findEmailById(emailId: string) {
    return this.prisma.email.findUnique({
      where: { id: emailId },
    });
  }

  /**
   * Updates an email's cleanup category assignment and confidence score.
   */
  async updateEmailCleanupCategory(emailId: string, category: CleanupCategory, confidence: number): Promise<any> {
    return this.prisma.email.update({
      where: { id: emailId },
      data: {
        cleanupCategory: category,
        cleanupConfidence: confidence,
      },
    });
  }

  /**
   * Finds emails within the 90-day scope, including categories and fraud analysis risk levels.
   */
  async findEmailsInScope(userId: string, sinceDate: Date) {
    return this.prisma.email.findMany({
      where: {
        userId,
        receivedAt: {
          gte: sinceDate,
        },
      },
      select: {
        id: true,
        subject: true,
        sender: true,
        snippet: true,
        labels: true,
        receivedAt: true,
        cleanupCategory: true,
        cleanupConfidence: true,
        fraudAnalysis: {
          select: {
            riskLevel: true,
          },
        },
      },
      orderBy: { receivedAt: 'desc' },
    });
  }

  /**
   * Counts the total emails for a user (unbounded by date) for general analytics.
   */
  async countAllUserEmails(userId: string): Promise<number> {
    return this.prisma.email.count({
      where: { userId },
    });
  }

  /**
   * Counts task completion rates for the health score calculator.
   */
  async countTaskMetrics(userId: string) {
    const total = await this.prisma.task.count({
      where: { userId },
    });
    const completed = await this.prisma.task.count({
      where: {
        userId,
        status: 'COMPLETED',
      },
    });
    return { total, completed };
  }

  /**
   * Counts unread clutter emails for the user within the 90-day scope.
   */
  async countUnreadClutter(userId: string, sinceDate: Date): Promise<number> {
    return this.prisma.email.count({
      where: {
        userId,
        receivedAt: { gte: sinceDate },
        labels: { has: 'UNREAD' },
        cleanupCategory: {
          in: ['PROMOTIONAL', 'NEWSLETTER', 'SOCIAL', 'UPDATES', 'CLUTTER'],
        },
      },
    });
  }
}
