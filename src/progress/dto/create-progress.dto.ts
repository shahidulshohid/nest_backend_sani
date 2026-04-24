import { IsBoolean, IsNotEmpty, IsString } from "class-validator"

export class CreateProgressDto {

    @IsNotEmpty()
    @IsString()
     drillId  : string

     @IsBoolean()
  isCompleted : boolean 
}
