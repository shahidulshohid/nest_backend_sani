import { Test, TestingModule } from '@nestjs/testing';
import { FavoriteDrillService } from './favorite-drill.service';

describe('FavoriteDrillService', () => {
  let service: FavoriteDrillService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FavoriteDrillService],
    }).compile();

    service = module.get<FavoriteDrillService>(FavoriteDrillService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
