import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { CleanupAnalysisRepository } from '../repositories/cleanup-analysis.repository';
import { CleanupAnalyticsService } from '../services/cleanup-analytics.service';
import { AIProvider } from '../interfaces/ai-provider.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CleanupAnalysisCompletedEvent } from '../events/cleanup-events';
import { AuditLogService } from '../../../common/services/audit-log.service';

@Processor('cleanup-analysis')
@Injectable()
export class CleanupAnalysisWorker extends WorkerHost {
  private readonly logger = new Logger(CleanupAnalysisWorker.name);

  constructor(
    private readonly repository: CleanupAnalysisRepository,
    private readonly analyticsService: CleanupAnalyticsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly auditLog: AuditLogService,
    @Inject('AI_PROVIDER') private readonly aiProvider: AIProvider,
    @InjectQueue('cleanup-analysis-failed') private readonly failedQueue: Queue,
  ) {
    super();
  }

  /**
   * Processes enqueued cleanup analysis tasks.
   */
  async process(job: Job<any, any, string>): Promise<any> {
    const { userId, emailId } = job.data;
    const name = job.name;
    const startTime = Date.now();

    this.logger.log(`📥 Processing cleanup job "${name}" for user: ${userId}`);

    try {
      if (name === 'categorize-email-job') {
        // Job: Categorize a single email
        await this.handleCategorizeEmail(userId, emailId);
        return { status: 'success', job: 'categorize-email', emailId };
      } else if (name === 'analyze-user-inbox-job') {
        // Job: Analyze the entire inbox hygiene state (last 90 days)
        const result = await this.handleAnalyzeUserInbox(userId);
        const duration = Date.now() - startTime;
        this.logger.log(`✅ Completed user inbox hygiene analysis for ${userId} in ${duration}ms`);
        return { status: 'success', job: 'analyze-user-inbox', analysisId: result.id };
      } else {
        throw new Error(`Unknown job name: ${name}`);
      }
    } catch (error: any) {
      const attemptsMade = job.attemptsMade;
      const maxAttempts = job.opts.attempts || 3;

      this.logger.error(
        `❌ Cleanup job "${name}" attempt ${attemptsMade}/${maxAttempts} failed for user: ${userId}`,
        error.stack,
      );

      // DLQ check: move failures to DLQ on max retries exhaustion
      if (attemptsMade >= maxAttempts) {
        this.logger.error(
          `🚨 Max attempts reached for cleanup analysis on user ${userId}. Moving to DLQ cleanup-analysis-failed.`,
        );

        try {
          await this.failedQueue.add(
            'cleanup-failure-job',
            {
              originalJobId: job.id,
              jobName: name,
              userId,
              emailId,
              error: error.message,
              stack: error.stack,
              attemptsCount: attemptsMade,
              failedAt: new Date().toISOString(),
            },
            {
              removeOnComplete: true,
            },
          );

          await this.auditLog.log({
            userId,
            action: 'EMAIL_CLEANUP_SCAN_MAX_ATTEMPTS_FAILED',
            details: {
              jobName: name,
              emailId,
              error: error.message,
              attempts: attemptsMade,
            },
          });
        } catch (dlqError: any) {
          this.logger.error(`❌ Failed to push failed cleanup job to DLQ: ${dlqError.message}`);
        }
      }

      throw error;
    }
  }

  /**
   * Logic to classify a single email's cleanup category.
   */
  private async handleCategorizeEmail(userId: string, emailId: string): Promise<void> {
    const email = await this.repository.findEmailById(emailId);

    if (!email) {
      this.logger.warn(`⚠️ Email record ${emailId} not found. Cannot categorize.`);
      return;
    }

    if (email.cleanupCategory) {
      this.logger.log(`⚡ Email ${emailId} already categorized as ${email.cleanupCategory}. Skipping.`);
      return;
    }

    const result = await this.aiProvider.classifyEmail(email.subject, email.sender, email.snippet || '');

    await this.repository.updateEmailCleanupCategory(emailId, result.category, result.confidenceScore);

    this.logger.log(`🏷️ Categorized email ${emailId} as ${result.category} (Confidence: ${result.confidenceScore})`);
  }

