import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import QueryBuilder from 'src/common/QueryBuilder';

@Injectable()
export class ChallengeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createChallengeDto: CreateChallengeDto) {
    const { drills, ...challengeData } = createChallengeDto;

    return await this.prisma.challenge.create({
      data: {
        ...challengeData,
        drillCount: drills.length,
        challengeDrills: {
          create: drills.map((d) => ({
            drillId: d.drillId,
            order: d.order,
          })),
        },
      },
      include: {
        challengeDrills: {
          include: { drill: true },
          orderBy: { order: 'asc' },
        },
      },
    });
  }




// async findAll(userId: string, query: Record<string, any>) {
//   const queryBuilder = new QueryBuilder(this.prisma.challenge, query)
//     .search(['name', 'ageRange'])
//     .filter()
//     .sort()
//     .paginate();

//   const challenges = await queryBuilder.execute();
//   const meta = await queryBuilder.countTotal();

//   const challengeIds = challenges.map((c: any) => c.id);

//   const challengesWithProgress = await this.prisma.challenge.findMany({
//     where: { id: { in: challengeIds } },
//     include: {
//       challengeDrills: {
//         include: { drill: true }, 
//         orderBy: { order: 'asc' },
//       },
//       userChallenges: {
//         where: { userId },
//         include: {
//           progress: { 
//             include: { drill: true }, 
//           },
//         },
//       },
//     },
//   });

//   const data = challengesWithProgress.map((challenge: any) => {
//     const userChallenge = challenge.userChallenges[0] || null;
//     const totalDrills = challenge.challengeDrills.length;
//     const completedDrills = userChallenge
//       ? userChallenge.progress.filter((p: any) => p.isCompleted).length
//       : 0;

//     const drills = challenge.challengeDrills.map((cd: any) => ({
//       id: cd.drill.id,
//       name: cd.drill.name,
//       isCompleted: userChallenge
//         ? userChallenge.progress.find((p: any) => p.drillId === cd.drillId)?.isCompleted || false
//         : false,
//     }));

//     return {
//       id: challenge.id,
//       name: challenge.name,
//       totalDrills,
//       completedDrills,
//       completionPercent: totalDrills ? Math.round((completedDrills / totalDrills) * 100) : 0,
//       isEnrolled: !!userChallenge,
//       isCompleted: userChallenge?.status === 'COMPLETED' || false,
//       drills,
//     };
//   });

//   return { data, meta };
// }

