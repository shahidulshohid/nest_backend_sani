import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  private async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
    return user;
  }

  private async validateDrill(drillId: string) {
    const drill = await this.prisma.drill.findUnique({ where: { id: drillId } });
    if (!drill) throw new NotFoundException(`Drill with ID ${drillId} not found`);
    return drill;
  }

  private async calculateDayStreak(userId: string): Promise<number> {
    const completedDrills = await this.prisma.userDrillProgress.findMany({
      where: { userId, isCompleted: true },
      select: { completedAt: true },
      orderBy: { completedAt: 'desc' },
    });

    if (completedDrills.length === 0) return 0;

    const uniqueDates = new Set(
      completedDrills
        .filter((d) => d.completedAt !== null)
        .map((d) => {
          const date = new Date(d.completedAt!);
          date.setHours(0, 0, 0, 0);
          return date.getTime();
        }),
    );

    let streak = 0;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);

    const startFrom = uniqueDates.has(currentDate.getTime())
      ? currentDate
      : uniqueDates.has(yesterday.getTime())
        ? yesterday
        : null;

    if (!startFrom) return 0;

    const checkDate = new Date(startFrom);
    while (uniqueDates.has(checkDate.getTime())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  }

  async getProgressOverview(userId: string) {
    await this.validateUser(userId);

    const [totalDrills, completedDrills, dayStreak, badgesEarned, totalCoins] =
      await Promise.all([
        this.prisma.userDrillProgress.count({ where: { userId } }),
        this.prisma.userDrillProgress.count({ where: { userId, isCompleted: true } }),
        this.calculateDayStreak(userId),
        this.prisma.userBadge.count({ where: { userId } }),
        this.prisma.userDrillProgress.aggregate({
          where: { userId, isCompleted: true },
          _sum: { earnedCoins: true },
        }),
      ]);

    return {
      drillsDone: completedDrills,
      dayStreak,
      badgesEarned,
      totalCoins: totalCoins._sum.earnedCoins ?? 0,
      completionRate:
        totalDrills > 0 ? Math.round((completedDrills / totalDrills) * 100) : 0,
    };
  }

 
  async getSkillLevels(userId: string) {
  await this.validateUser(userId);

  const levelProgress = await this.prisma.userLevelProgress.findMany({
    where: { userId, isUnlocked: true },
    include: {
      level: {
        select: {
          id: true,
          levelNumber: true,
          training: {
            select: { id: true, name: true, image: true },
          },
          drills: {
            select: { id: true },
          },
        },
      },
    },
    orderBy: { level: { levelNumber: 'asc' } },
  });

  const trainingMap = new Map<string, any>();

  for (const lp of levelProgress) {
    const tid = lp.level.training.id;
    const existing = trainingMap.get(tid);

    if (!existing || lp.level.levelNumber > existing.currentLevel) {
      trainingMap.set(tid, {
        trainingId: tid,
        name: lp.level.training.name,
        image: lp.level.training.image,
        currentLevel: lp.level.levelNumber,
        isCompleted: lp.isCompleted,
        totalDrillsInLevel: lp.level.drills.length,
      });
    }
  }

  const result = await Promise.all(
    Array.from(trainingMap.values()).map(async (training) => {
      
      const totalLevels = await this.prisma.level.count({
        where: { trainingId: training.trainingId },
      });

      const completedLevels = await this.prisma.userLevelProgress.count({
        where: {
          userId,
          isCompleted: true,
          level: { trainingId: training.trainingId },
        },
      });

      const totalDrills = await this.prisma.drill.count({
        where: { level: { trainingId: training.trainingId } },
      });

      const completedDrills = await this.prisma.userDrillProgress.count({
        where: {
          userId,
          isCompleted: true,
          drill: { level: { trainingId: training.trainingId } },
        },
      });

      const completionPercent =
        totalDrills > 0 ? Math.round((completedDrills / totalDrills) * 100) : 0;

      return {
        trainingId: training.trainingId,
        name: training.name,
        image: training.image,
        currentLevel: training.currentLevel,
        isCompleted: training.isCompleted,
        totalLevels,
        completedLevels,
        totalDrills,
        completedDrills,
        completionPercent,
      };
    }),
  );

  return result;
}


  async getBadgeCollection(userId: string) {
    await this.validateUser(userId);

    const badges = await this.prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: {
          select: {
            id: true,
            name: true,
            icon: true,
            description: true,
            category: true,
            rarity: true,
            points: true,
          },
        },
      },
      orderBy: { earnedAt: 'desc' },
    });

    return badges.map((ub) => ({
      badgeId: ub.badge.id,
      name: ub.badge.name,
      icon: ub.badge.icon,
      description: ub.badge.description,
      category: ub.badge.category,
      rarity: ub.badge.rarity,
      points: ub.badge.points,
      earnedAt: ub.earnedAt,
    }));
  }


