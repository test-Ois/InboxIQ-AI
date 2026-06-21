import { FraudRiskLevel, FraudType } from '@prisma/client';

export interface FraudAnalysisOutput {
  riskLevel: FraudRiskLevel;
  fraudType: FraudType;
  confidenceScore: number;
  explanation: string;
  indicators: string[]; // List of warnings detected
  modelName: string;
  promptVersion: string;
}

export interface AIProvider {
  analyzeFraud(
    subject: string,
    sender: string,
    snippet: string,
    receivedAt: Date,
    externalSignals: {
      senderReputation: Record<string, any>;
      linksScanned: Record<string, any>;
      attachmentsScanned: Record<string, any>;
    },
  ): Promise<FraudAnalysisOutput>;
}
