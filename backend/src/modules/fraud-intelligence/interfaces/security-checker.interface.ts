export interface SecurityCheckResult {
  checkerName: string;
  isFlagged: boolean;
  riskRating: 'SAFE' | 'LOW' | 'SUSPICIOUS' | 'HIGH' | 'CRITICAL';
  details: Record<string, any>;
}

export interface SecurityChecker {
  name: string;
  check(email: { sender: string; subject: string; snippet: string }): Promise<SecurityCheckResult>;
}

/**
 * Future-ready simulation for AbuseIPDB domain reputation.
 */
export class AbuseIPDBChecker implements SecurityChecker {
  readonly name = 'AbuseIPDB Domain Reputation';

  async check(email: { sender: string; subject: string; snippet: string }): Promise<SecurityCheckResult> {
    const sender = email.sender.toLowerCase();
    const domainMatch = sender.match(/@([a-z0-9\-]+\.[a-z0-9\.]+)/);
    const domain = domainMatch ? domainMatch[1] : '';

    const suspiciousTlds = ['.ru', '.click', '.gq', '.zip', '.country', '.download'];
    const isSuspiciousTld = suspiciousTlds.some((tld) => domain.endsWith(tld));

    // BEC Impersonation check: Sender using free email but display name mimics company/authority
    const freeProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    const isFreeProvider = freeProviders.some((provider) => domain === provider);

    const hasExecutiveKeywords = /ceo|cfo|executive|admin|support|security|finance|bank/i.test(email.sender);
    const isBecImpersonation = isFreeProvider && hasExecutiveKeywords;

    const details: Record<string, any> = {
      domain,
      isFreeProvider,
      isSuspiciousTld,
      isBecImpersonation,
    };

    let riskRating: SecurityCheckResult['riskRating'] = 'SAFE';
    let isFlagged = false;

    if (isBecImpersonation) {
      riskRating = 'HIGH';
      isFlagged = true;
      details.flagReason = 'BEC Impersonation detected (executive keywords from free provider)';
    } else if (isSuspiciousTld) {
      riskRating = 'SUSPICIOUS';
      isFlagged = true;
      details.flagReason = `Suspicious sender domain TLD detected: ${domain}`;
    }

    return {
      checkerName: this.name,
      isFlagged,
      riskRating,
      details,
    };
  }
}

/**
 * Future-ready simulation for OpenPhish phishing URL scanner.
 */
export class OpenPhishChecker implements SecurityChecker {
  readonly name = 'OpenPhish URL Reputation';

  async check(email: { sender: string; subject: string; snippet: string }): Promise<SecurityCheckResult> {
    const text = (email.subject + ' ' + email.snippet).toLowerCase();

    // Look for link structures or phishing keywords with redirection/sign-in calls
    const hasUrgentAction = /verify|login|signin|reset|update.*card|suspended|unauthorized|action.*required/i.test(
      text,
    );
    const hasHttpLink = /http:\/\/|https:\/\//i.test(text);

    const details: Record<string, any> = {
      hasHttpLink,
      hasUrgentAction,
    };

    let riskRating: SecurityCheckResult['riskRating'] = 'SAFE';
    let isFlagged = false;

    if (hasHttpLink && hasUrgentAction) {
      riskRating = 'CRITICAL';
      isFlagged = true;
      details.flagReason = 'Mismatched links combined with urgent credential update call-to-action';
    } else if (hasUrgentAction) {
      riskRating = 'LOW';
      isFlagged = true;
      details.flagReason = 'Suspicious credential reset/verification wording detected';
    }

    return {
      checkerName: this.name,
      isFlagged,
      riskRating,
      details,
    };
  }
}

/**
 * Future-ready simulation for VirusTotal file/hash attachment scanner.
 */
export class VirusTotalChecker implements SecurityChecker {
  readonly name = 'VirusTotal Attachment Scanner';

  async check(email: { sender: string; subject: string; snippet: string }): Promise<SecurityCheckResult> {
    const text = (email.subject + ' ' + email.snippet).toLowerCase();

    // Look for malware attachment flags (e.g. invoice.exe, report.scr, patch.vbs, archive.zip)
    const malwareExtensions = [/\.exe\b/i, /\.scr\b/i, /\.vbs\b/i, /\.bat\b/i, /\.js\b/i];
    const isDangerousExtension = malwareExtensions.some((regex) => regex.test(text));

    const zipOrArchive = /\.zip\b|\.rar\b|\.7z\b/i.test(text);

    const details: Record<string, any> = {
      isDangerousExtension,
      hasArchive: zipOrArchive,
    };

    let riskRating: SecurityCheckResult['riskRating'] = 'SAFE';
    let isFlagged = false;

    if (isDangerousExtension) {
      riskRating = 'CRITICAL';
      isFlagged = true;
      details.flagReason = 'Executable/script script file name references detected in email';
    } else if (zipOrArchive) {
      riskRating = 'SUSPICIOUS';
      isFlagged = true;
      details.flagReason = 'Archive file attachments referenced (potential packaging for malicious code)';
    }

    return {
      checkerName: this.name,
      isFlagged,
      riskRating,
      details,
    };
  }
}
