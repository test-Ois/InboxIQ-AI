import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EmailSyncProducer {
  constructor(@InjectQueue('email-sync') private readonly emailSyncQueue: Queue) {}

  /**
   * Enqueues an email sync job to BullMQ.
   */
  async queueSync(userId: string, accountId: string): Promise<void> {
    await this.emailSyncQueue.add(
      'sync-job',
      { userId, accountId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // wait 5s before retrying, then 10s, then 20s...
        },
        removeOnComplete: true, // Auto clean completed jobs to preserve Redis memory
        removeOnFail: false, // Keep failed logs for debugging
      },
    );
  }
}
