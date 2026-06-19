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
};
