import { IsNotEmpty, IsString } from "class-validator"

export class CreateTrainingDataDto {
     
    @IsNotEmpty()
    @IsString()
    name :string

  
}
