import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UtilsService } from 'src/utils/utils.service';
import { GenerateGiftCodeDto, RedeemGiftCodeDto } from './dto/create-giftcode.dto';
import QueryBuilder from 'src/common/QueryBuilder';

@Injectable()
export class GiftCodeService {
  constructor(
    private prisma: PrismaService,
    private mailService: UtilsService,
  ) {}

private generateUniqueCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'GIFT-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async generate(generateGiftCodeDto: GenerateGiftCodeDto) {
  const { email, planDuration = 365 } = generateGiftCodeDto;
  let code = this.generateUniqueCode();

  let existing = await this.prisma.giftCode.findUnique({ where: { code } });
  while (existing) {
    code = this.generateUniqueCode();
    existing = await this.prisma.giftCode.findUnique({ where: { code } });
  }

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const giftCode = await this.prisma.giftCode.create({
    data: {
      code,       
      email,
      expiresAt,
      planDuration,
    },
  });

await this.mailService.SendAuthEmail(
  email,
  '🎁 Your Gift Subscription Code - SOCKER',
  `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>🎁 You've received a gift subscription!</h2>
      <p>Someone special has gifted you a <strong>${planDuration} days</strong> subscription to SOCKER.</p>
      
      <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="font-size: 14px; color: #666; margin: 0;">Your Gift Code</p>
        <h1 style="font-size: 32px; letter-spacing: 4px; margin: 10px 0;">${code}</h1>
      </div>

      <p>To redeem:</p>
      <ol>
        <li>Open the SOCKER app</li>
        <li>Go to Settings → Redeem Code</li>
        <li>Enter the code above</li>
        <li>Enjoy your ${planDuration} days subscription!</li>
      </ol>

      <p style="color: #999; font-size: 12px;">
        This code can only be used once and expires in 1 year.
      </p>
    </div>
  `,
);

  return {
    code: giftCode.code,
    email: giftCode.email,
    expiresAt: giftCode.expiresAt,
    planDuration: giftCode.planDuration,
  };
}

  // async redeem(userId: string, redeemGiftCodeDto: RedeemGiftCodeDto) {
  //   const { code } = redeemGiftCodeDto;

  //   const giftCode = await this.prisma.giftCode.findUnique({
  //     where: { code },
  //   });

  //   if (!giftCode) {
  //     throw new NotFoundException('Invalid gift code');
  //   }

  //   if (giftCode.isUsed) {
  //     throw new ConflictException('This gift code has already been used');
  //   }

 
  //   if (new Date() > giftCode.expiresAt) {
  //     throw new BadRequestException('This gift code has expired');
  //   }

  //   const startDate = new Date();
  //   const endDate = new Date();
  //   endDate.setDate(endDate.getDate() + giftCode.planDuration);
  //   await this.prisma.$transaction([
  //     this.prisma.giftCode.update({
  //       where: { code },
  //       data: {
  //         isUsed: true,
  //         usedBy: userId,
  //         usedAt: new Date(),
  //       },
  //     }),

  //     this.prisma.user.update({
  //       where: { id: userId },
  //       data: {
  //         isSubscribed: true,
  //         planExpiration: endDate,
  //       },
  //     }),
  //   ]);

  //   return {
  //     message: `Subscription activated successfully for ${giftCode.planDuration} days`,
  //     startDate,
  //     endDate,
  //   };
  // }

async redeem(userId: string, redeemGiftCodeDto: RedeemGiftCodeDto) {
  const { code } = redeemGiftCodeDto;

  const giftCode = await this.prisma.giftCode.findUnique({
    where: { code },
  });

  if (!giftCode) throw new NotFoundException('Invalid gift code');
  if (giftCode.isUsed) throw new ConflictException('Already used');
  if (new Date() > giftCode.expiresAt) throw new BadRequestException('Expired');

  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { planExpiration: true, isSubscribed: true },
  });
  const baseDate =
    user?.isSubscribed && user?.planExpiration && user.planExpiration > new Date()
      ? user.planExpiration  
      : new Date();         

  const endDate = new Date(baseDate);
  endDate.setDate(endDate.getDate() + giftCode.planDuration);

  await this.prisma.$transaction([
    this.prisma.giftCode.update({
      where: { code },
      data: {
        isUsed: true,
        usedBy: userId,
        usedAt: new Date(),
      },
    }),

    this.prisma.user.update({
      where: { id: userId },
      data: {
        isSubscribed: true,
        planExpiration: endDate, 
      },
    }),
  ]);

  return {
    message: `Subscription activated for ${giftCode.planDuration} days`,
    startDate: baseDate,
    endDate,
  };
}



 async findAll(query: Record<string, any>) {
  const queryBuilder = new QueryBuilder(this.prisma.giftCode, query)
    .search(['code', 'email'])
    .filter()
    .sort()
    .paginate();

  const result = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  return { data: result, meta };
}


  async findOne(id: string) {
    const giftCode = await this.prisma.giftCode.findUnique({
      where: { id },
    });
    if (!giftCode) throw new NotFoundException('Gift code not found');
    return giftCode;
  }


  async remove(id: string) {
    const giftCode = await this.prisma.giftCode.findUnique({ where: { id } });
    if (!giftCode) throw new NotFoundException('Gift code not found');

    await this.prisma.giftCode.delete({ where: { id } });
    return { message: 'Gift code deleted successfully' };
  }
}