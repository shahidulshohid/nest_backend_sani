import { IsString, IsNumber, IsNotEmpty, Min, Max } from 'class-validator';

export class CreateSkillCardDtoData {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsString()
  country: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(99)
  playerNumber: number;

  @IsNotEmpty()
  @IsString()
  playerPosition: string;

  @IsNotEmpty()
  @IsString()
  favoriteClub: string;
;
  
}