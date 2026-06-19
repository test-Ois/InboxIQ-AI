import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EmailAnalysisRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Saves a new email analysis result to the database.
   */
  async create(data: Prisma.EmailAnalysisUncheckedCreateInput) {
    return this.prisma.emailAnalysis.create({ data });
  }

  /**
   * Retrieves an analysis record by email ID.
   */
  async findUniqueByEmailId(emailId: string) {
    return this.prisma.emailAnalysis.findUnique({
      where: { emailId },
    });
  }

  /**
   * Retrieves an analysis record by email ID, including relation details.
   */
  async findFirst(where: Prisma.EmailAnalysisWhereInput, include?: Prisma.EmailAnalysisInclude) {
    return this.prisma.emailAnalysis.findFirst({
      where,
      include,
    });
  }

  /**
   * Queries paginated, filtered analysis records.
   */
  async findMany(params: {
    where: Prisma.EmailAnalysisWhereInput;
    orderBy?: Prisma.EmailAnalysisOrderByWithRelationInput;
    skip?: number;
    take?: number;
    include?: Prisma.EmailAnalysisInclude;
  }) {
    return this.prisma.emailAnalysis.findMany(params);
  }

  /**
   * Counts the number of analysis records matching filters.
   */
  async count(where: Prisma.EmailAnalysisWhereInput) {
    return this.prisma.emailAnalysis.count({ where });
  }
}
