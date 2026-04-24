import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UtilsModule } from 'src/utils/utils.module';
import { PrismaModule } from 'src/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

@Module({
   imports: [UtilsModule, PrismaModule,JwtModule.register({

  secret: process.env.JWT_SECRET ,
  signOptions: { expiresIn: '7d' },

   })], 
  controllers: [AuthController],
  providers: [AuthService,JwtStrategy],
})
export class AuthModule {}
