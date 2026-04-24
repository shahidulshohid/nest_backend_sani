import { Test, TestingModule } from '@nestjs/testing';
import { GiftCodeController } from './giftcode.controller';
import { GiftCodeService } from './giftcode.service';


describe('GiftcodeController', () => {
  let controller: GiftCodeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GiftCodeController],
      providers: [GiftCodeService],
    }).compile();

    controller = module.get<GiftCodeController>(GiftCodeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
