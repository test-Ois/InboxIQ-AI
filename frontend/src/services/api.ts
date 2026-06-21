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
};


