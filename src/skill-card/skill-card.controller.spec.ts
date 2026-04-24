import { Test, TestingModule } from '@nestjs/testing';
import { SkillCardController } from './skill-card.controller';
import { SkillCardService } from './skill-card.service';

describe('SkillCardController', () => {
  let controller: SkillCardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SkillCardController],
      providers: [SkillCardService],
    }).compile();

    controller = module.get<SkillCardController>(SkillCardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
