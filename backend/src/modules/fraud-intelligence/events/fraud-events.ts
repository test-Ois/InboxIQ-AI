import { FraudRiskLevel, FraudType } from '@prisma/client';

export class FraudAnalyzedEvent {
  constructor(
    public readonly emailId: string,
    public readonly userId: string,
    public readonly riskLevel: FraudRiskLevel,
    public readonly fraudType: FraudType,
    public readonly confidenceScore: number,
  ) {}
}
