import { Injectable } from '@nestjs/common';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class DashboardService {


  constructor (private readonly prisma:PrismaService){
    
  }
 async getDashboardOverview() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

    // Total Users
    const totalUsers = await this.prisma.user.count();
    const lastMonthUsers = await this.prisma.user.count({
      where: { createdAt: { lt: lastMonth } },
    });
    const userGrowth = lastMonthUsers > 0
      ? ((totalUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1)
      : 0;

    // Active Training Users
    const activeUsers = await this.prisma.user.count({
      where: {
        lastActiveAt: { gte: lastMonth },
        userDrillProgress: {
          some: {
            completedAt: { gte: lastMonth },
          },
        },
      },
    });

    // Training Completion
    const totalProgress = await this.prisma.userDrillProgress.count();
    const completedProgress = await this.prisma.userDrillProgress.count({
      where: { isCompleted: true },
    });
    const currentMonthCompleted = await this.prisma.userDrillProgress.count({
      where: {
        isCompleted: true,
        completedAt: { gte: lastMonth },
      },
    });
    const previousMonthCompleted = await this.prisma.userDrillProgress.count({
      where: {
        isCompleted: true,
        completedAt: {
          gte: twoMonthsAgo,
          lt: lastMonth,
        },
      },
    });
    const completionRate = totalProgress > 0
      ? ((completedProgress / totalProgress) * 100).toFixed(0)
      : 0;
    const completionGrowth = previousMonthCompleted > 0
      ? ((currentMonthCompleted - previousMonthCompleted) / previousMonthCompleted * 100).toFixed(1)
      : 0;

    // Earning Revenue
    const currentMonthOrders = await this.prisma.order.aggregate({
      where: {
        paymentStatus: 'COMPLETED',
        createdAt: { gte: lastMonth },
      },
      _sum: { totalAmount: true },
    });
    const previousMonthOrders = await this.prisma.order.aggregate({
      where: {
        paymentStatus: 'COMPLETED',
        createdAt: {
          gte: twoMonthsAgo,
          lt: lastMonth,
        },
      },
      _sum: { totalAmount: true },
    });
    const currentMonthSubs = await this.prisma.subscription.aggregate({
      where: {
        paymentStatus: 'COMPLETED',
        createdAt: { gte: lastMonth },
      },
      _sum: { amount: true },
    });
    const totalRevenue = (currentMonthOrders._sum.totalAmount || 0) + (currentMonthSubs._sum.amount || 0);
    const prevTotal = previousMonthOrders._sum.totalAmount || 0;
    const revenueGrowth = prevTotal > 0 ? ((totalRevenue - prevTotal) / prevTotal * 100).toFixed(1) : 0;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const userGrowthData: { day: string; users: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const count = await this.prisma.user.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      userGrowthData.push({
        day: days[startOfDay.getDay()],
        users: count,
      });
    }

    // Subscription Percentage
    const plans = await this.prisma.plan.findMany({
      where: { active: true },
      include: {
        Subscription: {
          where: { paymentStatus: 'COMPLETED' },
        },
      },
    });
    const totalSubscriptions = plans.reduce((acc, plan) => acc + plan.Subscription.length, 0);
    const subscriptionData = plans.map((plan) => ({
      planName: plan.planName,
      count: plan.Subscription.length,
      percentage: totalSubscriptions > 0
        ? parseInt(((plan.Subscription.length / totalSubscriptions) * 100).toFixed(0))
        : 0,
    }));

    // Ball Control Data (Last 30 days)
    const ballControlData: { dateRange: string; value: number }[] = [];
    for (let i = 0; i < 30; i += 2) {
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - (30 - i));
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 2);

      const completedDrills = await this.prisma.userDrillProgress.count({
        where: {
          isCompleted: true,
          completedAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      });

      ballControlData.push({
        dateRange: `Jan. ${i + 1}-${i + 2}`,
        value: completedDrills,
      });
    }

    return {
      stats: {
        totalUsers: {
          count: totalUsers,
          growth: `+${userGrowth}%`,
          message: 'from last month',
        },
        activeTrainingUsers: {
          count: activeUsers,
          message: 'from last month',
        },
        trainingCompletion: {
          percentage: `${completionRate}%`,
          growth: `+${completionGrowth}%`,
          message: 'from last month',
        },
        earningRevenue: {
          amount: `$${(totalRevenue / 1000).toFixed(1)}k`,
          growth: `+${revenueGrowth}%`,
          message: 'from last month',
        },
      },
      charts: {
        userGrowth: userGrowthData,
        subscriptionPercentage: subscriptionData,
        ballControl: ballControlData,
      },
    };
  }

   async getEarningOverview() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

    // Earning Revenue (Total from orders and subscriptions)
    const currentMonthOrders = await this.prisma.order.aggregate({
      where: {
        paymentStatus: 'COMPLETED',
        createdAt: { gte: lastMonth },
      },
      _sum: { totalAmount: true },
    });

    const previousMonthOrders = await this.prisma.order.aggregate({
      where: {
        paymentStatus: 'COMPLETED',
        createdAt: {
          gte: twoMonthsAgo,
          lt: lastMonth,
        },
      },
      _sum: { totalAmount: true },
    });

    const currentMonthSubs = await this.prisma.subscription.aggregate({
      where: {
        paymentStatus: 'COMPLETED',
        createdAt: { gte: lastMonth },
      },
      _sum: { amount: true },
    });

    const previousMonthSubs = await this.prisma.subscription.aggregate({
      where: {
        paymentStatus: 'COMPLETED',
        createdAt: {
          gte: twoMonthsAgo,
          lt: lastMonth,
        },
      },
      _sum: { amount: true },
    });

    const currentEarningRevenue = (currentMonthOrders._sum.totalAmount || 0) + (currentMonthSubs._sum.amount || 0);
    const previousEarningRevenue = (previousMonthOrders._sum.totalAmount || 0) + (previousMonthSubs._sum.amount || 0);
    const earningGrowth = previousEarningRevenue > 0 
      ? ((currentEarningRevenue - previousEarningRevenue) / previousEarningRevenue * 100).toFixed(0)
      : 0;

    // Subscription Revenue
    const currentSubRevenue = currentMonthSubs._sum.amount || 0;
    const previousSubRevenue = previousMonthSubs._sum.amount || 0;
    const subGrowth = previousSubRevenue > 0
      ? ((currentSubRevenue - previousSubRevenue) / previousSubRevenue * 100).toFixed(0)
      : 0;

    // Shop Revenue (from orders)
    const currentShopRevenue = currentMonthOrders._sum.totalAmount || 0;
    const previousShopRevenue = previousMonthOrders._sum.totalAmount || 0;
    const shopGrowth = previousShopRevenue > 0
      ? ((currentShopRevenue - previousShopRevenue) / previousShopRevenue * 100).toFixed(0)
      : 0;

    // Revenue Breakdown (Last 7 days)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const revenueBreakdown: { day: string; shop: number; subscription: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const dailyOrders = await this.prisma.order.aggregate({
        where: {
          paymentStatus: 'COMPLETED',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _sum: { totalAmount: true },
      });

      const dailySubs = await this.prisma.subscription.aggregate({
        where: {
          paymentStatus: 'COMPLETED',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _sum: { amount: true },
      });

      revenueBreakdown.push({
        day: days[startOfDay.getDay()],
        shop: dailyOrders._sum.totalAmount || 0,
        subscription: dailySubs._sum.amount || 0,
      });
    }

    // Daily Earning (Last 7 days)
    const dailyEarning: { day: string; earning: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const dailyOrders = await this.prisma.order.aggregate({
        where: {
          paymentStatus: 'COMPLETED',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _sum: { totalAmount: true },
      });

      const dailySubs = await this.prisma.subscription.aggregate({
        where: {
          paymentStatus: 'COMPLETED',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _sum: { amount: true },
      });

      const totalDaily = (dailyOrders._sum.totalAmount || 0) + (dailySubs._sum.amount || 0);

      dailyEarning.push({
        day: days[startOfDay.getDay()],
        earning: totalDaily,
      });
    }

    // Recent Transactions
    const recentTransactions = await this.getRecentTransactions(1, 10);

    return {
      stats: {
        earningRevenue: {
          amount: `$${(currentEarningRevenue / 1000).toFixed(1)}k`,
          growth: `+${earningGrowth}%`,
          message: 'from last month',
        },
        subscriptionRevenue: {
          amount: `$${(currentSubRevenue / 1000).toFixed(1)}k`,
          growth: `${Number(subGrowth) >= 0 ? '+' : ''}${subGrowth}%`,
          message: 'from last month',
        },
        shopRevenue: {
          amount: `$${(currentShopRevenue / 1000).toFixed(1)}k`,
          growth: `+${shopGrowth}%`,
          message: 'from last month',
        },
      },
      charts: {
        revenueBreakdown,
        dailyEarning,
      },
      recentTransactions,
    };
  }

  async getRecentTransactions(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Get both orders and subscriptions
    const orders = await this.prisma.order.findMany({
      where: {
        paymentStatus: 'COMPLETED',
      },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        paymentStatus: 'COMPLETED',
      },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Combine and format transactions
    const transactions = [
      ...orders.map((order) => ({
        id: order.id,
        type: 'Shop Purchase',
        user: order.user.fullName,
        amount: `$${order.totalAmount.toFixed(2)}`,
        date: order.createdAt.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        createdAt: order.createdAt,
      })),
      ...subscriptions.map((sub) => ({
        id: sub.id,
        type: 'Subscription',
        user: sub.user.fullName,
        amount: `$${sub.amount.toFixed(2)}`,
        date: sub.createdAt.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        createdAt: sub.createdAt,
      })),
    ];

    // Sort by date and paginate
    transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const total = transactions.length;
    const paginatedTransactions = transactions.slice(skip, skip + limit);

    // Remove createdAt from response
    const formattedTransactions = paginatedTransactions.map(({ createdAt, ...rest }) => rest);

    return {
      data: formattedTransactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }



}
