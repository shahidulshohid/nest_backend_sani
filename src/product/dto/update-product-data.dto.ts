import { IsInt, IsNumber, IsOptional, IsString, IsUrl, Min } from "class-validator";

export class UpdateProductDataDto {
  
  @IsOptional()
    @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantity: number;

  
@IsOptional()
  @IsString()
  @IsUrl()
  imageUrl: string;
}
