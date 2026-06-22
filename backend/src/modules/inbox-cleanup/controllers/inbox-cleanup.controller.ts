import { Controller, Get, Post, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard, AuthenticatedUser } from '../../../common/guards/auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GetUser } from '../../../common/decorators/user.decorator';
import { InboxCleanupService } from '../services/inbox-cleanup.service';
import { CleanupQueryDto } from '../dto/cleanup-query.dto';
import { Request } from 'express';
import { AuditLogService } from '../../../common/services/audit-log.service';

@Controller('cleanup')
@UseGuards(AuthGuard, ThrottlerGuard)
export class InboxCleanupController {
  constructor(
    private readonly cleanupService: InboxCleanupService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * GET /api/cleanup/analysis
   * Retrieves paginated historical cleanup analysis runs.
   */
  @Get('analysis')
  async getCleanupAnalyses(@GetUser() user: AuthenticatedUser, @Query() query: CleanupQueryDto, @Req() req: Request) {
    const result = await this.cleanupService.getAnalyses(user.id, query);

    await this.auditLog.log({
      userId: user.id,
      action: 'CLEANUP_HISTORY_VIEWED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: { page: query.page, limit: query.limit },
    });

    return result;
  }

  /**
   * GET /api/cleanup/analysis/latest
   * Retrieves the most recent cleanup analysis.
   */
  @Get('analysis/latest')
  async getLatestAnalysis(@GetUser() user: AuthenticatedUser, @Req() req: Request) {
    const analysis = await this.cleanupService.getLatestAnalysis(user.id);

    await this.auditLog.log({
      userId: user.id,
      action: 'CLEANUP_LATEST_REPORT_VIEWED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    return analysis;
  }

  /**
   * GET /api/cleanup/stats
   * Retrieves active cleanup analytics metrics.
   */
  @Get('stats')
  async getStats(@GetUser() user: AuthenticatedUser, @Req() req: Request) {
    const stats = await this.cleanupService.getStats(user.id);

    await this.auditLog.log({
      userId: user.id,
      action: 'CLEANUP_STATS_VIEWED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    return stats;
  }

  /**
   * GET /api/cleanup/recommendations
   * Retrieves active prioritized recommendations.
   */
  @Get('recommendations')
  async getRecommendations(@GetUser() user: AuthenticatedUser, @Req() req: Request) {
    const recommendations = await this.cleanupService.getRecommendations(user.id);

    await this.auditLog.log({
      userId: user.id,
      action: 'CLEANUP_RECOMMENDATIONS_VIEWED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    return recommendations;
  }

  /**
   * POST /api/cleanup/analyze
   * Manually schedules a new user inbox hygiene analysis scan.
   */
  @Post('analyze')
  async triggerSweep(@GetUser() user: AuthenticatedUser, @Req() req: Request) {
    const result = await this.cleanupService.triggerAnalysis(user.id);

    await this.auditLog.log({
      userId: user.id,
      action: 'CLEANUP_SWEEP_TRIGGERED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    return result;
  }
}
