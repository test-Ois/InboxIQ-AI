import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';

export class EmailAnalyzedEvent {
  constructor(
    public readonly emailId: string,
    public readonly category: string,
    public readonly priority: string,
    public readonly deadline: Date | null,
  ) {}
}

@Injectable()
export class EmailAnalyzedListener {
  private readonly logger = new Logger(EmailAnalyzedListener.name);

  constructor(
    @InjectQueue('task-extraction') private readonly taskQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Listens to the domain event 'email.analyzed' emitted by the EmailAnalysisWorker.
   * Schedules a task extraction job in the background queue.
   */
  @OnEvent('email.analyzed')
  async handleEmailAnalyzed(event: EmailAnalyzedEvent): Promise<void> {
    const { emailId } = event;

    this.logger.log(`📢 Intercepted email.analyzed event for email ID: ${emailId}`);

    try {
      // Fetch the email to obtain the userId
      const email = await this.prisma.email.findUnique({
        where: { id: emailId },
        select: { userId: true },
      });

      if (!email) {
        this.logger.warn(`⚠️ Email record ${emailId} not found. Cannot schedule task extraction.`);
        return;
      }

      const { userId } = email;

      // Enqueue background job to extract tasks from this email
      await this.taskQueue.add(
        'extract-tasks-job',
        {
          emailId,
          userId,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000, // 5s, 10s, 20s...
          },
          removeOnComplete: true,
          removeOnFail: false, // Keep failed jobs in redis for diagnostic inspections before moving
        },
      );

      this.logger.log(`📥 Successfully enqueued task extraction job for email ${emailId} (user ${userId})`);
    } catch (error) {
      this.logger.error(`❌ Failed to enqueue task extraction job for email ${emailId}:`, error);
    }
  }
}
