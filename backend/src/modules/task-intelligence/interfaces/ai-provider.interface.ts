import { TaskPriority } from '@prisma/client';

export interface ExtractedTask {
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: string | null; // ISO-8601 UTC timestamp format (or null)
  confidenceScore: number;
}

export interface TaskExtractionOutput {
  tasks: ExtractedTask[];
  modelName: string;
  promptVersion: string;
}

export interface AIProvider {
  extractTasks(emailSubject: string, emailSnippet: string, receivedAt: Date): Promise<TaskExtractionOutput>;
}
