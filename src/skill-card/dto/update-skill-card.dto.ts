import { PartialType } from '@nestjs/mapped-types';
import { CreateSkillCardDto } from './create-skill-card.dto';
import { CreateSkillCardDtoData } from './skill-card.dtoData';

export class UpdateSkillCardDto extends PartialType(CreateSkillCardDto) {}
