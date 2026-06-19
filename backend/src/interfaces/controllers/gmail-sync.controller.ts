import { Controller, Post, Body, UseGuards, HttpCode, BadRequestException } from '@nestjs/common';
import { AuthGuard, AuthenticatedUser } from '../../common/guards/auth.guard';
import { GetUser } from '../../common/decorators/user.decorator';
import { EmailSyncProducer } from '../../modules/emails/queues/email-sync.producer';

@Controller('gmail')
@UseGuards(AuthGuard)
export class GmailSyncController {
  constructor(private readonly emailSyncProducer: EmailSyncProducer) {}

  /**
   * POST /api/gmail/sync
   * Enqueues an email synchronization task for a connected account.
   */
  @Post('sync')
  @HttpCode(202) // 202 Accepted for asynchronous queue operations
  async syncEmail(@GetUser() user: AuthenticatedUser, @Body('accountId') accountId: string) {
    if (!accountId) {
      throw new BadRequestException('accountId is required');
    }

    await this.emailSyncProducer.queueSync(user.id, accountId);

    return {
      message: 'Sync initiated in background',
      accountId,
    };
  }
}
