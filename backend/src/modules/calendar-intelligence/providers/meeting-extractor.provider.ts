import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MeetingExtractor, ExtractedMeeting } from '../interfaces/meeting-extractor.interface';
import { MeetingType } from '@prisma/client';
import { z } from 'zod';

const TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

const MeetingExtractionSchema = z.object({
  isMeeting: z.boolean(),
  title: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  meetingUrl: z.string().optional(),
  timezone: z.string().optional(),
  startTime: z.string().optional(), // ISO-8601 string format
  endTime: z.string().optional(), // ISO-8601 string format
  meetingType: z
    .enum(['STATUS_UPDATE', 'INTERVIEW', 'PROJECT_DISCUSSION', 'CLIENT_MEETING', 'FOLLOW_UP', 'OTHER'])
    .optional(),
  attendees: z.array(z.string().email()).optional(),
});

@Injectable()
export class MeetingExtractorProvider implements MeetingExtractor {
  private readonly logger = new Logger(MeetingExtractorProvider.name);
  private readonly genAI: GoogleGenerativeAI;
  public readonly promptVersion = 'v1.0.0';

  private readonly fallbackModels = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ];

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  async extractMeeting(subject: string, body: string, receivedAt: Date): Promise<ExtractedMeeting> {
    const prompt = `
You are an expert AI scheduling assistant. Analyze the email subject and body below and detect if it is a meeting request, calendar invite, or contains instructions to schedule a meeting.

Email Context:
Received At (Reference base time): ${receivedAt.toISOString()}
Subject: ${subject}
Body: ${body || '(No body content)'}

Extract meeting details relative to the "Received At" timestamp.
If it is NOT a meeting or does not schedule a meeting, return isMeeting: false.
If a meeting is detected, return isMeeting: true and extract all available details.
Find any links that look like video conference links (Google Meet, Zoom, Teams) and populate meetingUrl.

Return a JSON object conforming exactly to this structure:
{
  "isMeeting": true/false,
  "title": "A concise title for the calendar event",
  "description": "Short description summarizing the meeting purpose",
  "location": "Physical address, room number, or call link description",
  "meetingUrl": "Video call join URL (if found, e.g. zoom.us, meet.google.com)",
  "timezone": "Suggested timezone (e.g. UTC, EST, PST)",
  "startTime": "ISO-8601 start date time string",
  "endTime": "ISO-8601 end date time string (if end time isn't clear, assume 30 minutes duration)",
  "meetingType": "STATUS_UPDATE" | "INTERVIEW" | "PROJECT_DISCUSSION" | "CLIENT_MEETING" | "FOLLOW_UP" | "OTHER",
  "attendees": ["email1@domain.com", "email2@domain.com"]
}

Do not return any markdown code blocks, backticks, or other formatting. Return ONLY raw JSON text.
`;

    const result = await this.executeFallbackChain(prompt);

    // Convert string dates back into Date objects
    return {
      isMeeting: result.isMeeting,
      title: result.title,
      description: result.description,
      location: result.location,
      meetingUrl: result.meetingUrl,
      timezone: result.timezone || 'UTC',
      startTime: result.startTime ? new Date(result.startTime) : undefined,
      endTime: result.endTime ? new Date(result.endTime) : undefined,
      meetingType: result.meetingType as MeetingType,
      attendees: result.attendees || [],
      rawLLMResponse: result,
    };
  }

  private async executeFallbackChain(prompt: string): Promise<z.infer<typeof MeetingExtractionSchema>> {
    for (const modelName of this.fallbackModels) {
      this.logger.log(`🤖 Invoking Meeting Extraction AI using model: ${modelName}`);

      try {
        const rawResponse = await this.executeWithRetryAndTimeout(modelName, prompt);
        const parsed = this.parseAndValidate(rawResponse);
        return parsed;
      } catch (error: any) {
        this.logger.warn(`⚠️ Meeting extraction failed for ${modelName}: ${error.message}. Checking next fallback...`);
      }
    }

    throw new Error('❌ Meeting extraction failed: All generative AI models failed or timed out.');
  }

  private async executeWithRetryAndTimeout(modelName: string, prompt: string): Promise<string> {
    let lastError: any;

    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });

        let timeoutId: NodeJS.Timeout | undefined;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error(`Meeting Extractor API timed out after ${TIMEOUT_MS}ms`));
          }, TIMEOUT_MS);
        });

        try {
          const apiCall = model.generateContent(prompt);
          const response = await Promise.race([apiCall, timeoutPromise]);
          if (timeoutId) clearTimeout(timeoutId);

          const text = response.response.text();
          if (!text) {
            throw new Error('Empty response from Meeting Extractor AI');
          }
          return text;
        } catch (error) {
          if (timeoutId) clearTimeout(timeoutId);
          throw error;
        }
      } catch (error: any) {
        lastError = error;
        this.logger.warn(`Model ${modelName} attempt ${attempt} failed: ${error.message}`);
        if (attempt <= MAX_RETRIES) {
          await new Promise((res) => setTimeout(res, 1000));
        }
      }
    }

    throw lastError;
  }

  private parseAndValidate(rawText: string) {
    try {
      const cleaned = rawText
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/, '');
      const parsed = JSON.parse(cleaned);
      return MeetingExtractionSchema.parse(parsed);
    } catch (error: any) {
      this.logger.error(`Validation error parsing meeting extractor output: ${rawText.substring(0, 150)}...`, error);
      throw new Error(`LLM output validation error: ${error.message}`);
    }
  }
}
