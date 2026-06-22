import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { InboxCleanupController } from './controllers/inbox-cleanup.controller';
import { InboxCleanupService } from './services/inbox-cleanup.service';
import { CleanupAnalyticsService } from './services/cleanup-analytics.service';
import { CleanupAnalysisRepository } from './repositories/cleanup-analysis.repository';
import { CleanupAnalysisWorker } from './workers/cleanup-analysis.worker';
import { FraudAnalyzedListener } from './events/fraud-analyzed.listener';
import { GeminiProvider } from './providers/gemini.provider';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: 'cleanup-analysis',
      },
      {
        name: 'cleanup-analysis-failed',
      },
    ),
  ],
  controllers: [InboxCleanupController],
  providers: [
    InboxCleanupService,
    CleanupAnalyticsService,
    CleanupAnalysisRepository,
    CleanupAnalysisWorker,
    FraudAnalyzedListener,
    GeminiProvider,
    {
      provide: 'AI_PROVIDER',
      useClass: GeminiProvider,
    },
  ],
  exports: [InboxCleanupService, CleanupAnalyticsService],
})
export class InboxCleanupModule {}
