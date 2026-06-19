import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { EmailAnalysisRepository } from '../repositories/email-analysis.repository';
import { AIProvider } from '../interfaces/ai-provider.interface';
import { EmailAnalysisService } from '../services/email-analysis.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export class EmailAnalyzedEvent {
  constructor(
    public readonly emailId: string,
    public readonly category: string,
    public readonly priority: string,
    public readonly deadline: Date | null,
  ) {}
}

@Processor('email-analysis')
@Injectable()
export class EmailAnalysisWorker extends WorkerHost {
  private readonly logger = new Logger(EmailAnalysisWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: EmailAnalysisRepository,
    private readonly analysisService: EmailAnalysisService,
    private readonly eventEmitter: EventEmitter2,
    @Inject('AI_PROVIDER') private readonly aiProvider: AIProvider,
  ) {
    super();
  }

  /**
   * Processes enqueued AI analysis jobs.
   */
  async process(job: Job<any, any, string>): Promise<any> {
    const { emailId } = job.data;
    const startTime = Date.now();

    this.logger.log(`📥 Processing AI analysis job for email ID: ${emailId}`);

    try {
      // 1. Caching Cache Check: Prevent duplicate LLM calls
      const existingAnalysis = await this.repository.findUniqueByEmailId(emailId);

      if (existingAnalysis) {
        this.logger.log(`⚡ Email ${emailId} already analyzed. Skipping analysis.`);
        return { status: 'skipped', emailId, reason: 'already_analyzed' };
      }

      // 2. Fetch email record details
      const email = await this.prisma.email.findUnique({
        where: { id: emailId },
      });

      if (!email) {
        this.logger.warn(`⚠️ Email record ${emailId} not found in database. Retrying...`);
        throw new Error(`Email record ${emailId} not found`);
      }

      // 3. Request analysis from injected AI Provider (Gemini 2.5 Flash)
      const analysisOutput = await this.aiProvider.analyzeEmail({
        subject: email.subject,
        sender: email.sender,
        snippet: email.snippet,
        receivedAt: email.receivedAt,
      });

      // 4. Save results to the database using repository
      const parsedDeadline = analysisOutput.deadline ? new Date(analysisOutput.deadline) : null;

      const modelName = (this.aiProvider as any).modelName || 'gemini-2.5-flash';
      const promptVersion = (this.aiProvider as any).promptVersion || 'v1.0.0';

      await this.repository.create({
        emailId,
        category: analysisOutput.category,
        priority: analysisOutput.priority,
        priorityScore: analysisOutput.priorityScore,
        actionRequired: analysisOutput.actionRequired,
        deadline: parsedDeadline,
        summary: analysisOutput.summary,
        confidenceScore: analysisOutput.confidenceScore,
        modelName,
        promptVersion,
      });

      // 5. Emit downstream EmailAnalyzedEvent
      this.eventEmitter.emit(
        'email.analyzed',
        new EmailAnalyzedEvent(emailId, analysisOutput.category, analysisOutput.priority, parsedDeadline),
      );

      const duration = Date.now() - startTime;
      this.analysisService.trackSuccess(duration);

      this.logger.log(`✅ Success analyzing email ${emailId} in ${duration}ms`);
      return { status: 'success', emailId };
    } catch (error) {
      this.analysisService.trackFailure();
      this.logger.error(`❌ Background email analysis failed for email: ${emailId}`, error);
      throw error; // Fail the job to trigger BullMQ retry backoffs
    }
  }
}
