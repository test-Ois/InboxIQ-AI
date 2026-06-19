import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard, AuthenticatedUser } from '../../common/guards/auth.guard';
import { GetUser } from '../../common/decorators/user.decorator';
import { EmailsService } from '../../modules/emails/emails.service';

@Controller('emails')
@UseGuards(AuthGuard)
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  /**
   * GET /api/emails
   * Retrieves paginated, filtered, and searched emails.
   */
  @Get()
  async getEmails(
    @GetUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('label') label?: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.emailsService.getEmails(user.id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      label,
      accountId,
    });
  }

  /**
   * GET /api/emails/metrics
   * Retrieves total sync numbers and counts for the dashboard cards.
   */
  @Get('metrics')
  async getMetrics(@GetUser() user: AuthenticatedUser) {
    return this.emailsService.getSyncMetrics(user.id);
  }

  /**
   * GET /api/emails/:id
   * Retrieves detail record for a specific email.
   */
  @Get(':id')
  async getEmailById(@GetUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.emailsService.getEmailById(user.id, id);
  }
}
