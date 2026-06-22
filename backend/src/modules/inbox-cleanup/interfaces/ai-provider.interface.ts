import { CleanupCategory } from '@prisma/client';

export interface EmailClassifyOutput {
  category: CleanupCategory;
  confidenceScore: number;
}

export interface RecommendationOutput {
  id: string;
  title: string;
  description: string;
  category: CleanupCategory;
  actionType: 'ARCHIVE' | 'DELETE' | 'REVIEW' | 'PRIORITIZE';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore: number;
  estimatedStorageRecoveryMB: number;
  affectedCount: number;
}

export interface AIProvider {
  classifyEmail(subject: string, sender: string, snippet: string): Promise<EmailClassifyOutput>;

  generateRecommendations(stats: {
    promotionalCount: number;
    newsletterCount: number;
    socialCount: number;
    updatesCount: number;
    clutterCount: number;
    unreadClutterCount: number;
    fraudAlertsCount: number;
    estimatedStorageRecoveryMB: number;
    totalEmails: number;
  }): Promise<RecommendationOutput[]>;
}
