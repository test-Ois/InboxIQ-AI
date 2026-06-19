import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard, AuthenticatedUser } from '../../common/guards/auth.guard';
import { GetUser } from '../../common/decorators/user.decorator';
import { EmailAnalysisService } from '../../modules/email-analysis/services/email-analysis.service';

@Controller('email-analysis')
@UseGuards(AuthGuard)
export class EmailAnalysisController {
  constructor(private readonly analysisService: EmailAnalysisService) {}

  /**
   * GET /api/email-analysis
   * Retrieves paginated list of email analyses with filters.
   */
  @Get()
  async getAnalyses(
    @GetUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('actionRequired') actionRequired?: string,
  ) {
    let actionRequiredBool: boolean | undefined = undefined;
    if (actionRequired === 'true') actionRequiredBool = true;
    if (actionRequired === 'false') actionRequiredBool = false;

    return this.analysisService.getAnalyses(user.id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      category,
      priority,
      actionRequired: actionRequiredBool,
    });
  }

  /**
   * GET /api/email-analysis/stats
   * Retrieves summary counts for the dashboard AI widgets.
   */
  @Get('stats')
  async getStats(@GetUser() user: AuthenticatedUser) {
    return this.analysisService.getAnalysisStats(user.id);
  }

  /**
   * GET /api/email-analysis/monitoring
   * Retrieves internal AI processing metrics (totals, failure counters, average times).
   */
  @Get('monitoring')
  async getMonitoring() {
    return this.analysisService.getMonitoringStats();
  }

  /**
   * GET /api/email-analysis/:emailId
   * Retrieves detailed AI insights for a specific email.
   */
  @Get(':emailId')
  async getAnalysisById(@GetUser() user: AuthenticatedUser, @Param('emailId', ParseUUIDPipe) emailId: string) {
    return this.analysisService.getAnalysisByEmailId(user.id, emailId);
  }
}
