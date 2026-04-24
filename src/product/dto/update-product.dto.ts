import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateProductDataDto } from './update-product-data.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
@IsObject()
       @ValidateNested()
       @Type(() => UpdateProductDataDto)
       data:UpdateProductDataDto;

}
