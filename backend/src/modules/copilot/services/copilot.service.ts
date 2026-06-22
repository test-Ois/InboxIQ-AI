import { Injectable, Logger, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CopilotSuggestionRepository } from '../repositories/copilot-suggestion.repository';
import { AIProvider, EmailThreadMessage } from '../interfaces/ai-provider.interface';
import {
  ReplySuggestionDto,
  RewriteDraftDto,
  FollowUpDto,
  MeetingRequestDto,
  SummarizeThreadDto,
  RegenerateSuggestionDto,
  CopilotQueryDto,
} from '../dto/copilot-inputs.dto';
import { CopilotSuggestionType, CopilotTone } from '@prisma/client';

@Injectable()
export class CopilotService {
  private readonly logger = new Logger(CopilotService.name);
  private readonly COST_PER_TOKEN = 0.0000003; // Approx cost parameter

  constructor(
    private readonly repository: CopilotSuggestionRepository,
    @Inject('AI_PROVIDER') private readonly aiProvider: AIProvider,
  ) {}

  /**
   * Generates a reply suggestion based on email details.
   */
  async generateReply(userId: string, dto: ReplySuggestionDto) {
    const email = await this.repository.findEmailById(dto.emailId);
    if (!email) {
      throw new NotFoundException(`Email not found: ${dto.emailId}`);
    }
    if (email.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this email.');
    }

    const emailBody = email.snippet || '';
    const result = await this.aiProvider.generateReplySuggestion(
      email.subject,
      email.sender,
      emailBody,
      dto.tone,
      dto.customInstructions,
    );

    const cost = result.tokens * this.COST_PER_TOKEN;

    const context = {
      emailId: dto.emailId,
      subject: email.subject,
      sender: email.sender,
      customInstructions: dto.customInstructions,
    };

    return this.repository.create({
      userId,
      emailId: dto.emailId,
      suggestionType: CopilotSuggestionType.REPLY,
      tone: dto.tone,
      inputContext: context,
      generatedText: result.text,
      modelName: result.modelName,
      promptVersion: result.promptVersion,
      generatedTokens: result.tokens,
      estimatedCost: cost,
      generationTimeMs: result.generationTimeMs,
    });
  }

  /**
   * Rewrites an email draft.
   */
  async rewrite(userId: string, dto: RewriteDraftDto) {
    const result = await this.aiProvider.rewriteDraft(dto.text, dto.tone, dto.customInstructions);

    const cost = result.tokens * this.COST_PER_TOKEN;

    const context = {
      originalText: dto.text,
      customInstructions: dto.customInstructions,
    };

    return this.repository.create({
      userId,
      suggestionType: CopilotSuggestionType.REWRITE,
      tone: dto.tone || null,
      inputContext: context,
      generatedText: result.text,
      modelName: result.modelName,
      promptVersion: result.promptVersion,
      generatedTokens: result.tokens,
      estimatedCost: cost,
      generationTimeMs: result.generationTimeMs,
    });
  }

  /**
   * Generates a polite follow-up email remind draft.
   */
  async generateFollowUp(userId: string, dto: FollowUpDto) {
    const email = await this.repository.findEmailById(dto.emailId);
    if (!email) {
      throw new NotFoundException(`Email not found: ${dto.emailId}`);
    }
    if (email.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this email.');
    }

    const emailBody = email.snippet || '';
    const result = await this.aiProvider.generateFollowUp(email.subject, email.sender, emailBody, dto.delayDays);

    const cost = result.tokens * this.COST_PER_TOKEN;

    const context = {
      emailId: dto.emailId,
      subject: email.subject,
      sender: email.sender,
      delayDays: dto.delayDays,
    };

    return this.repository.create({
      userId,
      emailId: dto.emailId,
      suggestionType: CopilotSuggestionType.FOLLOWUP,
      tone: null,
      inputContext: context,
      generatedText: result.text,
      modelName: result.modelName,
      promptVersion: result.promptVersion,
      generatedTokens: result.tokens,
      estimatedCost: cost,
      generationTimeMs: result.generationTimeMs,
    });
  }

  /**
   * Generates a meeting request invitation draft.
   */
  async generateMeetingInvite(userId: string, dto: MeetingRequestDto) {
    let subject = 'Meeting Request';
    let sender = 'User';
    let emailBody = '';

    if (dto.emailId) {
      const email = await this.repository.findEmailById(dto.emailId);
      if (!email) {
        throw new NotFoundException(`Email not found: ${dto.emailId}`);
      }
      if (email.userId !== userId) {
        throw new ForbiddenException('You do not have permission to access this email.');
      }
      subject = email.subject;
      sender = email.sender;
      emailBody = email.snippet || '';
    }

    const result = await this.aiProvider.generateMeetingInvite(
      subject,
      sender,
      emailBody,
      dto.template,
      dto.agenda,
      dto.durationMinutes,
      dto.preferredTimes,
    );

    const cost = result.tokens * this.COST_PER_TOKEN;

    const context = {
      emailId: dto.emailId || null,
      template: dto.template,
      agenda: dto.agenda,
      durationMinutes: dto.durationMinutes,
      preferredTimes: dto.preferredTimes,
    };

    return this.repository.create({
      userId,
      emailId: dto.emailId || null,
      suggestionType: CopilotSuggestionType.MEETING,
      tone: null,
      inputContext: context,
      generatedText: result.text,
      modelName: result.modelName,
      promptVersion: result.promptVersion,
      generatedTokens: result.tokens,
      estimatedCost: cost,
      generationTimeMs: result.generationTimeMs,
    });
  }

