import { Injectable, Logger } from '@nestjs/common';
import { CleanupCategory } from '@prisma/client';

export interface ScopedEmailDto {
  id: string;
  subject: string;
  sender: string;
  snippet: string | null;
  labels: string[];
  receivedAt: Date;
  cleanupCategory: CleanupCategory | null;
  cleanupConfidence: number | null;
  fraudAnalysis?: {
    riskLevel: string;
  } | null;
}

@Injectable()
export class CleanupAnalyticsService {
  private readonly logger = new Logger(CleanupAnalyticsService.name);

  // Storage recovery values in Megabytes per email category
  private readonly STORAGE_WEIGHTS = {
    [CleanupCategory.IMPORTANT]: 0.05, // Archive/cleanup opportunity is low, but keep for completeness
    [CleanupCategory.PROMOTIONAL]: 0.15, // Promos have heavy image/HTML tags
    [CleanupCategory.NEWSLETTER]: 0.12, // Newsletters contain medium text/HTML
    [CleanupCategory.SOCIAL]: 0.08, // Social alerts are lightweight HTML
    [CleanupCategory.UPDATES]: 0.05, // System logs/receipts
    [CleanupCategory.CLUTTER]: 0.1, // General junk
  };

  /**
   * Calculates the overall analytics, health score, and storage recovery estimates.
   */
  calculateAnalytics(emails: ScopedEmailDto[], taskMetrics: { total: number; completed: number }) {
    const totalCount = emails.length;

    let promotionalCount = 0;
    let newsletterCount = 0;
    let socialCount = 0;
    let updatesCount = 0;
    let clutterCount = 0;
    let importantCount = 0;
    let unreadClutterCount = 0;
    let fraudAlertsCount = 0;

    for (const email of emails) {
      // 1. Categorization count
      switch (email.cleanupCategory) {
        case CleanupCategory.PROMOTIONAL:
          promotionalCount++;
          break;
        case CleanupCategory.NEWSLETTER:
          newsletterCount++;
          break;
        case CleanupCategory.SOCIAL:
          socialCount++;
          break;
        case CleanupCategory.UPDATES:
          updatesCount++;
          break;
        case CleanupCategory.CLUTTER:
          clutterCount++;
          break;
        case CleanupCategory.IMPORTANT:
          importantCount++;
          break;
      }

      // 2. Check if email is unread clutter (any category except IMPORTANT)
      const isClutterCat = email.cleanupCategory && email.cleanupCategory !== CleanupCategory.IMPORTANT;
      const isUnread = email.labels.some((l) => l.toUpperCase() === 'UNREAD');
      if (isClutterCat && isUnread) {
        unreadClutterCount++;
      }

      // 3. Check for HIGH or CRITICAL fraud risk
      const risk = email.fraudAnalysis?.riskLevel;
      if (risk === 'HIGH' || risk === 'CRITICAL') {
        fraudAlertsCount++;
      }
    }

    // 4. Compute Health Score deductions
    let healthScore = 100;
    const explanationParts: string[] = [];

    if (totalCount > 0) {
      // Promotional Percentage Deduction (max 20 points)
      const promoPct = (promotionalCount / totalCount) * 100;
      const promoDeduction = Math.min(promoPct * 0.2, 20);
      healthScore -= promoDeduction;
      if (promoDeduction > 5) {
        explanationParts.push(
          `Promotions make up ${promoPct.toFixed(0)}% of recent mail (-${promoDeduction.toFixed(0)} pts).`,
        );
      }

      // Clutter Percentage Deduction (max 30 points)
      const clutterPct = (clutterCount / totalCount) * 100;
      const clutterDeduction = Math.min(clutterPct * 0.3, 30);
      healthScore -= clutterDeduction;
      if (clutterDeduction > 5) {
        explanationParts.push(
          `Unimportant clutter/junk makes up ${clutterPct.toFixed(0)}% of your inbox (-${clutterDeduction.toFixed(0)} pts).`,
        );
      }
    }

    // Newsletter Volume Deduction (max 15 points)
    const newsletterDeduction = Math.min(newsletterCount * 0.5, 15);
    healthScore -= newsletterDeduction;
    if (newsletterDeduction > 5) {
      explanationParts.push(
        `High volume of newsletter subscriptions (${newsletterCount}) accumulating (-${newsletterDeduction.toFixed(0)} pts).`,
      );
    }

    // Unread Clutter Deduction (max 15 points)
    const unreadClutterDeduction = Math.min(unreadClutterCount * 1.0, 15);
    healthScore -= unreadClutterDeduction;
    if (unreadClutterDeduction > 5) {
      explanationParts.push(
        `You have ${unreadClutterCount} unread low-priority emails pileup (-${unreadClutterDeduction.toFixed(0)} pts).`,
      );
    }

    // Active Fraud Threats Deduction (max 20 points)
    const fraudDeduction = Math.min(fraudAlertsCount * 10.0, 20);
    healthScore -= fraudDeduction;
    if (fraudAlertsCount > 0) {
      explanationParts.push(
        `Detected ${fraudAlertsCount} unresolved high-risk fraud or security threats in your mailbox (-${fraudDeduction.toFixed(0)} pts).`,
      );
    }

    // Task Completion Ratio impact (max 10 points)
    let taskDeduction = 0;
    if (taskMetrics.total > 0) {
      const completionRatio = taskMetrics.completed / taskMetrics.total;
      taskDeduction = Math.round((1 - completionRatio) * 10);
      healthScore -= taskDeduction;
      if (taskDeduction > 3) {
        explanationParts.push(
          `Task completion rate is ${(completionRatio * 100).toFixed(0)}% (-${taskDeduction} pts).`,
        );
      }
    }

    // Clamp score strictly between 0 and 100
    const finalScore = Math.max(0, Math.min(100, Math.round(healthScore)));
    const explanation =
      explanationParts.length > 0
        ? `Inbox Hygiene Score: ${finalScore}/100. Deductions due to: ${explanationParts.join(' ')}`
        : 'Your inbox is perfectly clean and healthy! Zero significant clutter or security warnings found.';

    // 5. Estimate Storage Recovery (Promos, Newsletters, Social, Clutter, Updates)
    const estimatedStorageRecoveryMB =
      promotionalCount * this.STORAGE_WEIGHTS[CleanupCategory.PROMOTIONAL] +
      newsletterCount * this.STORAGE_WEIGHTS[CleanupCategory.NEWSLETTER] +
      socialCount * this.STORAGE_WEIGHTS[CleanupCategory.SOCIAL] +
      updatesCount * this.STORAGE_WEIGHTS[CleanupCategory.UPDATES] +
      clutterCount * this.STORAGE_WEIGHTS[CleanupCategory.CLUTTER];

    return {
      inboxHealthScore: finalScore,
      scoreExplanation: explanation,
      promotionalCount,
      newsletterCount,
      socialCount,
      updatesCount,
      clutterCount,
      importantCount,
      unreadClutterCount,
      fraudAlertsCount,
      estimatedStorageRecoveryMB: Number(estimatedStorageRecoveryMB.toFixed(2)),
    };
  }
}
