import { Test, TestingModule } from '@nestjs/testing';
import { CopilotService } from './copilot.service';
import { CopilotSuggestionRepository } from '../repositories/copilot-suggestion.repository';
import { CopilotSuggestionType, CopilotTone } from '@prisma/client';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('CopilotService', () => {
  let service: CopilotService;
  let mockRepository: any;
  let mockAiProvider: any;

  const userId = '5a6bc891-bdf4-4690-b9cc-8cfc1341a995';
  const emailId = '75d9e5ab-0453-433b-8ea3-b541bb87cd9d';
  const suggestionId = 'c071d0e1-f6a7-47b2-bd72-9fb5814522fb';

  const mockEmail = {
    id: emailId,
    userId,
    subject: 'Re: Project Alpha',
    sender: 'client@example.com',
    snippet: 'Can you please send me the latest metrics?',
    gmailThreadId: 'thread-xyz',
    receivedAt: new Date('2026-06-21T10:00:00Z'),
    gmailMessageId: 'msg-1',
    gmailHistoryId: null,
    labels: [],
    syncedAt: new Date(),
    createdAt: new Date(),
    cleanupCategory: null,
    cleanupConfidence: null,
  };

  const mockSuggestionResult = {
    text: 'Here are the requested metrics...',
    modelName: 'gemini-2.5-flash',
    promptVersion: 'v1.0.0',
    tokens: 8,
    generationTimeMs: 120,
  };

  beforeEach(async () => {
    mockRepository = {
      findEmailById: jest.fn(),
      findThreadEmails: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findManyAndCount: jest.fn(),
      getUsageAnalytics: jest.fn(),
    };

    mockAiProvider = {
      generateReplySuggestion: jest.fn(),
      rewriteDraft: jest.fn(),
      generateFollowUp: jest.fn(),
      generateMeetingInvite: jest.fn(),
      summarizeThread: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CopilotService,
        {
          provide: CopilotSuggestionRepository,
          useValue: mockRepository,
        },
        {
          provide: 'AI_PROVIDER',
          useValue: mockAiProvider,
        },
      ],
    }).compile();

    service = module.get<CopilotService>(CopilotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateReply', () => {
    it('should throw NotFoundException if email does not exist', async () => {
      mockRepository.findEmailById.mockResolvedValue(null);

      await expect(service.generateReply(userId, { emailId, tone: CopilotTone.PROFESSIONAL })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own the email', async () => {
      mockRepository.findEmailById.mockResolvedValue({
        ...mockEmail,
        userId: 'some-other-user',
      });

      await expect(service.generateReply(userId, { emailId, tone: CopilotTone.PROFESSIONAL })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should generate a reply successfully and save to database', async () => {
      mockRepository.findEmailById.mockResolvedValue(mockEmail);
      mockAiProvider.generateReplySuggestion.mockResolvedValue(mockSuggestionResult);
      mockRepository.create.mockResolvedValue({ id: suggestionId });

      const dto = {
        emailId,
        tone: CopilotTone.PROFESSIONAL,
        customInstructions: 'Keep it short',
      };

      const result = await service.generateReply(userId, dto);

      expect(mockAiProvider.generateReplySuggestion).toHaveBeenCalledWith(
        mockEmail.subject,
        mockEmail.sender,
        mockEmail.snippet,
        dto.tone,
        dto.customInstructions,
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId,
        emailId,
        suggestionType: CopilotSuggestionType.REPLY,
        tone: dto.tone,
        inputContext: {
          emailId,
          subject: mockEmail.subject,
          sender: mockEmail.sender,
          customInstructions: dto.customInstructions,
        },
        generatedText: mockSuggestionResult.text,
        modelName: mockSuggestionResult.modelName,
        promptVersion: mockSuggestionResult.promptVersion,
        generatedTokens: mockSuggestionResult.tokens,
        estimatedCost: mockSuggestionResult.tokens * 0.0000003,
        generationTimeMs: mockSuggestionResult.generationTimeMs,
      });

      expect(result).toEqual({ id: suggestionId });
    });
  });

  describe('rewrite', () => {
    it('should rewrite an email draft successfully and save', async () => {
      mockAiProvider.rewriteDraft.mockResolvedValue(mockSuggestionResult);
      mockRepository.create.mockResolvedValue({ id: suggestionId });

      const dto = {
        text: 'original draft',
        tone: CopilotTone.CASUAL,
        customInstructions: 'make it friendly',
      };

      const result = await service.rewrite(userId, dto);

      expect(mockAiProvider.rewriteDraft).toHaveBeenCalledWith(dto.text, dto.tone, dto.customInstructions);

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId,
        suggestionType: CopilotSuggestionType.REWRITE,
        tone: dto.tone,
        inputContext: {
          originalText: dto.text,
          customInstructions: dto.customInstructions,
        },
        generatedText: mockSuggestionResult.text,
        modelName: mockSuggestionResult.modelName,
        promptVersion: mockSuggestionResult.promptVersion,
        generatedTokens: mockSuggestionResult.tokens,
        estimatedCost: mockSuggestionResult.tokens * 0.0000003,
        generationTimeMs: mockSuggestionResult.generationTimeMs,
      });

      expect(result).toEqual({ id: suggestionId });
    });
  });

  describe('generateFollowUp', () => {
    it('should generate a followup draft successfully', async () => {
      mockRepository.findEmailById.mockResolvedValue(mockEmail);
      mockAiProvider.generateFollowUp.mockResolvedValue(mockSuggestionResult);
      mockRepository.create.mockResolvedValue({ id: suggestionId });

      const dto = {
        emailId,
        delayDays: 5,
      };

      const result = await service.generateFollowUp(userId, dto);

      expect(mockAiProvider.generateFollowUp).toHaveBeenCalledWith(
        mockEmail.subject,
        mockEmail.sender,
        mockEmail.snippet,
        dto.delayDays,
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId,
        emailId,
        suggestionType: CopilotSuggestionType.FOLLOWUP,
        tone: null,
        inputContext: {
          emailId,
          subject: mockEmail.subject,
          sender: mockEmail.sender,
          delayDays: dto.delayDays,
        },
        generatedText: mockSuggestionResult.text,
        modelName: mockSuggestionResult.modelName,
        promptVersion: mockSuggestionResult.promptVersion,
        generatedTokens: mockSuggestionResult.tokens,
        estimatedCost: mockSuggestionResult.tokens * 0.0000003,
        generationTimeMs: mockSuggestionResult.generationTimeMs,
      });

      expect(result).toEqual({ id: suggestionId });
    });
  });

  describe('generateMeetingInvite', () => {
    it('should generate meeting request without reference email', async () => {
      mockAiProvider.generateMeetingInvite.mockResolvedValue(mockSuggestionResult);
      mockRepository.create.mockResolvedValue({ id: suggestionId });

      const dto = {
        template: 'Interview',
        agenda: 'Software engineer interview',
        durationMinutes: 45,
        preferredTimes: 'Tuesday afternoon',
      };

      const result = await service.generateMeetingInvite(userId, dto);

      expect(mockAiProvider.generateMeetingInvite).toHaveBeenCalledWith(
        'Meeting Request',
        'User',
        '',
        dto.template,
        dto.agenda,
        dto.durationMinutes,
        dto.preferredTimes,
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId,
        emailId: null,
        suggestionType: CopilotSuggestionType.MEETING,
        tone: null,
        inputContext: {
          emailId: null,
          template: dto.template,
          agenda: dto.agenda,
          durationMinutes: dto.durationMinutes,
          preferredTimes: dto.preferredTimes,
        },
        generatedText: mockSuggestionResult.text,
        modelName: mockSuggestionResult.modelName,
        promptVersion: mockSuggestionResult.promptVersion,
        generatedTokens: mockSuggestionResult.tokens,
        estimatedCost: mockSuggestionResult.tokens * 0.0000003,
        generationTimeMs: mockSuggestionResult.generationTimeMs,
      });

      expect(result).toEqual({ id: suggestionId });
    });
  });

  describe('summarizeThread', () => {
    it('should load all thread emails, analyze, and save summary', async () => {
      mockRepository.findEmailById.mockResolvedValue(mockEmail);
      mockRepository.findThreadEmails.mockResolvedValue([mockEmail]);
      mockAiProvider.summarizeThread.mockResolvedValue(mockSuggestionResult);
      mockRepository.create.mockResolvedValue({ id: suggestionId });

      const dto = { emailId };

      const result = await service.summarizeThread(userId, dto);

      expect(mockRepository.findThreadEmails).toHaveBeenCalledWith(userId, mockEmail.gmailThreadId);
      expect(mockAiProvider.summarizeThread).toHaveBeenCalledWith([
        {
          sender: mockEmail.sender,
          subject: mockEmail.subject,
          body: mockEmail.snippet,
          date: mockEmail.receivedAt,
        },
      ]);

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId,
        emailId,
        suggestionType: CopilotSuggestionType.SUMMARY,
        tone: null,
        inputContext: {
          emailId,
          threadId: mockEmail.gmailThreadId,
          messageCount: 1,
        },
        generatedText: mockSuggestionResult.text,
        modelName: mockSuggestionResult.modelName,
        promptVersion: mockSuggestionResult.promptVersion,
        generatedTokens: mockSuggestionResult.tokens,
        estimatedCost: mockSuggestionResult.tokens * 0.0000003,
        generationTimeMs: mockSuggestionResult.generationTimeMs,
      });

      expect(result).toEqual({ id: suggestionId });
    });
  });

  describe('regenerate', () => {
    it('should generate an alternative suggestion from historical record', async () => {
      const mockHistoryRecord = {
        id: 'original-suggestion-id',
        userId,
        emailId,
        suggestionType: CopilotSuggestionType.REPLY,
        tone: CopilotTone.PROFESSIONAL,
        inputContext: {
          emailId,
          customInstructions: 'Keep it brief',
        },
      };

      mockRepository.findById.mockResolvedValue(mockHistoryRecord);
      mockRepository.findEmailById.mockResolvedValue(mockEmail);
      mockAiProvider.generateReplySuggestion.mockResolvedValue(mockSuggestionResult);
      mockRepository.create.mockResolvedValue({ id: suggestionId });

      const result = await service.regenerate(userId, { suggestionId: 'original-suggestion-id' });

      expect(mockAiProvider.generateReplySuggestion).toHaveBeenCalledWith(
        mockEmail.subject,
        mockEmail.sender,
        mockEmail.snippet,
        CopilotTone.PROFESSIONAL,
        'Keep it brief',
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId,
        emailId,
        suggestionType: CopilotSuggestionType.REPLY,
        tone: CopilotTone.PROFESSIONAL,
        inputContext: {
          emailId,
          customInstructions: 'Keep it brief',
          regeneratedFrom: 'original-suggestion-id',
        },
        generatedText: mockSuggestionResult.text,
        modelName: mockSuggestionResult.modelName,
        promptVersion: mockSuggestionResult.promptVersion,
        generatedTokens: mockSuggestionResult.tokens,
        estimatedCost: mockSuggestionResult.tokens * 0.0000003,
        generationTimeMs: mockSuggestionResult.generationTimeMs,
      });

      expect(result).toEqual({ id: suggestionId });
    });
  });
});
