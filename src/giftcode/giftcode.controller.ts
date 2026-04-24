import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  HttpException,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/guards/auth/roles/roles.guard';
import { Roles } from 'src/guards/auth/roles/roles.decorator';
import { UserRole } from 'generated/prisma/enums';
import { GenerateGiftCodeDto, RedeemGiftCodeDto } from './dto/create-giftcode.dto';
import { GiftCodeService } from './giftcode.service';

@Controller('gift-codes')
export class GiftCodeController {
  constructor(private readonly giftCodeService: GiftCodeService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generate(@Body() generateGiftCodeDto: GenerateGiftCodeDto) {
    try {
      const result = await this.giftCodeService.generate(generateGiftCodeDto);
      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: 'Gift code generated and sent successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to generate gift code',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }


  @UseGuards(JwtAuthGuard)
  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  async redeem(@Req() req: any, @Body() redeemGiftCodeDto: RedeemGiftCodeDto) {
    try {
      const userId = req.user?.userId;
      const result = await this.giftCodeService.redeem(userId, redeemGiftCodeDto);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: result.message,
        data: {
          startDate: result.startDate,
          endDate: result.endDate,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to redeem gift code',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Get()
@HttpCode(HttpStatus.OK)
async findAll(@Query() query: Record<string, any>) {
  try {
    const result = await this.giftCodeService.findAll(query);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Gift codes retrieved successfully',
      data: result.data,
      meta:result.meta
    };
  } catch (error) {
    throw new HttpException(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: 'Failed to retrieve gift codes',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.giftCodeService.findOne(id);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Gift code retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: error.message || 'Gift code not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    try {
      const result = await this.giftCodeService.remove(id);
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
          message: error.message || 'Failed to delete gift code',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}