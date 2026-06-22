import { MeetingType } from '@prisma/client';

export interface ExtractedMeeting {
  isMeeting: boolean;
  title?: string;
  description?: string;
  location?: string;
  meetingUrl?: string;
  timezone?: string;
  startTime?: Date;
  endTime?: Date;
  meetingType?: MeetingType;
  attendees?: string[];
  rawLLMResponse?: any;
}

export interface MeetingExtractor {
  extractMeeting(subject: string, body: string, receivedAt: Date): Promise<ExtractedMeeting>;
}

/**
 * Clean Extension Points for Future Integration.
 * Declared here as interfaces to keep the engine decoupled from specific provider implementations.
 */

export interface VideoConferenceProvider {
  name: 'GOOGLE_MEET' | 'ZOOM' | 'MS_TEAMS';
  createMeeting(title: string, startTime: Date, endTime: Date): Promise<{ joinUrl: string; conferenceId: string }>;
}

export interface ExternalCalendarProvider {
  name: 'OUTLOOK_CALENDAR';
  syncEvents(userId: string): Promise<void>;
  createEvent(userId: string, event: any): Promise<string>;
}
