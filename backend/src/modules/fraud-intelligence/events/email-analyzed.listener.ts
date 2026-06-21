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
    @InjectQueue('fraud-detection') private readonly fraudQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Listens to the domain event 'email.analyzed' emitted by the EmailAnalysisWorker.
   * Schedules a fraud detection job in the background queue.
   */
  @OnEvent('email.analyzed')
  async handleEmailAnalyzed(event: EmailAnalyzedEvent): Promise<void> {
    const { emailId } = event;

    this.logger.log(`📢 Intercepted email.analyzed event for email ID: ${emailId}`);

    try {
      // Query the email to obtain the owner's userId
      const email = await this.prisma.email.findUnique({
        where: { id: emailId },
        select: { userId: true },
      });

      if (!email) {
        this.logger.warn(`⚠️ Email record ${emailId} not found. Cannot schedule fraud intelligence scan.`);
        return;
      }

      const { userId } = email;

      // Add to BullMQ queue for security processing
      await this.fraudQueue.add(
        'scan-fraud-job',
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
          removeOnFail: false, // Keep failed jobs in Redis for diagnostics before moving to DLQ
        },
      );

      this.logger.log(`📥 Successfully enqueued fraud scan job for email ${emailId} (user ${userId})`);
    } catch (error) {
      this.logger.error(`❌ Failed to enqueue fraud scan job for email ${emailId}:`, error);
    }
  }
}
