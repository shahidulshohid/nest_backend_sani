import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { CreateSkillCardDto } from './dto/create-skill-card.dto';
import { UpdateSkillCardDto } from './dto/update-skill-card.dto';
import { PrismaService } from 'src/prisma.service';
import { S3Service } from 'src/common/s3/s3.service';

@Injectable()
export class SkillCardService {
  constructor(private prisma: PrismaService , private s3Service: S3Service,) {}

  async create(userId: string, createSkillCardDto: CreateSkillCardDto,file:Express.Multer.File) {


     const image = await this.s3Service.uploadFile(file, 'file');

      if (!image) {
      throw new BadRequestException('Image host problem in s3 bucket!');
    }


    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const existingSkillCard = await this.prisma.playerSkillCard.findUnique({
      where: { userId },
    });

    if (existingSkillCard) {
      throw new NotFoundException('User already has a skill card');
    }

    const skillCard = await this.prisma.playerSkillCard.create({
      data: {
        userId,
        fullName: createSkillCardDto.data.fullName,
        country: createSkillCardDto.data.country,
        playerNumber: createSkillCardDto.data.playerNumber,
        playerPosition: createSkillCardDto.data.playerPosition,
        favoriteClub: createSkillCardDto.data.favoriteClub,
        image
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profilePic: true,
          },
        },
      },
    });

    return skillCard;
  }

  async findAll() {
    const skillCards = await this.prisma.playerSkillCard.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profilePic: true,
          },
        },
      },
    });

    return skillCards;
  }

  async findOne(id: string) {
    const skillCard = await this.prisma.playerSkillCard.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profilePic: true,
          },
        },
      },
    });

    if (!skillCard) {
      throw new NotFoundException(`Skill card with ID ${id} not found`);
    }

    return skillCard;
  }

  async findByUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const skillCard = await this.prisma.playerSkillCard.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profilePic: true,
          },
        },
      },
    });

    if (!skillCard) {
      throw new NotFoundException(`Skill card not found for user ${userId}`);
    }

    return skillCard;
  }

 async update(id: string, updateSkillCardDto: UpdateSkillCardDto, file: Express.Multer.File) {

 
  const existingSkillCard = await this.prisma.playerSkillCard.findUnique({
    where: { id },
  });

  if (!existingSkillCard) {
    throw new NotFoundException(`Skill card with ID ${id} not found`);
  }


  const image = file
    ? await this.s3Service.uploadFile(file, 'file')
    : existingSkillCard.image;

  const skillCard = await this.prisma.playerSkillCard.update({
    where: { id },
    data: {
      image, 
      fullName: updateSkillCardDto?.data?.fullName,
      country: updateSkillCardDto.data?.country,
      playerNumber: updateSkillCardDto.data?.playerNumber,
      playerPosition: updateSkillCardDto.data?.playerPosition,
      favoriteClub: updateSkillCardDto.data?.favoriteClub,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
        },
      },
    },
  });

  return skillCard;
}
  async updateMySkillCard(userId: string, updateSkillCardDto: UpdateSkillCardDto) {
    const existingSkillCard = await this.prisma.playerSkillCard.findUnique({
      where: { userId },
    });

    if (!existingSkillCard) {
      throw new NotFoundException(`Skill card not found for user ${userId}`);
    }

    const skillCard = await this.prisma.playerSkillCard.update({
      where: { userId },
      data: {
        fullName: updateSkillCardDto.data?.fullName,
        country: updateSkillCardDto.data?.country,
        playerNumber: updateSkillCardDto.data?.playerNumber,
        playerPosition: updateSkillCardDto.data?.playerPosition,
        favoriteClub: updateSkillCardDto.data?.favoriteClub,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profilePic: true,
          },
        },
      },
    });

    return skillCard;
  }

  async remove(id: string) {
    const existingSkillCard = await this.prisma.playerSkillCard.findUnique({
      where: { id },
    });

    if (!existingSkillCard) {
      throw new NotFoundException(`Skill card with ID ${id} not found`);
    }

    await this.prisma.playerSkillCard.delete({
      where: { id },
    });

    return { message: 'Skill card deleted successfully' };
  }

  async removeMySkillCard(userId: string) {
    const existingSkillCard = await this.prisma.playerSkillCard.findUnique({
      where: { userId },
    });

    if (!existingSkillCard) {
      throw new NotFoundException(`Skill card not found for user ${userId}`);
    }

    await this.prisma.playerSkillCard.delete({
      where: { userId },
    });

    return { message: 'Skill card deleted successfully' };
  }

  async getMyCard(userId: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException(`User with ID ${userId} not found`);
  }

  const myCard = await this.prisma.playerSkillCard.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
        },
      },
    },
  });

  if (!myCard) {
    throw new NotFoundException(`Skill card not found for user ${userId}`);
  }

  return myCard;
}
}