import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { TaskRepository } from '../repositories/task.repository';
import { TaskExtractionService } from '../services/task-extraction.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaskCreatedEvent } from '../events/task-events';
import { TaskSource, TaskStatus } from '@prisma/client';
import { AuditLogService } from '../../../common/services/audit-log.service';

@Processor('task-extraction')
@Injectable()
export class TaskExtractionWorker extends WorkerHost {
  private readonly logger = new Logger(TaskExtractionWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: TaskRepository,
    private readonly extractionService: TaskExtractionService,
    private readonly eventEmitter: EventEmitter2,
    private readonly auditLog: AuditLogService,
    @InjectQueue('task-extraction-failed') private readonly failedQueue: Queue,
  ) {
    super();
  }

  /**
   * Processes enqueued task extraction jobs from BullMQ.
   */
  async process(job: Job<any, any, string>): Promise<any> {
    const { emailId, userId } = job.data;
    const startTime = Date.now();

    this.logger.log(`📥 Processing task extraction for email: ${emailId}, user: ${userId}`);

    try {
      // 1. Load Email
      const email = await this.prisma.email.findUnique({
        where: { id: emailId },
      });

      if (!email) {
        this.logger.warn(`⚠️ Email record ${emailId} not found in database. Retrying...`);
        throw new Error(`Email record ${emailId} not found`);
      }

      // 2. Load AI Analysis
      const analysis = await this.prisma.emailAnalysis.findUnique({
        where: { emailId },
      });

      if (!analysis) {
        this.logger.warn(`⚠️ Email Analysis record for email ${emailId} not found. Retrying...`);
        throw new Error(`Email Analysis for email ${emailId} not found`);
      }

      // Worker-level Duplicate Check 1 & 3: Skip if email already has tasks associated
      const existingEmailTasksCount = await this.repository.count({ emailId });
      if (existingEmailTasksCount > 0) {
        this.logger.log(`⚡ Tasks already extracted for email ${emailId}. Skipping extraction.`);
        return { status: 'skipped', emailId, reason: 'tasks_already_extracted' };
      }

      // 3. Extract tasks using Gemini fallback provider
      const snippet = email.snippet || '';
      const extractionResult = await this.extractionService.extractTasksFromEmail(
        email.subject,
        snippet,
        email.receivedAt,
      );

      const savedTaskIds: string[] = [];

      // 4. Validate output and prevent duplicates
      for (const extractedTask of extractionResult.tasks) {
        const parsedDueDate = extractedTask.dueDate ? new Date(extractedTask.dueDate) : null;

        // Worker-level Duplicate Check 2: Same title + dueDate
        const isDuplicate = await this.repository.findDuplicate(userId, emailId, extractedTask.title, parsedDueDate);

        if (isDuplicate) {
          this.logger.log(`⚡ Skipping duplicate task: "${extractedTask.title}" for user: ${userId}`);
          continue;
        }

        // 5. Save task using repository (also has repository-level protection)
        try {
          const task = await this.repository.create({
            userId,
            emailId,
            title: extractedTask.title,
            description: extractedTask.description,
            priority: extractedTask.priority,
            status: TaskStatus.PENDING,
            dueDate: parsedDueDate,
            confidenceScore: extractedTask.confidenceScore,
            source: TaskSource.EMAIL,
            extractionModel: extractionResult.modelName,
            promptVersion: extractionResult.promptVersion,
          });

          savedTaskIds.push(task.id);

          // 6. Emit TaskCreatedEvent
          this.eventEmitter.emit('task.created', new TaskCreatedEvent(userId, task.id, emailId));

          // Log in AuditLog
          await this.auditLog.log({
            userId,
            action: 'TASK_CREATED_FROM_EMAIL',
            details: {
              taskId: task.id,
              emailId,
              title: task.title,
            },
          });
        } catch (repoError: any) {
          this.logger.warn(`⚠️ Repository prevented duplicate or error saving: ${repoError.message}`);
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ Completed task extraction for email ${emailId} in ${duration}ms. Saved ${savedTaskIds.length} tasks.`,
      );

      return { status: 'success', emailId, tasksSaved: savedTaskIds.length };
    } catch (error: any) {
      const attemptsMade = job.attemptsMade;
      const maxAttempts = job.opts.attempts || 3;

      this.logger.error(
        `❌ Task extraction attempt ${attemptsMade}/${maxAttempts} failed for email: ${emailId}`,
        error.stack,
      );

      // Dead Letter Queue mechanism: move to failed queue if all retries exhausted
      if (attemptsMade >= maxAttempts) {
        this.logger.error(`🚨 Max attempts reached for email ${emailId}. Moving to DLQ task-extraction-failed.`);

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

          // Save failed state to Audit Logs for monitoring
          await this.auditLog.log({
            userId,
            action: 'TASK_EXTRACTION_MAX_ATTEMPTS_FAILED',
            details: {
              emailId,
              error: error.message,
              attempts: attemptsMade,
            },
          });
        } catch (dlqError: any) {
          this.logger.error(`❌ Failed to push failed job to DLQ: ${dlqError.message}`);
        }
      }

      throw error; // Re-throw to let BullMQ manage standard retry backing-off
    }
  }
}
