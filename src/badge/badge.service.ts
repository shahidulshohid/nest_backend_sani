import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { UpdateBadgeDto } from './dto/update-badge.dto';
import QueryBuilder from 'src/common/QueryBuilder';

@Injectable()
export class BadgeService {
  constructor(private prisma: PrismaService) {}
  async create(createBadgeDto: CreateBadgeDto) {
    const existing = await this.prisma.badge.findUnique({
      where: { name: createBadgeDto.name },
    });
    if (existing) {
      throw new ConflictException('Badge with this name already exists');
    }

    return this.prisma.badge.create({
      data: {
        name:          createBadgeDto.name,
        icon:          createBadgeDto.icon,
        description:   createBadgeDto.description,
        category:      createBadgeDto.category,
        rarity:        createBadgeDto.rarity,
        points:        createBadgeDto.points,
        isActive:      createBadgeDto.isActive ?? true,
        criteriaType:  createBadgeDto.criteriaType,
        levelId:       createBadgeDto.levelId      ?? null,
        trainingId:    createBadgeDto.trainingId   ?? null,
        challengeId:   createBadgeDto.challengeId  ?? null,
      },
      include: {
        level:    { select: { id: true, levelNumber: true } },
        training: { select: { id: true, name: true } },
        challenge:{ select: { id: true, name: true } },
      },
    });
  }

 async findAll(query: Record<string, any>) {
  const queryBuilder = new QueryBuilder(this.prisma.badge, query)
    .search(['name', 'description'])
    .filter()
    .sort()
    .paginate()
    .include({
      level:     { select: { id: true, levelNumber: true } },
      training:  { select: { id: true, name: true } },
      challenge: { select: { id: true, name: true } },
    });

  const result = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  return { data: result, meta };
}
  async findOne(id: string) {
    const badge = await this.prisma.badge.findUnique({
      where: { id },
      include: {
        level:    { select: { id: true, levelNumber: true } },
        training: { select: { id: true, name: true } },
        challenge:{ select: { id: true, name: true } },
      },
    });
    if (!badge) throw new NotFoundException('Badge not found');
    return badge;
  }

  async update(id: string, updateBadgeDto: UpdateBadgeDto) {
    const existing = await this.prisma.badge.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Badge not found');

    return this.prisma.badge.update({
      where: { id },
      data: {
        name:         updateBadgeDto.name,
        icon:         updateBadgeDto.icon,
        description:  updateBadgeDto.description,
        category:     updateBadgeDto.category,
        rarity:       updateBadgeDto.rarity,
        points:       updateBadgeDto.points,
        isActive:     updateBadgeDto.isActive,
        criteriaType: updateBadgeDto.criteriaType,
        levelId:      updateBadgeDto.levelId      ?? null,
        trainingId:   updateBadgeDto.trainingId   ?? null,
        challengeId:  updateBadgeDto.challengeId  ?? null,
      },
      include: {
        level:    { select: { id: true, levelNumber: true } },
        training: { select: { id: true, name: true } },
        challenge:{ select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.badge.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Badge not found');

    await this.prisma.badge.delete({ where: { id } });
    return { message: 'Badge deleted successfully' };
  }
}