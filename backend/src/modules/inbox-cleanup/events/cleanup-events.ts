export class CleanupAnalysisCompletedEvent {
  constructor(
    public readonly userId: string,
    public readonly analysisId: string,
    public readonly inboxHealthScore: number,
    public readonly promotionalCount: number,
    public readonly newsletterCount: number,
    public readonly socialCount: number,
    public readonly updatesCount: number,
    public readonly clutterCount: number,
    public readonly estimatedStorageRecoveryMB: number,
  ) {}
}
