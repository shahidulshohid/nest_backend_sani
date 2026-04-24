import { Test, TestingModule } from '@nestjs/testing';
import { FavoriteDrillController } from './favorite-drill.controller';
import { FavoriteDrillService } from './favorite-drill.service';

describe('FavoriteDrillController', () => {
  let controller: FavoriteDrillController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoriteDrillController],
      providers: [FavoriteDrillService],
    }).compile();

    controller = module.get<FavoriteDrillController>(FavoriteDrillController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
