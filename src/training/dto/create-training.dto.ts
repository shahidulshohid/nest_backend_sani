import { Type } from "class-transformer";
import { IsNotEmpty, IsObject, IsString, ValidateNested } from "class-validator";
import { CreateTrainingDataDto } from "./create-traning-data.dto";

export class CreateTrainingDto {
     
  @IsObject()
   @ValidateNested()
   @Type(() => CreateTrainingDataDto)
   data:CreateTrainingDataDto;
}
