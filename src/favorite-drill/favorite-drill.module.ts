import { Module } from '@nestjs/common';
import { FavoriteDrillService } from './favorite-drill.service';
import { FavoriteDrillController } from './favorite-drill.controller';

@Module({
  controllers: [FavoriteDrillController],
  providers: [FavoriteDrillService],
})
export class FavoriteDrillModule {}
