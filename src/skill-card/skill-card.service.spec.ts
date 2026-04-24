import { Test, TestingModule } from '@nestjs/testing';
import { SkillCardService } from './skill-card.service';

describe('SkillCardService', () => {
  let service: SkillCardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SkillCardService],
    }).compile();

    service = module.get<SkillCardService>(SkillCardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
