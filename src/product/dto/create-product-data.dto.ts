import { IsString, IsNotEmpty, IsNumber, IsInt, IsUrl, Min } from 'class-validator';

export class CreateProductDataDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  @Min(0)
  quantity: number;

}
