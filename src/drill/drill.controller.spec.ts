import { Test, TestingModule } from '@nestjs/testing';
import { DrillController } from './drill.controller';
import { DrillService } from './drill.service';

describe('DrillController', () => {
  let controller: DrillController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DrillController],
      providers: [DrillService],
    }).compile();

    controller = module.get<DrillController>(DrillController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
