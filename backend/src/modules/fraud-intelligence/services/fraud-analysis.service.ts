import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { FraudAnalysisRepository } from '../repositories/fraud-analysis.repository';
import { FraudRiskLevel, FraudType, FraudAnalysis, Prisma } from '@prisma/client';

@Injectable()
export class FraudAnalysisService {
  private readonly logger = new Logger(FraudAnalysisService.name);

  constructor(private readonly repository: FraudAnalysisRepository) {}

  /**
   * Retrieves paginated, sorted, and filtered fraud reports for a user.
   */
  async getAnalyses(
    userId: string,
    filters: {
      page?: number;
      limit?: number;
      riskLevel?: FraudRiskLevel;
      fraudType?: FraudType;
      search?: string;
    },
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.FraudAnalysisWhereInput = {
      email: {
        userId,
      },
    };

    if (filters.riskLevel) {
      whereClause.riskLevel = filters.riskLevel;
    }

    if (filters.fraudType) {
      whereClause.fraudType = filters.fraudType;
    }

    if (filters.search) {
      whereClause.OR = [
        { explanation: { contains: filters.search, mode: 'insensitive' } },
        {
          email: {
            OR: [
              { subject: { contains: filters.search, mode: 'insensitive' } },
              { sender: { contains: filters.search, mode: 'insensitive' } },
              { snippet: { contains: filters.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [analyses, total] = await Promise.all([
      this.repository.findMany({
        where: whereClause,
        orderBy: { analyzedAt: 'desc' },
        skip,
        take: limit,
        include: {
          email: {
            select: {
              subject: true,
              sender: true,
              receivedAt: true,
              snippet: true,
            },
          },
        },
      }),
      this.repository.count(whereClause),
    ]);

    return {
      analyses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves single fraud details after checking ownership permissions.
   */
  async getAnalysisByEmailId(userId: string, emailId: string): Promise<FraudAnalysis> {
    const analysis = await this.repository.findFirst({ emailId }, { email: true });

    if (!analysis) {
      throw new NotFoundException('Fraud analysis report for this email not found');
    }

    if ((analysis as any).email.userId !== userId) {
      throw new ForbiddenException('You are not authorized to view this security report');
    }

    return analysis;
  }
}
