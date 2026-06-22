import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, EmailClassifyOutput, RecommendationOutput } from '../interfaces/ai-provider.interface';
import { CleanupCategory } from '@prisma/client';
import { z } from 'zod';

const TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

// Zod schema to validate categorization output
const ClassifyResponseSchema = z.object({
  category: z.enum(['IMPORTANT', 'PROMOTIONAL', 'NEWSLETTER', 'SOCIAL', 'UPDATES', 'CLUTTER'] as const),
  confidenceScore: z.number().min(0).max(1).default(0.8),
});

// Zod schema to validate recommendation output
const RecommendationItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['IMPORTANT', 'PROMOTIONAL', 'NEWSLETTER', 'SOCIAL', 'UPDATES', 'CLUTTER'] as const),
  actionType: z.enum(['ARCHIVE', 'DELETE', 'REVIEW', 'PRIORITIZE'] as const),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW'] as const),
  confidenceScore: z.number().min(0).max(1),
  estimatedStorageRecoveryMB: z.number().min(0),
  affectedCount: z.number().int().min(0),
});

const RecommendationListSchema = z.array(RecommendationItemSchema);

@Injectable()
export class GeminiProvider implements AIProvider {
  private readonly logger = new Logger(GeminiProvider.name);
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

  async classifyEmail(subject: string, sender: string, snippet: string): Promise<EmailClassifyOutput> {
    const prompt = `
You are an expert AI email classification assistant. Categorize the following email into one of these hygiene categories:
- IMPORTANT: Personal, financial, job-related, or critical work emails.
- PROMOTIONAL: Advertisements, marketing offers, discounts, shopping offers.
- NEWSLETTER: Informational emails, weekly summaries, blog feeds, subscribed digests.
- SOCIAL: Notifications from social media (LinkedIn, Twitter, Facebook), friend alerts.
- UPDATES: Automated notifications, transactional receipts, password resets, server logs, shipping updates.
- CLUTTER: Stale notifications, low-value system reports, obvious bulk junk, unclassified clutter.

Email Metadata:
Sender: ${sender}
Subject: ${subject}
Snippet: ${snippet || '(No snippet available)'}

Return ONLY a valid JSON object conforming exactly to this structure:
{
  "category": "IMPORTANT" | "PROMOTIONAL" | "NEWSLETTER" | "SOCIAL" | "UPDATES" | "CLUTTER",
  "confidenceScore": number (float between 0.0 and 1.0)
}

Do not return any markdown code blocks, backticks, or other formatting. Return ONLY raw JSON text.
`;

    for (const modelName of this.fallbackModels) {
      this.logger.log(`🤖 Classifying email using model: ${modelName}`);
      try {
        const rawResponse = await this.executeWithRetryAndTimeout(modelName, prompt);
        const parsed = this.parseAndValidateClassify(rawResponse);
        return parsed;
      } catch (error: any) {
        this.logger.warn(
          `⚠️ Gemini classification failed for ${modelName}: ${error.message}. Trying next fallback model...`,
        );
      }
    }

    throw new Error('❌ Email classification failed: All Gemini models exhausted or failed response validation.');
  }

