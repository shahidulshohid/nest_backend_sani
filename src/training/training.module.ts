import { Module } from '@nestjs/common';
import { TrainingService } from './training.service';
import { TrainingController } from './training.controller';
import { PrismaModule } from 'src/prisma.module';
import { S3Module } from 'src/common/s3/s3.module';

@Module({
   imports: [PrismaModule, S3Module],
  controllers: [TrainingController],
  providers: [TrainingService],
})
export class TrainingModule {}
