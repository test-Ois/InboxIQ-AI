import { Controller, Get, Post, Query, Body, UseGuards, Redirect, Headers, Ip } from '@nestjs/common';
import { AuthGuard, AuthenticatedUser } from '../../common/guards/auth.guard';
import { GetUser } from '../../common/decorators/user.decorator';
import { GmailService } from '../../modules/gmail/gmail.service';

@Controller('gmail')
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  /**
   * GET /api/gmail/connect
   * Generates Google OAuth consent screen URL for the client to redirect to.
   * Expects a signed Next.js token in query params or Authorization header.
   */
  @Get('connect')
  @UseGuards(AuthGuard)
  async connect(@GetUser() user: AuthenticatedUser) {
    const url = await this.gmailService.getConnectUrl(user.id);
    return { url };
  }

  /**
   * GET /api/gmail/connect/callback
   * Google OAuth callback redirect endpoint. Exchanges code and redirects user back to dashboard.
   */
  @Get('connect/callback')
  @Redirect('http://localhost:3000/dashboard?gmail_connected=true', 302)
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    if (!code || !state) {
      // If code/state is missing, redirect with error flag
      return { url: 'http://localhost:3000/dashboard?error=oauth_failed' };
    }
    try {
      await this.gmailService.handleCallback(code, state, ip, userAgent);
      return { url: 'http://localhost:3000/dashboard?gmail_connected=true' };
    } catch (error) {
      console.error('❌ Gmail connection callback failed:', error);
      return { url: 'http://localhost:3000/dashboard?error=oauth_processing_error' };
    }
  }

  /**
   * GET /api/gmail/accounts
   * Lists all connected accounts for the current user.
   */
  @Get('accounts')
  @UseGuards(AuthGuard)
  async getAccounts(@GetUser() user: AuthenticatedUser) {
    return this.gmailService.getConnectedAccounts(user.id);
  }

  /**
   * POST /api/gmail/disconnect
   * Disconnects a specific linked Gmail account.
   */
  @Post('disconnect')
  @UseGuards(AuthGuard)
  async disconnect(
    @GetUser() user: AuthenticatedUser,
    @Body('accountId') accountId: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    await this.gmailService.disconnectAccount(user.id, accountId, ip, userAgent);
    return { message: 'Account disconnected successfully' };
  }
}
