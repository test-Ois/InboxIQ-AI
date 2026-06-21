import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, TaskExtractionOutput, ExtractedTask } from '../interfaces/ai-provider.interface';
import { z } from 'zod';

const TIMEOUT_MS = 15000; // 15 seconds timeout
const MAX_RETRIES = 2; // 2 retries per model

// Zod Schema to validate structured JSON response from Gemini
const ExtractedTaskSchema = z.object({
  title: z.string().min(1, 'Task title cannot be empty'),
  description: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val || null),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const),
  dueDate: z
    .string()
    .nullable()
    .optional()
    .refine((val) => {
      if (!val) return true;
      // Check if it is a valid ISO timestamp
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'dueDate must be a valid ISO Date string')
    .transform((val) => val || null),
  confidenceScore: z.number().min(0).max(1).default(1.0),
});

const TaskExtractionResponseSchema = z.object({
  tasks: z.array(ExtractedTaskSchema),
});

@Injectable()
export class GeminiProvider implements AIProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly genAI: GoogleGenerativeAI;
  public readonly promptVersion = 'v2.0.0';

  // Fallback models in priority order
  private readonly fallbackModels = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ];

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey || apiKey === 'gemini_api_key_placeholder') {
      this.logger.warn('⚠️ GEMINI_API_KEY is not configured or is set to placeholder.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  async extractTasks(emailSubject: string, emailSnippet: string, receivedAt: Date): Promise<TaskExtractionOutput> {
    const prompt = this.buildPrompt(emailSubject, emailSnippet, receivedAt);

    // Attempt models in order
    for (const modelName of this.fallbackModels) {
      this.logger.log(`🤖 Attempting task extraction using Gemini model: ${modelName}`);

      try {
        const textResponse = await this.executeWithRetryAndTimeout(modelName, prompt);
        const parsed = this.parseAndValidate(textResponse);

        this.logger.log(`✅ Successfully extracted ${parsed.tasks.length} tasks using ${modelName}`);
        return {
          tasks: parsed.tasks as ExtractedTask[],
          modelName,
          promptVersion: this.promptVersion,
        };
      } catch (error: any) {
        this.logger.warn(
          `⚠️ Gemini task extraction failed for model ${modelName}. Error: ${error.message}. Trying fallback model...`,
        );
      }
    }

    throw new Error('❌ Task extraction failed: All Gemini fallback models exhausted or failed validation.');
  }

  private buildPrompt(subject: string, snippet: string, receivedAt: Date): string {
    const receivedISO = receivedAt.toISOString();
    const currentISO = new Date().toISOString();

    return `
You are an advanced AI Task Extraction Engine. Analyze the following email metadata and snippet to extract actionable tasks.
Each task must represent a concrete action request, promise, todo, or instruction contained within the email snippet.

Email Subject: ${subject}
Email Snippet: ${snippet || '(No snippet available)'}
Email Received Date (Reference date for relative deadline calculation): ${receivedISO}
Current Date: ${currentISO}

Your task is to identify and extract any action items or tasks from this email.

DEADLINE INTELLIGENCE:
Determine relative deadlines (e.g., "tomorrow", "next Friday", "next week", "end of month", "EOD", "COB", "ASAP") relative to the Email Received Date (${receivedISO}).
Convert all relative deadlines into exact normalized UTC ISO 8601 timestamps (YYYY-MM-DDTHH:mm:ssZ).
Guidelines for deadlines:
- "tomorrow": The calendar day after the received date, due by 17:00:00 (5:00 PM) UTC.
- "next Friday": The next upcoming Friday after the received date, due by 17:00:00 (5:00 PM) UTC.
- "next week": Exactly 7 days after the received date, due by 17:00:00 (5:00 PM) UTC.
- "end of month": The last calendar day of the received date's month, due by 17:00:00 (5:00 PM) UTC.
- "EOD" / "COB": 17:00:00 (5:00 PM) UTC on the received date, or on the next business day if received on a weekend.
- "ASAP": Due within 24 hours of the received date, set priority to HIGH or CRITICAL.
- If no deadline is mentioned or implied, set "dueDate" to null.

PRIORITY CRITERIA:
Assign a priority based on the urgency and impact of the request:
- 'CRITICAL': Urgent security notifications, service outages, or tasks with direct loss potential due within hours.
- 'HIGH': Presentations due in days, client-facing deliverables, or tasks with short deadlines.
- 'MEDIUM': Standard team updates, scheduling requests, or general action items.
- 'LOW': Reading newsletters, low-priority articles, or non-urgent future tasks.

CONFIDENCE SCORE:
Assign a confidenceScore between 0.0 and 1.0 based on how explicitly the task is stated.

You MUST return a JSON object conforming exactly to this structure:
{
  "tasks": [
    {
      "title": "Short descriptive title of the task",
      "description": "More detail about the task context from the email",
      "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "dueDate": "YYYY-MM-DDTHH:mm:ssZ" | null,
      "confidenceScore": number (float between 0.0 and 1.0)
    }
  ]
}

If no tasks can be extracted, return an empty array for tasks:
{
  "tasks": []
}

Provide ONLY raw JSON output. No markdown block formatting, no backticks, no comments.
`;
  }

  private async executeWithRetryAndTimeout(modelName: string, prompt: string): Promise<string> {
    let lastError: any;

    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        const resultText = await this.executeCall(modelName, prompt);
        return resultText;
      } catch (error: any) {
        lastError = error;
        this.logger.warn(`Attempt ${attempt} for model ${modelName} failed: ${error.message}`);
        if (attempt <= MAX_RETRIES) {
          // Wait 1s before retrying
          await new Promise((res) => setTimeout(res, 1000));
        }
      }
    }

    throw lastError;
  }

  private async executeCall(modelName: string, prompt: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    // Timeout implementation using Promise.race
    let timeoutId: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`API request timed out after ${TIMEOUT_MS}ms`));
      }, TIMEOUT_MS);
    });

    try {
      const apiCall = model.generateContent(prompt);
      const response = await Promise.race([apiCall, timeoutPromise]);

      if (timeoutId) clearTimeout(timeoutId);

      const text = response.response.text();
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }
      return text;
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      throw error;
    }
  }

  private parseAndValidate(rawText: string): { tasks: any[] } {
    try {
      const cleanedText = rawText
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/, '');
      const parsed = JSON.parse(cleanedText);
      const validated = TaskExtractionResponseSchema.parse(parsed);
      return validated;
    } catch (error: any) {
      this.logger.error(`Validation error for response text: "${rawText.substring(0, 150)}..."`, error);
      throw new Error(`LLM output response validation failed: ${error.message}`);
    }
  }
}
