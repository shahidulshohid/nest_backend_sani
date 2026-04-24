import { BadRequestException, Injectable } from '@nestjs/common';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma.service';
import { S3Service } from 'src/common/s3/s3.service';
import QueryBuilder from 'src/common/QueryBuilder';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService ,private s3Service:S3Service) {}

 async create(createProductDto: CreateProductDto,file:Express.Multer.File) {

 const  image =await this.s3Service.uploadFile(file, 'file')

   if(!image){

    throw new BadRequestException("image host problem in s3 bracket !")
   }
    
    return this.prisma.product.create({
      data: {
        name: createProductDto.data.name,
        price: createProductDto.data.price,
        quantity: createProductDto.data.quantity,
        imageUrl: image
      },
    });
  }

async findAll(query: Record<string, any>) {
  const queryBuilder = new QueryBuilder(this.prisma.product, query)
    .search(['name'])
    .filter()
    .sort()
    .paginate();

  const result = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  return { data: result, meta };
}



  findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

 async update(id: string, updateProductDto: UpdateProductDto,file:Express.Multer.File) {
   const isExist= await this.prisma.product.findFirst({where:{id}})
      let image =isExist?.imageUrl;
  if (file) {
    if (isExist) await this.s3Service.deleteFile(isExist.imageUrl);
  image = await this.s3Service.uploadFile(file, 'file');
  }

    return this.prisma.product.update({
      where: { id },
      data: {
        name: updateProductDto.data?.name,
        price: updateProductDto.data?.price,
        quantity: updateProductDto.data?.quantity,
        imageUrl: image,
      },
    });
  }

  remove(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }


  async getShopStats() {
  const totalRevenue = await this.prisma.orderItem.aggregate({
    _sum: { totalPrice: true },
  });

  const totalSales = await this.prisma.orderItem.aggregate({
    _sum: { quantity: true },
  });

  const activeItems = await this.prisma.product.count();

  const totalOrders = await this.prisma.order.count();

  const avgOrderValue = await this.prisma.order.aggregate({
    _avg: { totalAmount: true },
  });

  return {
    totalRevenue: totalRevenue._sum.totalPrice ?? 0,
    totalSales: totalSales._sum.quantity ?? 0,
    activeItems,
    avgOrderValue: avgOrderValue._avg.totalAmount ?? 0,
  };
}


}