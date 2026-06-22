import { IsOptional, IsString, IsEnum, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { CopilotTone, CopilotSuggestionType } from '@prisma/client';

export class ReplySuggestionDto {
  @IsUUID()
  emailId: string;

  @IsEnum(CopilotTone)
  tone: CopilotTone;

  @IsOptional()
  @IsString()
  customInstructions?: string;
}

export class RewriteDraftDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsEnum(CopilotTone)
  tone?: CopilotTone;

  @IsOptional()
  @IsString()
  customInstructions?: string;
}

export class FollowUpDto {
  @IsUUID()
  emailId: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  delayDays?: number;
}

export class MeetingRequestDto {
  @IsOptional()
  @IsUUID()
  emailId?: string;

  @IsString()
  template: string; // e.g. Status Update, Interview, Project Discussion, Client Meeting, Follow-Up

  @IsString()
  agenda: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  preferredTimes?: string;
}

export class SummarizeThreadDto {
  @IsUUID()
  emailId: string;
}

export class RegenerateSuggestionDto {
  @IsUUID()
  suggestionId: string;
}

export class CopilotQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsEnum(CopilotSuggestionType)
  type?: CopilotSuggestionType;
}
