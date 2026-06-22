import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CalendarEventRepository } from '../repositories/calendar-event.repository';
import { MeetingExtractorProvider } from '../providers/meeting-extractor.provider';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { MeetingStatus } from '@prisma/client';

@Processor('calendar-extraction')
@Injectable()
export class CalendarExtractionWorker extends WorkerHost {
  private readonly logger = new Logger(CalendarExtractionWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: CalendarEventRepository,
    private readonly extractor: MeetingExtractorProvider,
    private readonly auditLog: AuditLogService,
    @InjectQueue('calendar-sync') private readonly syncQueue: Queue,
    @InjectQueue('calendar-extraction-failed') private readonly failedQueue: Queue,
  ) {
    super();
  }

  /**
   * Processes enqueued calendar extraction jobs from BullMQ.
   */
  async process(job: Job<any, any, string>): Promise<any> {
    const { emailId, userId } = job.data;
    const startTime = Date.now();

    this.logger.log(`📥 Processing calendar extraction for email: ${emailId}, user: ${userId}`);

    try {
      // 1. Load Email
      const email = await this.prisma.email.findUnique({
        where: { id: emailId },
      });

      if (!email) {
        this.logger.warn(`⚠️ Email record ${emailId} not found. Skipping extraction.`);
        return { status: 'skipped', reason: 'email_not_found' };
      }

      // Check if calendar events are already extracted for this email to prevent duplicate processing
      const existingEventsCount = await this.repository.countByEmailId(emailId);
      if (existingEventsCount > 0) {
        this.logger.log(`⚡ Calendar events already extracted for email ${emailId}. Skipping extraction.`);
        return { status: 'skipped', reason: 'already_extracted' };
      }

      // 2. Invoke meeting extraction provider (Gemini fallback)
      const snippet = email.snippet || '';
      const extraction = await this.extractor.extractMeeting(email.subject, snippet, email.receivedAt);

      if (!extraction.isMeeting) {
        this.logger.log(`ℹ️ Email ${emailId} does not contain meeting scheduling invitations.`);
        return { status: 'success', isMeeting: false };
      }

      // Validate times exist
      if (!extraction.startTime || !extraction.endTime) {
        this.logger.warn(`⚠️ Meeting times missing from extraction for email ${emailId}. Skipping.`);
        return { status: 'failed', reason: 'missing_dates' };
      }

      // 3. Create database calendar event
      const event = await this.repository.create({
        userId,
        emailId,
        title: extraction.title || email.subject,
        description: extraction.description,
        location: extraction.location,
        meetingUrl: extraction.meetingUrl,
        timezone: extraction.timezone || 'UTC',
        startTime: extraction.startTime,
        endTime: extraction.endTime,
        meetingType: extraction.meetingType || 'OTHER',
        status: MeetingStatus.PENDING,
        attendees: extraction.attendees || [],
        metadata: {
          modelName: extraction.rawLLMResponse?.modelName,
          promptVersion: this.extractor.promptVersion,
        },
      });

      this.logger.log(`📅 Created local calendar event: "${event.title}" for user: ${userId}`);

      // 4. Audit Log
      await this.auditLog.log({
        userId,
        action: 'CALENDAR_EVENT_DETECTED_FROM_EMAIL',
        details: {
          eventId: event.id,
          emailId,
          title: event.title,
          startTime: event.startTime.toISOString(),
          endTime: event.endTime.toISOString(),
        },
      });

      // 5. Enqueue synchronization job to push this event to Google Calendar
      const accounts = await this.repository.findConnectedAccounts(userId);
      for (const account of accounts) {
        await this.syncQueue.add(
          'sync-calendar-job',
          {
            userId,
            accountId: account.id,
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
        this.logger.log(`🔄 Enqueued calendar sync job for account: ${account.providerEmail}`);
      }

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Completed calendar extraction for email ${emailId} in ${duration}ms.`);

      return { status: 'success', isMeeting: true, eventId: event.id };
    } catch (error: any) {
      const attemptsMade = job.attemptsMade;
      const maxAttempts = job.opts.attempts || 3;

      this.logger.error(
        `❌ Calendar extraction attempt ${attemptsMade}/${maxAttempts} failed for email: ${emailId}`,
        error.stack,
      );

      // DLQ mechanism
      if (attemptsMade >= maxAttempts) {
        this.logger.error(`🚨 Max attempts reached for calendar extraction ${job.id}. Moving to DLQ.`);
        try {
          await this.failedQueue.add(
            'extraction-failure-job',
            {
              originalJobId: job.id,
              emailId,
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
            action: 'CALENDAR_EXTRACTION_MAX_ATTEMPTS_FAILED',
            details: {
              emailId,
              error: error.message,
              attempts: attemptsMade,
            },
          });
        } catch (dlqError: any) {
          this.logger.error(`❌ Failed to push failed extraction job to DLQ: ${dlqError.message}`);
        }
      }

      throw error;
    }
  }
}
