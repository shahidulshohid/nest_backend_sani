import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, UseGuards, HttpCode, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { DrillService } from './drill.service';
import { CreateDrillDto } from './dto/create-drill.dto';
import { UpdateDrillDto } from './dto/update-drill.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/guards/auth/roles/roles.guard';
import { Roles } from 'src/guards/auth/roles/roles.decorator';
import { UserRole } from 'generated/prisma/enums';
import { FileInterceptor } from '@nestjs/platform-express';
import { InterceptorsInterceptor } from 'src/common/interceptors/interceptors.interceptor';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Drills')
@Controller('drills')
export class DrillController {
  constructor(private readonly drillService: DrillService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new drill' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        time: { type: 'string' },
        earnCoin: { type: 'string' },
        levelId: { type: 'string' },
        hashtags: { type: 'array', items: { type: 'string' } },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @Post()
  @UseInterceptors(FileInterceptor('file'), InterceptorsInterceptor)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDrillDto: CreateDrillDto, @UploadedFile() file: Express.Multer.File) {
    try {
      const result = await this.drillService.create(createDrillDto, file);
      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: 'Drill created successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to create drill',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all drills' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @Get()
  async findAll(@Query() query: Record<string, unknown>) {
    try {
      const result = await this.drillService.findAll(query);
      return {
        message: 'Drills retrieved successfully',
        data: result.data,
        meta: result.meta,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: 'Failed to retrieve drills',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Get drills by level ID' })
  @ApiParam({ name: 'levelId', description: 'Level ID' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get('level/:levelId')
  @HttpCode(HttpStatus.OK)
  async findByTraining(
    @Param('levelId') levelId: string,
    @Query() query: Record<string, any>
  ) {
    const result = await this.drillService.findByTraining(levelId, query);
    return {
      success: true,
      message: "Get drills by level successfully!",
      data: result.data,
      meta: result.meta,
    };
  }

  @ApiOperation({ summary: 'Get drill by ID' })
  @ApiParam({ name: 'id', description: 'Drill ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.drillService.findOne(id);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Drill retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: error.message || 'Drill not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update drill by ID' })
  @ApiParam({ name: 'id', description: 'Drill ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        time: { type: 'string' },
        earnCoin: { type: 'string' },
        levelId: { type: 'string' },
        hashtags: { type: 'array', items: { type: 'string' } },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'), InterceptorsInterceptor)
  async update(@Param('id') id: string, @Body() updateDrillDto: UpdateDrillDto, @UploadedFile() file: Express.Multer.File) {
    try {
      const result = await this.drillService.update(id, updateDrillDto, file);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Drill updated successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to update drill',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete drill by ID' })
  @ApiParam({ name: 'id', description: 'Drill ID' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    try {
      const result = await this.drillService.remove(id);
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
          message: error.message || 'Failed to delete drill',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}