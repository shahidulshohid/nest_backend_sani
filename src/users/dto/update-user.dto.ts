
// dto/update-user.dto.ts
import { Type } from 'class-transformer';
import { IsObject, ValidateNested } from 'class-validator';
import { UpdateUserDataDto } from './update-user-data.dto';

export class UpdateUserDto {
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateUserDataDto)
  data: UpdateUserDataDto;
}