import { Test, TestingModule } from '@nestjs/testing';
import { DrillService } from './drill.service';

describe('DrillService', () => {
  let service: DrillService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DrillService],
    }).compile();

    service = module.get<DrillService>(DrillService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
