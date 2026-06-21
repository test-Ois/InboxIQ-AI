import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './database/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { GmailModule } from './modules/gmail/gmail.module';
import { EmailsModule } from './modules/emails/emails.module';
import { EmailAnalysisModule } from './modules/email-analysis/email-analysis.module';
import { HealthModule } from './modules/health/health.module';
import { TaskIntelligenceModule } from './modules/task-intelligence/task-intelligence.module';
import { FraudIntelligenceModule } from './modules/fraud-intelligence/fraud-intelligence.module';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    CommonModule,
    EventEmitterModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        return {
          connection: {
            url: redisUrl,
          },
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      useFactory: () => [
        {
          ttl: 60000, // 1 minute
          limit: 100, // 100 requests per IP per minute
        },
      ],
    }),
    AuthModule,
    GmailModule,
    EmailsModule,
    EmailAnalysisModule,
    HealthModule,
    TaskIntelligenceModule,
    FraudIntelligenceModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
