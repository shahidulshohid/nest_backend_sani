import { Type } from "class-transformer";
import { IsObject, ValidateNested } from "class-validator";
import { CreateDrillDataDto } from "./create-drill-data.dto";

export class CreateDrillDto {
       @IsObject()
       @ValidateNested()
       @Type(() => CreateDrillDataDto)
       data:CreateDrillDataDto;
}
