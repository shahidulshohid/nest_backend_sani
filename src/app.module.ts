import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UtilsService } from './utils/utils.service';
import { UtilsModule } from './utils/utils.module';
import { UsersModule } from './users/users.module';
import { StripeModule } from './common/stripe/stripe.module';
import { WebhookModule } from './common/webhook/webhook.module';
import { PlanModule } from './plan/plan.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { SeedService } from './seed/seed.service';
import { SeedModule } from './seed/seed.module';
import { S3Service } from './common/s3/s3.service';
import { S3Module } from './common/s3/s3.module';
import { ChallengeModule } from './challenge/challenge.module';
import { TrainingModule } from './training/training.module';
import { DrillModule } from './drill/drill.module';
import { ProductModule } from './product/product.module';
import { ProgressModule } from './progress/progress.module';
import { SkillCardModule } from './skill-card/skill-card.module';
import { CouponModule } from './coupon/coupon.module';
import { FavoriteDrillModule } from './favorite-drill/favorite-drill.module';
import { OrderModule } from './order/order.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { BadgeModule } from './badge/badge.module';
import { LevelModule } from './level/level.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { GiftcodeModule } from './giftcode/giftcode.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
          },
          //  password: process.env.REDIS_PASSWORD,
          ttl: 300,
        }),
      }),
    }),
    AuthModule,
    UtilsModule,
    UsersModule,
    StripeModule,
    WebhookModule,
    PlanModule,
    SubscriptionModule,
    SeedModule,
    S3Module,
    ChallengeModule,
    TrainingModule,
    DrillModule,
    ProductModule,
    ProgressModule,
    SkillCardModule,
    CouponModule,
    FavoriteDrillModule,
    OrderModule,
    DashboardModule,
    BadgeModule,
    LevelModule,
    GiftcodeModule,
  ],
  controllers: [AppController],
  providers: [AppService, UtilsService, SeedService, S3Service],
})
export class AppModule {}