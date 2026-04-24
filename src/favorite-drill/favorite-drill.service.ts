import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class FavoriteDrillService {
  constructor(private prisma: PrismaService) {}

  async createCollection(userId: string, name: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User not found`);

    return await this.prisma.drillCollection.create({
      data: { userId, name },
    });
  }

  async getUserCollections(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User not found`);

    return await this.prisma.drillCollection.findMany({
      where: { userId },
      include: {
        _count: { select: { favoriteDrills: true } },
        favoriteDrills: {
          include: {
            drill: {
              include: {
                level: {
                  select: { id: true, levelNumber: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

D
  async getCollection(collectionId: string, userId: string) {
    const collection = await this.prisma.drillCollection.findUnique({
      where: { id: collectionId },
      include: {
        _count: { select: { favoriteDrills: true } },
        favoriteDrills: {
          include: {
            drill: {
              include: {
                level: {
                  select: { id: true, levelNumber: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!collection) throw new NotFoundException('Collection not found');
    if (collection.userId !== userId) throw new NotFoundException('Collection not found');

    return collection;
  }


  async removeCollection(collectionId: string, userId: string) {
    const collection = await this.prisma.drillCollection.findUnique({
      where: { id: collectionId },
    });
    console.log(collection)

    if (!collection) throw new NotFoundException('Collection not found');
    // if (collection.userId !== userId) throw new NotFoundException('Collection not found');

    await this.prisma.drillCollection.delete({ where: { id: collectionId } });
    return { message: 'Collection deleted successfully' };
  }

  // =============================================
  // FAVORITE DRILL — Add & Remove from Collection
  // =============================================


  async addDrillToCollection(userId: string, collectionId: string, drillId: string) {

    const collection = await this.prisma.drillCollection.findUnique({
      where: { id: collectionId },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    if (collection.userId !== userId) throw new NotFoundException('Collection not found');
    const drill = await this.prisma.drill.findUnique({ where: { id: drillId } });
    if (!drill) throw new NotFoundException('Drill not found');

    const existing = await this.prisma.favoriteDrill.findUnique({
      where: {
        collectionId_drillId: { collectionId, drillId },
      },
    });
    if (existing) throw new ConflictException('Drill is already in this collection');

    return await this.prisma.favoriteDrill.create({
      data: { collectionId, drillId },
      include: {
        drill: {
          include: {
            level: { select: { id: true, levelNumber: true } },
          },
        },
      },
    });
  }

  // Remove a drill from a collection
  async removeDrillFromCollection(userId: string, collectionId: string, drillId: string) {
    // Check collection belongs to user
    const collection = await this.prisma.drillCollection.findUnique({
      where: { id: collectionId },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    if (collection.userId !== userId) throw new NotFoundException('Collection not found');

    const existing = await this.prisma.favoriteDrill.findUnique({
      where: {
        collectionId_drillId: { collectionId, drillId },
      },
    });
    if (!existing) throw new NotFoundException('Drill is not in this collection');

    await this.prisma.favoriteDrill.delete({
      where: {
        collectionId_drillId: { collectionId, drillId },
      },
    });

    return { message: 'Drill removed from collection successfully' };
  }

  // Check if a drill is in any of user's collections
  async checkIfFavorite(userId: string, drillId: string) {
    const collections = await this.prisma.drillCollection.findMany({
      where: { userId },
      select: { id: true },
    });

    const collectionIds = collections.map((c) => c.id);

    const favorite = await this.prisma.favoriteDrill.findFirst({
      where: {
        drillId,
        collectionId: { in: collectionIds },
      },
      include: {
        collection: { select: { id: true, name: true } },
      },
    });

    return {
      isFavorite: !!favorite,
      collection: favorite?.collection || null,
    };
  }

  // Get user's favorite stats
  async getUserFavoriteStats(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const totalCollections = await this.prisma.drillCollection.count({
      where: { userId },
    });

    const collections = await this.prisma.drillCollection.findMany({
      where: { userId },
      select: { id: true },
    });

    const totalFavorites = await this.prisma.favoriteDrill.count({
      where: { collectionId: { in: collections.map((c) => c.id) } },
    });

    const recentFavorites = await this.prisma.favoriteDrill.findMany({
      where: { collectionId: { in: collections.map((c) => c.id) } },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        drill: { select: { name: true } },
        collection: { select: { name: true } },
      },
    });

    return {
      totalCollections,
      totalFavorites,
      recentFavorites,
    };
  }
}