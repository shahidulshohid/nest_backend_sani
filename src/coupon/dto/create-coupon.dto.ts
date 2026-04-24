import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, Min, Max } from 'class-validator';
import { CouponStatus } from 'generated/prisma/enums';


export class CreateCouponDto {
  @IsString()
  couponName: string;
   @IsOptional()
  @IsString()
  couponCode: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  discountPercent: number;

  @IsOptional()
  @IsNumber()
  usageLimit?: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  expiryDate: string;

  @IsOptional()
  @IsEnum(CouponStatus)
  status?: CouponStatus;
}
