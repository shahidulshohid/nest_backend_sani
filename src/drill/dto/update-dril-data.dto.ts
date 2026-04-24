import { PartialType } from "@nestjs/mapped-types";
import { CreateDrillDataDto } from "./create-drill-data.dto";
import { IsArray, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";

export class UpdateDrillDataDto extends PartialType(CreateDrillDataDto) {

       @IsOptional()
      @IsString({ message: 'Name must be a string!' })
      name: string;
    
 @IsOptional()
      @IsString({ message: 'Time must be a string!' })
      time: string;
    
      @IsOptional()
      @IsString({ message: 'Earn Coin must be a string!' })
      earnCoin: string;
    
     @IsOptional()
      @IsArray()
        @Transform(({ value }) => {
          if (typeof value === 'string') {
            return JSON.parse(value);
          }
          return value;
        })
        hashtags: string[];
    
     @IsOptional()
      @IsString({ message: 'level ID must be a string!' })
      levelId: string;
}
