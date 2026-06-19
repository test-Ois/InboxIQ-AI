import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GmailInfrastructureService } from '../../infrastructure/gmail/gmail.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export class EmailSyncedEvent {
  constructor(
    public readonly userId: string,
    public readonly accountId: string,
    public readonly emailIds: string[],
    public readonly historyId: string,
  ) {}
}

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gmailInfra: GmailInfrastructureService,
    private readonly encryptionService: EncryptionService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Syncs emails for a connected account.
   * Fetches latest historyId or falls back to full sync.
   * Saves records and emits EmailSyncedEvent.
   */
  async syncEmails(userId: string, accountId: string): Promise<void> {
    const account = await this.prisma.connectedAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new BadRequestException('Connected Gmail account not found');
    }

    const accessToken = this.encryptionService.decrypt(account.encryptedAccessToken);
    const refreshToken = this.encryptionService.decrypt(account.encryptedRefreshToken);

    // Call infra service with auto-refresh persist hook
    const onTokensRefreshed = async (newTokens: any) => {
      const encryptedAccess = this.encryptionService.encrypt(newTokens.access_token);
      const updateData: any = { encryptedAccessToken: encryptedAccess };
      if (newTokens.refresh_token) {
        updateData.encryptedRefreshToken = this.encryptionService.encrypt(newTokens.refresh_token);
      }
      if (newTokens.expiry_date) {
        updateData.tokenExpiry = new Date(newTokens.expiry_date);
      }
      await this.prisma.connectedAccount.update({
        where: { id: accountId },
        data: updateData,
      });
      this.logger.log(`🔑 Refreshed tokens updated for connected account ID: ${accountId}`);
    };

    const { messages, latestHistoryId } = await this.gmailInfra.fetchGmailMessages(
      accessToken,
      refreshToken,
      { startHistoryId: account.gmailHistoryId || undefined, maxResults: 50 },
      onTokensRefreshed,
    );

    // Bulk upsert emails into database
    if (messages.length > 0) {
      this.logger.log(`📥 Upserting ${messages.length} email records...`);
      for (const msg of messages) {
        await this.prisma.email.upsert({
          where: {
            unique_user_gmail_message_id: {
              userId,
              gmailMessageId: msg.id,
            },
          },
          create: {
            userId,
            gmailMessageId: msg.id,
            gmailThreadId: msg.threadId,
            gmailHistoryId: msg.historyId,
            sender: msg.sender,
            subject: msg.subject,
            snippet: msg.snippet,
            labels: msg.labels,
            receivedAt: msg.receivedAt,
          },
          update: {
            gmailHistoryId: msg.historyId,
            sender: msg.sender,
            subject: msg.subject,
            snippet: msg.snippet,
            labels: msg.labels,
          },
        });
      }
    }

    // Update history ID in database
    await this.prisma.connectedAccount.update({
      where: { id: accountId },
      data: {
        gmailHistoryId: latestHistoryId || account.gmailHistoryId,
      },
    });

    // Fire Domain Event for downstream processors (AI, Fraud, Tasks, etc.)
    const emailIds = messages.map((m) => m.id);
    this.logger.log(`📢 Emitting EmailSyncedEvent with ${emailIds.length} email IDs.`);
    this.eventEmitter.emit('email.synced', new EmailSyncedEvent(userId, accountId, emailIds, latestHistoryId));
  }

  /**
   * Retrieves user emails with search, pagination, and filter capability.
   */
  async getEmails(
    userId: string,
    filters: {
      page?: number;
      limit?: number;
      search?: string;
      label?: string;
      accountId?: string;
    },
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause: any = { userId };

    if (filters.label) {
      whereClause.labels = { has: filters.label };
    }

    if (filters.search) {
      whereClause.OR = [
        { sender: { contains: filters.search, mode: 'insensitive' } },
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { snippet: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Optional connected account filter
    if (filters.accountId) {
      const account = await this.prisma.connectedAccount.findUnique({
        where: { id: filters.accountId },
      });
      if (account) {
        whereClause.sender = { contains: account.providerEmail, mode: 'insensitive' };
      }
    }

    const [emails, total] = await Promise.all([
      this.prisma.email.findMany({
        where: whereClause,
        orderBy: { receivedAt: 'desc' },
        skip,
        take: limit,
        include: {
          analysis: true,
        },
      }),
      this.prisma.email.count({ where: whereClause }),
    ]);

    return {
      emails,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Fetches detailed information for a single email record.
   */
  async getEmailById(userId: string, emailId: string) {
    const email = await this.prisma.email.findFirst({
      where: { id: emailId, userId },
      include: {
        analysis: true,
      },
    });

    if (!email) {
      throw new NotFoundException('Email record not found');
    }

    return email;
  }

  /**
   * Fetches total sync metrics for dashboard panels.
   */
  async getSyncMetrics(userId: string) {
    const connectedAccountsCount = await this.prisma.connectedAccount.count({
      where: { userId },
    });

    const totalEmailsCount = await this.prisma.email.count({
      where: { userId },
    });

    const lastSyncAccount = await this.prisma.connectedAccount.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    return {
      connectedAccounts: connectedAccountsCount,
      totalEmails: totalEmailsCount,
      lastSyncTime: lastSyncAccount?.updatedAt || null,
    };
  }
}
