import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanDto } from './create-plan.dto';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { Interval, PlanCategory, PlanType } from 'generated/prisma/enums';

export class UpdatePlanDto extends PartialType(CreatePlanDto) {
    @IsOptional()
     @IsString()
      planName: string;
    @IsOptional()
      @IsNumber()
      amount: number;
    
      @IsEnum(PlanType)
      @IsOptional()
      PlanType?: PlanType = PlanType.FREE;
    @IsOptional()
      @IsEnum(PlanCategory)
      planCategory: PlanCategory;
    
      @IsString()
      @IsOptional()
      currency?: string;
    
      @IsEnum(Interval)
      @IsOptional()
      interval?: Interval = Interval.month;
    @IsOptional()
      @IsInt()
      intervalCount: number;
    
      @IsInt()
      @IsOptional()
      freeTrialDays?: number;
    
      @IsOptional()
      @IsBoolean()
      active: boolean;
    
      @IsString()
      @IsOptional()
      description?: string;
    
    
  @IsOptional()
   whatsOffered?:any;   
   
   @IsNumber()
  @IsOptional()
  xpReward? :  number ;  
    //   @IsJSON()
      @IsOptional()
      features?: any;
    
    
}