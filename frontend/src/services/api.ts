import axios from 'axios';

// Create axios instance pointing to our local Next.js proxy prefix
const apiClient = axios.create({
  baseURL: '/api/backend',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to extract payload or reject with descriptive errors
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && body.success === false) {
      return Promise.reject(new Error(body.error?.message || 'API request failed'));
    }
    // Return the actual payload inside the envelope
    return body.data;
  },
  (error) => {
    const apiError = error.response?.data?.error;
    const message = apiError?.message || error.message || 'Network error occurred';
    return Promise.reject(new Error(message));
  }
);

export interface ConnectedAccountDto {
  id: string;
  providerEmail: string;
  createdAt: string;
}

export interface EmailAnalysisDto {
  id: string;
  emailId: string;
  category: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  priorityScore: number;
  actionRequired: boolean;
  deadline: string | null;
  summary: string;
  confidenceScore: number;
  modelName: string;
  promptVersion: string;
  analyzedAt: string;
}

export interface EmailDto {
  id: string;
  gmailMessageId: string;
  gmailThreadId: string;
  gmailHistoryId?: string;
  sender: string;
  subject: string;
  snippet: string;
  labels: string[];
  receivedAt: string;
  syncedAt: string;
  analysis?: EmailAnalysisDto | null;
}

