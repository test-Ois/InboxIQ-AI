import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CleanupAnalysisRepository } from '../repositories/cleanup-analysis.repository';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CleanupAnalysis } from '@prisma/client';

@Injectable()
export class InboxCleanupService {
  private readonly logger = new Logger(InboxCleanupService.name);

  constructor(
    private readonly repository: CleanupAnalysisRepository,
    @InjectQueue('cleanup-analysis') private readonly cleanupQueue: Queue,
  ) {}

  /**
   * Retrieves the most recent cleanup analysis.
   */
  async getLatestAnalysis(userId: string): Promise<CleanupAnalysis> {
    const analysis = await this.repository.findLatestByUserId(userId);
    if (!analysis) {
      throw new NotFoundException('No cleanup analysis found. Please trigger an analysis first.');
    }
    return analysis;
  }

  /**
   * Retrieves historical cleanup analyses.
   */
  async getAnalyses(userId: string, query: { page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [analyses, total] = await this.repository.findManyAndCount({
      userId,
      skip,
      take: limit,
    });

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
   * Extracts clean metrics summaries from the latest analysis.
   */
  async getStats(userId: string) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 90);
    const unreadClutterCount = await this.repository.countUnreadClutter(userId, sinceDate);

    const analysis = await this.repository.findLatestByUserId(userId);
    if (!analysis) {
      return {
        inboxHealthScore: 100,
        previousHealthScore: null,
        promotionalCount: 0,
        newsletterCount: 0,
        socialCount: 0,
        updatesCount: 0,
        clutterCount: 0,
        unreadClutterCount: 0,
        estimatedStorageRecoveryMB: 0,
        recommendationCount: 0,
        analyzedAt: null,
      };
    }

    const recommendations = Array.isArray(analysis.recommendations) ? analysis.recommendations : [];

    return {
      inboxHealthScore: analysis.inboxHealthScore,
      previousHealthScore: analysis.previousHealthScore,
      promotionalCount: analysis.promotionalCount,
      newsletterCount: analysis.newsletterCount,
      socialCount: analysis.socialCount,
      updatesCount: analysis.updatesCount,
      clutterCount: analysis.clutterCount,
      unreadClutterCount,
      estimatedStorageRecoveryMB: analysis.estimatedStorageRecoveryMB,
      recommendationCount: recommendations.length,
      analyzedAt: analysis.analyzedAt,
    };
  }

  /**
   * Extracts recommendation details.
   */
  async getRecommendations(userId: string) {
    const analysis = await this.repository.findLatestByUserId(userId);
    if (!analysis) {
      return [];
    }
    return analysis.recommendations;
  }

  /**
   * Enqueues an on-demand background user-wide analysis.
   * Debounces using a specific jobId to avoid parallel job run conflicts.
   */
  async triggerAnalysis(userId: string): Promise<{ message: string; jobId: string }> {
    const jobId = `cleanup-user-analysis:${userId}`;

    const job = await this.cleanupQueue.add(
      'analyze-user-inbox-job',
      { userId },
      {
        jobId,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false, // Diagnostics
      },
    );

    this.logger.log(`📥 Triggered cleanup analysis sweep job: ${jobId} (User ${userId})`);

    return {
      message: 'Inbox hygiene sweep analysis scheduled successfully.',
      jobId: job.id || jobId,
    };
  }
}
