import { Controller, Get, Post, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard, AuthenticatedUser } from '../../../common/guards/auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GetUser } from '../../../common/decorators/user.decorator';
import { CalendarService } from '../services/calendar.service';
import { ConflictCheckDto, SuggestSlotsDto, SyncCalendarDto } from '../dto/calendar.dto';
import { Request } from 'express';
import { AuditLogService } from '../../../common/services/audit-log.service';

@Controller('calendar')
@UseGuards(AuthGuard, ThrottlerGuard)
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * GET /api/calendar/events
   * Returns a paginated list of calendar events for the user.
   */
  @Get('events')
  async getEvents(@GetUser() user: AuthenticatedUser, @Query() query: any, @Req() req: Request) {
    const result = await this.calendarService.getEvents(user.id, query);

    await this.auditLog.log({
      userId: user.id,
      action: 'CALENDAR_EVENTS_VIEWED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: { query },
    });

    return result;
  }

  /**
   * GET /api/calendar/events/:id
   * Returns details for a single calendar event.
   */
  @Get('events/:id')
  async getEventById(@GetUser() user: AuthenticatedUser, @Param('id') id: string, @Req() req: Request) {
    const result = await this.calendarService.getEventById(user.id, id);

    await this.auditLog.log({
      userId: user.id,
      action: 'CALENDAR_EVENT_DETAILS_VIEWED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: { eventId: id },
    });

    return result;
  }

  /**
   * POST /api/calendar/sync
   * Triggers a Google Calendar sync sweep.
   */
  @Post('sync')
  async syncCalendar(@GetUser() user: AuthenticatedUser, @Body() dto: SyncCalendarDto, @Req() req: Request) {
    const result = await this.calendarService.syncGoogleCalendar(user.id, dto.accountId);

    await this.auditLog.log({
      userId: user.id,
      action: 'CALENDAR_SYNC_TRIGGERED_MANUALLY',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: { accountId: dto.accountId },
    });

    return result;
  }

  /**
   * POST /api/calendar/conflict-check
   * Verifies if a given date time range overlaps with any confirmed bookings.
   */
  @Post('conflict-check')
  async checkConflict(@GetUser() user: AuthenticatedUser, @Body() dto: ConflictCheckDto, @Req() req: Request) {
    const result = await this.calendarService.checkConflict(user.id, dto);

    await this.auditLog.log({
      userId: user.id,
      action: 'CALENDAR_CONFLICT_CHECK_PERFORMED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: { startTime: dto.startTime, endTime: dto.endTime, eventId: dto.eventId },
    });

    return result;
  }

  /**
   * POST /api/calendar/suggest-slots
   * Recommends free intervals matching working hour configurations.
   */
  @Post('suggest-slots')
  async suggestSlots(@GetUser() user: AuthenticatedUser, @Body() dto: SuggestSlotsDto, @Req() req: Request) {
    const result = await this.calendarService.suggestSlots(user.id, dto);

    await this.auditLog.log({
      userId: user.id,
      action: 'CALENDAR_SUGGEST_SLOTS_PERFORMED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: { durationMinutes: dto.durationMinutes, timezone: dto.timezone },
    });

    return result;
  }

  /**
   * GET /api/calendar/stats
   * Aggregates meeting count types, busy hour durations, and collision totals.
   */
  @Get('stats')
  async getStats(@GetUser() user: AuthenticatedUser, @Req() req: Request) {
    const result = await this.calendarService.getStats(user.id);

    await this.auditLog.log({
      userId: user.id,
      action: 'CALENDAR_STATS_VIEWED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    return result;
  }
}
