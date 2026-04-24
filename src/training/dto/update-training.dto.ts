import { PartialType } from '@nestjs/mapped-types';
import { CreateTrainingDto } from './create-training.dto';
import { IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateTrainingDataDto } from './update-training-data.dto';

export class UpdateTrainingDto extends PartialType(CreateTrainingDto) {
          
         @IsObject()
          @ValidateNested()
          @Type(() => UpdateTrainingDataDto)
          data:UpdateTrainingDataDto;
 
}
