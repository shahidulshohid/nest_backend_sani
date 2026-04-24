import { Module } from '@nestjs/common';
import { DrillService } from './drill.service';
import { DrillController } from './drill.controller';
import { PrismaModule } from 'src/prisma.module';
import { S3Module } from 'src/common/s3/s3.module';

@Module({
    imports: [PrismaModule, S3Module],
  controllers: [DrillController],
  providers: [DrillService],
})
export class DrillModule {}
