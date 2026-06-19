import { Module } from '@nestjs/common';
import { GmailService } from './gmail.service';
import { GmailInfrastructureService } from '../../infrastructure/gmail/gmail.service';
import { GmailController } from '../../interfaces/controllers/gmail.controller';

@Module({
  controllers: [GmailController],
  providers: [GmailService, GmailInfrastructureService],
  exports: [GmailService, GmailInfrastructureService],
})
export class GmailModule {}
