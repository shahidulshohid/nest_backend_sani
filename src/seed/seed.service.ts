import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma.service';
import * as bcrypt from 'bcrypt';
@Injectable()
export class SeedService {

constructor (private prisma:PrismaService, private readonly configService:ConfigService) {}

async seedSuperAdmin(){
  const email = this.configService.get<string>("SUPER_ADMIN_EMAIL") as string
  const password = this.configService.get<string>("SUPER_ADMIN_PASSWORD")

  const existingUser = await this.prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // console.log("⚠️  Super Admin already exists!");
    return;
  }

  const hashedPassword = await bcrypt.hash(password as string,12)

  await this.prisma.user.create({
    data: {
      fullName: "Super Admin",
      email,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      referralCode:"Raf-111",
      isVerified: true,
    },
  });

  console.log("Super Admin seeded successfully.");
};
    
}
