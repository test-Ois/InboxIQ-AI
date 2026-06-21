import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, FraudAnalysisOutput } from '../interfaces/ai-provider.interface';
import { z } from 'zod';

const TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

// Zod validation schema matching FraudAnalysis requirements
const FraudResponseSchema = z.object({
  riskLevel: z.enum(['SAFE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const),
  fraudType: z.enum([
    'NONE',
    'PHISHING',
    'SPAM',
    'SPOOFING',
    'MALWARE',
    'BEC',
    'SCAM',
    'IMPERSONATION',
    'OTHER',
  ] as const),
  confidenceScore: z.number().min(0).max(1).default(0.8),
  explanation: z.string().min(1, 'Explanation cannot be empty'),
  indicators: z.array(z.string()).default([]),
});

@Injectable()
export class GeminiProvider implements AIProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly genAI: GoogleGenerativeAI;
  public readonly promptVersion = 'v3.0.0';

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

  async analyzeFraud(
    subject: string,
    sender: string,
    snippet: string,
    receivedAt: Date,
    externalSignals: {
      senderReputation: Record<string, any>;
      linksScanned: Record<string, any>;
      attachmentsScanned: Record<string, any>;
    },
  ): Promise<FraudAnalysisOutput> {
    const prompt = this.buildPrompt(subject, sender, snippet, receivedAt, externalSignals);

    for (const modelName of this.fallbackModels) {
      this.logger.log(`🤖 Requesting fraud scan using model: ${modelName}`);

      try {
        const rawResponse = await this.executeWithRetryAndTimeout(modelName, prompt);
        const parsed = this.parseAndValidate(rawResponse);

        return {
          ...parsed,
          modelName,
          promptVersion: this.promptVersion,
        };
      } catch (error: any) {
        this.logger.warn(`⚠️ Gemini fraud analysis failed for ${modelName}: ${error.message}. Checking next model...`);
      }
    }

    throw new Error('❌ Fraud analysis failed: All Gemini models exhausted or failed response validation.');
  }

  private buildPrompt(
    subject: string,
    sender: string,
    snippet: string,
    receivedAt: Date,
    signals: {
      senderReputation: Record<string, any>;
      linksScanned: Record<string, any>;
      attachmentsScanned: Record<string, any>;
    },
  ): string {
    return `
You are an advanced Cyber Security Fraud & Phishing Detection Engine. Analyze the following email details and security check signals to evaluate fraud and phishing risks.

Email Subject: ${subject}
Email Sender: ${sender}
Email Content Snippet: ${snippet || '(No snippet available)'}
Received Date: ${receivedAt.toISOString()}

EXTERNAL SECURITY SIGNALS SCANNED:
1. Sender Reputation Check:
   - Domain: ${signals.senderReputation.domain}
   - Free Provider: ${signals.senderReputation.isFreeProvider}
   - Mismatched/Executive Keywords: ${signals.senderReputation.isBecImpersonation}
   - Flagged details: ${signals.senderReputation.flagReason || 'None'}

2. Phishing URL scanner:
   - Contains Hyperlinks: ${signals.linksScanned.hasHttpLink}
   - Credential keywords found: ${signals.linksScanned.hasUrgentAction}
   - Flagged details: ${signals.linksScanned.flagReason || 'None'}

3. Malware Attachment scanner:
   - Script/Executable extension references: ${signals.attachmentsScanned.isDangerousExtension}
   - Zip/Rar archive extensions: ${signals.attachmentsScanned.hasArchive}
   - Flagged details: ${signals.attachmentsScanned.flagReason || 'None'}

Your goal is to evaluate if this email is safe, spam, spoofed, a phishing attempt, BEC (Business Email Compromise), malware carrier, scam, or impersonation.

CLASSIFICATION INSTRUCTIONS:
- riskLevel: Set to SAFE (no flags), LOW (spam/newsletters), MEDIUM (suspicious domains, standard spam), HIGH (BEC impersonation, scam), or CRITICAL (malware extensions, active phishing links).
- fraudType: Choose from NONE, PHISHING, SPAM, SPOOFING, MALWARE, BEC, SCAM, IMPERSONATION, OTHER.
- indicators: Extract specific alert details (e.g., "Spoofed sender address", "Mismatched domain authority", "Urgent action requested in body", "Suspicious link found").
- explanation: Write a detailed breakdown (2-3 sentences) describing why this classification was made, the indicators found, and warning advice for the user.

Return ONLY a valid JSON object conforming exactly to this structure:
{
  "riskLevel": "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "fraudType": "NONE" | "PHISHING" | "SPAM" | "SPOOFING" | "MALWARE" | "BEC" | "SCAM" | "IMPERSONATION" | "OTHER",
  "confidenceScore": number (float between 0.0 and 1.0),
  "explanation": "string description",
  "indicators": ["string alert 1", "string alert 2"]
}

Do not return any markdown code blocks, backticks, or other formatting. Return ONLY raw JSON text.
`;
  }

  private async executeWithRetryAndTimeout(modelName: string, prompt: string): Promise<string> {
    let lastError: any;

    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        const text = await this.executeCall(modelName, prompt);
        return text;
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

  private async executeCall(modelName: string, prompt: string): Promise<string> {
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
  }

  private parseAndValidate(rawText: string) {
    try {
      const cleaned = rawText
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/, '');
      const parsed = JSON.parse(cleaned);
      return FraudResponseSchema.parse(parsed);
    } catch (error: any) {
      this.logger.error(`Validation error parsing response: ${rawText.substring(0, 150)}...`, error);
      throw new Error(`LLM output validation error: ${error.message}`);
    }
  }
}
