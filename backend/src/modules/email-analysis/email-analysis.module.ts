import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailAnalysisService } from './services/email-analysis.service';
import { EmailAnalysisRepository } from './repositories/email-analysis.repository';
import { EmailAnalysisWorker } from './queues/email-analysis.worker';
import { EmailSyncedListener } from './events/email-synced.listener';
import { GeminiProvider } from './providers/gemini.provider';
import { EmailAnalysisController } from '../../interfaces/controllers/email-analysis.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email-analysis',
    }),
  ],
  controllers: [EmailAnalysisController],
  providers: [
    EmailAnalysisService,
    EmailAnalysisRepository,
    EmailAnalysisWorker,
    EmailSyncedListener,
    GeminiProvider,
    {
      provide: 'AI_PROVIDER',
      useClass: GeminiProvider,
    },
  ],
  exports: [EmailAnalysisService, EmailAnalysisRepository],
})
export class EmailAnalysisModule {}
