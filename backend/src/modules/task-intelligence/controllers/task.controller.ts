import { Controller, Get, Param, Patch, Delete, Query, Body, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard, AuthenticatedUser } from '../../../common/guards/auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GetUser } from '../../../common/decorators/user.decorator';
import { TaskService } from '../services/task.service';
import { TaskAnalyticsService } from '../services/task-analytics.service';
import { TaskQueryDto } from '../dto/task-query.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { Request } from 'express';
import { AuditLogService } from '../../../common/services/audit-log.service';

@Controller('tasks')
@UseGuards(AuthGuard, ThrottlerGuard)
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly analyticsService: TaskAnalyticsService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * GET /api/tasks
   * Retrieves user's tasks with paginated and filtered queries.
   */
  @Get()
  async getTasks(@GetUser() user: AuthenticatedUser, @Query() query: TaskQueryDto, @Req() req: Request) {
    const result = await this.taskService.getTasks(user.id, query);

    await this.auditLog.log({
      userId: user.id,
      action: 'TASKS_LISTED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: { filters: query },
    });

    return result;
  }

  /**
   * GET /api/tasks/stats
   * Retrieves summary counts and productivity insights for dashboard widgets.
   */
  @Get('stats')
  async getStats(@GetUser() user: AuthenticatedUser, @Req() req: Request) {
    const stats = await this.analyticsService.getTaskStats(user.id);

    await this.auditLog.log({
      userId: user.id,
      action: 'TASK_STATS_VIEWED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    return stats;
  }

  /**
   * GET /api/tasks/:id
   * Retrieves a specific task for the authenticated user.
   */
  @Get(':id')
  async getTaskById(@GetUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const task = await this.taskService.getTaskById(user.id, id);

    await this.auditLog.log({
      userId: user.id,
      action: 'TASK_VIEWED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: { taskId: id },
    });

    return task;
  }

  /**
   * PATCH /api/tasks/:id
   * Modifies task parameters (title, description, priority, status, dueDate).
   */
  @Patch(':id')
  async updateTask(
    @GetUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateTaskDto,
    @Req() req: Request,
  ) {
    const updated = await this.taskService.updateTask(user.id, id, body);

    await this.auditLog.log({
      userId: user.id,
      action: 'TASK_MODIFIED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: { taskId: id, updates: body },
    });

    return updated;
  }

  /**
   * DELETE /api/tasks/:id
   * Removes a specific task.
   */
  @Delete(':id')
  async deleteTask(@GetUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const deleted = await this.taskService.deleteTask(user.id, id);

    await this.auditLog.log({
      userId: user.id,
      action: 'TASK_REMOVED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: { taskId: id, title: deleted.title },
    });

    return deleted;
  }
}
