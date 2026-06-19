import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { EmailsService } from '../emails.service';

@Processor('email-sync')
@Injectable()
export class EmailSyncWorker extends WorkerHost {
  private readonly logger = new Logger(EmailSyncWorker.name);

  constructor(private readonly emailsService: EmailsService) {
    super();
  }

  /**
   * Processes enqueued jobs.
   */
  async process(job: Job<any, any, string>): Promise<any> {
    const { userId, accountId } = job.data;
    this.logger.log(`📥 Processing background email sync job for account: ${accountId}`);

    try {
      await this.emailsService.syncEmails(userId, accountId);
      this.logger.log(`✅ Completed background email sync for account: ${accountId}`);
      return { status: 'success', accountId };
    } catch (error: any) {
      this.logger.error(`❌ Background email sync failed for account: ${accountId}`, error);
      throw error;
    }
  }
}
