import { BadRequestException, Injectable } from '@nestjs/common';

import { CreateDrillDto } from './dto/create-drill.dto';
import { UpdateDrillDto } from './dto/update-drill.dto';
import { PrismaService } from 'src/prisma.service';
import { S3Service } from 'src/common/s3/s3.service';
import QueryBuilder from 'src/common/QueryBuilder';

@Injectable()
export class DrillService {
  constructor(private prisma: PrismaService,private s3Service:S3Service) {}

  async create(createDrillDto: CreateDrillDto,file:Express.Multer.File) {

       const videoFile = await this.s3Service.uploadVideo(file,"file")
    
       console.log(videoFile)
       if(!videoFile){
    
        throw new BadRequestException("image host problem in s3 bracket !")
       }
    const drill = await this.prisma.drill.create({
      data: {
        name: createDrillDto.data.name,
        time: createDrillDto.data.time ,
        earnCoin: createDrillDto.data.earnCoin ,
        video: videoFile ,
        hashtags: createDrillDto.data.hashtags ,
        levelId: createDrillDto.data.levelId,
      },
    });

    return drill;
  }

  // async findAll() {
  //   const drills = await this.prisma.drill.findMany({
  //     orderBy: {
  //       createdAt: 'desc',
  //     },
  //     include: {
  //     level: {
  //         select: {
  //           id: true,
  //         levelNumber:true
  //         },
  //       },
  //     },
  //   });

  //   return drills;
  // }

  async findAll(query: Record<string, unknown>) {
  const queryBuilder = new QueryBuilder(this.prisma.drill, query);

  const data = await queryBuilder
    .search(['title', 'description'])
    .filter()
    .sort()
    .paginate()
    .include({
      level: {
        select: {
          id: true,
          levelNumber: true,
        },
      },
    })
    .execute();

  const meta = await queryBuilder.countTotal();

  return { data, meta };
}
  async findOne(id: string) {
    const drill = await this.prisma.drill.findUnique({
      where: { id },
      include: {
        level: {
          select: {
            id: true,
          levelNumber:true
          },
        },
      },
    });

    if (!drill) {
      throw new Error('Drill not found');
    }

    return drill;
  }

  async findByTraining(levelId: string, query: Record<string, any>) {

  const queryBuilder = new QueryBuilder(this.prisma.drill, query)
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .include({
      level: {
        select: {
          id: true,
          levelNumber: true,
        },
      },
    });

  queryBuilder.rawFilter({ levelId });

  const result = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  return { data: result, meta };
}

  async update(id: string, updateDrillDto: UpdateDrillDto,file:Express.Multer.File) {

    console.log(file)
    const existingDrill = await this.prisma.drill.findUnique({
      where: { id },
    });

    if (!existingDrill) {
      throw new Error('Drill not found');
    }

     let videoUrl =existingDrill.video
  if (file) {
    if (existingDrill) await this.s3Service.deleteFile(existingDrill.video);
  videoUrl = await this.s3Service.uploadVideo(file, 'file');
  }

    const drill = await this.prisma.drill.update({
      where: { id },
      data: {
        name: updateDrillDto.data?.name,
        time: updateDrillDto.data?.time,
        earnCoin: updateDrillDto.data?.earnCoin,
        video: videoUrl,
        hashtags: updateDrillDto.data?.hashtags,
        levelId: updateDrillDto.data?.levelId,
      },
    });

    return drill;
  }

  async remove(id: string) {
    const existingDrill = await this.prisma.drill.findUnique({
      where: { id },
    });

    if (!existingDrill) {
      throw new Error('Drill not found');
    }

    await this.prisma.drill.delete({
      where: { id },
    });

    return { message: 'Drill deleted successfully' };
  }
}