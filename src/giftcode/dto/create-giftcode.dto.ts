import { IsEmail, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class GenerateGiftCodeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  planDuration?: number; 
}

export class RedeemGiftCodeDto {
  @IsNotEmpty()
  code: string;
}