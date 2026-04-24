import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ChallengeService } from './challenge.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/guards/auth/roles/roles.guard';
import { Roles } from 'src/guards/auth/roles/roles.decorator';
import { UserRole } from 'generated/prisma/enums';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ClientBase } from 'pg';

@ApiTags('Challenges')
@ApiBearerAuth()
@Controller('challenges')
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  // =============================================
  // ADMIN Routes
  // =============================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new challenge' })
  @Post()
  @HttpCode(HttpStatus.OK)
  async create(@Body() createChallengeDto: CreateChallengeDto) {
    const result = await this.challengeService.create(createChallengeDto);
    return {
      success: true,
      message: 'Challenge created successfully!',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update challenge by ID' })
  @ApiParam({ name: 'id', description: 'Challenge ID' })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updateChallengeDto: UpdateChallengeDto) {
    const result = await this.challengeService.update(id, updateChallengeDto);
    return {
      success: true,
      message: 'Challenge updated successfully!',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete challenge by ID' })
  @ApiParam({ name: 'id', description: 'Challenge ID' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.challengeService.remove(id);
    return {
      success: true,
      message: 'Challenge deleted successfully!',
    };
  }

  // =============================================
  // USER Routes
  // =============================================

 @UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Get all challenges' })
@ApiQuery({ name: 'search', required: false })
@ApiQuery({ name: 'page', required: false })
@ApiQuery({ name: 'limit', required: false })
@ApiQuery({ name: 'sortBy', required: false })
@Get()
@HttpCode(HttpStatus.OK)
async findAll(@Req() req:any,@Query() query: Record<string, any>) {
  const result = await this.challengeService.findAll(req.user.userId,query);
  return {
    success: true,
    message: 'Challenges fetched successfully!',
    data: result.data,
    meta: result.meta,
  };
}


  @UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Get current user challenges' })
@ApiQuery({ name: 'page', required: false })
@ApiQuery({ name: 'limit', required: false })
@Get('my/all')
@HttpCode(HttpStatus.OK)
async getMyChallenges(@Req() req: any, @Query() query: Record<string, any>) {
  const result = await this.challengeService.getUserChallenges(req.user.userId, query);
  return {
    success: true,
    message: 'User challenges fetched successfully!',
    data: result.data,
    meta: result.meta,
  };
}
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get challenge by ID' })
  @ApiParam({ name: 'id', description: 'Challenge ID' })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    const result = await this.challengeService.findOne(id);
    return {
      success: true,
      message: 'Challenge fetched successfully!',
      data: result,
    };
  }



  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Join a challenge' })
  @ApiParam({ name: 'id', description: 'Challenge ID' })
  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  async joinChallenge(@Param('id') challengeId: string, @Req() req: any) {
  console.log(req.user)
    const result = await this.challengeService.joinChallenge(req.user.userId, challengeId);
    return {
      success: true,
      message: 'Joined challenge successfully!',
      data: result,
    };
  }




  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Complete a drill in a challenge' })
  @ApiParam({ name: 'id', description: 'Challenge ID' })
  @ApiParam({ name: 'drillId', description: 'Drill ID' })
  @Post(':id/drills/:drillId/complete')
  @HttpCode(HttpStatus.OK)
  async completeDrill(
    @Param('id') challengeId: string,
    @Param('drillId') drillId: string,
    @Req() req: any,
  ) {
    const result = await this.challengeService.completeDrill(req.user.userId, challengeId, drillId);
    return {
      success: true,
      message: 'Drill completed successfully!',
      data: result,
    };
  }



  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user progress in a challenge' })
  @ApiParam({ name: 'id', description: 'Challenge ID' })
  @Get(':id/progress')
  @HttpCode(HttpStatus.OK)
  async getProgress(@Param('id') challengeId: string, @Req() req: any) {
    const result = await this.challengeService.getUserChallengeProgress(req.user.userId, challengeId);
    return {
      success: true,
      message: 'Challenge progress fetched successfully!',
      data: result,
    };
  }



@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiOperation({ summary: 'Get challenge dashboard stats' })
@Get('dashboard/stats')                         
@HttpCode(HttpStatus.OK)
async getDashboardStats() {
  const result = await this.challengeService.getDashboardStats();
  return {
    success: true,
    message: 'Dashboard stats fetched successfully!',
    data: result,
  };
}
}