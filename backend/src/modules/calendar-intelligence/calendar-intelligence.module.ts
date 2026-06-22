import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CalendarController } from './controllers/calendar.controller';
import { CalendarService } from './services/calendar.service';
import { CalendarEventRepository } from './repositories/calendar-event.repository';
import { MeetingExtractorProvider } from './providers/meeting-extractor.provider';
import { CalendarSyncWorker } from './workers/calendar-sync.worker';
import { CalendarExtractionWorker } from './workers/calendar-extraction.worker';
import { FraudAnalyzedListener } from './events/fraud-analyzed.listener';
import { GmailModule } from '../gmail/gmail.module';

@Module({
  imports: [
    GmailModule,
    BullModule.registerQueue(
      {
        name: 'calendar-sync',
      },
      {
        name: 'calendar-sync-failed',
      },
      {
        name: 'calendar-extraction',
      },
      {
        name: 'calendar-extraction-failed',
      },
    ),
  ],
  controllers: [CalendarController],
  providers: [
    CalendarService,
    CalendarEventRepository,
    MeetingExtractorProvider,
    CalendarSyncWorker,
    CalendarExtractionWorker,
    FraudAnalyzedListener,
  ],
  exports: [CalendarService],
})
export class CalendarIntelligenceModule {}
