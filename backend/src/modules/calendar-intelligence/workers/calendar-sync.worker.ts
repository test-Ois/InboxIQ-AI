import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { CalendarService } from '../services/calendar.service';
import { AuditLogService } from '../../../common/services/audit-log.service';

@Processor('calendar-sync')
@Injectable()
export class CalendarSyncWorker extends WorkerHost {
  private readonly logger = new Logger(CalendarSyncWorker.name);

  constructor(
    private readonly calendarService: CalendarService,
    private readonly auditLog: AuditLogService,
    @InjectQueue('calendar-sync-failed') private readonly failedQueue: Queue,
  ) {
    super();
  }

  /**
   * Processes Google Calendar synchronization jobs from BullMQ.
   */
  async process(job: Job<any, any, string>): Promise<any> {
    const { userId, accountId } = job.data;
    const startTime = Date.now();

    this.logger.log(`📥 Processing Google Calendar sync for user: ${userId}, account: ${accountId}`);

    try {
      // Execute the double-directional synchronization
      const result = await this.calendarService.syncGoogleCalendar(userId, accountId);

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ Calendar sync completed for user ${userId} in ${duration}ms. Pulled ${result.pulled} events. Pushed ${result.pushed} events.`,
      );

      // Audit Log log success
      await this.auditLog.log({
        userId,
        action: 'CALENDAR_SYNC_COMPLETED',
        details: {
          accountId,
          pulled: result.pulled,
          pushed: result.pushed,
          durationMs: duration,
        },
      });

      return { status: 'success', pulled: result.pulled, pushed: result.pushed };
    } catch (error: any) {
      const attemptsMade = job.attemptsMade;
      const maxAttempts = job.opts.attempts || 3;

      this.logger.error(
        `❌ Calendar synchronization attempt ${attemptsMade}/${maxAttempts} failed for account: ${accountId}`,
        error.stack,
      );

      // DLQ mechanism: move to failed queue if all retries exhausted
      if (attemptsMade >= maxAttempts) {
        this.logger.error(`🚨 Max attempts reached for calendar sync job ${job.id}. Moving to failed queue.`);

        try {
          await this.failedQueue.add(
            'sync-failure-job',
            {
              originalJobId: job.id,
              accountId,
              userId,
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
            action: 'CALENDAR_SYNC_MAX_ATTEMPTS_FAILED',
            details: {
              accountId,
              error: error.message,
              attempts: attemptsMade,
            },
          });
        } catch (dlqError: any) {
          this.logger.error(`❌ Failed to push failed sync job to DLQ: ${dlqError.message}`);
        }
      }

      throw error; // Re-throw to trigger standard retry backoff
    }
  }
}