  /**
   * Summarizes all emails in a Gmail conversation thread.
   */
  async summarizeThread(userId: string, dto: SummarizeThreadDto) {
    const email = await this.repository.findEmailById(dto.emailId);
    if (!email) {
      throw new NotFoundException(`Email not found: ${dto.emailId}`);
    }
    if (email.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this email.');
    }

    // Load thread emails
    const threadEmails = await this.repository.findThreadEmails(userId, email.gmailThreadId);
    const messages: EmailThreadMessage[] = threadEmails.map((e) => ({
      sender: e.sender,
      subject: e.subject,
      body: e.snippet || '',
      date: e.receivedAt,
    }));

    const result = await this.aiProvider.summarizeThread(messages);
    const cost = result.tokens * this.COST_PER_TOKEN;

    const context = {
      emailId: dto.emailId,
      threadId: email.gmailThreadId,
      messageCount: messages.length,
    };

    return this.repository.create({
      userId,
      emailId: dto.emailId,
      suggestionType: CopilotSuggestionType.SUMMARY,
      tone: null,
      inputContext: context,
      generatedText: result.text,
      modelName: result.modelName,
      promptVersion: result.promptVersion,
      generatedTokens: result.tokens,
      estimatedCost: cost,
      generationTimeMs: result.generationTimeMs,
    });
  }

  /**
   * Regenerates a new alternative suggestion based on past context parameters.
   */
  async regenerate(userId: string, dto: RegenerateSuggestionDto) {
    const original = await this.repository.findById(dto.suggestionId);
    if (!original) {
      throw new NotFoundException(`Suggestion not found: ${dto.suggestionId}`);
    }
    if (original.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this suggestion.');
    }

    const context = original.inputContext as Record<string, any>;
    let result;

    switch (original.suggestionType) {
      case CopilotSuggestionType.REPLY: {
        const email = await this.repository.findEmailById(context.emailId);
        if (!email) throw new NotFoundException(`Email context lost: ${context.emailId}`);
        result = await this.aiProvider.generateReplySuggestion(
          email.subject,
          email.sender,
          email.snippet || '',
          original.tone || CopilotTone.PROFESSIONAL,
          context.customInstructions,
        );
        break;
      }
      case CopilotSuggestionType.REWRITE: {
        result = await this.aiProvider.rewriteDraft(
          context.originalText,
          original.tone || undefined,
          context.customInstructions,
        );
        break;
      }
      case CopilotSuggestionType.FOLLOWUP: {
        const email = await this.repository.findEmailById(context.emailId);
        if (!email) throw new NotFoundException(`Email context lost: ${context.emailId}`);
        result = await this.aiProvider.generateFollowUp(
          email.subject,
          email.sender,
          email.snippet || '',
          context.delayDays,
        );
        break;
      }
      case CopilotSuggestionType.MEETING: {
        let subject = 'Meeting Request';
        let sender = 'User';
        let snippet = '';
        if (context.emailId) {
          const email = await this.repository.findEmailById(context.emailId);
          if (email) {
            subject = email.subject;
            sender = email.sender;
            snippet = email.snippet || '';
          }
        }
        result = await this.aiProvider.generateMeetingInvite(
          subject,
          sender,
          snippet,
          context.template,
          context.agenda,
          context.durationMinutes,
          context.preferredTimes,
        );
        break;
      }
      case CopilotSuggestionType.SUMMARY: {
        const email = await this.repository.findEmailById(context.emailId);
        if (!email) throw new NotFoundException(`Email context lost: ${context.emailId}`);
        const threadEmails = await this.repository.findThreadEmails(userId, email.gmailThreadId);
        const messages: EmailThreadMessage[] = threadEmails.map((e) => ({
          sender: e.sender,
          subject: e.subject,
          body: e.snippet || '',
          date: e.receivedAt,
        }));
        result = await this.aiProvider.summarizeThread(messages);
        break;
      }
      default:
        throw new ForbiddenException(`Regeneration not supported for type: ${original.suggestionType}`);
    }

    const cost = result.tokens * this.COST_PER_TOKEN;

    // Create a new suggestion record of type CUSTOM or original type
    return this.repository.create({
      userId,
      emailId: original.emailId,
      suggestionType: original.suggestionType,
      tone: original.tone,
      inputContext: {
        ...context,
        regeneratedFrom: original.id,
      },
      generatedText: result.text,
      modelName: result.modelName,
      promptVersion: result.promptVersion,
      generatedTokens: result.tokens,
      estimatedCost: cost,
      generationTimeMs: result.generationTimeMs,
    });
  }

  /**
   * Retrieves paginated usage history log for a user.
   */
  async getHistory(userId: string, query: CopilotQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [analyses, total] = await this.repository.findManyAndCount({
      userId,
      suggestionType: query.type,
      skip,
      take: limit,
    });

    return {
      history: analyses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Exposes metrics totals to the dashboard.
   */
  async getAnalytics(userId: string) {
    return this.repository.getUsageAnalytics(userId);
  }
}
