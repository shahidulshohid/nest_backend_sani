// create-challenge.dto.ts
import {
  IsString,
  IsInt,
  IsDateString,
  IsArray,
  IsOptional,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class ChallengeDrillDto {
  @IsString()
  drillId: string;

  @IsInt()
  @Min(1)
  order: number;
}

export class CreateChallengeDto {
  @IsString()
  name: string;

  @IsInt()
  earnCoin: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  ageRange: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChallengeDrillDto)
  drills: ChallengeDrillDto[]; 
}