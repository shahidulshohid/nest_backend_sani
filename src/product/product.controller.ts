import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, UseGuards, UseInterceptors, HttpCode, UploadedFile, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/guards/auth/roles/roles.guard';
import { Roles } from 'src/guards/auth/roles/roles.decorator';
import { UserRole } from 'generated/prisma/enums';
import { FileInterceptor } from '@nestjs/platform-express';
import { InterceptorsInterceptor } from 'src/common/interceptors/interceptors.interceptor';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(UserRole.ADMIN,UserRole.SUPER_ADMIN)
  @Post()
   @UseInterceptors(FileInterceptor('file'),InterceptorsInterceptor)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProductDto: CreateProductDto,@UploadedFile() file:Express.Multer.File) {
    try {
      const result = await this.productService.create(createProductDto,file);
      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: 'Product created successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to create product',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

@Get()
async findAll(@Query() query: Record<string, any>) {
  try {
    const result = await this.productService.findAll(query);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Products retrieved successfully',
      data: result.data,
      meta:result.meta
    };
  } catch (error) {
    throw new HttpException(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: 'Failed to retrieve products',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.productService.findOne(id);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Product retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: error.message || 'Product not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(UserRole.ADMIN,UserRole.SUPER_ADMIN)
  @Patch(':id')
    @UseInterceptors(FileInterceptor('file'),InterceptorsInterceptor)
  @HttpCode(HttpStatus.CREATED)
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto,@UploadedFile() file:Express.Multer.File) {
    try {
      const result = await this.productService.update(id, updateProductDto,file);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Product updated successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to update product',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const result = await this.productService.remove(id);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Product deleted successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to delete product',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }


  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Get('all/stats')
@HttpCode(HttpStatus.OK)
async getShopStats() {
  try {
    const result = await this.productService.getShopStats();
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Shop stats retrieved successfully',
      data: result,
    };
  } catch (error) {
    throw new HttpException(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: 'Failed to retrieve shop stats',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

}