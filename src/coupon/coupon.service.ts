import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CouponService {
  constructor(private prisma: PrismaService) {}

  async create(createCouponDto: CreateCouponDto) {
    const { couponName, discountPercent, usageLimit, startDate, expiryDate } = createCouponDto;
    
    if (startDate > expiryDate) {
      throw new BadRequestException('Start date cannot be after expiry date');
    }
    const couponCode = this.generateCouponCode();
    
    const coupon = await this.prisma.coupon.create({
      data: {
        couponName,
        couponCode,
        discountPercent,
        usageLimit,
        startDate,
        expiryDate,
        status: 'ACTIVE',
      },
    });

    return coupon;
  }

  async findAll() {
    const coupons = await this.prisma.coupon.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return coupons;
  }

  async findOne(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    return coupon;
  }

  async findByCode(code: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { couponCode: code },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with code ${code} not found`);
    }

    return coupon;
  }

  async validateCoupon(code: string, userId: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { couponCode: code },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    const now = new Date();

    if (coupon.status !== 'ACTIVE') {
      throw new BadRequestException('Coupon is not active');
    }

    if (now < coupon.startDate) {
      throw new BadRequestException('Coupon is not yet valid');
    }

    if (now > coupon.expiryDate) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    // Check if user already used this coupon
    const userUsage = await this.prisma.userCouponUsage.findUnique({
      where: {
        userId_couponId: {
          userId,
          couponId: coupon.id,
        },
      },
    });

    if (userUsage) {
      throw new BadRequestException('You have already used this coupon');
    }

    return {
      isValid: true,
      coupon,
      discountPercent: coupon.discountPercent,
    };
  }

  async applyCoupon(code: string, userId: string) {
    console.log(userId,code)

    const user = await this.prisma.user.findUnique({
  where: { id: userId },
});

if (!user) {
  throw new BadRequestException('User not found');
}
    const validation = await this.validateCoupon(code, userId);
    
    if (!validation.isValid) {
      return validation;
    }

    const coupon = validation.coupon;

   
    const result = await this.prisma.$transaction(async (prisma) => {

      const updatedCoupon = await prisma.coupon.update({
        where: { id: coupon.id },
        data: {
          usedCount: coupon.usedCount + 1,
        },
      });

      await prisma.userCouponUsage.create({
        data: {
          userId,
          couponId: coupon.id,
        },
      });

      return updatedCoupon;
    });

    return {
      isValid: true,
      coupon: result,
      discountPercent: result.discountPercent,
      message: 'Coupon applied successfully',
    };
  }

  async update(id: string, updateCouponDto: UpdateCouponDto) {
    const existingCoupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!existingCoupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    const coupon = await this.prisma.coupon.update({
      where: { id },
      data: {
        couponName: updateCouponDto.couponName,
        discountPercent: updateCouponDto.discountPercent,
        usageLimit: updateCouponDto.usageLimit,
        startDate: updateCouponDto.startDate,
        expiryDate: updateCouponDto.expiryDate,
        status: updateCouponDto.status,
      },
    });

    return coupon;
  }

  async remove(id: string) {
    const existingCoupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!existingCoupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    await this.prisma.coupon.delete({
      where: { id },
    });

    return { message: 'Coupon deleted successfully' };
  }

  async getUserCouponHistory(userId: string) {
    const userCoupons = await this.prisma.userCouponUsage.findMany({
      where: { userId },
      include: {
        coupon: {
          select: {
            id: true,
            couponCode: true,
            couponName: true,
            discountPercent: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return userCoupons;
  }

  async checkUserCouponUsage(userId: string, couponCode: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { couponCode },
    });

    if (!coupon) {
      return { canUse: false, reason: 'Coupon not found' };
    }

    const userUsage = await this.prisma.userCouponUsage.findUnique({
      where: {
        userId_couponId: {
          userId,
          couponId: coupon.id,
        },
      },
    });

    return {
      canUse: !userUsage,
      coupon,
      alreadyUsed: !!userUsage,
    };
  }

  private generateCouponCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }
    async getCouponStats() {
    const totalCoupons = await this.prisma.coupon.count();
    const activeCoupons = await this.prisma.coupon.count({
      where: { status: 'ACTIVE' },
    });
    const expiredCoupons = await this.prisma.coupon.count({
      where: { status: 'EXPIRED' },
    });
    const inactiveCoupons = await this.prisma.coupon.count({
      where: { status: 'INACTIVE' },
    });

    const totalUsage = await this.prisma.coupon.aggregate({
      _sum: {
        usedCount: true,
      },
    });

    return {
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      inactiveCoupons,
      totalUsage: totalUsage._sum.usedCount || 0,
    };
  }
}