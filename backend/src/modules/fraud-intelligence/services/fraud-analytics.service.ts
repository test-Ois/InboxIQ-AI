import { Injectable, Logger } from '@nestjs/common';
import { FraudAnalysisRepository } from '../repositories/fraud-analysis.repository';
import { FraudRiskLevel } from '@prisma/client';

@Injectable()
export class FraudAnalyticsService {
  private readonly logger = new Logger(FraudAnalyticsService.name);

  constructor(private readonly repository: FraudAnalysisRepository) {}

  /**
   * Helper to extract clean domain string from sender formatting:
   * e.g., "CEO Admin <admin@malicious-spammer.ru>" -> "malicious-spammer.ru"
   */
  private getDomain(sender: string): string {
    const emailMatch = sender.match(/<([^>]+)>/);
    const emailStr = emailMatch ? emailMatch[1].trim() : sender.trim();
    const parts = emailStr.split('@');
    return parts.length > 1 ? parts[1].toLowerCase() : emailStr.toLowerCase();
  }

  /**
   * Aggregates threat data to compute Security Score and details list.
   */
  async getFraudStats(userId: string) {
    // 1. Total emails scanned for security
    const totalScanned = await this.repository.count({
      email: { userId },
    });

    // 2. Risk counts for widgets
    const lowCount = await this.repository.count({
      email: { userId },
      riskLevel: FraudRiskLevel.LOW,
    });

    const mediumCount = await this.repository.count({
      email: { userId },
      riskLevel: FraudRiskLevel.MEDIUM,
    });

    const highCount = await this.repository.count({
      email: { userId },
      riskLevel: FraudRiskLevel.HIGH,
    });

    const criticalCount = await this.repository.count({
      email: { userId },
      riskLevel: FraudRiskLevel.CRITICAL,
    });

    const safeCount = await this.repository.count({
      email: { userId },
      riskLevel: FraudRiskLevel.SAFE,
    });

    // 3. Fraud Alerts (Medium + High + Critical)
    const fraudAlertsCount = mediumCount + highCount + criticalCount;

    // 4. Mathematical Security Score
    // Formula: 100 - (Critical * 15 + High * 8 + Medium * 3 + Low * 1)
    const severityDeductions = criticalCount * 15 + highCount * 8 + mediumCount * 3 + lowCount * 1;

    const securityScore = Math.max(0, 100 - severityDeductions);

    // 5. Aggregate Top Suspicious Domains
    const suspiciousEmails = await this.repository.findSuspiciousEmails(userId);
    const domainCounts: Record<string, number> = {};

    for (const item of suspiciousEmails) {
      if (item.email?.sender) {
        const domain = this.getDomain(item.email.sender);
        if (domain) {
          domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        }
      }
    }

    const topSuspiciousDomains = Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Return top 5 most frequent suspicious domains

    return {
      metrics: {
        totalScanned,
        fraudAlertsCount,
        securityScore,
        safeEmailsCount: safeCount,
      },
      widgets: {
        fraudAlerts: fraudAlertsCount,
        highRiskEmails: highCount,
        criticalEmails: criticalCount,
        securityScore,
        topSuspiciousDomains,
      },
      breakdown: {
        SAFE: safeCount,
        LOW: lowCount,
        MEDIUM: mediumCount,
        HIGH: highCount,
        CRITICAL: criticalCount,
      },
    };
  }
}
