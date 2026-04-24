import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  HttpException, 
  HttpStatus, 
  Req, 
  UseGuards,
  Query,
  ParseUUIDPipe, 
  HttpCode
} from '@nestjs/common';
import { LevelService } from './level.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/guards/auth/roles/roles.guard';
import { Roles } from 'src/guards/auth/roles/roles.decorator';
import { UserRole } from 'generated/prisma/enums';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Levels')
@Controller('levels')
export class LevelController {
  constructor(private readonly levelService: LevelService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new level for a training' })
  @ApiParam({ name: 'id', description: 'Training ID' })
  @Post(":id")
  async create(@Param("id") id: string, @Req() req: any) {
    try {
      const result = await this.levelService.create(id);
      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: 'Level created successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to create level',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @ApiOperation({ summary: 'Get all levels' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.levelService.findAll(query);
    return {
      success: true,
      message: "Get all levels successfully!",
      data: result.data,
      meta: result.meta,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get levels by training ID' })
  @ApiParam({ name: 'trainingId', description: 'Training ID' })
  @Get('training/:trainingId')
  async findByTrainingId(@Param('trainingId', ParseUUIDPipe) trainingId: string) {
    try {
      const result = await this.levelService.findByTrainingId(trainingId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Training levels retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: error.message || 'Training levels not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get level by ID' })
  @ApiParam({ name: 'id', description: 'Level ID' })
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const result = await this.levelService.findOne(id);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Level retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: error.message || 'Level not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete level by ID' })
  @ApiParam({ name: 'id', description: 'Level ID' })
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const result = await this.levelService.remove(id);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Level deleted successfully',
        data: null,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to delete level',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get training level stats' })
  @ApiParam({ name: 'trainingId', description: 'Training ID' })
  @Get('training/:trainingId/stats')
  async getTrainingLevelStats(@Param('trainingId', ParseUUIDPipe) trainingId: string) {
    try {
      const result = await this.levelService.getTrainingLevelStats(trainingId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Training level stats retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: 'Failed to retrieve training level stats',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if level number exists in a training' })
  @ApiParam({ name: 'trainingId', description: 'Training ID' })
  @ApiParam({ name: 'levelNumber', description: 'Level Number' })
  @Get('check/:trainingId/:levelNumber')
  async checkLevelNumberExists(
    @Param('trainingId', ParseUUIDPipe) trainingId: string,
    @Param('levelNumber') levelNumber: number
  ) {
    try {
      const result = await this.levelService.checkLevelNumberExists(trainingId, levelNumber);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Level number check completed',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: 'Failed to check level number',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}