export interface EmailListResponse {
  emails: EmailDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SyncMetricsDto {
  connectedAccounts: number;
  totalEmails: number;
  lastSyncTime: string | null;
}

export interface AiStatsDto {
  criticalEmails: number;
  highPriorityEmails: number;
  actionRequiredEmails: number;
  upcomingDeadlines: number;
}

export interface HealthCheckDto {
  status: string;
  timestamp: string;
  services: {
    database: string;
  };
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskSource = 'EMAIL' | 'MANUAL' | 'AI_GENERATED';

export interface TaskDto {
  id: string;
  userId: string;
  emailId: string | null;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  completedAt: string | null;
  confidenceScore: number;
  source: TaskSource;
  extractionModel: string | null;
  promptVersion: string | null;
  createdAt: string;
  updatedAt: string;
  email?: {
    subject: string;
    sender: string;
    receivedAt: string;
  } | null;
}

export interface TaskStatsDto {
  metrics: {
    totalCreated: number;
    totalCompleted: number;
    completionPercentage: number;
    averageCompletionTimeMs: number;
    overdueCount: number;
    overdueRate: number;
    aiGeneratedToday: number;
  };
  widgets: {
    myTasks: number;
    dueToday: number;
    upcomingDeadlines: number;
    overdueTasks: number;
    completedTasks: number;
    highPriorityTasks: number;
    aiGeneratedToday: number;
  };
}

export interface TaskListResponse {
  tasks: TaskDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type FraudRiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FraudType =
  | 'NONE'
  | 'PHISHING'
  | 'SPAM'
  | 'SPOOFING'
  | 'MALWARE'
  | 'BEC'
  | 'SCAM'
  | 'IMPERSONATION'
  | 'OTHER';

export interface FraudAnalysisDto {
  id: string;
  emailId: string;
  riskLevel: FraudRiskLevel;
  fraudType: FraudType;
  confidenceScore: number;
  explanation: string;
  indicators: string[]; // parsed JSON string[]
  modelName: string;
  promptVersion: string;
  analyzedAt: string;
  createdAt: string;
  updatedAt: string;
  email?: {
    subject: string;
    sender: string;
    receivedAt: string;
    snippet: string;
  } | null;
}

export interface SuspiciousDomainDto {
  domain: string;
  count: number;
}

export interface FraudStatsDto {
  metrics: {
    totalScanned: number;
    fraudAlertsCount: number;
    securityScore: number;
    safeEmailsCount: number;
  };
  widgets: {
    fraudAlerts: number;
    highRiskEmails: number;
    criticalEmails: number;
    securityScore: number;
    topSuspiciousDomains: SuspiciousDomainDto[];
  };
  breakdown: Record<FraudRiskLevel, number>;
}

export interface FraudListResponse {
  analyses: FraudAnalysisDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RecommendationOutputDto {
  id: string;
  title: string;
  description: string;
  category: 'IMPORTANT' | 'PROMOTIONAL' | 'NEWSLETTER' | 'SOCIAL' | 'UPDATES' | 'CLUTTER';
  actionType: 'ARCHIVE' | 'DELETE' | 'REVIEW' | 'PRIORITIZE';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore: number;
  estimatedStorageRecoveryMB: number;
  affectedCount: number;
}

export interface CleanupAnalysisDto {
  id: string;
  userId: string;
  inboxHealthScore: number;
  previousHealthScore: number | null;
  promotionalCount: number;
  newsletterCount: number;
  socialCount: number;
  updatesCount: number;
  clutterCount: number;
  estimatedStorageRecoveryMB: number;
  recommendations: RecommendationOutputDto[];
  analyzedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CleanupStatsDto {
  inboxHealthScore: number;
  previousHealthScore: number | null;
  promotionalCount: number;
  newsletterCount: number;
  socialCount: number;
  updatesCount: number;
  clutterCount: number;
  unreadClutterCount: number;
  estimatedStorageRecoveryMB: number;
  recommendationCount: number;
  analyzedAt: string | null;
}

export interface CleanupHistoryResponse {
  analyses: CleanupAnalysisDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type CopilotSuggestionType = 'REPLY' | 'REWRITE' | 'FOLLOWUP' | 'MEETING' | 'SUMMARY' | 'CUSTOM';
export type CopilotTone = 'PROFESSIONAL' | 'CASUAL' | 'APOLOGETIC' | 'DIRECT' | 'ENTHUSIASTIC';

export interface CopilotSuggestionDto {
  id: string;
  userId: string;
  emailId: string | null;
  suggestionType: CopilotSuggestionType;
  tone: CopilotTone | null;
  inputContext: any;
  generatedText: string;
  modelName: string;
  promptVersion: string;
  generatedTokens: number | null;
  estimatedCost: number | null;
  generationTimeMs: number | null;
  createdAt: string;
  updatedAt: string;
  email: {
    subject: string;
    sender: string;
    receivedAt: string;
  } | null;
}

export interface CopilotStatsDto {
  totalUsageCount: number;
  suggestionsGenerated: number;
  mostUsedTone: string;
  averageGenerationTimeMs: number;
  averageTokens: number;
  totalEstimatedCost: number;
}

export interface CopilotHistoryResponse {
  history: CopilotSuggestionDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type MeetingType = 'STATUS_UPDATE' | 'INTERVIEW' | 'PROJECT_DISCUSSION' | 'CLIENT_MEETING' | 'FOLLOW_UP' | 'OTHER';
export type MeetingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'TENTATIVE' | 'COMPLETED';

export interface CalendarEventDto {
  id: string;
  userId: string;
  emailId: string | null;
  googleEventId: string | null;
  title: string;
  description: string | null;
  location: string | null;
  meetingUrl: string | null;
  timezone: string;
  startTime: string;
  endTime: string;
  meetingType: MeetingType;
  status: MeetingStatus;
  attendees: string[] | null;
  isConflict: boolean;
  isSynced: boolean;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  email?: {
    subject: string;
    sender: string;
    receivedAt: string;
  } | null;
}

export interface CalendarEventsResponse {
  events: CalendarEventDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CalendarStatsDto {
  upcomingMeetings: number;
  completedMeetings: number;
  interviewCount: number;
  conflictCount: number;
  busyHours: number;
  availableHours: number;
  typeDistribution: Record<MeetingType, number>;
}

export const apiService = {
  getProfile: async (): Promise<any> => {
    return apiClient.get('/auth/profile');
  },

  getConnectedAccounts: async (): Promise<ConnectedAccountDto[]> => {
    return apiClient.get('/gmail/accounts');
  },

  getConnectUrl: async (): Promise<{ url: string }> => {
    return apiClient.get('/gmail/connect');
  },

  disconnectAccount: async (accountId: string): Promise<any> => {
    return apiClient.post('/gmail/disconnect', { accountId });
  },

  triggerSync: async (accountId: string): Promise<{ message: string; accountId: string }> => {
    return apiClient.post('/gmail/sync', { accountId });
  },

  getEmails: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    label?: string;
    accountId?: string;
  }): Promise<EmailListResponse> => {
    return apiClient.get('/emails', { params });
  },

  getEmailById: async (id: string): Promise<EmailDto> => {
    return apiClient.get(`/emails/${id}`);
  },

  getMetrics: async (): Promise<SyncMetricsDto> => {
    return apiClient.get('/emails/metrics');
  },

  getAiStats: async (): Promise<AiStatsDto> => {
    return apiClient.get('/email-analysis/stats');
  },

  getHealth: async (): Promise<HealthCheckDto> => {
    return apiClient.get('/health');
  },

  getTasks: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<TaskListResponse> => {
    return apiClient.get('/tasks', { params });
  },

  getTaskById: async (id: string): Promise<TaskDto> => {
    return apiClient.get(`/tasks/${id}`);
  },

  updateTask: async (
    id: string,
    updates: {
      title?: string;
      description?: string;
      priority?: TaskPriority;
      status?: TaskStatus;
      dueDate?: string | null;
    },
  ): Promise<TaskDto> => {
    return apiClient.patch(`/tasks/${id}`, updates);
  },