async findAll(userId: string, query: Record<string, any>) {
  const queryBuilder = new QueryBuilder(this.prisma.challenge, query)
    .search(['name', 'ageRange'])
    .filter()
    .sort()
    .paginate();

  const challenges = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  const challengeIds = challenges.map((c: any) => c.id);

  const challengesWithProgress = await this.prisma.challenge.findMany({
    where: { id: { in: challengeIds } },
    include: {
      challengeDrills: {
        include: { drill: true },
        orderBy: { order: 'asc' },
      },
      userChallenges: {
        where: { userId },
        include: {
          progress: true,
        },
      },
    },
  });

  const data = challengesWithProgress.map((challenge: any) => {
    const userChallenge = challenge.userChallenges[0] || null;

    const totalDrills = challenge.challengeDrills.length;

    const completedDrills = userChallenge
      ? userChallenge.progress.filter((p: any) => p.isCompleted).length
      : 0;

    const drills = challenge.challengeDrills.map((cd: any) => {
      const progress = userChallenge
        ? userChallenge.progress.find((p: any) => p.drillId === cd.drillId)
        : null;

      return {
        ...cd.drill, 
        isCompleted: progress?.isCompleted || false,
      };
    });

    return {
      id: challenge.id,
      name: challenge.name,
      totalDrills,
      completedDrills,
      completionPercent: totalDrills
        ? Math.round((completedDrills / totalDrills) * 100)
        : 0,
      isEnrolled: !!userChallenge,
      isCompleted: userChallenge?.status === 'COMPLETED' || false,
      drills,
    };
  });

  return { data, meta };
}

  async findOne(id: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: {
        challengeDrills: {
          include: { drill: true },
          orderBy: { order: 'asc' },
        },
        _count: { select: { userChallenges: true } },
      },
    });

    if (!challenge) throw new NotFoundException('Challenge not found');
    return challenge;
  }

  async update(id: string, updateChallengeDto: UpdateChallengeDto) {
    await this.findOne(id);
    const { drills, ...challengeData } = updateChallengeDto;

    if (drills && drills.length > 0) {

      await this.prisma.challengeDrill.deleteMany({ where: { challengeId: id } });

      return this.prisma.challenge.update({
        where: { id },
        data: {
          ...challengeData,
          drillCount: drills.length,
          challengeDrills: {
            create: drills.map((d) => ({
              drillId: d.drillId,
              order: d.order,
            })),
          },
        },
        include: {
          challengeDrills: {
            include: { drill: true },
            orderBy: { order: 'asc' },
          },
        },
      });
    }

    return this.prisma.challenge.update({
      where: { id },
      data: challengeData,
    });
  }


  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.challenge.delete({ where: { id } });
  }

  
  async joinChallenge(userId: string, challengeId: string) {
    await this.findOne(challengeId);

    const alreadyJoined = await this.prisma.userChallenge.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });
    if (alreadyJoined) throw new ConflictException('Already joined this challenge');


    const challengeDrills = await this.prisma.challengeDrill.findMany({
      where: { challengeId },
    });

    if (challengeDrills.length === 0) {
      throw new BadRequestException('This challenge has no drills');
    }

    return await this.prisma.userChallenge.create({
      data: {
        userId,
        challengeId,
        progress: {
          create: challengeDrills.map((cd) => ({
            drillId: cd.drillId,
          })),
        },
      },
      include: {
        progress: {
          include: { drill: true },
        },
        challenge: true,
      },
    });
  }


  async completeDrill(userId: string, challengeId: string, drillId: string) {

    const userChallenge = await this.prisma.userChallenge.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });

    if (!userChallenge) throw new NotFoundException('You have not joined this challenge');
    if (userChallenge.status === 'COMPLETED') {
      throw new BadRequestException('This challenge is already completed');
    }

    const progressRow = await this.prisma.userChallengeProgress.findUnique({
      where: {
        userChallengeId_drillId: {
          userChallengeId: userChallenge.id,
          drillId,
        },
      },
    });

    if (!progressRow) throw new NotFoundException('This drill does not belong to the challenge');
    if (progressRow.isCompleted) throw new BadRequestException('This drill is already completed');


    await this.prisma.userChallengeProgress.update({
      where: { id: progressRow.id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });


    await this.checkAndCompleteChallenge(userChallenge.id, userId, challengeId);

    return { message: 'Drill completed successfully' };
  }

 
  async getUserChallengeProgress(userId: string, challengeId: string) {
    const userChallenge = await this.prisma.userChallenge.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
      include: {
        challenge: true,
        progress: {
          include: { drill: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!userChallenge) throw new NotFoundException('You have not joined this challenge');

    const totalDrills = userChallenge.progress.length;
    const completedDrills = userChallenge.progress.filter((p) => p.isCompleted).length;

    return {
      ...userChallenge,
      totalDrills,
      completedDrills,
      completionPercent: Math.round((completedDrills / totalDrills) * 100),
    };
  }

async getUserChallenges(userId: string, query: Record<string, any>) {

  const queryBuilder = new QueryBuilder(this.prisma.userChallenge, query)
    .filter()
    .sort()
    .paginate()
    .include({
      challenge: {
        include: {
          challengeDrills: {
            include: { drill: true },
            orderBy: { order: 'asc' },
          },
        },
      },
      progress: true,
    });

  queryBuilder.rawFilter({ userId });

  const result = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  return { data: result, meta };
}

  private async checkAndCompleteChallenge(
    userChallengeId: string,
    userId: string,
    challengeId: string,
  ) {
    const allProgress = await this.prisma.userChallengeProgress.findMany({
      where: { userChallengeId },
    });

    const allCompleted = allProgress.every((p) => p.isCompleted);

    if (allCompleted) {
      const challenge = await this.prisma.challenge.findUnique({
        where: { id: challengeId },
      });


      await this.prisma.userChallenge.update({
        where: { id: userChallengeId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });


      await this.awardCoins(userId, challenge?.earnCoin as number);


      await this.checkAndAwardBadge(userId, challengeId);
    }
  }


  private async awardCoins(userId: string, amount: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        coinBalance: { increment: amount },
      },
    });
  }


private async checkAndAwardBadge(userId: string, challengeId: string) {
  const badges = await this.prisma.badge.findMany({
    where: {
      isActive: true,
      criteriaType: 'CHALLENGE_COMPLETE',
      challengeId: challengeId,
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

async getDashboardStats() {
  const now = new Date();

  const activeChallenges = await this.prisma.challenge.count({
    where: {
      startDate: { lte: now },
      endDate:   { gte: now },
    },
  });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const totalAttemptsToday = await this.prisma.userChallenge.count({
    where: {
      joinedAt: { gte: startOfDay },
    },
  });

  const allUserChallenges = await this.prisma.userChallenge.findMany({
    include: {
      progress: true,
      challenge: {
        include: { challengeDrills: true },
      },
    },
  });

  const completionPercents = allUserChallenges.map((uc) => {
    const total = uc.challenge.challengeDrills.length;
    if (!total) return 0;
    const completed = uc.progress.filter((p) => p.isCompleted).length;
    return Math.round((completed / total) * 100);
  });

  const averageCompletion = completionPercents.length
    ? Math.round(
        completionPercents.reduce((sum, p) => sum + p, 0) / completionPercents.length
      )
    : 0;

  return {
    activeChallenges,
    totalAttemptsToday,
    averageCompletion,
  };
}


}