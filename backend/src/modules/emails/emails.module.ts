import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailsService } from './emails.service';
import { EmailSyncProducer } from './queues/email-sync.producer';
import { EmailSyncWorker } from './queues/email-sync.worker';
import { EmailsController } from '../../interfaces/controllers/emails.controller';
import { GmailSyncController } from '../../interfaces/controllers/gmail-sync.controller';
import { GmailModule } from '../gmail/gmail.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email-sync',
    }),
    GmailModule,
  ],
  controllers: [EmailsController, GmailSyncController],
  providers: [EmailsService, EmailSyncProducer, EmailSyncWorker],
  exports: [EmailsService, EmailSyncProducer],
})
export class EmailsModule {}
