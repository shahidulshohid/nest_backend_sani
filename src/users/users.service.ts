import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma.service';
import { S3Service } from 'src/common/s3/s3.service';
import QueryBuilder from 'src/common/QueryBuilder';
import { UserRole } from 'generated/prisma/enums';

@Injectable()
export class UsersService {

  constructor(private readonly prisma:PrismaService,private s3Service:S3Service){

  }

  // create(createUserDto: CreateUserDto) {
  //   return 'This action adds a new user';
  // }

async findAll(query: Record<string, any>) {

  const include = {
    Profile: true,
    Subscription: {
      include: {
        plan: true,
      },
    },
  };

  const queryBuilder = new QueryBuilder(this.prisma.user, query)
    .search(['email', 'fullName'])
    .filter()
    .sort()
    .paginate()
    .include(include);

  queryBuilder.rawFilter({
    role: UserRole.USER,
  });

  const result = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  const data = result.map((user: any) => {
    const {
      password,
      ...rest
    } = user;
    return rest;
  });

  return { data, meta };
}

 async  findOne(id: string) {

    const result =await this.prisma.user.findFirst({where:{id},select:{fullName:true,email:true,id:true,isSubscribed:true,profilePic:true,isVerified:true,role:true,lastActiveAt:true,Profile:true}})
    
    if(!result) {
      throw new NotFoundException("user not found !")
    }
    
    return result
  }
async update(
  id: string,
  updateUserDto: UpdateUserDto,
  file?: Express.Multer.File,
) {
  const user = await this.prisma.user.findUnique({
    where: { id },
    include: { Profile: true },
  });

  if (!user) throw new NotFoundException('user not found!');

  let profileImage = user.profilePic;
  if (file) {
    if (user.profilePic) await this.s3Service.deleteFile(user.profilePic);
    profileImage = await this.s3Service.uploadFile(file, 'file');
  }
  console.log(profileImage)

  const userData: any = {};
  if (updateUserDto.data.fullName !== undefined) userData.fullName = updateUserDto.data.fullName;
  if (profileImage !== undefined) userData.profilePic = profileImage;

  const profileData: any = {};
  if (updateUserDto.data.ageRange !== undefined) profileData.ageRange = updateUserDto.data.ageRange;
  if (updateUserDto.data.practiceLevel !== undefined) profileData.practiceLevel = updateUserDto.data.practiceLevel;
  if (updateUserDto.data.practiceDuration !== undefined) profileData.practiceDuration = updateUserDto.data.practiceDuration;
  if (updateUserDto.data.preferredShots !== undefined) profileData.preferredShots = updateUserDto.data.preferredShots;
  if (updateUserDto.data.skillConfidence !== undefined) profileData.skillConfidence = updateUserDto.data.skillConfidence;

  const updatedUser = await this.prisma.user.update({
    where: { id },
    data: {
      ...userData,
      Profile: {
        upsert: {
          where: { userId: id },
          create: { ...profileData},
          update: { ...profileData },
        },
      },
    },
    select:{
      fullName:true,
      id:true,
      email:true,
      profilePic:true,
      Profile:true,
      createdAt:true,
      updatedAt:true,
    }
  });

  return updatedUser;
}


  async remove(id: string) {


   
   const isExist = await this.prisma.user.findFirst({where:{id}})

     
    if(!isExist) {
      throw new NotFoundException("user not found !")
    }
       
  const result=await this.prisma.user.delete({where:{id}})
      

  if(!result){
    throw new BadRequestException("file to delete user ")
  }
    return result
  }

async findOneForUser(id: string) {
  const user = await this.prisma.user.findFirst({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      profilePic: true,
      isSubscribed: true,
      isVerified: true,
      role: true,
      lastActiveAt: true,
      planExpiration: true,
      coinBalance: true,
      walletBalance: true,
      createdAt: true,
      Profile: true,
      playerSkillCard: true,
      Subscription: {
        include: { plan: true },
      },
    },
  });

  if (!user) throw new NotFoundException('User not found!');


  const drillProgress = await this.prisma.userDrillProgress.findMany({
    where: { userId: id },
    select: {
      isCompleted: true,
      earnedCoins: true,
      drill: {
        select: { time: true },
      },
    },
  });

  const completedDrills = drillProgress.filter((d) => d.isCompleted);
  const totalDrills    = completedDrills.length;
  const totalCoins     = completedDrills.reduce((sum, d) => sum + d.earnedCoins, 0);

  const totalMinutes = completedDrills.reduce((sum, d) => {
    const mins = parseInt(d.drill.time) || 0;
    return sum + mins;
  }, 0);
  const hours   = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const levelProgress = await this.prisma.userLevelProgress.findMany({
    where: { userId: id, isCompleted: true },
    select: { trainingId: true },
  });
  const totalSessions = levelProgress.length;


  const trainingProgress = await this.prisma.userTrainingProgress.findMany({
    where: { userId: id },
    select: {
      isCompleted: true,
      training: {
        select: {
          id: true,
          name: true,
          levels: {
            select: { id: true },
          },
        },
      },
    },
  });


  const trainingIds = trainingProgress.map((t) => t.training.id);
  const completedLevels = await this.prisma.userLevelProgress.findMany({
    where: {
      userId: id,
      trainingId: { in: trainingIds },
      isCompleted: true,
    },
    select: { trainingId: true },
  });

  const completedByTraining = completedLevels.reduce<Record<string, number>>(
    (acc, l) => {
      acc[l.trainingId] = (acc[l.trainingId] || 0) + 1;
      return acc;
    },
    {},
  );

  const skillProgress = trainingProgress.map((t) => {
    const totalLevels     = t.training.levels.length || 1;
    const completedCount  = completedByTraining[t.training.id] || 0;
    const progressPercent = Math.round((completedCount / totalLevels) * 100);
    return {
      trainingId:      t.training.id,
      trainingName:    t.training.name,
      totalLevels,
      completedLevels: completedCount,
      progressPercent,
      isCompleted:     t.isCompleted,
    };
  });


  const challenges = await this.prisma.userChallenge.findMany({
    where: { userId: id },
    select: {
      status: true,
      joinedAt: true,
      completedAt: true,
      challenge: {
        select: {
          name: true,
          earnCoin: true,
          startDate: true,
          endDate: true,
        },
      },
    },
  });

  const { password, ...safeUser } = user as any;

  return {
    ...safeUser,
    trainingHistory: {
      totalDrills,
      totalSessions,
      totalCoins,
      trainingTime: `${hours}hr ${minutes}min`,
    },
    skillProgress,
    challenges,
  };
}
}
