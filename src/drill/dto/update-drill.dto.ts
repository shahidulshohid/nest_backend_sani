import { PartialType } from '@nestjs/mapped-types';
import { CreateDrillDto } from './create-drill.dto';
import { IsArray, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateDrillDataDto } from './update-dril-data.dto';

export class UpdateDrillDto extends PartialType(CreateDrillDto) {
       @IsObject()
       @ValidateNested()
       @Type(() => UpdateDrillDataDto)
       data:UpdateDrillDataDto;
}
