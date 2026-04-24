import { IsArray, IsString } from "class-validator";

export class CreateLevelDto {
  @IsArray()

  levelIds: string[]


}
