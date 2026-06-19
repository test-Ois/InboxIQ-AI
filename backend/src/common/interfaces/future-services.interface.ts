/**
 * InboxIQ AI - Future Services Architecture Boundaries & Interfaces
 *
 * These interfaces define the contracts, integration patterns, and boundaries
 * for subsequent development phases. Implementing classes will plug directly
 * into the event-driven hooks (e.g., listening to EmailSyncedEvent).
 */

// ==========================================
// Phase 2: AI Email Analysis Service
// ==========================================

export interface EmailAnalysisResult {
  emailId: string;
  summary: string;
  category: 'work' | 'personal' | 'finance' | 'travel' | 'social' | 'updates';
  sentiment: 'positive' | 'negative' | 'neutral';
  urgencyScore: number; // 0 to 100
  keyKeywords: string[];
}

export interface IAiAnalysisService {
  /**
   * Process email content using LLM models to create summaries, sentiments, and classifications.
   * This is triggered asynchronously via EmailSyncedEvent.
   */
  analyzeEmail(emailId: string): Promise<EmailAnalysisResult>;

  /**
   * Generates a vector embedding of the email content to be stored in Qdrant.
   */
  generateEmailEmbedding(emailId: string): Promise<number[]>;
}

// ==========================================
// Phase 3: Task Extraction Engine
// ==========================================

export interface ExtractedTask {
  title: string;
  description?: string;
  dueDate?: Date;
  suggestedAssignee?: string;
  confidenceScore: number; // 0.0 to 1.0
}

export interface ITaskIntelligenceService {
  /**
   * Scan email body and extract actionable checklist tasks automatically.
   * Typically triggered by EmailAnalyzedEvent.
   */
  extractTasksFromEmail(emailId: string): Promise<ExtractedTask[]>;
}

// ==========================================
// Phase 4: Fraud Detection Engine
// ==========================================

export interface FraudScanResult {
  isPhishing: boolean;
  spamScore: number; // 0 to 100
  dmarcStatus: 'PASS' | 'FAIL' | 'NONE';
  reasons: string[];
  recommendedAction: 'DELIVER' | 'FLAG' | 'QUARANTINE';
}

export interface IFraudDetectionService {
  /**
   * Scans email headers and body for malicious links, social engineering indicators, and spoofing.
   * Runs concurrently during synchronization to block spam/phishing early.
   */
  scanEmail(emailId: string): Promise<FraudScanResult>;
}

// ==========================================
// Phase 5: Productivity Analytics
// ==========================================

export interface UserAnalyticsOverview {
  totalEmailsReceived: number;
  averageResponseTimeSeconds: number;
  tasksCompletedCount: number;
  fraudEmailsBlocked: number;
  volumeHistory: { date: string; count: number }[];
  categoryDistribution: Record<string, number>;
}

export interface IAnalyticsService {
  /**
   * Aggregates synchronization data, category histories, and response metrics for user charts.
   */
  getUserOverview(userId: string, startDate: Date, endDate: Date): Promise<UserAnalyticsOverview>;
}

// ==========================================
// Phase 6: AI Copilot
// ==========================================

export interface CopilotMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CopilotQueryResponse {
  answer: string;
  contextSources: { emailId: string; subject: string; snippet: string }[];
  suggestedActions?: { label: string; actionType: string; payload: Record<string, any> }[];
}

export interface IAiCopilotService {
  /**
   * Interactively answers user questions regarding their emails.
   * Leverages RAG (Retrieval-Augmented Generation) querying Qdrant to load email context.
   */
  queryCopilot(userId: string, query: string, history: CopilotMessage[]): Promise<CopilotQueryResponse>;
}

// ==========================================
// Cross-Cutting: Notification Service
// ==========================================

export interface NotificationPayload {
  userId: string;
  channel: 'email' | 'web_push' | 'sms' | 'in_app';
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface INotificationService {
  /**
   * Triggers real-time alerts or updates.
   * Called by FraudDetection (phishing alert) or TaskIntelligence (task reminders).
   */
  sendNotification(payload: NotificationPayload): Promise<boolean>;
}
