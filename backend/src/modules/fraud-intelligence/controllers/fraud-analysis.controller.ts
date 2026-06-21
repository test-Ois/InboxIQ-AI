import { Controller, Get, Param, Query, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard, AuthenticatedUser } from '../../../common/guards/auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GetUser } from '../../../common/decorators/user.decorator';
import { FraudAnalysisService } from '../services/fraud-analysis.service';
import { FraudAnalyticsService } from '../services/fraud-analytics.service';
import { FraudQueryDto } from '../dto/fraud-query.dto';
import { Request } from 'express';
import { AuditLogService } from '../../../common/services/audit-log.service';

@Controller('fraud-analysis')
@UseGuards(AuthGuard, ThrottlerGuard)
export class FraudAnalysisController {
  constructor(
    private readonly fraudService: FraudAnalysisService,
    private readonly analyticsService: FraudAnalyticsService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * GET /api/fraud-analysis
   * Retrieves security analyses for emails with search and page filters.
   */
  @Get()
  async getFraudAnalyses(@GetUser() user: AuthenticatedUser, @Query() query: FraudQueryDto, @Req() req: Request) {
    const result = await this.fraudService.getAnalyses(user.id, query);

    await this.auditLog.log({
      userId: user.id,
      action: 'EMAIL_SECURITY_LIST_VIEWED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: { filters: query },
    });

    return result;
  }

  /**
   * GET /api/fraud-analysis/stats
   * Retrieves security widgets aggregates, Top Suspicious Domains, and security rating.
   */
  @Get('stats')
  async getStats(@GetUser() user: AuthenticatedUser, @Req() req: Request) {
    const stats = await this.analyticsService.getFraudStats(user.id);

    await this.auditLog.log({
      userId: user.id,
      action: 'SECURITY_DASHBOARD_VIEWED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    return stats;
  }

  /**
   * GET /api/fraud-analysis/:emailId
   * Retrieves single security threat details after verifying owner permissions.
   */
  @Get(':emailId')
  async getAnalysisByEmailId(
    @GetUser() user: AuthenticatedUser,
    @Param('emailId', ParseUUIDPipe) emailId: string,
    @Req() req: Request,
  ) {
    const analysis = await this.fraudService.getAnalysisByEmailId(user.id, emailId);

    await this.auditLog.log({
      userId: user.id,
      action: 'EMAIL_SECURITY_REPORT_VIEWED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: { emailId },
    });

    return analysis;
  }
}
