export interface EmailContent {
  subject: string;
  sender: string;
  snippet: string | null;
  receivedAt: Date;
}

export interface EmailAnalysisOutput {
  category: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  priorityScore: number; // 0 to 100
  actionRequired: boolean;
  deadline: string | null; // ISO Date YYYY-MM-DD
  summary: string; // concise bullet points, max 250 chars
  confidenceScore: number; // 0.0 to 1.0
}

export interface AIProvider {
  /**
   * Evaluates the email contents using LLM reasoning and returns structured metadata insights.
   */
  analyzeEmail(email: EmailContent): Promise<EmailAnalysisOutput>;
}
