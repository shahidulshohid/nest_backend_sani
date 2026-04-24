import { Module } from '@nestjs/common';

import { GiftCodeService } from './giftcode.service';
import { GiftCodeController } from './giftcode.controller';
import { UtilsModule } from 'src/utils/utils.module';

@Module({
  imports: [UtilsModule],
  controllers: [GiftCodeController],
  providers: [GiftCodeService],
})
export class GiftcodeModule { }
