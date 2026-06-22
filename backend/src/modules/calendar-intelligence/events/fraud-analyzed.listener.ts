import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { FraudAnalyzedEvent } from '../../fraud-intelligence/events/fraud-events';

@Injectable()
export class FraudAnalyzedListener {
  private readonly logger = new Logger(FraudAnalyzedListener.name);

  constructor(@InjectQueue('calendar-extraction') private readonly extractionQueue: Queue) {}

  /**
   * Listens to the domain event 'fraud.analyzed' emitted by the FraudDetectionWorker.
   * Schedules calendar extraction in the background ONLY if the email is deemed safe.
   */
  @OnEvent('fraud.analyzed')
  async handleFraudAnalyzed(event: FraudAnalyzedEvent): Promise<void> {
    const { emailId, userId, riskLevel } = event;

    this.logger.log(`📢 Intercepted fraud.analyzed event for email ID: ${emailId}`);

    // Potential phishing invitations must not automatically enter scheduling workflows.
    if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
      this.logger.warn(
        `⚠️ Email ${emailId} is flagged with high/critical security risk (${riskLevel}). Skipping scheduling workflows.`,
      );
      return;
    }

    try {
      // Enqueue job to extract calendar event details from the email
      await this.extractionQueue.add(
        'extract-calendar-job',
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
          removeOnFail: false,
        },
      );

      this.logger.log(`📥 Successfully enqueued calendar event extraction job for email ${emailId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to enqueue calendar extraction job for email ${emailId}:`, error);
    }
  }
}
