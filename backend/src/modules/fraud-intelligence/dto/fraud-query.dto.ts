import { IsOptional, IsInt, Min, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { FraudRiskLevel, FraudType } from '@prisma/client';

export class FraudQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(FraudRiskLevel)
  riskLevel?: FraudRiskLevel;

  @IsOptional()
  @IsEnum(FraudType)
  fraudType?: FraudType;
}
