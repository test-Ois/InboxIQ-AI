import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard, AuthenticatedUser } from '../../../common/guards/auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GetUser } from '../../../common/decorators/user.decorator';
import { CopilotService } from '../services/copilot.service';
import {
  ReplySuggestionDto,
  RewriteDraftDto,
  FollowUpDto,
  MeetingRequestDto,
  SummarizeThreadDto,
  RegenerateSuggestionDto,
  CopilotQueryDto,
} from '../dto/copilot-inputs.dto';
import { Request } from 'express';
import { AuditLogService } from '../../../common/services/audit-log.service';

@Controller('copilot')
@UseGuards(AuthGuard, ThrottlerGuard)
export class CopilotController {
  constructor(
    private readonly copilotService: CopilotService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * POST /api/copilot/reply
   * Generates a reply suggestion based on email and tone selection.
   */
  @Post('reply')
  async generateReply(@GetUser() user: AuthenticatedUser, @Body() dto: ReplySuggestionDto, @Req() req: Request) {
    const result = await this.copilotService.generateReply(user.id, dto);

    await this.auditLog.log({
      userId: user.id,
      action: 'COPILOT_REPLY_GENERATED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: { emailId: dto.emailId, tone: dto.tone },
    });

    return result;
  }

  /**
   * POST /api/copilot/rewrite
   * Rewrites draft content according to chosen tone and instructions.
   */
  @Post('rewrite')
  async rewrite(@GetUser() user: AuthenticatedUser, @Body() dto: RewriteDraftDto, @Req() req: Request) {
    const result = await this.copilotService.rewrite(user.id, dto);

    await this.auditLog.log({
      userId: user.id,
      action: 'COPILOT_REWRITE_GENERATED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: { tone: dto.tone },
    });

    return result;
  }

  /**
   * POST /api/copilot/followup
   * Prepares a polite follow-up draft.
   */
  @Post('followup')
  async generateFollowUp(@GetUser() user: AuthenticatedUser, @Body() dto: FollowUpDto, @Req() req: Request) {
    const result = await this.copilotService.generateFollowUp(user.id, dto);

    await this.auditLog.log({
      userId: user.id,
      action: 'COPILOT_FOLLOWUP_GENERATED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: { emailId: dto.emailId, delayDays: dto.delayDays },
    });

    return result;
  }

  /**
   * POST /api/copilot/meeting
   * Prepares a professional meeting invitation request.
   */
  @Post('meeting')
  async generateMeetingInvite(@GetUser() user: AuthenticatedUser, @Body() dto: MeetingRequestDto, @Req() req: Request) {
    const result = await this.copilotService.generateMeetingInvite(user.id, dto);

    await this.auditLog.log({
      userId: user.id,
      action: 'COPILOT_MEETING_GENERATED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: { emailId: dto.emailId, template: dto.template },
    });

    return result;
  }

  /**
   * POST /api/copilot/summarize-thread
   * Summarizes Gmail conversation timeline and key items.
   */
  @Post('summarize-thread')
  async summarizeThread(@GetUser() user: AuthenticatedUser, @Body() dto: SummarizeThreadDto, @Req() req: Request) {
    const result = await this.copilotService.summarizeThread(user.id, dto);

    await this.auditLog.log({
      userId: user.id,
      action: 'COPILOT_SUMMARY_GENERATED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: { emailId: dto.emailId },
    });

    return result;
  }

  /**
   * POST /api/copilot/regenerate
   * Generates alternative suggestions based on previous run parameters.
   */
  @Post('regenerate')
  async regenerate(@GetUser() user: AuthenticatedUser, @Body() dto: RegenerateSuggestionDto, @Req() req: Request) {
    const result = await this.copilotService.regenerate(user.id, dto);

    await this.auditLog.log({
      userId: user.id,
      action: 'COPILOT_REGENERATED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: { originalSuggestionId: dto.suggestionId, newSuggestionId: result.id },
    });

    return result;
  }

  /**
   * GET /api/copilot/history
   * Retrieves previous copilot suggestion runs.
   */
  @Get('history')
  async getHistory(@GetUser() user: AuthenticatedUser, @Query() query: CopilotQueryDto, @Req() req: Request) {
    const result = await this.copilotService.getHistory(user.id, query);

    await this.auditLog.log({
      userId: user.id,
      action: 'COPILOT_HISTORY_VIEWED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: { page: query.page, limit: query.limit, type: query.type },
    });

    return result;
  }

  /**
   * GET /api/copilot/stats
   * Exposes token consumption counts, cost, and latency averages.
   */
  @Get('stats')
  async getStats(@GetUser() user: AuthenticatedUser, @Req() req: Request) {
    const result = await this.copilotService.getAnalytics(user.id);

    await this.auditLog.log({
      userId: user.id,
      action: 'COPILOT_STATS_VIEWED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    return result;
  }
}
