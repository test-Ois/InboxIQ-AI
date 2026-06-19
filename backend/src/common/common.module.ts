import { Global, Module } from '@nestjs/common';
import { EncryptionService } from './services/encryption.service';
import { AuditLogService } from './services/audit-log.service';
import { AuthGuard } from './guards/auth.guard';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EncryptionService, AuditLogService, AuthGuard],
  exports: [EncryptionService, AuditLogService, AuthGuard],
})
export class CommonModule {}