  deleteTask: async (id: string): Promise<TaskDto> => {
    return apiClient.delete(`/tasks/${id}`);
  },

  getTaskStats: async (): Promise<TaskStatsDto> => {
    return apiClient.get('/tasks/stats');
  },

  getFraudAnalyses: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    riskLevel?: FraudRiskLevel;
    fraudType?: FraudType;
  }): Promise<FraudListResponse> => {
    return apiClient.get('/fraud-analysis', { params });
  },

  getFraudAnalysisByEmailId: async (emailId: string): Promise<FraudAnalysisDto> => {
    return apiClient.get(`/fraud-analysis/${emailId}`);
  },

  getFraudStats: async (): Promise<FraudStatsDto> => {
    return apiClient.get('/fraud-analysis/stats');
  },

  getLatestCleanupAnalysis: async (): Promise<CleanupAnalysisDto> => {
    return apiClient.get('/cleanup/analysis/latest');
  },

  getCleanupStats: async (): Promise<CleanupStatsDto> => {
    return apiClient.get('/cleanup/stats');
  },

  getCleanupRecommendations: async (): Promise<RecommendationOutputDto[]> => {
    return apiClient.get('/cleanup/recommendations');
  },

  getCleanupAnalyses: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<CleanupHistoryResponse> => {
    return apiClient.get('/cleanup/analysis', { params });
  },

  triggerCleanupSweep: async (): Promise<{ message: string; jobId: string }> => {
    return apiClient.post('/cleanup/analyze');
  },

  generateCopilotReply: async (body: {
    emailId: string;
    tone: CopilotTone;
    customInstructions?: string;
  }): Promise<CopilotSuggestionDto> => {
    return apiClient.post('/copilot/reply', body);
  },

  rewriteCopilotDraft: async (body: {
    text: string;
    tone?: CopilotTone;
    customInstructions?: string;
  }): Promise<CopilotSuggestionDto> => {
    return apiClient.post('/copilot/rewrite', body);
  },

  generateCopilotFollowup: async (body: {
    emailId: string;
    delayDays?: number;
  }): Promise<CopilotSuggestionDto> => {
    return apiClient.post('/copilot/followup', body);
  },

  generateCopilotMeetingInvite: async (body: {
    emailId?: string;
    template: string;
    agenda: string;
    durationMinutes?: number;
    preferredTimes?: string;
  }): Promise<CopilotSuggestionDto> => {
    return apiClient.post('/copilot/meeting', body);
  },

  summarizeCopilotThread: async (body: {
    emailId: string;
  }): Promise<CopilotSuggestionDto> => {
    return apiClient.post('/copilot/summarize-thread', body);
  },

  regenerateCopilotSuggestion: async (body: {
    suggestionId: string;
  }): Promise<CopilotSuggestionDto> => {
    return apiClient.post('/copilot/regenerate', body);
  },

  getCopilotHistory: async (params?: {
    page?: number;
    limit?: number;
    type?: CopilotSuggestionType;
  }): Promise<CopilotHistoryResponse> => {
    return apiClient.get('/copilot/history', { params });
  },

  getCopilotStats: async (): Promise<CopilotStatsDto> => {
    return apiClient.get('/copilot/stats');
  },

  getCalendarEvents: async (params?: {
    page?: number;
    limit?: number;
    meetingType?: MeetingType;
    status?: MeetingStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<CalendarEventsResponse> => {
    return apiClient.get('/calendar/events', { params });
  },

  getCalendarEventById: async (id: string): Promise<CalendarEventDto> => {
    return apiClient.get(`/calendar/events/${id}`);
  },

  syncCalendar: async (accountId: string): Promise<{ success: boolean; pulled: number; pushed: number }> => {
    return apiClient.post('/calendar/sync', { accountId });
  },

  checkCalendarConflict: async (body: {
    startTime: string;
    endTime: string;
    eventId?: string;
  }): Promise<{ hasConflict: boolean; conflictsCount: number; overlappingEvents: any[] }> => {
    return apiClient.post('/calendar/conflict-check', body);
  },

  suggestCalendarSlots: async (body: {
    startDate: string;
    endDate: string;
    durationMinutes: number;
    workHourStart?: number;
    workHourEnd?: number;
    timezone?: string;
  }): Promise<{ availableSlots: { startTime: string; endTime: string; ranking: number }[] }> => {
    return apiClient.post('/calendar/suggest-slots', body);
  },

  getCalendarStats: async (): Promise<CalendarStatsDto> => {
    return apiClient.get('/calendar/stats');
  },
};