async getActivityCalendar(userId: string, year: number, month: number, day?: number) {
  await this.validateUser(userId);

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  if (day) {
    const dayStart = new Date(year, month - 1, day, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59);

    const drills = await this.prisma.userDrillProgress.findMany({
      where: {
        userId,
        isCompleted: true,
        completedAt: { gte: dayStart, lte: dayEnd },
      },
      include: {
        drill: {
          select: {
            id: true,
            name: true,
            time: true,
            earnCoin: true,
            video: true,
          },
        },
      },
    });

    return {
      year,
      month,
      day,
      drills: drills.map((d) => ({
        drillId: d.drill.id,
        name: d.drill.name,
        time: d.drill.time,
        earnCoin: d.drill.earnCoin,
        video: d.drill.video,
        earnedCoins: d.earnedCoins,
        completedAt: d.completedAt,
      })),
    };
  }

  const completedDrills = await this.prisma.userDrillProgress.findMany({
    where: {
      userId,
      isCompleted: true,
      completedAt: { gte: startDate, lte: endDate },
    },
    select: { completedAt: true, earnedCoins: true },
  });

  const activityByDate: Record<number, { date: number; drillCount: number; coins: number }> = {};

  for (const drill of completedDrills) {
    if (!drill.completedAt) continue;
    const d = drill.completedAt.getDate();
    if (!activityByDate[d]) {
      activityByDate[d] = { date: d, drillCount: 0, coins: 0 };
    }
    activityByDate[d].drillCount += 1;
    activityByDate[d].coins += drill.earnedCoins;
  }

  return {
    year,
    month,
    activeDays: Object.values(activityByDate),
  };
}

  async getTopTableOfMonth(year?: number, month?: number) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const topUsers = await this.prisma.userDrillProgress.groupBy({
      by: ['userId'],
      where: {
        isCompleted: true,
        completedAt: { gte: startDate, lte: endDate },
      },
      _sum: { earnedCoins: true },
      _count: { id: true },
      orderBy: { _sum: { earnedCoins: 'desc' } },
      take: 11,
    });

    const userIds = topUsers.map((u) => u.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        fullName: true,
        profilePic: true,
        Profile: { select: { preferredShots: true } },
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return topUsers.map((entry, index) => {
      const user = userMap.get(entry.userId);
      return {
        rank: index + 1,
        userId: entry.userId,
        name: user?.fullName ?? 'Unknown',
        avatar: user?.profilePic ?? null,
        position: user?.Profile?.preferredShots ?? null,
        fieldPosition: this.assignFieldPosition(index), 
        totalCoins: entry._sum.earnedCoins ?? 0,
        drillsCompleted: entry._count.id,
      };
    });
  }

  private assignFieldPosition(rank: number): string {
    const positions = [
      'ST',       
      'LM', 'RM',  
      'CM', 'CM',  
      'LB', 'RB',  
      'CB', 'CB',  
      'GK',        
      'SUB',       
    ];
    return positions[rank] ?? 'SUB';
  }

  async create(userId: string, createProgressDto: CreateProgressDto) {
    const { drillId } = createProgressDto;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    const drill = await this.prisma.drill.findUnique({ where: { id: drillId } });
    if (!drill) throw new NotFoundException(`Drill with ID ${drillId} not found`);

    const existingProgress = await this.prisma.userDrillProgress.findUnique({
      where: { userId_drillId: { userId, drillId } },
    });
    if (existingProgress) {
      throw new ConflictException('Progress already exists for this user and drill');
    }

    return this.prisma.userDrillProgress.create({
      data: {
        userId,
        drillId,
        isCompleted: createProgressDto.isCompleted || false,
        completedAt: createProgressDto.isCompleted ? new Date() : null,
        earnedCoins: Number(drill.earnCoin) || 0,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        drill: {
          select: {
            id: true,
            name: true,
            earnCoin: true,
            level: { select: { id: true, levelNumber: true } },
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.userDrillProgress.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        drill: { select: { id: true, name: true, earnCoin: true, levelId: true } },
      },
    });
  }

  async findOne(id: string) {
    const progress = await this.prisma.userDrillProgress.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        drill: { select: { id: true, name: true, earnCoin: true, levelId: true } },
      },
    });
    if (!progress) throw new NotFoundException(`Progress with ID ${id} not found`);
    return progress;
  }

  async findByUser(userId: string) {
    await this.validateUser(userId);
    return this.prisma.userDrillProgress.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        drill: { select: { id: true, name: true, earnCoin: true, levelId: true } },
      },
    });
  }

  async findByDrill(drillId: string) {
    await this.validateDrill(drillId);
    return this.prisma.userDrillProgress.findMany({
      where: { drillId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  async update(id: string, updateProgressDto: UpdateProgressDto) {
    const existingProgress = await this.prisma.userDrillProgress.findUnique({ where: { id } });
    if (!existingProgress) throw new NotFoundException(`Progress with ID ${id} not found`);

    const updateData: any = {};
    if (updateProgressDto.isCompleted !== undefined) {
      updateData.isCompleted = updateProgressDto.isCompleted;
      if (updateProgressDto.isCompleted && !existingProgress.completedAt) {
        updateData.completedAt = new Date();
      } else if (!updateProgressDto.isCompleted) {
        updateData.completedAt = null;
      }
    }

    return this.prisma.userDrillProgress.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        drill: { select: { id: true, name: true, earnCoin: true, levelId: true } },
      },
    });
  }

  async completeProgress(userId: string, drillId: string, earnedCoins?: number) {
    const existingProgress = await this.prisma.userDrillProgress.findUnique({
      where: { userId_drillId: { userId, drillId } },
    });

    if (existingProgress) {
      if (existingProgress.isCompleted) {
        throw new ConflictException('Drill already completed');
      }
      return this.prisma.userDrillProgress.update({
        where: { userId_drillId: { userId, drillId } },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          earnedCoins: earnedCoins ?? existingProgress.earnedCoins,
        },
        include: { drill: { select: { name: true, earnCoin: true } } },
      });
    }

    const drill = await this.validateDrill(drillId);
    return this.prisma.userDrillProgress.create({
      data: {
        userId,
        drillId,
        isCompleted: true,
        completedAt: new Date(),
        earnedCoins: earnedCoins ?? parseInt(drill.earnCoin || '0'),
      },
      include: { drill: { select: { name: true, earnCoin: true } } },
    });
  }

  async remove(id: string) {
    const existingProgress = await this.prisma.userDrillProgress.findUnique({ where: { id } });
    if (!existingProgress) throw new NotFoundException(`Progress with ID ${id} not found`);
    await this.prisma.userDrillProgress.delete({ where: { id } });
    return { message: 'Progress deleted successfully' };
  }
