import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, IsInt, IsUrl, Min, IsObject, ValidateNested } from 'class-validator';
import { CreateProductDataDto } from './create-product-data.dto';

export class CreateProductDto {
 @IsObject()
       @ValidateNested()
       @Type(() => CreateProductDataDto)
       data:CreateProductDataDto;
}
