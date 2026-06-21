import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { FraudAnalysisController } from './controllers/fraud-analysis.controller';
import { FraudAnalysisService } from './services/fraud-analysis.service';
import { FraudAnalyticsService } from './services/fraud-analytics.service';
import { FraudAnalysisRepository } from './repositories/fraud-analysis.repository';
import { FraudDetectionWorker } from './workers/fraud-detection.worker';
import { EmailAnalyzedListener } from './events/email-analyzed.listener';
import { GeminiProvider } from './providers/gemini.provider';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: 'fraud-detection',
      },
      {
        name: 'fraud-detection-failed',
      },
    ),
  ],
  controllers: [FraudAnalysisController],
  providers: [
    FraudAnalysisService,
    FraudAnalyticsService,
    FraudAnalysisRepository,
    FraudDetectionWorker,
    EmailAnalyzedListener,
    GeminiProvider,
    {
      provide: 'AI_PROVIDER',
      useClass: GeminiProvider,
    },
  ],
  exports: [FraudAnalysisService, FraudAnalyticsService],
})
export class FraudIntelligenceModule {}
