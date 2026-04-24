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
  HttpCode,
  Query,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/guards/auth/roles/roles.guard';
import { Roles } from 'src/guards/auth/roles/roles.decorator';
import { UserRole } from 'generated/prisma/enums';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: any, @Body() createProgressDto: CreateProgressDto) {
    try {
      const userId = req.user?.userId;
      const result = await this.progressService.create(userId, createProgressDto);
      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: 'Progress created successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to create progress',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    try {
      const result = await this.progressService.findAll();
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'All progress retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: 'Failed to retrieve progress',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-progress')
  @HttpCode(HttpStatus.OK)
  async getMyProgress(@Req() req: any) {
    try {
      const userId = req.user?.userId;
      const result = await this.progressService.getMyProgress(userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'My progress retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: error.message || 'Failed to retrieve my progress',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getStats(@Req() req: any) {
    try {
      const userId = req.user?.userId;
      const result = await this.progressService.getUserProgressStats(userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Progress stats retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: error.message || 'Failed to retrieve progress stats',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('overview')
  @HttpCode(HttpStatus.OK)
  async getProgressOverview(@Req() req: any) {
    try {
      const userId = req.user?.userId;
      const result = await this.progressService.getProgressOverview(userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Progress overview retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: error.message || 'Failed to retrieve progress overview',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('skill-levels')
  @HttpCode(HttpStatus.OK)
  async getSkillLevels(@Req() req: any) {
    try {
      const userId = req.user?.userId;
      const result = await this.progressService.getSkillLevels(userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Skill levels retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: error.message || 'Failed to retrieve skill levels',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('badges')
  @HttpCode(HttpStatus.OK)
  async getBadgeCollection(@Req() req: any) {
    try {
      const userId = req.user?.userId;
      const result = await this.progressService.getBadgeCollection(userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Badge collection retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: error.message || 'Failed to retrieve badge collection',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

@UseGuards(JwtAuthGuard)
@Get('calendar')
@HttpCode(HttpStatus.OK)
async getActivityCalendar(
  @Req() req: any,
  @Query('year') year?: string,
  @Query('month') month?: string,
  @Query('day') day?: string,      
) {
  try {
    const userId = req.user?.userId;
    const now = new Date();
    const result = await this.progressService.getActivityCalendar(
      userId,
      year ? parseInt(year) : now.getFullYear(),
      month ? parseInt(month) : now.getMonth() + 1,
      day ? parseInt(day) : undefined, 
    );
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Activity calendar retrieved successfully',
      data: result,
    };
  } catch (error) {
    throw new HttpException(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: error.message || 'Failed to retrieve activity calendar',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
  @Get('top-table/month')
  @HttpCode(HttpStatus.OK)
  async getTopTableOfMonth(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    try {
      const result = await this.progressService.getTopTableOfMonth(
        year ? parseInt(year) : undefined,
        month ? parseInt(month) : undefined,
      );
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Top table of the month retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to get top of the month table progress',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  async findByUser(@Param('userId') userId: string) {
    try {
      const result = await this.progressService.findByUser(userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'User progress retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: error.message || 'Failed to retrieve user progress',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('drill/:drillId')
  @HttpCode(HttpStatus.OK)
  async findByDrill(@Param('drillId') drillId: string) {
    try {
      const result = await this.progressService.findByDrill(drillId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Drill progress retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: error.message || 'Failed to retrieve drill progress',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('complete/:drillId')
  @HttpCode(HttpStatus.OK)
  async completeProgress(@Req() req: any, @Param('drillId') drillId: string) {
    try {
      const userId = req.user?.userId;  
      const result = await this.progressService.completeProgress(userId, drillId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Drill completed successfully',
        data: result,
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

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updateProgressDto: UpdateProgressDto) {
    try {
      const result = await this.progressService.update(id, updateProgressDto);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Progress updated successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to update progress',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    try {
      const result = await this.progressService.remove(id);
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
          message: error.message || 'Failed to delete progress',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
@Get('my/monthly-challenge')
@HttpCode(HttpStatus.OK)
async getMonthlyChallenge(@Req() req: any) {
  try {
    const userId = req.user?.userId;
    const result = await this.progressService.getMonthlyChallenge(userId);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Monthly challenge retrieved successfully',
      data: result,
    };
  } catch (error) {
    throw new HttpException(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: error.message || 'Failed to retrieve monthly challenge',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}


  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.progressService.findOne(id);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Progress retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: error.message || 'Progress not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }



}