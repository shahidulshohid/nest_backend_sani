import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpException,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FavoriteDrillService } from './favorite-drill.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('favorite-drill')
export class FavoriteDrillController {
  constructor(private readonly favoriteDrillService: FavoriteDrillService) {}


  @UseGuards(JwtAuthGuard)
  @Post('collections')
  async createCollection(@Req() req: any, @Body('name') name: string) {
    try {
      const userId = req.user?.userId;
      const result = await this.favoriteDrillService.createCollection(userId, name);
      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: 'Collection created successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to create collection',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }


  @UseGuards(JwtAuthGuard)
  @Get('collections')
  async getUserCollections(@Req() req: any) {
    try {
      const userId = req.user?.userId;
      const result = await this.favoriteDrillService.getUserCollections(userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Collections retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: error.message || 'Failed to retrieve collections',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

 
  @UseGuards(JwtAuthGuard)
  @Get('collections/:collectionId')
  async getCollection(@Req() req: any, @Param('collectionId') collectionId: string) {
    try {
      const userId = req.user?.userId;
      const result = await this.favoriteDrillService.getCollection(collectionId, userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Collection retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: error.message || 'Collection not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }



  @UseGuards(JwtAuthGuard)
  @Delete('collections/:collectionId')
  async removeCollection(@Req() req: any, @Param('collectionId') collectionId: string) {
    try {
      const userId = req.user?.userId;
      const result = await this.favoriteDrillService.removeCollection(collectionId, userId);
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
          message: error.message || 'Failed to delete collection',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }



  @UseGuards(JwtAuthGuard)
  @Post('collections/:collectionId/drills/:drillId')
  async addDrillToCollection(
    @Req() req: any,
    @Param('collectionId') collectionId: string,
    @Param('drillId') drillId: string,
  ) {
    try {
      const userId = req.user?.userId;
      const result = await this.favoriteDrillService.addDrillToCollection(
        userId,
        collectionId,
        drillId,
      );
      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: 'Drill added to collection successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to add drill to collection',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }


  @UseGuards(JwtAuthGuard)
  @Delete('collections/:collectionId/drills/:drillId')
  async removeDrillFromCollection(
    @Req() req: any,
    @Param('collectionId') collectionId: string,
    @Param('drillId') drillId: string,
  ) {
    try {
      const userId = req.user?.userId;
      const result = await this.favoriteDrillService.removeDrillFromCollection(
        userId,
        collectionId,
        drillId,
      );
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
          message: error.message || 'Failed to remove drill from collection',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }


  @UseGuards(JwtAuthGuard)
  @Get('check/:drillId')
  async checkIfFavorite(@Req() req: any, @Param('drillId') drillId: string) {
    try {
      const userId = req.user?.userId;
      const result = await this.favoriteDrillService.checkIfFavorite(userId, drillId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Favorite status checked successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: error.message || 'Failed to check favorite status',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getStats(@Req() req: any) {
    try {
      const userId = req.user?.userId;
      const result = await this.favoriteDrillService.getUserFavoriteStats(userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Favorite stats retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: error.message || 'Failed to retrieve favorite stats',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}