  /**
   * Logic to perform user inbox analytics, score compiling, and recommendations.
   */
  private async handleAnalyzeUserInbox(userId: string) {
    // 1. Resolve scope (last 90 days)
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 90);

    // 2. Fetch all emails in 90-day scope
    const emails = await this.repository.findEmailsInScope(userId, sinceDate);
    this.logger.log(`📊 Scanned ${emails.length} emails in 90-day scope for user ${userId}`);

    // 3. Detect and classify uncategorized emails (up to 50 in parallel to prevent rate limits)
    const uncategorized = emails.filter((e) => !e.cleanupCategory);
    if (uncategorized.length > 0) {
      this.logger.log(
        `Found ${uncategorized.length} uncategorized emails in 90-day scope for user ${userId}. Categorizing top 50...`,
      );
      const targetBatch = uncategorized.slice(0, 50);

      await Promise.all(
        targetBatch.map(async (email) => {
          try {
            const res = await this.aiProvider.classifyEmail(email.subject, email.sender, email.snippet || '');
            await this.repository.updateEmailCleanupCategory(email.id, res.category, res.confidenceScore);
            // Update local memory representation
            email.cleanupCategory = res.category;
            email.cleanupConfidence = res.confidenceScore;
          } catch (err: any) {
            this.logger.error(`❌ Failed to categorize email ${email.id}: ${err.message}`);
          }
        }),
      );
    }

    // 4. Load task metrics for health calculation
    const taskMetrics = await this.repository.countTaskMetrics(userId);

    // 5. Calculate composite health score and storage recovery estimation
    const stats = this.analyticsService.calculateAnalytics(emails, taskMetrics);

    // 6. Generate prioritized actionable recommendations using LLM provider
    const recommendations = await this.aiProvider.generateRecommendations({
      promotionalCount: stats.promotionalCount,
      newsletterCount: stats.newsletterCount,
      socialCount: stats.socialCount,
      updatesCount: stats.updatesCount,
      clutterCount: stats.clutterCount,
      unreadClutterCount: stats.unreadClutterCount,
      fraudAlertsCount: stats.fraudAlertsCount,
      estimatedStorageRecoveryMB: stats.estimatedStorageRecoveryMB,
      totalEmails: emails.length,
    });

    // 7. Load latest analysis to fetch previous score
    const latestAnalysis = await this.repository.findLatestByUserId(userId);
    const previousHealthScore = latestAnalysis ? latestAnalysis.inboxHealthScore : null;

    // 8. Store report inside Neon PostgreSQL
    const saved = await this.repository.create({
      userId,
      inboxHealthScore: stats.inboxHealthScore,
      previousHealthScore,
      promotionalCount: stats.promotionalCount,
      newsletterCount: stats.newsletterCount,
      socialCount: stats.socialCount,
      updatesCount: stats.updatesCount,
      clutterCount: stats.clutterCount,
      estimatedStorageRecoveryMB: stats.estimatedStorageRecoveryMB,
      recommendations: recommendations as any,
    });

    // 9. Emit event CleanupAnalysisCompletedEvent
    this.eventEmitter.emit(
      'cleanup.analysis.completed',
      new CleanupAnalysisCompletedEvent(
        userId,
        saved.id,
        saved.inboxHealthScore,
        saved.promotionalCount,
        saved.newsletterCount,
        saved.socialCount,
        saved.updatesCount,
        saved.clutterCount,
        saved.estimatedStorageRecoveryMB,
      ),
    );

    // 10. Write Audit Log
    await this.auditLog.log({
      userId,
      action: 'EMAIL_CLEANUP_ANALYSIS_COMPLETED',
      details: {
        analysisId: saved.id,
        healthScore: saved.inboxHealthScore,
        storageRecoveryMB: saved.estimatedStorageRecoveryMB,
      },
    });

    return saved;
  }
}
