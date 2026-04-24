import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PrismaModule } from 'src/prisma.module';
import { S3Module } from 'src/common/s3/s3.module';

@Module({
   imports: [PrismaModule, S3Module],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
