import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateTrainingDataDto{
    @IsOptional()
    @IsString()
    name :string

  
}
