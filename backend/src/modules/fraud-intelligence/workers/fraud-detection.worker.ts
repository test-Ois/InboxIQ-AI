import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { FraudAnalysisRepository } from '../repositories/fraud-analysis.repository';
import { AIProvider } from '../interfaces/ai-provider.interface';
import {
  SecurityChecker,
  AbuseIPDBChecker,
  OpenPhishChecker,
  VirusTotalChecker,
} from '../interfaces/security-checker.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FraudAnalyzedEvent } from '../events/fraud-events';
import { AuditLogService } from '../../../common/services/audit-log.service';

@Processor('fraud-detection')
@Injectable()
export class FraudDetectionWorker extends WorkerHost {
  private readonly logger = new Logger(FraudDetectionWorker.name);
  private readonly checkers: SecurityChecker[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: FraudAnalysisRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly auditLog: AuditLogService,
    @Inject('AI_PROVIDER') private readonly aiProvider: AIProvider,
    @InjectQueue('fraud-detection-failed') private readonly failedQueue: Queue,
  ) {
    super();
    // Instantiate pluggable checkers for domain reputation, URL scanning, and attachments
    this.checkers = [new AbuseIPDBChecker(), new OpenPhishChecker(), new VirusTotalChecker()];
  }

  /**
   * Processes enqueued fraud scans from BullMQ.
   */
  async process(job: Job<any, any, string>): Promise<any> {
    const { emailId, userId } = job.data;
    const startTime = Date.now();

    this.logger.log(`📥 Processing security scan for email: ${emailId}`);

    try {
      // 1. Double scan check: check if analysis already exists
      const existing = await this.repository.findUniqueByEmailId(emailId);
      if (existing) {
        this.logger.log(`⚡ Email ${emailId} already analyzed for security threats. Skipping.`);
        return { status: 'skipped', emailId, reason: 'already_analyzed' };
      }

      // 2. Fetch Email details
      const email = await this.prisma.email.findUnique({
        where: { id: emailId },
      });

      if (!email) {
        this.logger.warn(`⚠️ Email record ${emailId} not found in database. Retrying...`);
        throw new Error(`Email record ${emailId} not found`);
      }

      // 3. Execute pluggable checkers
      const emailContext = {
        sender: email.sender,
        subject: email.subject,
        snippet: email.snippet || '',
      };

      const [senderReputation, linksScanned, attachmentsScanned] = await Promise.all([
        this.checkers[0].check(emailContext),
        this.checkers[1].check(emailContext),
        this.checkers[2].check(emailContext),
      ]);

      // 4. Request intelligence from Gemini AI Provider
      const analysisOutput = await this.aiProvider.analyzeFraud(
        email.subject,
        email.sender,
        emailContext.snippet,
        email.receivedAt,
        {
          senderReputation: senderReputation.details,
          linksScanned: linksScanned.details,
          attachmentsScanned: attachmentsScanned.details,
        },
      );

      // 5. Store output to Neon PostgreSQL
      const saved = await this.repository.create({
        emailId,
        riskLevel: analysisOutput.riskLevel,
        fraudType: analysisOutput.fraudType,
        confidenceScore: analysisOutput.confidenceScore,
        explanation: analysisOutput.explanation,
        indicators: analysisOutput.indicators, // Saved as Json directly
        modelName: analysisOutput.modelName,
        promptVersion: analysisOutput.promptVersion,
      });

      // 6. Emit FraudAnalyzedEvent
      this.eventEmitter.emit(
        'fraud.analyzed',
        new FraudAnalyzedEvent(emailId, userId, saved.riskLevel, saved.fraudType, saved.confidenceScore),
      );

      // Log in AuditLog
      await this.auditLog.log({
        userId,
        action: 'EMAIL_SECURITY_SCANNED',
        details: {
          emailId,
          riskLevel: saved.riskLevel,
          fraudType: saved.fraudType,
        },
      });

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ Completed security scan for email ${emailId} in ${duration}ms. Threat rating: ${saved.riskLevel}`,
      );

      return { status: 'success', emailId, riskLevel: saved.riskLevel };
    } catch (error: any) {
      const attemptsMade = job.attemptsMade;
      const maxAttempts = job.opts.attempts || 3;

      this.logger.error(
        `❌ Security scan attempt ${attemptsMade}/${maxAttempts} failed for email: ${emailId}`,
        error.stack,
      );

      // DLQ check: move failures to DLQ on max retries exhaustion
      if (attemptsMade >= maxAttempts) {
        this.logger.error(
          `🚨 Max attempts reached for security scan on email ${emailId}. Moving to DLQ fraud-detection-failed.`,
        );

        try {
          await this.failedQueue.add(
            'scan-failure-job',
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
            action: 'EMAIL_SECURITY_SCAN_MAX_ATTEMPTS_FAILED',
            details: {
              emailId,
              error: error.message,
              attempts: attemptsMade,
            },
          });
        } catch (dlqError: any) {
          this.logger.error(`❌ Failed to push failed scan job to DLQ: ${dlqError.message}`);
        }
      }

      throw error;
    }
  }
}
