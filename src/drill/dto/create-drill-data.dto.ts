import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsArray } from 'class-validator';

export class CreateDrillDataDto {
  @IsNotEmpty({ message: 'Name is required!' })
  @IsString({ message: 'Name must be a string!' })
  name: string;

  @IsNotEmpty({ message: 'Time is required!' })
  @IsString({ message: 'Time must be a string!' })
  time: string;

  @IsNotEmpty({ message: 'Earn Coin is required!' })
  @IsString({ message: 'Earn Coin must be a string!' })
  earnCoin: string;

  
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  })
  hashtags: string[];

  @IsNotEmpty({ message: 'level ID is required!' })
  @IsString({ message: 'level ID must be a string!' })
  levelId: string;
}