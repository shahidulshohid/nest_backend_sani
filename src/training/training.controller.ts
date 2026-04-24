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
  UseInterceptors,
  BadRequestException,
  UseGuards,
  UploadedFile,
  HttpCode,
  Query,
  Req,
} from '@nestjs/common';
import { TrainingService } from './training.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { InterceptorsInterceptor } from 'src/common/interceptors/interceptors.interceptor';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/guards/auth/roles/roles.guard';
import { Roles } from 'src/guards/auth/roles/roles.decorator';
import { UserRole } from 'generated/prisma/enums';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Trainings')
@Controller('trainings')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  // =============================================
  // ADMIN Routes
  // =============================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new training' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @Post()
  @UseInterceptors(FileInterceptor('file'), InterceptorsInterceptor)
  async create(
    @Body() createTrainingDto: CreateTrainingDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required!');
    }
    try {
      const result = await this.trainingService.create(createTrainingDto, file);
      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: 'Training created successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to create training',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update training by ID' })
  @ApiParam({ name: 'id', description: 'Training ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'), InterceptorsInterceptor)
  async update(
    @Param('id') id: string,
    @Body() updateTrainingDto: UpdateTrainingDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      const result = await this.trainingService.update(id, updateTrainingDto, file);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Training updated successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to update training',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete training by ID' })
  @ApiParam({ name: 'id', description: 'Training ID' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const result = await this.trainingService.remove(id);
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
          message: error.message || 'Failed to delete training',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // =============================================
  // USER Routes
  // =============================================


  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all trainings with user enrollment status and completion %' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: Record<string, any>, @Req() req: any) {
    const result = await this.trainingService.findAllForUser(req.user.userId, query);
    return {
      success: true,
      message: 'Get all trainings successfully!',
      data: result.data,
      meta: result.meta,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get training by ID with level lock/unlock status and progress' })
  @ApiParam({ name: 'id', description: 'Training ID' })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string, @Req() req: any) {
    try {
      const result = await this.trainingService.findOneForUser(id, req.user.userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Training retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: error.message || 'Training not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enroll in a training — Level 1 auto unlocks' })
  @ApiParam({ name: 'id', description: 'Training ID' })
  @Post(':id/enroll')
  @HttpCode(HttpStatus.OK)
  async enroll(@Param('id') trainingId: string, @Req() req: any) {
    try {
      const result = await this.trainingService.enrollInTraining(req.user.userId, trainingId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: result.message,
        data: { currentLevelId: result.currentLevelId },
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to enroll in training',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete a drill inside a training level' })
  @ApiParam({ name: 'id', description: 'Training ID' })
  @ApiParam({ name: 'levelId', description: 'Level ID' })
  @ApiParam({ name: 'drillId', description: 'Drill ID' })
  @Post(':id/levels/:levelId/drills/:drillId/complete')
  @HttpCode(HttpStatus.OK)
  async completeDrill(
    @Param('id') trainingId: string,
    @Param('levelId') levelId: string,
    @Param('drillId') drillId: string,
    @Req() req: any,
  ) {
    try {
      const result = await this.trainingService.completeDrill(
        req.user.userId,
        trainingId,
        levelId,
        drillId,
      );
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: result.message,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to complete drill',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}