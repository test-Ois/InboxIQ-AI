import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma, CalendarEvent, MeetingType, MeetingStatus } from '@prisma/client';

@Injectable()
export class CalendarEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CalendarEventUncheckedCreateInput): Promise<CalendarEvent> {
    return this.prisma.calendarEvent.create({ data });
  }

  async update(id: string, data: Prisma.CalendarEventUpdateInput): Promise<CalendarEvent> {
    return this.prisma.calendarEvent.update({
      where: { id },
      data,
    });
  }

  async findById(id: string): Promise<CalendarEvent | null> {
    return this.prisma.calendarEvent.findUnique({
      where: { id },
      include: {
        email: {
          select: {
            subject: true,
            sender: true,
            receivedAt: true,
          },
        },
      },
    });
  }

  async findByGoogleEventId(userId: string, googleEventId: string): Promise<CalendarEvent | null> {
    return this.prisma.calendarEvent.findFirst({
      where: { userId, googleEventId },
    });
  }

  async delete(id: string): Promise<CalendarEvent> {
    return this.prisma.calendarEvent.delete({
      where: { id },
    });
  }

  async findManyAndCount(params: {
    userId: string;
    meetingType?: MeetingType;
    status?: MeetingStatus;
    skip?: number;
    take?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<[CalendarEvent[], number]> {
    const { userId, meetingType, status, skip = 0, take = 10, startDate, endDate } = params;

    const where: Prisma.CalendarEventWhereInput = {
      userId,
      ...(meetingType ? { meetingType } : {}),
      ...(status ? { status } : {}),
      ...(startDate || endDate
        ? {
            startTime: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    };

    return Promise.all([
      this.prisma.calendarEvent.findMany({
        where,
        orderBy: { startTime: 'asc' },
        skip,
        take,
        include: {
          email: {
            select: {
              subject: true,
              sender: true,
              receivedAt: true,
            },
          },
        },
      }),
      this.prisma.calendarEvent.count({ where }),
    ]);
  }

  /**
   * Find any events that overlap with the specified date range.
   */
  async findOverlappingEvents(
    userId: string,
    startTime: Date,
    endTime: Date,
    excludeEventId?: string,
  ): Promise<CalendarEvent[]> {
    return this.prisma.calendarEvent.findMany({
      where: {
        userId,
        status: { notIn: [MeetingStatus.CANCELLED] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
        ...(excludeEventId ? { id: { not: excludeEventId } } : {}),
      },
    });
  }

  /**
   * Aggregate statistics for calendar events.
   */
  async getAnalytics(userId: string, timeMin: Date) {
    // 1. Total upcoming meetings
    const upcomingCount = await this.prisma.calendarEvent.count({
      where: {
        userId,
        status: { notIn: [MeetingStatus.CANCELLED] },
        startTime: { gte: timeMin },
      },
    });

    // 2. Total completed meetings
    const completedCount = await this.prisma.calendarEvent.count({
      where: {
        userId,
        status: MeetingStatus.COMPLETED,
      },
    });

    // 3. Interview Count
    const interviewCount = await this.prisma.calendarEvent.count({
      where: {
        userId,
        meetingType: MeetingType.INTERVIEW,
        status: { notIn: [MeetingStatus.CANCELLED] },
      },
    });

    // 4. Conflict count
    const conflictCount = await this.prisma.calendarEvent.count({
      where: {
        userId,
        isConflict: true,
        status: { notIn: [MeetingStatus.CANCELLED] },
      },
    });

    // 5. Total hours spent in meetings (confirmed/tentative/completed)
    const activeEvents = await this.prisma.calendarEvent.findMany({
      where: {
        userId,
        status: { notIn: [MeetingStatus.CANCELLED] },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    let totalDurationMs = 0;
    for (const event of activeEvents) {
      totalDurationMs += event.endTime.getTime() - event.startTime.getTime();
    }
    const busyHours = Number((totalDurationMs / (1000 * 60 * 60)).toFixed(1));

    // 6. Meeting type distribution
    const typeDistribution = await this.prisma.calendarEvent.groupBy({
      by: ['meetingType'],
      where: {
        userId,
        status: { notIn: [MeetingStatus.CANCELLED] },
      },
      _count: {
        meetingType: true,
      },
    });

    const breakdown: Record<MeetingType, number> = {
      STATUS_UPDATE: 0,
      INTERVIEW: 0,
      PROJECT_DISCUSSION: 0,
      CLIENT_MEETING: 0,
      FOLLOW_UP: 0,
      OTHER: 0,
    };

    for (const item of typeDistribution) {
      breakdown[item.meetingType] = item._count.meetingType;
    }

    return {
      upcomingCount,
      completedCount,
      interviewCount,
      conflictCount,
      busyHours,
      breakdown,
    };
  }

  /**
   * Count how many meetings are linked to an email.
   */
  async countByEmailId(emailId: string): Promise<number> {
    return this.prisma.calendarEvent.count({
      where: { emailId },
    });
  }

  /**
   * Find an existing account for token operations.
   */
  async findConnectedAccount(userId: string, accountId: string) {
    return this.prisma.connectedAccount.findFirst({
      where: { id: accountId, userId },
    });
  }

  /**
   * Find all linked accounts.
   */
  async findConnectedAccounts(userId: string) {
    return this.prisma.connectedAccount.findMany({
      where: { userId },
    });
  }

  /**
   * Save refreshed credentials back to database.
   */
  async updateAccountCredentials(accountId: string, data: { encryptedAccessToken: string; tokenExpiry: Date }) {
    await this.prisma.connectedAccount.update({
      where: { id: accountId },
      data,
    });
  }
}
