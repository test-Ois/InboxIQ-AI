import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, EmailContent, EmailAnalysisOutput } from '../interfaces/ai-provider.interface';

@Injectable()
export class GeminiProvider implements AIProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly genAI: GoogleGenerativeAI;
  public readonly modelName = 'gemini-2.5-flash';
  public readonly promptVersion = 'v1.0.0';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey || apiKey === 'gemini_api_key_placeholder') {
      this.logger.warn('⚠️ GEMINI_API_KEY is not configured or is set to placeholder.');
    }
    // Initialize Google Generative AI SDK
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  async analyzeEmail(email: EmailContent): Promise<EmailAnalysisOutput> {
    this.logger.log(`🤖 Requesting Gemini analysis for email: "${email.subject.substring(0, 30)}..."`);

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const referenceDate = email.receivedAt.toISOString();
      const prompt = `
        You are an AI Email Assistant. Analyze the following email metadata and content:
        Sender: ${email.sender}
        Subject: ${email.subject}
        Snippet: ${email.snippet || '(No snippet available)'}
        Received Date: ${referenceDate}

        Current Reference Date (for calculating relative deadlines like "next Friday"): ${new Date().toISOString()}

        Return a JSON object conforming exactly to this structure:
        {
          "category": "Job" | "Work" | "Finance" | "Education" | "Personal" | "Newsletter" | "Promotion" | "Security" | "Travel" | "Shopping" | "Other",
          "priority": "Critical" | "High" | "Medium" | "Low",
          "priorityScore": number (integer between 0 and 100),
          "actionRequired": boolean,
          "deadline": "YYYY-MM-DD" or null,
          "summary": string (concise bullet points, max 3 bullets, max 250 characters total),
          "confidenceScore": number (float between 0.0 and 1.0)
        }
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      if (!responseText) {
        throw new Error('Empty response received from Gemini API');
      }

      const parsed: EmailAnalysisOutput = JSON.parse(responseText);

      // Simple runtime validation checks for output schema compatibility
      if (
        !parsed.category ||
        !parsed.priority ||
        typeof parsed.priorityScore !== 'number' ||
        typeof parsed.actionRequired !== 'boolean' ||
        !parsed.summary
      ) {
        throw new Error('Gemini response JSON structure does not conform to the expected schema');
      }

      return {
        category: parsed.category,
        priority: parsed.priority,
        priorityScore: parsed.priorityScore,
        actionRequired: parsed.actionRequired,
        deadline: parsed.deadline || null,
        summary: parsed.summary.substring(0, 250), // Hard limit length
        confidenceScore: parsed.confidenceScore || 0.8,
      };
    } catch (error) {
      this.logger.error('❌ Gemini analysis request failed:', error);
      throw error;
    }
  }
}
