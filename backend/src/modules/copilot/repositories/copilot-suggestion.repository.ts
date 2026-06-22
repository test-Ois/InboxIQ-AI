import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma, CopilotSuggestion, CopilotSuggestionType } from '@prisma/client';

@Injectable()
export class CopilotSuggestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Saves a new copilot suggestion.
   */
  async create(data: Prisma.CopilotSuggestionUncheckedCreateInput): Promise<CopilotSuggestion> {
    return this.prisma.copilotSuggestion.create({ data });
  }

  /**
   * Finds a copilot suggestion by ID.
   */
  async findById(id: string): Promise<CopilotSuggestion | null> {
    return this.prisma.copilotSuggestion.findUnique({
      where: { id },
    });
  }

  /**
   * Finds an email by ID.
   */
  async findEmailById(emailId: string) {
    return this.prisma.email.findUnique({
      where: { id: emailId },
    });
  }

  /**
   * Retrieves paginated history for a user, filtered optionally by type.
   */
  async findManyAndCount(params: {
    userId: string;
    suggestionType?: CopilotSuggestionType;
    skip?: number;
    take?: number;
  }): Promise<[CopilotSuggestion[], number]> {
    const { userId, suggestionType, skip = 0, take = 10 } = params;

    const where: Prisma.CopilotSuggestionWhereInput = {
      userId,
      ...(suggestionType ? { suggestionType } : {}),
    };

    return Promise.all([
      this.prisma.copilotSuggestion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          email: {
            select: {
              subject: true,
              sender: true,
              receivedAt: true,
            },
          },
        },
      }),
      this.prisma.copilotSuggestion.count({ where }),
    ]);
  }

  /**
   * Computes custom analytics metrics for the user copilot usage dashboard.
   */
  async getUsageAnalytics(userId: string) {
    // 1. Total usage/suggestions count
    const totalCount = await this.prisma.copilotSuggestion.count({
      where: { userId },
    });

    // 2. Average generation time in Ms
    const aggregates = await this.prisma.copilotSuggestion.aggregate({
      where: { userId },
      _avg: {
        generationTimeMs: true,
        generatedTokens: true,
      },
      _sum: {
        estimatedCost: true,
      },
    });

    const averageGenerationTimeMs = aggregates._avg.generationTimeMs ? Math.round(aggregates._avg.generationTimeMs) : 0;

    const averageTokens = aggregates._avg.generatedTokens ? Math.round(aggregates._avg.generatedTokens) : 0;

    const totalEstimatedCost = aggregates._sum.estimatedCost ?? 0.0;

    // 3. Most used tone
    const toneRanking = await this.prisma.copilotSuggestion.groupBy({
      by: ['tone'],
      where: {
        userId,
        tone: { not: null },
      },
      _count: {
        tone: true,
      },
      orderBy: {
        _count: {
          tone: 'desc',
        },
      },
      take: 1,
    });

    const mostUsedTone = toneRanking.length > 0 && toneRanking[0].tone ? toneRanking[0].tone : 'NONE';

    return {
      totalUsageCount: totalCount,
      suggestionsGenerated: totalCount,
      mostUsedTone,
      averageGenerationTimeMs,
      averageTokens,
      totalEstimatedCost: Number(totalEstimatedCost.toFixed(5)),
    };
  }

  /**
   * Finds all emails belonging to a specific thread.
   */
  async findThreadEmails(userId: string, gmailThreadId: string) {
    return this.prisma.email.findMany({
      where: {
        userId,
        gmailThreadId,
      },
      orderBy: { receivedAt: 'asc' },
    });
  }
}
