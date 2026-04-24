import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/guards/auth/roles/roles.guard';
import { Roles } from 'src/guards/auth/roles/roles.decorator';
import { UserRole } from 'generated/prisma/enums';

@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(UserRole.ADMIN,UserRole.SUPER_ADMIN)
  @Post()
  async create(@Body() createCouponDto: CreateCouponDto) {
    try {
      const result = await this.couponService.create(createCouponDto);
      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: 'Coupon created successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to create coupon',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(UserRole.ADMIN,UserRole.SUPER_ADMIN)
  @Get()
  async findAll() {
    try {
      const result = await this.couponService.findAll();
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Coupons retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: 'Failed to retrieve coupons',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

   @Get('stats')
  async getStats() {
    try {
      const result = await this.couponService.getCouponStats();
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Coupon statistics retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: 'Failed to retrieve coupon statistics',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Get('my-history')
  async getMyCouponHistory(@Req() req: any) {
    try {
      const userId = req.user?.userId
      const result = await this.couponService.getUserCouponHistory(userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'My coupon history retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: 'Failed to retrieve coupon history',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('check/:code')
  async checkUserCouponUsage(@Req() req: any, @Param('code') code: string) {
    try {
      const userId = req.user?.id;
      const result = await this.couponService.checkUserCouponUsage(userId, code);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Coupon usage checked successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: 'Failed to check coupon usage',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('validate/:code')
  async validateCoupon(@Req() req: any, @Param('code') code: string) {
    try {
      const userId = req.user?.id;
      const result = await this.couponService.validateCoupon(code, userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Coupon validated successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Invalid coupon',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('apply/:code')
  async applyCoupon(@Req() req: any, @Param('code') code: string) {
    try {
      const userId = req.user?.userId;
      const result = await this.couponService.applyCoupon(code, userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Coupon applied successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to apply coupon',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('code/:code')
  async findByCode(@Param('code') code: string) {
    try {
      const result = await this.couponService.findByCode(code);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Coupon retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: error.message || 'Coupon not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.couponService.findOne(id);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Coupon retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: error.message || 'Coupon not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

    @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(UserRole.ADMIN,UserRole.SUPER_ADMIN)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto) {
    try {
      const result = await this.couponService.update(id, updateCouponDto);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Coupon updated successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to update coupon',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

    @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(UserRole.ADMIN,UserRole.SUPER_ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const result = await this.couponService.remove(id);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: result.message,
        data: null,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to delete coupon',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  
}