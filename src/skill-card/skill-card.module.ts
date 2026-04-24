import { Module } from '@nestjs/common';
import { SkillCardService } from './skill-card.service';
import { SkillCardController } from './skill-card.controller';
import { S3Module } from 'src/common/s3/s3.module';

@Module({
    imports: [S3Module],
  controllers: [SkillCardController],
  providers: [SkillCardService],
})
export class SkillCardModule {}
