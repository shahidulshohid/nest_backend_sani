import { PartialType } from '@nestjs/mapped-types';
import { CreateProgressDto } from './create-progress.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateProgressDto extends PartialType(CreateProgressDto) {

    @IsOptional()
        @IsString()
         drillId  : string

         @IsOptional()
         @IsBoolean()
      isCompleted : boolean 
}
