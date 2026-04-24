import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Req, UseGuards, HttpCode, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { SkillCardService } from './skill-card.service';
import { CreateSkillCardDto } from './dto/create-skill-card.dto';
import { UpdateSkillCardDto } from './dto/update-skill-card.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { InterceptorsInterceptor } from 'src/common/interceptors/interceptors.interceptor';

@Controller('skill-cards')
export class SkillCardController {
  constructor(private readonly skillCardService: SkillCardService) {}

  @UseGuards(JwtAuthGuard)
  @Post()

  @UseInterceptors(FileInterceptor('file'), InterceptorsInterceptor)
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: any, @Body() createSkillCardDto: CreateSkillCardDto,  @UploadedFile() file: Express.Multer.File,) {
        if (!file) {
          throw new BadRequestException('Image file is required!');
        }

    try {
      const userId = req.user?.userId;
      const result = await this.skillCardService.create(userId, createSkillCardDto,file);
      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: 'Skill card created successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to create skill card',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  
  @Get()
  async findAll() {
    try {
      const result = await this.skillCardService.findAll();
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Skill cards retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: 'Failed to retrieve skill cards',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-card')

  @HttpCode(HttpStatus.CREATED)
  async getMyCard(@Req() req: any) {
    try {
      const userId = req.user?.userId;
      const result = await this.skillCardService.getMyCard(userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'My skill card retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: error.message || 'Skill card not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string) {
    try {
      const result = await this.skillCardService.findByUser(userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'User skill card retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: error.message || 'Skill card not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.skillCardService.findOne(id);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Skill card retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: error.message || 'Skill card not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }



  @UseGuards(JwtAuthGuard)
  @Patch(':id')
    @UseInterceptors(FileInterceptor('file'), InterceptorsInterceptor)
  async update(@Param('id') id: string, @Body() updateSkillCardDto: UpdateSkillCardDto,@UploadedFile() file: Express.Multer.File) {
    try {
      const result = await this.skillCardService.update(id, updateSkillCardDto,file);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Skill card updated successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to update skill card',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch('my-card/update')
  async updateMyCard(@Req() req: any, @Body() updateSkillCardDto: UpdateSkillCardDto) {
    try {
      const userId = req.user?.id;
      const result = await this.skillCardService.updateMySkillCard(userId, updateSkillCardDto);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'My skill card updated successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to update skill card',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const result = await this.skillCardService.remove(id);
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
          message: error.message || 'Failed to delete skill card',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete('my-card/delete')
  async removeMyCard(@Req() req: any) {
    try {
      const userId = req.user?.id;
      const result = await this.skillCardService.removeMySkillCard(userId);
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
          message: error.message || 'Failed to delete skill card',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }


  
}