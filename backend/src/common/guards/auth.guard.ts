import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify } from 'jose';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogService } from '../services/audit-log.service';

export interface AuthenticatedUser {
  id: string; // Internal database UUID
  authProviderId: string; // Google sub ID
  email: string;
  name: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly jwtSecret: Uint8Array;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {
    const secret = this.configService.get<string>('SHARED_JWT_SECRET');
    if (!secret) {
      throw new Error('SHARED_JWT_SECRET is not configured');
    }
    this.jwtSecret = new TextEncoder().encode(secret);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    try {
      const { payload } = await jwtVerify(token, this.jwtSecret);

      if (!payload.sub || !payload.email) {
        throw new UnauthorizedException('Token payload is incomplete');
      }

      const authProviderId = payload.sub;
      const email = payload.email as string;
      const name = (payload.name as string) || '';

      // Find or lazy-provision the user in the database
      let dbUser = await this.prisma.user.findUnique({
        where: { authProviderId },
      });

      if (!dbUser) {
        // Self-provision user on first authentication request
        dbUser = await this.prisma.user.create({
          data: {
            authProviderId,
            email,
            name,
          },
        });

        await this.auditLog.log({
          userId: dbUser.id,
          action: 'USER_REGISTERED',
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
          details: { email },
        });
      }

      request.user = {
        id: dbUser.id, // Internal database UUID
        authProviderId,
        email: dbUser.email,
        name: dbUser.name,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ') ?? [];
      if (type === 'Bearer') {
        return token;
      }
    }
    return (request.query?.token as string) || null;
  }
}
