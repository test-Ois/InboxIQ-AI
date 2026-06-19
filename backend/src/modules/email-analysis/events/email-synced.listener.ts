import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailSyncedEvent } from '../../emails/emails.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EmailSyncedListener {
  private readonly logger = new Logger(EmailSyncedListener.name);

  constructor(@InjectQueue('email-analysis') private readonly analysisQueue: Queue) {}

  /**
   * Listens to the local 'email.synced' domain event.
   * Schedules a background analysis job for each newly synchronized email.
   */
  @OnEvent('email.synced')
  async handleEmailSynced(event: EmailSyncedEvent): Promise<void> {
    const { userId, emailIds } = event;

    if (emailIds.length === 0) {
      return;
    }

    this.logger.log(
      `📢 Intercepted email.synced event for user ${userId}. Enqueuing ${emailIds.length} emails into the AI analysis queue.`,
    );

    for (const id of emailIds) {
      await this.analysisQueue.add(
        'analyze-email-job',
        {
          userId,
          emailId: id,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000, // 5s, 10s, 20s...
          },
          removeOnComplete: true, // Clean completed jobs from Redis
          removeOnFail: false, // Keep failed jobs for diagnostic inspection
        },
      );
    }
  }
}
