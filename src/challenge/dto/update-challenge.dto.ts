import { PartialType } from '@nestjs/mapped-types';
import { CreateChallengeDto } from './create-challenge.dto';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateChallengeDto extends PartialType(CreateChallengeDto) {
     @IsOptional()
    @IsString()
      name: string;
      
       @IsOptional()
      @IsInt()
      drillCount: number;

       @IsOptional()
      @IsInt()
      earnCoin: number;

       @IsOptional()
      @IsDateString()
      startDate: string;

       @IsOptional()
      @IsDateString()
      endDate: string;

       @IsOptional()
      @IsString()
      ageRange: string;
}
