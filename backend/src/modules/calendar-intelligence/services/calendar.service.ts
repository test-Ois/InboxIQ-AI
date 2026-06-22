import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CalendarEventRepository } from '../repositories/calendar-event.repository';
import { GmailInfrastructureService } from '../../../infrastructure/gmail/gmail.service';
import { EncryptionService } from '../../../common/services/encryption.service';
import { google } from 'googleapis';
import { MeetingType, MeetingStatus } from '@prisma/client';
import { SuggestSlotsDto, ConflictCheckDto } from '../dto/calendar.dto';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private readonly repository: CalendarEventRepository,
    private readonly gmailInfra: GmailInfrastructureService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Synchronizes calendar events between Google Calendar and the local database.
   * 1. Refreshes OAuth credentials automatically.
   * 2. Pulls new/modified events from Google Calendar.
   * 3. Attempts to push local (unsynced) events to Google Calendar.
   */
  async syncGoogleCalendar(
    userId: string,
    accountId: string,
  ): Promise<{ success: boolean; pulled: number; pushed: number }> {
    const account = await this.repository.findConnectedAccount(userId, accountId);
    if (!account) {
      throw new BadRequestException('Connected Gmail account not found.');
    }

    const accessToken = this.encryptionService.decrypt(account.encryptedAccessToken);
    const refreshToken = this.encryptionService.decrypt(account.encryptedRefreshToken);

    const client = this.gmailInfra.getOAuth2Client();
    client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // Handle token refreshes auto-persist hook
    client.on('tokens', async (tokens) => {
      this.logger.log(`🔑 Refreshing Google Calendar OAuth credentials for account: ${accountId}`);
      const encryptedAccess = this.encryptionService.encrypt(tokens.access_token!);
      const updateData: any = { encryptedAccessToken: encryptedAccess };
      if (tokens.refresh_token) {
        updateData.encryptedRefreshToken = this.encryptionService.encrypt(tokens.refresh_token);
      }
      if (tokens.expiry_date) {
        updateData.tokenExpiry = new Date(tokens.expiry_date);
      }
      await this.repository.updateAccountCredentials(accountId, updateData);
    });

    const calendar = google.calendar({ version: 'v3', auth: client });
    let pulledCount = 0;
    let pushedCount = 0;

    // 1. Pull events from Google Calendar
    try {
      this.logger.log(`📥 Fetching events from Google Calendar for account: ${account.providerEmail}`);
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const googleEvents = response.data.items || [];
      for (const ge of googleEvents) {
        if (!ge.id) continue;

        const startStr = ge.start?.dateTime || ge.start?.date;
        const endStr = ge.end?.dateTime || ge.end?.date;
        if (!startStr || !endStr) continue;

        const startTime = new Date(startStr);
        const endTime = new Date(endStr);
        const title = ge.summary || 'No Title';
        const description = ge.description || null;
        const location = ge.location || null;
        const meetingUrl = ge.hangoutLink || this.parseMeetingUrl(description || '') || null;
        const attendeesEmails = ge.attendees ? (ge.attendees.map((a) => a.email).filter(Boolean) as string[]) : [];

        // Check mapping type
        let meetingType: MeetingType = MeetingType.OTHER;
        const lowerTitle = title.toLowerCase();
        const lowerDesc = (description || '').toLowerCase();
        if (lowerTitle.includes('interview') || lowerDesc.includes('interview')) {
          meetingType = MeetingType.INTERVIEW;
        } else if (lowerTitle.includes('client') || lowerTitle.includes('customer')) {
          meetingType = MeetingType.CLIENT_MEETING;
        } else if (lowerTitle.includes('status') || lowerTitle.includes('standup') || lowerTitle.includes('sync')) {
          meetingType = MeetingType.STATUS_UPDATE;
        } else if (lowerTitle.includes('discussion') || lowerTitle.includes('project')) {
          meetingType = MeetingType.PROJECT_DISCUSSION;
        } else if (lowerTitle.includes('follow-up') || lowerTitle.includes('followup')) {
          meetingType = MeetingType.FOLLOW_UP;
        }

        // Mapped Status
        let status: MeetingStatus = MeetingStatus.CONFIRMED;
        if (ge.status === 'tentative') status = MeetingStatus.TENTATIVE;
        if (ge.status === 'cancelled') status = MeetingStatus.CANCELLED;

        // Check if event already exists locally
        const existing = await this.repository.findByGoogleEventId(userId, ge.id);
        if (existing) {
          await this.repository.update(existing.id, {
            title,
            description,
            location,
            meetingUrl,
            startTime,
            endTime,
            meetingType,
            status,
            attendees: attendeesEmails,
          });
        } else {
          await this.repository.create({
            userId,
            googleEventId: ge.id,
            title,
            description,
            location,
            meetingUrl,
            startTime,
            endTime,
            meetingType,
            status,
            attendees: attendeesEmails,
            isSynced: true,
          });
        }
        pulledCount++;
      }
    } catch (pullError: any) {
      this.logger.error(`❌ Failed pulling calendar events from Google: ${pullError.message}`, pullError.stack);
    }

    // 2. Push unsynced local events to Google Calendar (only if write scope permits)
    try {
      const [unsyncedEvents] = await this.repository.findManyAndCount({
        userId,
        take: 50,
      });

      const targetEvents = unsyncedEvents.filter((e) => !e.googleEventId && !e.isSynced);
      this.logger.log(`📤 Pushing ${targetEvents.length} local calendar events to Google Calendar...`);

      for (const event of targetEvents) {
        try {
          const insertResponse = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
              summary: event.title,
              description: event.description || undefined,
              location: event.location || undefined,
              start: { dateTime: event.startTime.toISOString() },
              end: { dateTime: event.endTime.toISOString() },
              attendees: event.attendees ? (event.attendees as string[]).map((email) => ({ email })) : [],
            },
          });

          if (insertResponse.data.id) {
            await this.repository.update(event.id, {
              googleEventId: insertResponse.data.id,
              isSynced: true,
            });
            pushedCount++;
          }
        } catch (writeError: any) {
          this.logger.warn(`⚠️ Write access blocked or failed (likely read-only scope): ${writeError.message}`);
          // Set local state synced to true to avoid infinite retry loops if scopes are read-only
          await this.repository.update(event.id, { isSynced: true });
        }
      }
    } catch (pushError: any) {
      this.logger.error(`❌ Failed processing pushed calendar events: ${pushError.message}`, pushError.stack);
    }

    // Evaluate conflicts user-wide after sync finishes
    await this.updateConflictFlags(userId);

    return {
      success: true,
      pulled: pulledCount,
      pushed: pushedCount,
    };
  }

  /**
   * Scans all events of a user and sets the conflict state isConflict = true/false.
   */
  async updateConflictFlags(userId: string): Promise<void> {
    const [events] = await this.repository.findManyAndCount({
      userId,
      take: 1000,
    });

    const activeEvents = events.filter((e) => e.status !== MeetingStatus.CANCELLED);

    for (const event of activeEvents) {
      const overlaps = activeEvents.filter(
        (other) => other.id !== event.id && other.startTime < event.endTime && other.endTime > event.startTime,
      );

      const hasConflict = overlaps.length > 0;
      if (event.isConflict !== hasConflict) {
        await this.repository.update(event.id, { isConflict: hasConflict });
      }
    }
  }

  /**
   * Checks if a specified interval has conflicts.
   */
  async checkConflict(userId: string, dto: ConflictCheckDto) {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date parameters.');
    }

    const overlapping = await this.repository.findOverlappingEvents(userId, start, end, dto.eventId);
    return {
      hasConflict: overlapping.length > 0,
      conflictsCount: overlapping.length,
      overlappingEvents: overlapping.map((o) => ({
        id: o.id,
        title: o.title,
        startTime: o.startTime,
        endTime: o.endTime,
        meetingType: o.meetingType,
      })),
    };
  }

  /**
   * Generates availability slot recommendations.
   */
  async suggestSlots(userId: string, dto: SuggestSlotsDto) {
    const startRange = new Date(dto.startDate);
    const endRange = new Date(dto.endDate);
    if (isNaN(startRange.getTime()) || isNaN(endRange.getTime())) {
      throw new BadRequestException('Invalid start or end dates.');
    }

    const [events] = await this.repository.findManyAndCount({
      userId,
      take: 500,
    });
    const activeEvents = events.filter((e) => e.status !== MeetingStatus.CANCELLED);

    const suggestions: { startTime: string; endTime: string; ranking: number }[] = [];
    const durationMs = dto.durationMinutes * 60 * 1000;

    const startH = dto.workHourStart ?? 9;
    const endH = dto.workHourEnd ?? 17;

    // Loop day-by-day
    const current = new Date(startRange);
    while (current <= endRange) {
      const dayOfWeek = current.getUTCDay();
      // Skip weekends (Sunday=0, Saturday=6)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Set work hours starting anchor in UTC (or specified timezone offset helper)
        const workStart = new Date(current);
        workStart.setUTCHours(startH, 0, 0, 0);

        const workEnd = new Date(current);
        workEnd.setUTCHours(endH, 0, 0, 0);

        let slotStart = new Date(workStart);
        while (slotStart.getTime() + durationMs <= workEnd.getTime()) {
          const slotEnd = new Date(slotStart.getTime() + durationMs);

          // Check if slot overlaps with any calendar event
          const hasConflict = activeEvents.some((e) => e.startTime < slotEnd && e.endTime > slotStart);

          if (!hasConflict) {
            // Rank morning slots higher (e.g. 9 AM - 12 PM gets rank 1, afternoon rank 2, late afternoon rank 3)
            const hours = slotStart.getUTCHours();
            let ranking = 2;
            if (hours >= 9 && hours < 12) {
              ranking = 1; // Morning preference
            } else if (hours >= 15) {
              ranking = 3; // Late afternoon preference
            }

            suggestions.push({
              startTime: slotStart.toISOString(),
              endTime: slotEnd.toISOString(),
              ranking,
            });
          }

          // Advance by 30 minutes increments for availability choices
          slotStart = new Date(slotStart.getTime() + 30 * 60 * 1000);
        }
      }
      // Advance to next day
      current.setUTCDate(current.getUTCDate() + 1);
    }

    // Rank slots: prefer morning (ranking asc), then chronologically
    suggestions.sort((a, b) => {
      if (a.ranking !== b.ranking) {
        return a.ranking - b.ranking;
      }
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

    return {
      availableSlots: suggestions.slice(0, 15), // Return top 15 recommendations
    };
  }

  /**
   * Retrieves calendar event listing.
   */
  async getEvents(userId: string, query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [events, total] = await this.repository.findManyAndCount({
      userId,
      meetingType: query.meetingType,
      status: query.status,
      skip,
      take: limit,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });

    return {
      events,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEventById(userId: string, id: string) {
    const event = await this.repository.findById(id);
    if (!event) {
      throw new NotFoundException(`Calendar event not found: ${id}`);
    }
    if (event.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this event.');
    }
    return event;
  }

  /**
   * Aggregate statistics for calendar events dashboard.
   */
  async getStats(userId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const stats = await this.repository.getAnalytics(userId, startOfToday);

    // Calculate free hours remaining today (total business hours - busy hours today)
    const workHoursPerDay = 8;
    const todayEvents = await this.repository.findOverlappingEvents(
      userId,
      startOfToday,
      new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000),
    );
    let todayBusyMs = 0;
    for (const e of todayEvents) {
      todayBusyMs += e.endTime.getTime() - e.startTime.getTime();
    }
    const todayBusyHours = todayBusyMs / (1000 * 60 * 60);
    const availableHours = Math.max(0, Number((workHoursPerDay - todayBusyHours).toFixed(1)));

    return {
      upcomingMeetings: stats.upcomingCount,
      completedMeetings: stats.completedCount,
      interviewCount: stats.interviewCount,
      conflictCount: stats.conflictCount,
      busyHours: stats.busyHours,
      availableHours,
      typeDistribution: stats.breakdown,
    };
  }

  private parseMeetingUrl(text: string): string | null {
    const zoomRegex = /(https:\/\/[a-zA-Z0-9-]+\.zoom\.us\/j\/[a-zA-Z0-9?=&_-]+)/i;
    const meetRegex = /(https:\/\/meet\.google\.com\/[a-z-]+)/i;
    const teamsRegex = /(https:\/\/teams\.microsoft\.com\/l\/meetup-join\/[a-zA-Z0-9?=&%_-]+)/i;

    const zoomMatch = text.match(zoomRegex);
    if (zoomMatch) return zoomMatch[1];

    const meetMatch = text.match(meetRegex);
    if (meetMatch) return meetMatch[1];

    const teamsMatch = text.match(teamsRegex);
    if (teamsMatch) return teamsMatch[1];

    return null;
  }
}
