import { Test, TestingModule } from '@nestjs/testing';
import { GiftCodeService } from './giftcode.service';


describe('GiftcodeService', () => {
  let service: GiftCodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GiftCodeService],
    }).compile();

    service = module.get<GiftCodeService>(GiftCodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