  async generateRecommendations(stats: {
    promotionalCount: number;
    newsletterCount: number;
    socialCount: number;
    updatesCount: number;
    clutterCount: number;
    unreadClutterCount: number;
    fraudAlertsCount: number;
    estimatedStorageRecoveryMB: number;
    totalEmails: number;
  }): Promise<RecommendationOutput[]> {
    const prompt = `
You are an AI Email Hygiene Architect. Analyze the following statistics of a user's inbox (representing the last 90 days of emails) and generate prioritized, actionable cleanup recommendations.

Inbox Metadata Stats:
- Total Synchronized Emails: ${stats.totalEmails}
- Promotional Emails: ${stats.promotionalCount}
- Newsletters: ${stats.newsletterCount}
- Social Alerts: ${stats.socialCount}
- Notifications/Updates: ${stats.updatesCount}
- Clutter/System Logs: ${stats.clutterCount}
- Unread Clutter (Promo/Social/Clutter/Newsletters): ${stats.unreadClutterCount}
- Security Fraud/Phishing Alerts: ${stats.fraudAlertsCount}
- Total Estimated Storage Recovery: ${stats.estimatedStorageRecoveryMB.toFixed(2)} MB

Generate a list of 2 to 5 actionable recommendations to clean up the inbox.
Each recommendation object must contain:
1. id: unique string slug, e.g. "archive-old-promotional"
2. title: short action-oriented title, e.g., "Archive old promotional emails"
3. description: descriptive warning and recommendation, e.g., "You have ${stats.promotionalCount} promotional emails. We recommend archiving promotions older than 30 days to free up space."
4. category: one of IMPORTANT, PROMOTIONAL, NEWSLETTER, SOCIAL, UPDATES, CLUTTER
5. actionType: one of ARCHIVE, DELETE, REVIEW, PRIORITIZE
6. priority: one of HIGH, MEDIUM, LOW
7. confidenceScore: float between 0.0 and 1.0 (indicating the recommendation certainty)
8. estimatedStorageRecoveryMB: estimated storage recovered by this action (float, <= total recovery estimate)
9. affectedCount: number of emails affected by this action

Return ONLY a valid JSON array conforming exactly to this structure:
[
  {
    "id": "string-slug",
    "title": "string action title",
    "description": "string detail",
    "category": "IMPORTANT" | "PROMOTIONAL" | "NEWSLETTER" | "SOCIAL" | "UPDATES" | "CLUTTER",
    "actionType": "ARCHIVE" | "DELETE" | "REVIEW" | "PRIORITIZE",
    "priority": "HIGH" | "MEDIUM" | "LOW",
    "confidenceScore": number,
    "estimatedStorageRecoveryMB": number,
    "affectedCount": number
  }
]

Do not return any markdown code blocks, backticks, or other formatting. Return ONLY raw JSON text.
`;

    for (const modelName of this.fallbackModels) {
      this.logger.log(`🤖 Generating recommendations using model: ${modelName}`);
      try {
        const rawResponse = await this.executeWithRetryAndTimeout(modelName, prompt);
        const parsed = this.parseAndValidateRecommendations(rawResponse);
        return parsed;
      } catch (error: any) {
        this.logger.warn(
          `⚠️ Gemini recommendations failed for ${modelName}: ${error.message}. Trying next fallback model...`,
        );
      }
    }

    // Return hardcoded graceful fallback recommendations if LLM fails completely
    this.logger.error('❌ All Gemini models failed to generate recommendations. Returning fallback recommendations.');
    return this.getHardcodedFallbacks(stats);
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

  private parseAndValidateClassify(rawText: string): EmailClassifyOutput {
    try {
      const cleaned = this.cleanJsonText(rawText);
      const parsed = JSON.parse(cleaned);
      return ClassifyResponseSchema.parse(parsed);
    } catch (error: any) {
      this.logger.error(`Validation error parsing classification response: ${rawText.substring(0, 100)}...`, error);
      throw new Error(`LLM output validation error: ${error.message}`);
    }
  }

  private parseAndValidateRecommendations(rawText: string): RecommendationOutput[] {
    try {
      const cleaned = this.cleanJsonText(rawText);
      const parsed = JSON.parse(cleaned);
      return RecommendationListSchema.parse(parsed);
    } catch (error: any) {
      this.logger.error(`Validation error parsing recommendations response: ${rawText.substring(0, 100)}...`, error);
      throw new Error(`LLM output validation error: ${error.message}`);
    }
  }

  private cleanJsonText(rawText: string): string {
    return rawText
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/, '');
  }

  private getHardcodedFallbacks(stats: any): RecommendationOutput[] {
    const recommendations: RecommendationOutput[] = [];
    if (stats.promotionalCount > 0) {
      recommendations.push({
        id: 'archive-promotions',
        title: 'Review and Archive Promotions',
        description: `Archive your ${stats.promotionalCount} promotional emails to keep your primary inbox clean and focused.`,
        category: CleanupCategory.PROMOTIONAL,
        actionType: 'ARCHIVE',
        priority: 'MEDIUM',
        confidenceScore: 0.9,
        estimatedStorageRecoveryMB: stats.promotionalCount * 0.15,
        affectedCount: stats.promotionalCount,
      });
    }
    if (stats.newsletterCount > 5) {
      recommendations.push({
        id: 'review-newsletters',
        title: 'Clean Up Unread Newsletters',
        description: `Review newsletter subscriptions. You accumulated ${stats.newsletterCount} newsletters recently.`,
        category: CleanupCategory.NEWSLETTER,
        actionType: 'REVIEW',
        priority: 'LOW',
        confidenceScore: 0.85,
        estimatedStorageRecoveryMB: stats.newsletterCount * 0.12,
        affectedCount: stats.newsletterCount,
      });
    }
    if (stats.clutterCount > 0) {
      recommendations.push({
        id: 'delete-clutter',
        title: 'Remove Low-Value Clutter',
        description: `You have ${stats.clutterCount} automated updates or notifications which can be archived or deleted safely.`,
        category: CleanupCategory.CLUTTER,
        actionType: 'DELETE',
        priority: 'HIGH',
        confidenceScore: 0.8,
        estimatedStorageRecoveryMB: stats.clutterCount * 0.1,
        affectedCount: stats.clutterCount,
      });
    }
    return recommendations;
  }
}
