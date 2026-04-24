import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { S3Service } from 'src/common/s3/s3.service';
import QueryBuilder from 'src/common/QueryBuilder';

@Injectable()
export class TrainingService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async create(createTrainingDto: CreateTrainingDto, file: Express.Multer.File) {
    const profileImage = await this.s3Service.uploadFile(file, 'file');

    if (!profileImage) {
      throw new BadRequestException('Image host problem in s3 bucket!');
    }

    return await this.prisma.training.create({
      data: {
        name: createTrainingDto.data.name,
        image: profileImage,
      },
    });
  }


  async update(id: string, updateTrainingDto: UpdateTrainingDto, file: Express.Multer.File) {
    const existingTraining = await this.prisma.training.findUnique({ where: { id } });
    if (!existingTraining) throw new NotFoundException('Training not found');

    let image = existingTraining.image;
    if (file) {
      if (existingTraining.image) await this.s3Service.deleteFile(existingTraining.image);
      image = await this.s3Service.uploadFile(file, 'file');
    }

    return await this.prisma.training.update({
      where: { id },
      data: {
        name: updateTrainingDto.data?.name,
        image,
      },
    });
  }


  async remove(id: string) {
    const existingTraining = await this.prisma.training.findUnique({ where: { id } });
    if (!existingTraining) throw new NotFoundException('Training not found');

    await this.prisma.training.delete({ where: { id } });
    return { message: 'Training deleted successfully' };
  }

  