async getUserProgressStats(userId: string) {
  await this.validateUser(userId);

  const totalProgress = await this.prisma.userDrillProgress.count({
    where: { userId },
  });

  const completedProgress = await this.prisma.userDrillProgress.count({
    where: { userId, isCompleted: true },
  });

  const totalEarnedCoins = await this.prisma.userDrillProgress.aggregate({
    where: { userId, isCompleted: true },
    _sum: { earnedCoins: true },
  });

  const recentProgress = await this.prisma.userDrillProgress.findMany({
    where: { userId },
    take: 5,
    orderBy: { updatedAt: 'desc' },
    include: { drill: { select: { name: true } } },
  });

  return {
    totalDrills: totalProgress,
    completedDrills: completedProgress,
    pendingDrills: totalProgress - completedProgress,
    totalEarnedCoins: totalEarnedCoins._sum.earnedCoins ?? 0,
    completionRate: totalProgress > 0 ? (completedProgress / totalProgress) * 100 : 0,
    recentProgress,
  };
}


  async getMyProgress(userId: string) {
    await this.validateUser(userId);

    return this.prisma.userDrillProgress.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        drill: {
          select: {
            id: true,
            name: true,
            earnCoin: true,
            time: true,
            video: true,
            hashtags: true,
            levelId: true,
          },
        },
      },
    });
  }


  async getMonthlyChallenge(userId: string) {
  await this.validateUser(userId);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const completedDrills = await this.prisma.userDrillProgress.findMany({
    where: {
      userId,
      isCompleted: true,
      completedAt: { gte: startOfMonth, lte: endOfMonth },
    },
    include: {
      drill: { select: { time: true } },
    },
  });

  const totalMinutes = completedDrills.reduce((sum, p) => {
    const time = parseInt(p.drill.time) || 0;
    return sum + time;
  }, 0);

  const milestones = [20, 60, 180, 360];
  const reachedMilestones = milestones.filter((m) => totalMinutes >= m);

  return {
    totalMinutes,
    milestones: milestones.map((m) => ({
      minutes: m,
      isReached: totalMinutes >= m,
    })),
    currentMilestone: reachedMilestones.length > 0
      ? reachedMilestones[reachedMilestones.length - 1]
      : null,
    nextMilestone: milestones.find((m) => totalMinutes < m) ?? null,
  };
}
}