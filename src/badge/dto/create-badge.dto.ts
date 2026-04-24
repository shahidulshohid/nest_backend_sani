import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  ValidateIf,
} from 'class-validator';
import { BadgeCategory, BadgeRarity } from 'generated/prisma/enums';

export enum BadgeCriteriaType {
  LEVEL_COMPLETE     = 'LEVEL_COMPLETE',
  TRAINING_COMPLETE  = 'TRAINING_COMPLETE',
  CHALLENGE_COMPLETE = 'CHALLENGE_COMPLETE',
}

export class CreateBadgeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  icon: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(BadgeCategory)
  category: BadgeCategory;

  @IsEnum(BadgeRarity)
  @IsOptional()
  rarity?: BadgeRarity;

  @IsInt()
  @Min(0)
  @IsOptional()
  points?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsEnum(BadgeCriteriaType)
  criteriaType: BadgeCriteriaType;

  @ValidateIf((o) => o.criteriaType === BadgeCriteriaType.LEVEL_COMPLETE)
  @IsString()
  @IsNotEmpty()
  levelId?: string;

  @ValidateIf((o) => o.criteriaType === BadgeCriteriaType.TRAINING_COMPLETE)
  @IsString()
  @IsNotEmpty()
  trainingId?: string;

  @ValidateIf((o) => o.criteriaType === BadgeCriteriaType.CHALLENGE_COMPLETE)
  @IsString()
  @IsNotEmpty()
  challengeId?: string;
}