async findAllForUser(userId: string, query: Record<string, any>) {
  const queryBuilder = new QueryBuilder(this.prisma.training, query)
    .search(['name'])
    .filter()
    .sort()
    .paginate();


  const trainings = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  const trainingIds = trainings.map((t: any) => t.id);

  const trainingsWithLevels = await this.prisma.training.findMany({
    where: { id: { in: trainingIds } },
    include: {
      _count: { select: { levels: true } },
      userTrainingProgress: {
        where: { userId },
      },
    },
  });


  const userLevelProgressList = await this.prisma.userLevelProgress.findMany({
    where: { userId },
  });

  const data = trainingsWithLevels.map((training: any) => {
    const progress = training.userTrainingProgress[0] || null;
    const totalLevels = training._count.levels;

    const completedLevels = userLevelProgressList.filter(
      (lp) => lp.trainingId === training.id && lp.isCompleted,
    ).length;

    const completionPercent =
      totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0;

    return {
      id: training.id,
      name: training.name,
      image: training.image,
      totalLevels,
      isEnrolled: !!progress,
      isCompleted: progress?.isCompleted || false,
      currentLevelId: progress?.currentLevelId || null,
      completedLevels,
      completionPercent,
    };
  });

  return { data, meta };
}
  


  async findOneForUser(trainingId: string, userId: string) {
    const training = await this.prisma.training.findUnique({
      where: { id: trainingId },
      include: {
        levels: {
          orderBy: { levelNumber: 'asc' },
          include: {
            drills: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!training) throw new NotFoundException('Training not found');


    const trainingProgress = await this.prisma.userTrainingProgress.findUnique({
      where: { userId_trainingId: { userId, trainingId } },
    });

    const isEnrolled = !!trainingProgress;

    const levelProgressList = isEnrolled
      ? await this.prisma.userLevelProgress.findMany({
          where: { userId, trainingId },
        })
      : [];


    const completedDrillIds = isEnrolled
      ? (
          await this.prisma.userDrillProgress.findMany({
            where: {
              userId,
              isCompleted: true,
              drill: { level: { trainingId } },
            },
            select: { drillId: true },
          })
        ).map((d) => d.drillId)
      : [];


    const levels = training.levels.map((level) => {
      const levelProgress = levelProgressList.find((lp) => lp.levelId === level.id);
      const totalDrills = level.drills.length;
      const completedDrills = level.drills.filter((d) =>
        completedDrillIds.includes(d.id),
      ).length;

      return {
        id: level.id,
        levelNumber: level.levelNumber,
        isUnlocked: isEnrolled ? levelProgress?.isUnlocked || false : false,
        isCompleted: levelProgress?.isCompleted || false,
        unlockedAt: levelProgress?.unlockedAt || null,
        completedAt: levelProgress?.completedAt || null,
        totalDrills,
        completedDrills,
        drills: level.drills.map((drill) => ({
          ...drill,
          isCompleted: completedDrillIds.includes(drill.id),
        })),
      };
    });

    return {
      id: training.id,
      name: training.name,
      image: training.image,
      isEnrolled,
      isCompleted: trainingProgress?.isCompleted || false,
      currentLevelId: trainingProgress?.currentLevelId || null,
      totalLevels: training.levels.length,
      completedLevels: levelProgressList.filter((lp) => lp.isCompleted).length,
      levels,
    };
  }


  async enrollInTraining(userId: string, trainingId: string) {
    const training = await this.prisma.training.findUnique({
      where: { id: trainingId },
      include: {
        levels: { orderBy: { levelNumber: 'asc' } },
      },
    });

    if (!training) throw new NotFoundException('Training not found');
    if (training.levels.length === 0) {
      throw new BadRequestException('This training has no levels yet');
    }


    const alreadyEnrolled = await this.prisma.userTrainingProgress.findUnique({
      where: { userId_trainingId: { userId, trainingId } },
    });
    if (alreadyEnrolled) throw new ConflictException('Already enrolled in this training');

    const firstLevel = training.levels[0];

    await this.prisma.$transaction([
      this.prisma.userTrainingProgress.create({
        data: {
          userId,
          trainingId,
          currentLevelId: firstLevel.id,
        },
      }),
      this.prisma.userLevelProgress.create({
        data: {
          userId,
          levelId: firstLevel.id,
          trainingId,
          isUnlocked: true,
          unlockedAt: new Date(),
        },
      }),
    ]);

    return {
      message: 'Enrolled successfully! Level 1 is now unlocked.',
      currentLevelId: firstLevel.id,
    };
  }



  async completeDrill(userId: string, trainingId: string, levelId: string, drillId: string) {

    const trainingProgress = await this.prisma.userTrainingProgress.findUnique({
      where: { userId_trainingId: { userId, trainingId } },
    });
    if (!trainingProgress) throw new NotFoundException('You are not enrolled in this training');
    // if (trainingProgress.isCompleted) {
    //   throw new BadRequestException('This training is already completed');
    // }

    if (trainingProgress.isCompleted) {

  const newLevel = await this.prisma.userLevelProgress.findUnique({
    where: { userId_levelId: { userId, levelId } },
  });


  if (!newLevel || !newLevel.isUnlocked) {
    throw new BadRequestException('This level is locked');
  }


  await this.prisma.userTrainingProgress.update({
    where: { userId_trainingId: { userId, trainingId } },
    data: {
      isCompleted: false,
      completedAt: null,
      currentLevelId: levelId,
    },
  });
}


    const levelProgress = await this.prisma.userLevelProgress.findUnique({
      where: { userId_levelId: { userId, levelId } },
    });
    if (!levelProgress || !levelProgress.isUnlocked) {
      throw new BadRequestException('This level is locked. Complete the previous level first');
    }
    if (levelProgress.isCompleted) {
      throw new BadRequestException('This level is already completed');
    }

    const drill = await this.prisma.drill.findFirst({
      where: { id: drillId, levelId },
    });
    if (!drill) throw new NotFoundException('Drill not found in this level');

    const existingProgress = await this.prisma.userDrillProgress.findUnique({
      where: { userId_drillId: { userId, drillId } },
    });
    if (existingProgress?.isCompleted) {
      throw new BadRequestException('This drill is already completed');
    }


    await this.prisma.userDrillProgress.upsert({
      where: { userId_drillId: { userId, drillId } },
      create: {
        userId,
        drillId,
        isCompleted: true,
        completedAt: new Date(),
        earnedCoins: parseInt(drill.earnCoin),
      },
      update: {
        isCompleted: true,
        completedAt: new Date(),
        earnedCoins: parseInt(drill.earnCoin),
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { coinBalance: { increment: parseInt(drill.earnCoin) } },
    });


    await this.checkAndCompleteLevel(userId, levelId, trainingId);

    return { message: 'Drill completed successfully!' };
  }

  private async checkAndCompleteLevel(userId: string, levelId: string, trainingId: string) {
    const allDrills = await this.prisma.drill.findMany({ where: { levelId } });

    const completedDrills = await this.prisma.userDrillProgress.findMany({
      where: {
        userId,
        isCompleted: true,
        drillId: { in: allDrills.map((d) => d.id) },
      },
    });

    if (completedDrills.length !== allDrills.length) return;

   
    await this.prisma.userLevelProgress.update({
      where: { userId_levelId: { userId, levelId } },
      data: { isCompleted: true, completedAt: new Date() },
    });

      await this.checkAndAwardLevelBadge(userId, levelId);
    const currentLevel = await this.prisma.level.findUnique({ where: { id: levelId } });

    const nextLevel = await this.prisma.level.findFirst({
      where: {
        trainingId,
        levelNumber: (currentLevel?.levelNumber as number) + 1,
      },
    });

    if (nextLevel) {
      
      await this.prisma.userLevelProgress.upsert({
        where: { userId_levelId: { userId, levelId: nextLevel.id } },
        create: {
          userId,
          levelId: nextLevel.id,
          trainingId,
          isUnlocked: true,
          unlockedAt: new Date(),
        },
        update: {
          isUnlocked: true,
          unlockedAt: new Date(),
        },
      });

      await this.prisma.userTrainingProgress.update({
        where: { userId_trainingId: { userId, trainingId } },
        data: { currentLevelId: nextLevel.id },
      });
    } else {
  
      await this.checkAndCompleteTraining(userId, trainingId);
    }


    
  }



private async checkAndAwardLevelBadge(userId: string, levelId: string) {
  const badges = await this.prisma.badge.findMany({
    where: {
      isActive: true,
      criteriaType: 'LEVEL_COMPLETE',
      levelId: levelId,
    },
  });

  for (const badge of badges) {
    const alreadyEarned = await this.prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
    });

    if (!alreadyEarned) {
      await this.prisma.userBadge.create({
        data: { userId, badgeId: badge.id },
      });
    }
  }
}

  

  private async checkAndCompleteTraining(userId: string, trainingId: string) {
    await this.prisma.userTrainingProgress.update({
      where: { userId_trainingId: { userId, trainingId } },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        currentLevelId: null,
      },
    });

    await this.checkAndAwardBadge(userId, trainingId);
  }

  
private async checkAndAwardBadge(userId: string, trainingId: string) {
 
  const badges = await this.prisma.badge.findMany({
    where: {
      isActive: true,
      criteriaType: 'TRAINING_COMPLETE',
      trainingId: trainingId,
    },
  });

  for (const badge of badges) {
    const alreadyEarned = await this.prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
    });

    if (!alreadyEarned) {
      await this.prisma.userBadge.create({
        data: { userId, badgeId: badge.id },
      });
    }
  }
}
}