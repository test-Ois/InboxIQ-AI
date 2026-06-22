export interface ISubscriptionDetector {
  /**
   * Extension point for future subscription intelligence.
   * Evaluates if a given email is a mailing list or subscription.
   */
  detectSubscription(email: {
    id: string;
    subject: string;
    sender: string;
    snippet: string;
    headers?: Record<string, string>;
  }): Promise<{
    isSubscription: boolean;
    unsubscribeUrl?: string;
    confidenceScore?: number;
  }>;
}
