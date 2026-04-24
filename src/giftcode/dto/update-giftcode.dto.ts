import { PartialType } from '@nestjs/swagger';
import { GenerateGiftCodeDto } from './create-giftcode.dto';


export class UpdateGiftcodeDto extends PartialType(GenerateGiftCodeDto) {}
