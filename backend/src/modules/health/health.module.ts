import { Module } from '@nestjs/common';
import { HealthController } from '../../interfaces/controllers/health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
