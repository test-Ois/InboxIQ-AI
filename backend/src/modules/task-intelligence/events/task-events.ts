import { TaskStatus } from '@prisma/client';

export class TaskCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly taskId: string,
    public readonly emailId: string | null,
  ) {}
}

export class TaskUpdatedEvent {
  constructor(
    public readonly userId: string,
    public readonly taskId: string,
    public readonly status: TaskStatus,
  ) {}
}

export class TaskCompletedEvent {
  constructor(
    public readonly userId: string,
    public readonly taskId: string,
    public readonly completedAt: Date,
  ) {}
}
