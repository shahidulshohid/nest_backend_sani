import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  HttpException,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BadgeService } from './badge.service';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { UpdateBadgeDto } from './dto/update-badge.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/guards/auth/roles/roles.guard';
import { Roles } from 'src/guards/auth/roles/roles.decorator';
import { UserRole } from 'generated/prisma/enums';

@Controller('badges')
export class BadgeController {
  constructor(private readonly badgeService: BadgeService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createBadgeDto: CreateBadgeDto) {
    try {
      const result = await this.badgeService.create(createBadgeDto);
      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: 'Badge created successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to create badge',
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
    const result = await this.badgeService.findAll(query);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Badges retrieved successfully',
      data: result.data,
      meta:result.meta
    };
  } catch (error) {
    throw new HttpException(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: 'Failed to retrieve badges',
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
      const result = await this.badgeService.findOne(id);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Badge retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: error.message || 'Badge not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateBadgeDto: UpdateBadgeDto,
  ) {
    try {
      const result = await this.badgeService.update(id, updateBadgeDto);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Badge updated successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to update badge',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

 
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    try {
      const result = await this.badgeService.remove(id);
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
          message: error.message || 'Failed to delete badge',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}