import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TaskController } from './controllers/task.controller';
import { TaskService } from './services/task.service';
import { TaskAnalyticsService } from './services/task-analytics.service';
import { TaskExtractionService } from './services/task-extraction.service';
import { TaskRepository } from './repositories/task.repository';
import { TaskExtractionWorker } from './workers/task-extraction.worker';
import { EmailAnalyzedListener } from './events/email-analyzed.listener';
import { GeminiProvider } from './providers/gemini.provider';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: 'task-extraction',
      },
      {
        name: 'task-extraction-failed',
      },
    ),
  ],
  controllers: [TaskController],
  providers: [
    TaskService,
    TaskAnalyticsService,
    TaskExtractionService,
    TaskRepository,
    TaskExtractionWorker,
    EmailAnalyzedListener,
    GeminiProvider,
    {
      provide: 'AI_PROVIDER',
      useClass: GeminiProvider,
    },
  ],
  exports: [TaskService, TaskAnalyticsService],
})
export class TaskIntelligenceModule {}
