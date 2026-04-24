import {
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  IsInt,
} from 'class-validator';
import {  PracticeDuration, PracticeLevel, PreferredShot } from 'generated/prisma/enums';

export class UpdateUserDataDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
 @IsString()
  ageRange?:string

  @IsOptional()
  @IsEnum(PracticeLevel)
  practiceLevel?: PracticeLevel;

  @IsOptional()
  @IsEnum(PracticeDuration)
  practiceDuration?: PracticeDuration;

  @IsOptional()
  @IsString()
  preferredShots?: string

  @IsOptional()
  @IsInt()
  skillConfidence?: number;
   @IsOptional()
   @IsString()
  profilePic :string
}
