import { Type } from "class-transformer";
import { IsObject, ValidateNested } from "class-validator";
import { CreateSkillCardDtoData } from "./skill-card.dtoData";


export class CreateSkillCardDto {
@IsObject()
   @ValidateNested()
   @Type(() => CreateSkillCardDtoData)
   data:CreateSkillCardDtoData;
  
}