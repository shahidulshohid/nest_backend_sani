import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';

import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import { PrismaService } from 'src/prisma.service';
import QueryBuilder from 'src/common/QueryBuilder';

@Injectable()
export class LevelService {
  constructor(private prisma: PrismaService) {}

  async create(trainingId:string) {
    try {
    
      const maxLevel = await this.prisma.level.findFirst({
        where: { trainingId: trainingId },
        orderBy: { levelNumber: 'desc' },
        select: { levelNumber: true }
      });

      const nextLevelNumber = maxLevel ? maxLevel.levelNumber + 1 : 1;

      const level = await this.prisma.level.create({
        data: {
         trainingId,
          levelNumber: nextLevelNumber,
        },
        include: {
          training: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      //  await this.resetCompletedTrainingIfNewLevel(trainingId);
await this.unlockNewLevelForCompletedUsers(trainingId, level.id);

      return level;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Level number already exists for this training');
      }
      if (error.code === 'P2003') {
        throw new NotFoundException('Training not found');
      }
      throw new InternalServerErrorException('Failed to create level');
    }
  }

  // async findAll() {
  //   try {
  //     const levels = await this.prisma.level.findMany({
  //       include: {
  //         training: {
  //           select: {
  //             id: true,
  //             name: true,
  //           },
  //         },
  //         drills: {
  //           select: {
  //             id: true,
  //             name: true,
  //           },
  //         },
  //       },
  //       orderBy: [
  //         { trainingId: 'asc' },
  //         { levelNumber: 'asc' }
  //       ],
  //     });

  //     return levels;
  //   } catch (error) {
  //     throw new InternalServerErrorException('Failed to retrieve levels');
  //   }
  // }

async findAll(query: Record<string, any>) {

  const queryBuilder = new QueryBuilder(this.prisma.level, query)
    .search(['levelNumber'])
    .filter()
    .sort()
    .paginate()
    .include({
      training: {
        select: {
          id: true,
          name: true,
        },
      },
      drills: {
        select: {
          id: true,
          name: true,
        },
      },
    });

  const result = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  return { data: result, meta };
}

  async findOne(id: string) {
    try {
      const level = await this.prisma.level.findUnique({
        where: { id },
        include: {
          training: {
            select: {
              id: true,
              name: true,
      
            },
          },
          drills: true
        },
      });

      if (!level) {
        throw new NotFoundException(`Level with ID "${id}" not found`);
      }

      return level;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve level');
    }
  }

  async findByTrainingId(trainingId: string) {
    try {
      const levels = await this.prisma.level.findMany({
        where: { trainingId },
        include: {
          drills: true
        },
        orderBy: { levelNumber: 'asc' },
      });

      if (levels.length === 0) {
        throw new NotFoundException(`No levels found for training ID "${trainingId}"`);
      }

      return levels;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve training levels');
    }
  }

  async remove(id: string) {
    try {
      await this.findOne(id);

      await this.prisma.level.delete({
        where: { id },
      });

      return { message: 'Level deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete level');
    }
  }

  async getTrainingLevelStats(trainingId: string) {
    try {
      const totalLevels = await this.prisma.level.count({
        where: { trainingId },
      });

      const levelsWithDrills = await this.prisma.level.findMany({
        where: { trainingId },
        include: {
          _count: {
            select: { drills: true },
          },
        },
        orderBy: { levelNumber: 'asc' },
      });

      return {
        totalLevels,
        levels: levelsWithDrills.map(level => ({
          id: level.id,
          levelNumber: level.levelNumber,
          totalDrills: level._count.drills,
        })),
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve training level stats');
    }
  }

  async checkLevelNumberExists(trainingId: string, levelNumber: number) {
    try {
      const level = await this.prisma.level.findFirst({
        where: {
          trainingId,
          levelNumber,
        },
        select: {
          id: true,
          levelNumber: true,
        },
      });

      return {
        exists: !!level,
        levelId: level?.id || null,
        levelNumber,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to check level number');
    }
  }


public async unlockNewLevelForCompletedUsers(trainingId: string, newLevelId: string) {
  const enrolledUsers = await this.prisma.userTrainingProgress.findMany({
    where: { trainingId },
    select: { userId: true },
  });

  if (enrolledUsers.length === 0) return;

  for (const { userId } of enrolledUsers) {
    const incompleteLevels = await this.prisma.userLevelProgress.findMany({
      where: {
        userId,
        trainingId,
        isCompleted: false,
        isUnlocked: true,
      },
    });
    if (incompleteLevels.length > 0) continue;


    await this.prisma.userLevelProgress.upsert({
      where: { userId_levelId: { userId, levelId: newLevelId } },
      create: {
        userId,
        levelId: newLevelId,
        trainingId,
        isUnlocked: true,
        isCompleted: false,
        unlockedAt: new Date(),
      },
      update: {
        isUnlocked: true,
        isCompleted: false,
        unlockedAt: new Date(),
      },
    });

   
    await this.prisma.userTrainingProgress.update({
      where: { userId_trainingId: { userId, trainingId } },
      data: {
        isCompleted: false,
        completedAt: null,
        currentLevelId: newLevelId,
      },
    });
  }
}


// async resetCompletedTrainingIfNewLevel(trainingId: string) {
//   const completedProgresses = await this.prisma.userTrainingProgress.findMany({
//     where: { trainingId, isCompleted: true },
//   });

//   if (completedProgresses.length === 0) return;

//   const allLevels = await this.prisma.level.findMany({
//     where: { trainingId },
//     orderBy: { levelNumber: 'asc' },
//   });

//   if (allLevels.length === 0) return;

//   const userIds = completedProgresses.map((p) => p.userId);

//   for (const userId of userIds) {
   
//     const completedLevelIds = await this.prisma.userLevelProgress.findMany({
//       where: { userId, trainingId, isCompleted: true },
//       select: { levelId: true },
//     });

//     const completedLevelIdSet = new Set(completedLevelIds.map((l) => l.levelId));


//     for (const level of allLevels) {
//       if (completedLevelIdSet.has(level.id)) continue;

//       await this.prisma.userLevelProgress.upsert({
//         where: { userId_levelId: { userId, levelId: level.id } },
//         create: {
//           userId,
//           levelId: level.id,
//           trainingId,
//           isUnlocked: true,
//           unlockedAt: new Date(),
//         },
//         update: {
//           isUnlocked: true,
//           unlockedAt: new Date(),
//         },
//       });

//       await this.prisma.userTrainingProgress.update({
//         where: { userId_trainingId: { userId, trainingId } },
//         data: {
//           isCompleted: false,
//           completedAt: null,
//           currentLevelId: level.id,
//         },
//       });

//       break; 
//     }
//   }
// }


}