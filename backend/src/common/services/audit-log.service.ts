import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Appends an audit log entry to the database.
   * Catches errors locally to prevent breaking main business operations.
   */
  async log(params: {
    userId?: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, any>;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId || null,
          action: params.action,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
          details: params.details || {},
        },
      });
    } catch (error) {
      console.error('❌ Failed to write audit log:', error);
    }
  }
}
