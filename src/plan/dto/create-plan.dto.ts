import { IsBoolean, IsEnum, IsInt, IsJSON, IsNumber, IsOptional, IsString } from "class-validator";
import { Interval, PlanCategory, PlanType } from "generated/prisma/enums";


export class CreatePlanDto {

  @IsString()
  planName: string;

  @IsNumber()
  amount: number;

  @IsEnum(PlanType)
  @IsOptional()
  PlanType?: PlanType = PlanType.FREE;

  @IsEnum(PlanCategory)
  planCategory: PlanCategory;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(Interval)
  @IsOptional()
  interval?: Interval = Interval.month;

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

  @IsOptional()
  features?: any;

}