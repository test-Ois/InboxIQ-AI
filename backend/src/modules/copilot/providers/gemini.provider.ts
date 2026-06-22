import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, CopilotOutput, EmailThreadMessage } from '../interfaces/ai-provider.interface';
import { CopilotTone } from '@prisma/client';
import { z } from 'zod';

const TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

// Validation Schema for Gemini raw text payload checks
const TextResponseSchema = z.object({
  text: z.string().min(1, 'Generated text must not be empty'),
});

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

  async generateReplySuggestion(
    subject: string,
    sender: string,
    body: string,
    tone: CopilotTone,
    customInstructions?: string,
  ): Promise<CopilotOutput> {
    const prompt = `
You are an expert AI email writing assistant. Draft a reply to the following email.

Original Email Details:
From: ${sender}
Subject: ${subject}
Body: ${body || '(No content)'}

Tone of Reply: ${tone}
${customInstructions ? `Custom Instructions to incorporate: ${customInstructions}` : ''}

Draft a clear, polite, and contextual reply.
Return a JSON object conforming exactly to this structure:
{
  "text": "Your drafted email reply goes here. Use double newlines for spacing. Do not include subject line or header placeholders."
}

Do not return any markdown code blocks, backticks, or other formatting. Return ONLY raw JSON text.
`;

    return this.executeFallbackChain(prompt);
  }

  async rewriteDraft(draftText: string, tone?: CopilotTone, customInstructions?: string): Promise<CopilotOutput> {
    const prompt = `
You are an expert AI copywriter. Rewrite the following email draft.

Original Draft:
${draftText}

${tone ? `Requested Tone: ${tone}` : ''}
${customInstructions ? `Custom Instructions to incorporate: ${customInstructions}` : ''}

Rewrite the draft to improve clarity, grammar, structure, and professional appeal.
Return a JSON object conforming exactly to this structure:
{
  "text": "Your rewritten email goes here. Use double newlines for spacing. Keep placeholders like names intact."
}

Do not return any markdown code blocks, backticks, or other formatting. Return ONLY raw JSON text.
`;

    return this.executeFallbackChain(prompt);
  }

  async generateFollowUp(subject: string, sender: string, body: string, delayDays?: number): Promise<CopilotOutput> {
    const daysStr = delayDays ? `${delayDays} days` : 'a few days';
    const prompt = `
You are an expert AI assistant. Draft a polite follow-up email reminder.
Context: We sent an email or received an email from "${sender}" with subject "${subject}" about ${daysStr} ago and have not received a resolution or reply.

Original Email snippet:
${body || '(No content)'}

Draft a friendly, professional follow-up email asking if they had a chance to look at it, and prompting for next steps.
Return a JSON object conforming exactly to this structure:
{
  "text": "Your follow-up email goes here. Use double newlines for spacing."
}

Do not return any markdown code blocks, backticks, or other formatting. Return ONLY raw JSON text.
`;

    return this.executeFallbackChain(prompt);
  }

  async generateMeetingInvite(
    subject: string,
    sender: string,
    body: string,
    template: string,
    agenda: string,
    durationMinutes?: number,
    preferredTimes?: string,
  ): Promise<CopilotOutput> {
    const durationStr = durationMinutes ? `${durationMinutes} minutes` : 'a short sync';
    const prompt = `
You are an expert AI meeting organizer. Draft a professional meeting request email.

Meeting Details:
- Meeting Template/Type: ${template}
- Agenda: ${agenda}
- Suggested Duration: ${durationStr}
- Preferred Times: ${preferredTimes || 'Please suggest times that work for you'}

Reference Email context:
Sender: ${sender}
Subject: ${subject}
Snippet: ${body || '(No content)'}

Draft a clear, professional meeting request invitation. Include sections detailing the purpose/agenda of the meeting, the duration, and suggested meeting times.
Return a JSON object conforming exactly to this structure:
{
  "text": "Your meeting invitation email goes here. Use double newlines for spacing."
}

Do not return any markdown code blocks, backticks, or other formatting. Return ONLY raw JSON text.
`;

    return this.executeFallbackChain(prompt);
  }

  async summarizeThread(messages: EmailThreadMessage[]): Promise<CopilotOutput> {
    const formattedMessages = messages
      .map(
        (m, idx) => `
Message #${idx + 1}
From: ${m.sender}
Date: ${m.date}
Subject: ${m.subject}
Content: ${m.body}
`,
      )
      .join('\n---');

    const prompt = `
You are an expert AI email thread analyst. Analyze the following thread containing ${messages.length} messages and generate a structured summary.

Email Thread Messages:
${formattedMessages}

Your summary must contain:
1. Timeline: A chronological list of key events and message dates.
2. Key Decisions: Important decisions that were made or agreed upon.
3. Action Items: Assigned tasks, who is responsible, and deadlines.
4. Risks: Any blocker issues, delay risks, or warnings.
5. Next Steps: Clear next actions needed to progress the conversation.

Format the summary using clear markdown headers and bullet points.
Return a JSON object conforming exactly to this structure:
{
  "text": "# Thread Summary\\n\\n### 1. Timeline\\n- [Bullet point with date]\\n\\n### 2. Key Decisions\\n- [Bullet point]\\n\\n### 3. Action Items\\n- [Bullet point]\\n\\n### 4. Risks\\n- [Bullet point]\\n\\n### 5. Next Steps\\n- [Bullet point]"
}

Do not return any markdown code blocks, backticks, or other formatting. Return ONLY raw JSON text.
`;

    return this.executeFallbackChain(prompt);
  }

  /**
   * Evaluates the model fallback sequence.
   */
  private async executeFallbackChain(prompt: string): Promise<CopilotOutput> {
    const startTime = Date.now();

    for (const modelName of this.fallbackModels) {
      this.logger.log(`🤖 Invoking Copilot AI prompt using model: ${modelName}`);

      try {
        const rawResponse = await this.executeWithRetryAndTimeout(modelName, prompt);
        const parsed = this.parseAndValidate(rawResponse);
        const elapsed = Date.now() - startTime;
        const generatedTokens = Math.max(1, Math.round(parsed.text.length / 3.8));

        return {
          text: parsed.text,
          modelName,
          promptVersion: this.promptVersion,
          tokens: generatedTokens,
          generationTimeMs: elapsed,
        };
      } catch (error: any) {
        this.logger.warn(
          `⚠️ Copilot execution failed for ${modelName}: ${error.message}. Checking next model fallback...`,
        );
      }
    }

    throw new Error('❌ Copilot execution failed: All generative AI models failed or timed out.');
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
            reject(new Error(`Copilot API timed out after ${TIMEOUT_MS}ms`));
          }, TIMEOUT_MS);
        });

        try {
          const apiCall = model.generateContent(prompt);
          const response = await Promise.race([apiCall, timeoutPromise]);
          if (timeoutId) clearTimeout(timeoutId);

          const text = response.response.text();
          if (!text) {
            throw new Error('Empty response from Copilot AI');
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
      return TextResponseSchema.parse(parsed);
    } catch (error: any) {
      this.logger.error(`Validation error parsing copilot output: ${rawText.substring(0, 150)}...`, error);
      throw new Error(`LLM output validation error: ${error.message}`);
    }
  }
}
