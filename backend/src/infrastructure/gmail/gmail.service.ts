import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface GmailProfileInfo {
  email: string;
  name: string;
}

export interface GmailMessageData {
  id: string;
  threadId: string;
  historyId: string;
  sender: string;
  subject: string;
  snippet: string;
  labels: string[];
  receivedAt: Date;
}

@Injectable()
export class GmailInfrastructureService {
  private readonly logger = new Logger(GmailInfrastructureService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initializes a fresh instance of the OAuth2 client from environment configurations.
   */
  getOAuth2Client(): OAuth2Client {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GMAIL_REDIRECT_URI');

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  /**
   * Generates the Google OAuth url requesting gmail.readonly, email, and profile permissions.
   * Forces offline access type and consent prompt to ensure a refresh token is returned.
   */
  generateAuthUrl(state: string): string {
    const client = this.getOAuth2Client();
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      state,
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
    });
  }

  /**
   * Exchanges authorization code returned by callback for OAuth tokens.
   */
  async exchangeCodeForTokens(code: string) {
    const client = this.getOAuth2Client();
    const { tokens } = await client.getToken(code);
    return tokens;
  }

  /**
   * Fetches user profile (email, name) using the Google API.
   */
  async getUserProfile(accessToken: string): Promise<GmailProfileInfo> {
    const client = this.getOAuth2Client();
    client.setCredentials({ access_token: accessToken });

    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const { data } = await oauth2.userinfo.get();

    if (!data.email) {
      throw new Error('Could not retrieve email from Google profile');
    }

    return {
      email: data.email,
      name: data.name || '',
    };
  }

  /**
   * Fetches messages from Gmail. If historyId is passed, pulls modifications (delta sync).
   * Otherwise fetches latest messages (initial sync).
   */
  async fetchGmailMessages(
    accessToken: string,
    refreshToken: string,
    options: { maxResults?: number; startHistoryId?: string },
    onTokensRefreshed?: (newTokens: any) => Promise<void>,
  ): Promise<{ messages: GmailMessageData[]; latestHistoryId: string }> {
    const client = this.getOAuth2Client();
    client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // Listen for automatic token refreshes
    client.on('tokens', async (tokens) => {
      this.logger.log('🔑 Google access token automatically refreshed by client.');
      if (onTokensRefreshed) {
        await onTokensRefreshed(tokens);
      }
    });

    const gmail = google.gmail({ version: 'v1', auth: client });
    const fetchedMessages: GmailMessageData[] = [];
    let latestHistoryId = '';

    try {
      // Step 1: Get list of messages
      let messageIds: string[] = [];

      if (options.startHistoryId) {
        // Delta sync using History API
        this.logger.log(`🔄 Performing delta sync starting from history ID: ${options.startHistoryId}`);
        try {
          const historyResponse = await gmail.users.history.list({
            userId: 'me',
            startHistoryId: options.startHistoryId,
            maxResults: options.maxResults || 50,
          });

          // Fetch user current history ID for baseline
          const profile = await gmail.users.getProfile({ userId: 'me' });
          latestHistoryId = profile.data.historyId || options.startHistoryId;

          const historyRecords = historyResponse.data.history || [];
          for (const item of historyRecords) {
            const added = item.messagesAdded || [];
            for (const msg of added) {
              if (msg.message?.id) {
                messageIds.push(msg.message.id);
              }
            }
          }
        } catch (error: any) {
          // If historyId is expired (status 404/400), trigger full sync fallback
          if (error.code === 404 || error.code === 400) {
            this.logger.warn('⚠️ History ID has expired. Falling back to initial full sync.');
            options.startHistoryId = undefined; // Proceed with initial sync below
          } else {
            throw error;
          }
        }
      }

      if (!options.startHistoryId) {
        // Full initial sync
        this.logger.log('📥 Performing full initial sync of emails.');
        const response = await gmail.users.messages.list({
          userId: 'me',
          maxResults: options.maxResults || 20, // default limit for dev safety
        });

        const messages = response.data.messages || [];
        messageIds = messages.map((m) => m.id as string).filter(Boolean);

        const profile = await gmail.users.getProfile({ userId: 'me' });
        latestHistoryId = profile.data.historyId || '';
      }

      // Step 2: Fetch detailed metadata for each message
      for (const id of messageIds) {
        try {
          const detail = await gmail.users.messages.get({
            userId: 'me',
            id,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date'],
          });

          const headers = detail.data.payload?.headers || [];
          const sender = headers.find((h) => h.name === 'From')?.value || 'Unknown Sender';
          const subject = headers.find((h) => h.name === 'Subject')?.value || '(No Subject)';
          const dateStr = headers.find((h) => h.name === 'Date')?.value || '';

          const receivedAt = dateStr ? new Date(dateStr) : new Date();

          fetchedMessages.push({
            id: detail.data.id as string,
            threadId: detail.data.threadId as string,
            historyId: detail.data.historyId as string,
            sender,
            subject,
            snippet: detail.data.snippet || '',
            labels: detail.data.labelIds || [],
            receivedAt,
          });
        } catch (detailError) {
          this.logger.error(`❌ Failed to fetch detail for message ${id}`, detailError);
        }
      }

      return {
        messages: fetchedMessages,
        latestHistoryId,
      };
    } catch (error) {
      this.logger.error('❌ Failed fetching Gmail messages:', error);
      throw error;
    }
  }
}
