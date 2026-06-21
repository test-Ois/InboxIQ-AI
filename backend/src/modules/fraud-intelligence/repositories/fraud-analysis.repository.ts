import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma, FraudAnalysis, FraudRiskLevel } from '@prisma/client';

@Injectable()
export class FraudAnalysisRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Saves a new fraud analysis report.
   */
  async create(data: Prisma.FraudAnalysisUncheckedCreateInput): Promise<FraudAnalysis> {
    return this.prisma.fraudAnalysis.create({ data });
  }

  /**
   * Finds fraud analysis by email ID.
   */
  async findUniqueByEmailId(emailId: string): Promise<FraudAnalysis | null> {
    return this.prisma.fraudAnalysis.findUnique({
      where: { emailId },
    });
  }

  /**
   * Finds first report matching filters, optionally including email relation.
   */
  async findFirst(
    where: Prisma.FraudAnalysisWhereInput,
    include?: Prisma.FraudAnalysisInclude,
  ): Promise<FraudAnalysis | null> {
    return this.prisma.fraudAnalysis.findFirst({
      where,
      include,
    });
  }

  /**
   * Queries paginated, filtered fraud analyses.
   */
  async findMany(params: {
    where: Prisma.FraudAnalysisWhereInput;
    orderBy?: Prisma.FraudAnalysisOrderByWithRelationInput;
    skip?: number;
    take?: number;
    include?: Prisma.FraudAnalysisInclude;
  }): Promise<FraudAnalysis[]> {
    return this.prisma.fraudAnalysis.findMany(params);
  }

  /**
   * Counts scanned emails matching filters.
   */
  async count(where: Prisma.FraudAnalysisWhereInput): Promise<number> {
    return this.prisma.fraudAnalysis.count({ where });
  }

  /**
   * Returns emails flagged as suspicious/high/critical risk to aggregate top malicious domains.
   */
  async findSuspiciousEmails(userId: string) {
    return this.prisma.fraudAnalysis.findMany({
      where: {
        email: {
          userId,
        },
        riskLevel: {
          in: [FraudRiskLevel.MEDIUM, FraudRiskLevel.HIGH, FraudRiskLevel.CRITICAL],
        },
      },
      select: {
        email: {
          select: {
            sender: true,
          },
        },
      },
    });
  }
}
