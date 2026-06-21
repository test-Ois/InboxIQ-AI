import { Injectable, Inject, Logger } from '@nestjs/common';
import { AIProvider, TaskExtractionOutput } from '../interfaces/ai-provider.interface';

@Injectable()
export class TaskExtractionService {
  private readonly logger = new Logger(TaskExtractionService.name);

  constructor(@Inject('AI_PROVIDER') private readonly aiProvider: AIProvider) {}

  /**
   * Invokes the injected AI provider to extract tasks from the given email content.
   */
  async extractTasksFromEmail(subject: string, snippet: string, receivedAt: Date): Promise<TaskExtractionOutput> {
    this.logger.log(`🔍 Requesting task extraction from AI provider for: "${subject}"`);
    return this.aiProvider.extractTasks(subject, snippet, receivedAt);
  }
}
