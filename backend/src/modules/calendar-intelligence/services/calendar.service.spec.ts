import { Test, TestingModule } from '@nestjs/testing';
import { CalendarService } from './calendar.service';
import { CalendarEventRepository } from '../repositories/calendar-event.repository';
import { GmailInfrastructureService } from '../../../infrastructure/gmail/gmail.service';
import { EncryptionService } from '../../../common/services/encryption.service';
import { MeetingType, MeetingStatus } from '@prisma/client';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

// Mock googleapis
const mockCalendarList = jest.fn();
const mockCalendarInsert = jest.fn();

jest.mock('googleapis', () => {
  return {
    google: {
      calendar: jest.fn(() => ({
        events: {
          list: mockCalendarList,
          insert: mockCalendarInsert,
        },
      })),
    },
  };
});

describe('CalendarService', () => {
  let service: CalendarService;
  let mockRepository: any;
  let mockGmailInfra: any;
  let mockEncryptionService: any;
  let mockOAuth2Client: any;

  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const accountId = '223e4567-e89b-12d3-a456-426614174001';
  const eventId = '323e4567-e89b-12d3-a456-426614174002';

  const mockAccount = {
    id: accountId,
    userId,
    providerEmail: 'test@example.com',
    encryptedAccessToken: 'encrypted_access_token',
    encryptedRefreshToken: 'encrypted_refresh_token',
  };

  const mockEvents = [
    {
      id: eventId,
      userId,
      emailId: 'email-uuid',
      googleEventId: 'ge-1',
      title: 'Interview with Candidate',
      description: 'Technical interview',
      location: 'Google Meet',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      startTime: new Date('2026-06-22T10:00:00Z'),
      endTime: new Date('2026-06-22T11:00:00Z'),
      meetingType: MeetingType.INTERVIEW,
      status: MeetingStatus.CONFIRMED,
      attendees: ['candidate@example.com'],
      isConflict: false,
      isSynced: true,
    },
    {
      id: 'event-uuid-2',
      userId,
      emailId: null,
      googleEventId: null,
      title: 'Status Update',
      description: 'Daily standup meeting',
      location: null,
      meetingUrl: null,
      startTime: new Date('2026-06-22T10:30:00Z'),
      endTime: new Date('2026-06-22T11:00:00Z'),
      meetingType: MeetingType.STATUS_UPDATE,
      status: MeetingStatus.CONFIRMED,
      attendees: [],
      isConflict: false,
      isSynced: false,
    },
  ];

  beforeEach(async () => {
    mockCalendarList.mockReset();
    mockCalendarInsert.mockReset();

    mockOAuth2Client = {
      setCredentials: jest.fn(),
      on: jest.fn(),
    };

    mockGmailInfra = {
      getOAuth2Client: jest.fn().mockReturnValue(mockOAuth2Client),
    };

    mockEncryptionService = {
      encrypt: jest.fn((val) => `encrypted_${val}`),
      decrypt: jest.fn((val) => val.replace('encrypted_', '')),
    };

    mockRepository = {
      findConnectedAccount: jest.fn(),
      updateAccountCredentials: jest.fn(),
      findByGoogleEventId: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findManyAndCount: jest.fn(),
      findOverlappingEvents: jest.fn(),
      findById: jest.fn(),
      getAnalytics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        {
          provide: CalendarEventRepository,
          useValue: mockRepository,
        },
        {
          provide: GmailInfrastructureService,
          useValue: mockGmailInfra,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncGoogleCalendar', () => {
    it('should throw BadRequestException if account does not exist', async () => {
      mockRepository.findConnectedAccount.mockResolvedValue(null);

      await expect(service.syncGoogleCalendar(userId, accountId)).rejects.toThrow(BadRequestException);
    });

    it('should sync pulled events from Google and push unsynced events', async () => {
      mockRepository.findConnectedAccount.mockResolvedValue(mockAccount);

      // Google Calendar list response
      mockCalendarList.mockResolvedValue({
        data: {
          items: [
            {
              id: 'ge-1',
              summary: 'Updated Interview Title',
              description: 'Updated tech interview',
              location: 'Google Meet',
              hangoutLink: 'https://meet.google.com/abc-defg-hij',
              start: { dateTime: '2026-06-22T10:00:00Z' },
              end: { dateTime: '2026-06-22T11:00:00Z' },
              attendees: [{ email: 'candidate@example.com' }],
              status: 'confirmed',
            },
            {
              id: 'ge-3',
              summary: 'Client Sync',
              description: 'Project discussions',
              start: { dateTime: '2026-06-23T15:00:00Z' },
              end: { dateTime: '2026-06-23T15:30:00Z' },
              status: 'tentative',
            },
          ],
        },
      });

      // Existing event in database lookup
      mockRepository.findByGoogleEventId
        .mockResolvedValueOnce(mockEvents[0]) // ge-1 exists
        .mockResolvedValueOnce(null); // ge-3 is new

      // Local unsynced event to push
      mockRepository.findManyAndCount.mockResolvedValue([[mockEvents[1]], 1]);

      // Google Calendar insert response
      mockCalendarInsert.mockResolvedValue({
        data: { id: 'ge-4-inserted' },
      });

      const result = await service.syncGoogleCalendar(userId, accountId);

      expect(mockOAuth2Client.setCredentials).toHaveBeenCalledWith({
        access_token: 'access_token',
        refresh_token: 'refresh_token',
      });

      // Assert update of existing ge-1
      expect(mockRepository.update).toHaveBeenCalledWith(
        mockEvents[0].id,
        expect.objectContaining({
          title: 'Updated Interview Title',
          description: 'Updated tech interview',
          meetingType: MeetingType.INTERVIEW,
        }),
      );

      // Assert creation of new ge-3
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          googleEventId: 'ge-3',
          title: 'Client Sync',
          meetingType: MeetingType.CLIENT_MEETING,
          status: MeetingStatus.TENTATIVE,
        }),
      );

      // Assert local event is pushed to Google
      expect(mockCalendarInsert).toHaveBeenCalledWith({
        calendarId: 'primary',
        requestBody: {
          summary: 'Status Update',
          description: 'Daily standup meeting',
          location: undefined,
          start: { dateTime: mockEvents[1].startTime.toISOString() },
          end: { dateTime: mockEvents[1].endTime.toISOString() },
          attendees: [],
        },
      });

      // Assert update of pushed local event's googleEventId
      expect(mockRepository.update).toHaveBeenCalledWith(mockEvents[1].id, {
        googleEventId: 'ge-4-inserted',
        isSynced: true,
      });

      expect(result).toEqual({
        success: true,
        pulled: 2,
        pushed: 1,
      });
    });

    it('should update local event to isSynced=true even if push throws write error', async () => {
      mockRepository.findConnectedAccount.mockResolvedValue(mockAccount);
      mockCalendarList.mockResolvedValue({ data: { items: [] } });
      mockRepository.findManyAndCount.mockResolvedValue([[mockEvents[1]], 1]);
      mockCalendarInsert.mockRejectedValue(new Error('Write permissions required'));

      const result = await service.syncGoogleCalendar(userId, accountId);

      expect(mockRepository.update).toHaveBeenCalledWith(mockEvents[1].id, { isSynced: true });
      expect(result.pushed).toBe(0);
    });
  });

  describe('updateConflictFlags', () => {
    it('should set isConflict flag on overlapping events', async () => {
      mockRepository.findManyAndCount.mockResolvedValue([mockEvents, 2]);

      await service.updateConflictFlags(userId);

      // mockEvents[0] starts 10:00, ends 11:00. mockEvents[1] starts 10:30, ends 11:00.
      // They overlap, so both should be flagged with isConflict: true
      expect(mockRepository.update).toHaveBeenCalledWith(mockEvents[0].id, { isConflict: true });
      expect(mockRepository.update).toHaveBeenCalledWith(mockEvents[1].id, { isConflict: true });
    });
  });

  describe('checkConflict', () => {
    it('should return no conflict when range is clear', async () => {
      mockRepository.findOverlappingEvents.mockResolvedValue([]);

      const dto = {
        startTime: '2026-06-22T08:00:00Z',
        endTime: '2026-06-22T09:00:00Z',
      };

      const result = await service.checkConflict(userId, dto);

      expect(mockRepository.findOverlappingEvents).toHaveBeenCalledWith(
        userId,
        new Date(dto.startTime),
        new Date(dto.endTime),
        undefined,
      );
      expect(result).toEqual({
        hasConflict: false,
        conflictsCount: 0,
        overlappingEvents: [],
      });
    });

    it('should throw BadRequestException if dates are invalid', async () => {
      await expect(service.checkConflict(userId, { startTime: 'invalid', endTime: 'invalid' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('suggestSlots', () => {
    it('should suggest slots and avoid conflicts and weekends', async () => {
      // 2026-06-22 is Monday (weekday). 2026-06-21 is Sunday.
      // Let's test from Sunday June 21st to Tuesday June 23rd.
      // We have one event on Monday June 22nd from 10:00 to 11:00.
      mockRepository.findManyAndCount.mockResolvedValue([
        [
          {
            ...mockEvents[0],
            startTime: new Date('2026-06-22T10:00:00Z'),
            endTime: new Date('2026-06-22T11:00:00Z'),
          },
        ],
        1,
      ]);

      const dto = {
        startDate: '2026-06-21T00:00:00Z', // Sunday
        endDate: '2026-06-23T23:59:59Z', // Tuesday
        durationMinutes: 60,
        workHourStart: 9,
        workHourEnd: 12, // morning only for testing brevity
      };

      const result = await service.suggestSlots(userId, dto);

      // Suggestions should not include June 21st (Sunday).
      // On Monday June 22nd, work hours: 09:00 - 12:00.
      // Event: 10:00 - 11:00.
      // Available slots (60m duration):
      // - 09:00 - 10:00 (Starts 9:00, Ends 10:00 -> No conflict)
      // - 09:30 - 10:30 (Starts 9:30, Ends 10:30 -> Conflict with 10:00-11:00)
      // - 10:00 - 11:00 (Conflict)
      // - 10:30 - 11:30 (Conflict)
      // - 11:00 - 12:00 (Starts 11:00, Ends 12:00 -> No conflict)
      // On Tuesday June 23rd, work hours: 09:00 - 12:00. No events.
      // Available slots:
      // - 09:00 - 10:00
      // - 09:30 - 10:30
      // - 10:00 - 11:00
      // - 10:30 - 11:30
      // - 11:00 - 12:00

      // Let's verify results are sorted/ranked.
      expect(result.availableSlots.length).toBeGreaterThan(0);

      const containsSunday = result.availableSlots.some((s) => new Date(s.startTime).getUTCDay() === 0);
      expect(containsSunday).toBe(false);

      const conflicts = result.availableSlots.filter((s) => {
        const start = new Date(s.startTime);
        const end = new Date(s.endTime);
        return start < new Date('2026-06-22T11:00:00Z') && end > new Date('2026-06-22T10:00:00Z');
      });
      expect(conflicts.length).toBe(0);
    });

    it('should throw BadRequestException if date ranges are invalid', async () => {
      await expect(
        service.suggestSlots(userId, { startDate: 'invalid', endDate: 'invalid', durationMinutes: 30 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getEvents', () => {
    it('should return paginated events list', async () => {
      mockRepository.findManyAndCount.mockResolvedValue([[mockEvents[0]], 1]);

      const result = await service.getEvents(userId, { page: 1, limit: 10 });

      expect(mockRepository.findManyAndCount).toHaveBeenCalledWith({
        userId,
        skip: 0,
        take: 10,
        meetingType: undefined,
        status: undefined,
        startDate: undefined,
        endDate: undefined,
      });

      expect(result).toEqual({
        events: [mockEvents[0]],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });
  });

  describe('getEventById', () => {
    it('should throw NotFoundException if event does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getEventById(userId, 'non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if event belongs to another user', async () => {
      mockRepository.findById.mockResolvedValue({
        ...mockEvents[0],
        userId: 'different-user-id',
      });

      await expect(service.getEventById(userId, eventId)).rejects.toThrow(ForbiddenException);
    });

    it('should return the event if it belongs to the user', async () => {
      mockRepository.findById.mockResolvedValue(mockEvents[0]);

      const result = await service.getEventById(userId, eventId);

      expect(result).toEqual(mockEvents[0]);
    });
  });

  describe('getStats', () => {
    it('should compile stats and calculate available hours', async () => {
      const mockAnalytics = {
        upcomingCount: 5,
        completedCount: 10,
        interviewCount: 2,
        conflictCount: 1,
        busyHours: 15.5,
        breakdown: {
          STATUS_UPDATE: 2,
          INTERVIEW: 2,
          PROJECT_DISCUSSION: 1,
          CLIENT_MEETING: 3,
          FOLLOW_UP: 1,
          OTHER: 1,
        },
      };

      mockRepository.getAnalytics.mockResolvedValue(mockAnalytics);

      // Mock today's events for free hours calculation. Let's say one meeting of 2 hours.
      mockRepository.findOverlappingEvents.mockResolvedValue([
        {
          startTime: new Date('2026-06-22T10:00:00Z'),
          endTime: new Date('2026-06-22T12:00:00Z'),
        },
      ]);

      const result = await service.getStats(userId);

      expect(result).toEqual({
        upcomingMeetings: 5,
        completedMeetings: 10,
        interviewCount: 2,
        conflictCount: 1,
        busyHours: 15.5,
        availableHours: 6.0, // 8.0 business hours - 2.0 busy hours today
        typeDistribution: mockAnalytics.breakdown,
      });
    });
  });
});
