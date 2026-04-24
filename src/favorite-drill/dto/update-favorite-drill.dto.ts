import { PartialType } from '@nestjs/mapped-types';
import { CreateFavoriteDrillDto } from './create-favorite-drill.dto';

export class UpdateFavoriteDrillDto extends PartialType(CreateFavoriteDrillDto) {}
