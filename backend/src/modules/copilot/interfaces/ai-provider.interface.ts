import { CopilotTone } from '@prisma/client';

export interface CopilotOutput {
  text: string;
  modelName: string;
  promptVersion: string;
  tokens: number;
  generationTimeMs: number;
}

export interface EmailThreadMessage {
  sender: string;
  subject: string;
  body: string;
  date: Date;
}

export interface AIProvider {
  generateReplySuggestion(
    subject: string,
    sender: string,
    body: string,
    tone: CopilotTone,
    customInstructions?: string,
  ): Promise<CopilotOutput>;

  rewriteDraft(draftText: string, tone?: CopilotTone, customInstructions?: string): Promise<CopilotOutput>;

  generateFollowUp(subject: string, sender: string, body: string, delayDays?: number): Promise<CopilotOutput>;

  generateMeetingInvite(
    subject: string,
    sender: string,
    body: string,
    template: string,
    agenda: string,
    durationMinutes?: number,
    preferredTimes?: string,
  ): Promise<CopilotOutput>;

  summarizeThread(messages: EmailThreadMessage[]): Promise<CopilotOutput>;
}
