import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { GmailInfrastructureService } from '../../infrastructure/gmail/gmail.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { SignJWT, jwtVerify } from 'jose';

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);
  private readonly sharedSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly gmailInfra: GmailInfrastructureService,
    private readonly encryptionService: EncryptionService,
    private readonly auditLog: AuditLogService,
    private readonly configService: ConfigService,
  ) {
    this.sharedSecret = this.configService.get<string>('SHARED_JWT_SECRET') || '';
    if (!this.sharedSecret) {
      throw new Error('SHARED_JWT_SECRET is missing');
    }
  }

  /**
   * Generates a secure, signed OAuth state token to prevent CSRF.
   */
  private async generateStateToken(userId: string): Promise<string> {
    const secretBytes = new TextEncoder().encode(this.sharedSecret);
    return await new SignJWT({ userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(secretBytes);
  }

  /**
   * Verifies the OAuth state token and extracts the userId.
   */
  private async verifyStateToken(state: string): Promise<string> {
    try {
      const secretBytes = new TextEncoder().encode(this.sharedSecret);
      const { payload } = await jwtVerify(state, secretBytes);
      return payload.userId as string;
    } catch (error) {
      this.logger.error('❌ Failed verifying state token:', error);
      throw new BadRequestException('Invalid or expired OAuth state parameter');
    }
  }

  /**
   * Begins the Gmail integration redirect flow.
   */
  async getConnectUrl(userId: string): Promise<string> {
    const state = await this.generateStateToken(userId);
    return this.gmailInfra.generateAuthUrl(state);
  }

  /**
   * Handles Google's callback code: exchanges code, fetches profile, encrypts tokens, and saves.
   */
  async handleCallback(code: string, state: string, clientIp?: string, userAgent?: string): Promise<void> {
    const userId = await this.verifyStateToken(state);

    this.logger.log(`🔑 Exchanging code for tokens on user ID: ${userId}`);
    const tokens = await this.gmailInfra.exchangeCodeForTokens(code);

    if (!tokens.access_token) {
      throw new BadRequestException('Failed to exchange code for tokens (no access token received)');
    }

    // Encrypt the credentials
    const encryptedAccess = this.encryptionService.encrypt(tokens.access_token);
    const encryptedRefresh = tokens.refresh_token ? this.encryptionService.encrypt(tokens.refresh_token) : ''; // Can be empty if the user is reconnecting without consent prompt

    const expiryDate = new Date(Date.now() + (tokens.expiry_date || 3600 * 1000));

    // Fetch profile to resolve provider email
    const profile = await this.gmailInfra.getUserProfile(tokens.access_token);

    // Save or update to ConnectedAccount database table
    await this.prisma.$transaction(async (tx) => {
      // Find existing account first to preserve refresh token if Google didn't return one
      const existingAccount = await tx.connectedAccount.findUnique({
        where: {
          unique_user_provider_email: {
            userId,
            providerEmail: profile.email,
          },
        },
      });

      const finalRefreshToken = encryptedRefresh || existingAccount?.encryptedRefreshToken;
      if (!finalRefreshToken) {
        throw new BadRequestException(
          'Re-authorization required. Please disconnect and connect again to grant offline access permissions.',
        );
      }

      await tx.connectedAccount.upsert({
        where: {
          unique_user_provider_email: {
            userId,
            providerEmail: profile.email,
          },
        },
        create: {
          userId,
          provider: 'google',
          providerEmail: profile.email,
          encryptedAccessToken: encryptedAccess,
          encryptedRefreshToken: finalRefreshToken,
          tokenExpiry: expiryDate,
        },
        update: {
          encryptedAccessToken: encryptedAccess,
          encryptedRefreshToken: finalRefreshToken,
          tokenExpiry: expiryDate,
        },
      });
    });

    // Write audit log
    await this.auditLog.log({
      userId,
      action: 'GMAIL_CONNECTED',
      ipAddress: clientIp,
      userAgent,
      details: { email: profile.email },
    });
  }

  /**
   * Retrieves a list of active linked Gmail profiles for an authenticated user.
   */
  async getConnectedAccounts(userId: string) {
    const accounts = await this.prisma.connectedAccount.findMany({
      where: { userId },
      select: {
        id: true,
        providerEmail: true,
        createdAt: true,
      },
    });
    return accounts;
  }

  /**
   * Disconnects and purges a linked Gmail profile.
   */
  async disconnectAccount(userId: string, accountId: string, clientIp?: string, userAgent?: string): Promise<void> {
    const account = await this.prisma.connectedAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new BadRequestException('Connected account not found or access denied');
    }

    await this.prisma.connectedAccount.delete({
      where: { id: accountId },
    });

    // Write audit log
    await this.auditLog.log({
      userId,
      action: 'GMAIL_DISCONNECTED',
      ipAddress: clientIp,
      userAgent,
      details: { email: account.providerEmail },
    });
  }
}
