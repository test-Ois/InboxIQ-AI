import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { FraudAnalyzedEvent } from '../../fraud-intelligence/events/fraud-events';

@Injectable()
export class FraudAnalyzedListener {
  private readonly logger = new Logger(FraudAnalyzedListener.name);

  constructor(@InjectQueue('cleanup-analysis') private readonly cleanupQueue: Queue) {}

  /**
   * Listens to the domain event 'fraud.analyzed' emitted by the FraudDetectionWorker.
   * This guarantees cleanup classification runs only after fraud analysis completes successfully.
   */
  @OnEvent('fraud.analyzed')
  async handleFraudAnalyzed(event: FraudAnalyzedEvent): Promise<void> {
    const { emailId, userId } = event;

    this.logger.log(`📢 Intercepted fraud.analyzed event for email: ${emailId}`);

    try {
      // 1. Enqueue job to categorize this specific email
      await this.cleanupQueue.add(
        'categorize-email-job',
        {
          emailId,
          userId,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: true,
        },
      );

      // 2. Enqueue user-level inbox hygiene sweep with a 15-second delay for debouncing.
      // Utilizing the exact same jobId 'cleanup-user-analysis:${userId}' will overwrite/debounce
      // any existing delayed job if the sync is still actively running.
      const jobId = `cleanup-user-analysis:${userId}`;
      await this.cleanupQueue.add(
        'analyze-user-inbox-job',
        {
          userId,
        },
        {
          jobId,
          delay: 15000, // 15 seconds debounce delay
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: true,
        },
      );

      this.logger.log(
        `📥 Successfully scheduled categorization for email ${emailId} and scheduled debounced sweep for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(`❌ Failed to queue cleanup scan jobs for email ${emailId}:`, error);
    }
  }
}
