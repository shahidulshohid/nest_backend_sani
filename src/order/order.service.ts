import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
;
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from 'src/prisma.service';
import { OrderStatus, PaymentStatus } from 'generated/prisma/enums';
interface CreateOrderData {
  userId: string;
  shippingAddress: {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  state?: string;
  city: string;
  postalCode: string;
  area?: string;
  address: string;
  specialMessage?: string; // optional
};
  shippingCost: number;
  paymentMethod?: string;
  orderItems: {
    productId: string;
    quantity: number;
    price: number;
  }[];
}


@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async createOrder(userId: string, createOrderDto: CreateOrderData) {
    const { shippingAddress, shippingCost, paymentMethod, orderItems } = createOrderDto;  

    console.log(createOrderDto)
   
    if (!orderItems || orderItems.length === 0) {
      throw new BadRequestException('Order items are required!');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User not found with ID: ${userId}`);
    }


    let subtotal = 0;
    
    for (const item of orderItems) {
      if (item.quantity <= 0) {
        throw new BadRequestException('Quantity must be greater than 0!');
      }
      
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product not found: ${item.productId}`);
      }

      if (product.quantity < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product: ${product.name}`);
      }

      subtotal += item.price * item.quantity;
    }

    const totalAmount = subtotal + shippingCost;

    const result = await this.prisma.$transaction(async (tx) => {
 
      const shipping = await tx.shippingAddress.upsert({
        where: { userId },
        update: { ...shippingAddress },
        create: { userId, ...shippingAddress },
      });


      const order = await tx.order.create({
        data: {
          userId,
          shippingId: shipping.id,
          totalAmount,
          shippingCost,
          paymentMethod: paymentMethod || 'stripe',
          orderStatus: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          orderItems: {
            create: orderItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              totalPrice: item.price * item.quantity,
            }))
          },
        },
        include: { 
          orderItems: {
            include: {
              product: true
            }
          }, 
          shippingAddress: true,
          user: {
            select: {
              id: true,
            fullName:true,
              email: true,
              profilePic: true,
            }
          }
        },
      });

      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        });
      }

      return order;
    }, { timeout: 15000 });

    return result;
  }

  // async getAllOrders(query: Record<string, any> = {}) {
  //   const { page, limit, sortBy, sortOrder, ...filters } = query;
    
  //   let whereCondition: any = {};

  //   if (filters.startDate || filters.endDate) {
  //     whereCondition.createdAt = {
  //       ...(filters.startDate && { gte: new Date(filters.startDate) }),
  //       ...(filters.endDate && { lte: new Date(filters.endDate) })
  //     };
  //   }

  //   if (filters.orderStatus) {
  //     whereCondition.orderStatus = filters.orderStatus;
  //   }

  //   if (filters.paymentStatus) {
  //     whereCondition.paymentStatus = filters.paymentStatus;
  //   }

  //   const skip = page && limit ? (parseInt(page) - 1) * parseInt(limit) : 0;
  //   const take = limit ? parseInt(limit) : undefined;
  //   let orderBy: any = {};
  //   if (sortBy && sortOrder) {
  //     orderBy[sortBy] = sortOrder;
  //   } else {
  //     orderBy = { createdAt: 'desc' };
  //   }

  //   const orders = await this.prisma.order.findMany({
  //     where: whereCondition,
  //     skip,
  //     take,
  //     orderBy,
  //     include: {
  //       user: {
  //         select: {
  //           id: true,
  //         fullName:true,
  //           email: true,
  //           profilePic: true,
  //         }
  //       },
  //       orderItems: {
  //         include: {
  //           product: true
  //         }
  //       },
  //       shippingAddress: true
  //     },
  //   });

  //   const total = await this.prisma.order.count({
  //     where: whereCondition,
  //   });

  //   return {
  //     orders,
  //     pagination: {
  //       page: page ? parseInt(page) : 1,
  //       limit: take || 10,
  //       total,
  //       pages: take ? Math.ceil(total / take) : 1
  //     }
  //   };
  // }


  // 1. getAllOrders — stats সহ response return করে


  async getAllOrders(query: Record<string, any> = {}) {
  const { page, limit, sortBy, sortOrder, ...filters } = query;

  let whereCondition: any = {};

  if (filters.startDate || filters.endDate) {
    whereCondition.createdAt = {
      ...(filters.startDate && { gte: new Date(filters.startDate) }),
      ...(filters.endDate && { lte: new Date(filters.endDate) }),
    };
  }
  if (filters.orderStatus) whereCondition.orderStatus = filters.orderStatus;
  if (filters.paymentStatus) whereCondition.paymentStatus = filters.paymentStatus;

  const skip = page && limit ? (parseInt(page) - 1) * parseInt(limit) : 0;
  const take = limit ? parseInt(limit) : undefined;
  let orderBy: any = sortBy && sortOrder ? { [sortBy]: sortOrder } : { createdAt: 'desc' };
  const [orders, total, stats] = await Promise.all([
    this.prisma.order.findMany({
      where: whereCondition,
      skip,
      take,
      orderBy,
      include: {
        user: {
          select: { id: true, fullName: true, email: true, profilePic: true },
        },
        orderItems: { include: { product: true } },
        shippingAddress: true,
      },
    }),
    this.prisma.order.count({ where: whereCondition }),
    this.getOrderStats(),
  ]);

  return {
    stats,          
    orders,
    pagination: {
      page: page ? parseInt(page) : 1,
      limit: take || 10,
      total,
      pages: take ? Math.ceil(total / take) : 1,
    },
  };
}

async getOrderStats() {
  const [totalOrders, pendingOrders, completedOrders, totalRevenue] = await Promise.all([
    this.prisma.order.count(),
    this.prisma.order.count({
      where: { orderStatus: OrderStatus.PENDING },
    }),
    this.prisma.order.count({
      where: { orderStatus: OrderStatus.COMPLETED },
    }),
    this.prisma.order.aggregate({
      where: { paymentStatus: PaymentStatus.PAID },
      _sum: { totalAmount: true },
    }),
  ]);

  return {
    totalOrders,
    pendingOrders,
    completedOrders,
    totalRevenue: totalRevenue._sum.totalAmount || 0,
  };
}

  async getSingleOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
           fullName:true,
            email: true,
          }
        },
        orderItems: {
          include: {
            product: true
          }
        },
        shippingAddress: true
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found!');
    }

    return order;
  }

  async updateOrder(orderId: string, data: UpdateOrderDto) {
    const existingOrder = await this.prisma.order.findUnique({ 
      where: { id: orderId } 
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found!');
    }

    const updatedOrder = await this.prisma.order.update({ 
      where: { id: orderId }, 
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: { 
        orderItems: {
          include: {
            product: true
          }
        }, 
        shippingAddress: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      } 
    });

    return updatedOrder;
  }

  async updateOrderStatus(orderId: string, orderStatus: OrderStatus) {
    const existingOrder = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found!');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        orderItems: {
          include: {
            product: true
          }
        },
        shippingAddress: true
      }
    });

    return updatedOrder;
  }

  async updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus) {
    const existingOrder = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found!');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        orderItems: {
          include: {
            product: true
          }
        },
        shippingAddress: true
      }
    });

    return updatedOrder;
  }

  async deleteOrder(orderId: string) {
    const existingOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true }
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found!');
    }
    if (existingOrder.orderStatus !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be deleted!');
    }
    await this.prisma.$transaction(async (tx) => {
    
      for (const item of existingOrder.orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              increment: item.quantity
            }
          }
        });
      }
      await tx.orderItem.deleteMany({
        where: { orderId }
      });

      await tx.order.delete({
        where: { id: orderId }
      });
    });

    return { message: 'Order deleted successfully' };
  }

  async getOrdersByUser(userId: string, query: Record<string, any> = {}) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User not found with ID: ${userId}`);
    }

    const { page, limit, sortBy, sortOrder, ...filters } = query;
    
    let whereCondition: any = { userId };
    
    if (filters.startDate || filters.endDate) {
      whereCondition.createdAt = {
        ...(filters.startDate && { gte: new Date(filters.startDate) }),
        ...(filters.endDate && { lte: new Date(filters.endDate) })
      };
    }

    
    if (filters.orderStatus) {
      whereCondition.orderStatus = filters.orderStatus;
    }

    if (filters.paymentStatus) {
      whereCondition.paymentStatus = filters.paymentStatus;
    }

    const skip = page && limit ? (parseInt(page) - 1) * parseInt(limit) : 0;
    const take = limit ? parseInt(limit) : undefined;


    let orderBy: any = {};
    if (sortBy && sortOrder) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy = { createdAt: 'desc' };
    }

    const orders = await this.prisma.order.findMany({
      where: whereCondition,
      skip,
      take,
      orderBy,
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        shippingAddress: true
      },
    });

    const total = await this.prisma.order.count({
      where: whereCondition,
    });

    return {
      orders,
      pagination: {
        page: page ? parseInt(page) : 1,
        limit: take || 10,
        total,
        pages: take ? Math.ceil(total / take) : 1
      }
    };
  }

  async getUserOrderStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User not found with ID: ${userId}`);
    }

    const totalOrders = await this.prisma.order.count({
      where: { userId },
    });

    const completedOrders = await this.prisma.order.count({
      where: {
        userId,
        orderStatus: OrderStatus.COMPLETED,
      },
    });

    const totalSpent = await this.prisma.order.aggregate({
      where: {
        userId,
        orderStatus: OrderStatus.COMPLETED,
      },
      _sum: {
        totalAmount: true,
      },
    });

    const recentOrders = await this.prisma.order.findMany({
      where: { userId },
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        orderItems: {
          take: 1,
          include: {
            product: {
              select: {
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    return {
      totalOrders,
      completedOrders,
      pendingOrders: totalOrders - completedOrders,
      totalSpent: totalSpent._sum.totalAmount || 0,
      recentOrders,
    };
  }

  async createPaymentSession(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { 
        id: orderId,
        userId 
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
              },
            },
          },
        },
        shippingAddress: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.orderStatus !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be paid');
    }

  
    const paymentSession = {
      sessionId: `pay_${orderId}_${Date.now()}`,
      url: `https://payment.example.com/pay/${orderId}`,
      orderId: order.id,
      amount: order.totalAmount,
    };

    return paymentSession;
  }

  async cancelOrder(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.orderStatus !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }
    for (const item of order.orderItems) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          quantity: {
            increment: item.quantity,
          },
        },
      });
    }

    const cancelledOrder = await this.prisma.order.update({
      where: { id },
      data: {
        orderStatus: OrderStatus.CANCELED,
        updatedAt: new Date(),
      },
    });

    return cancelledOrder;
  }
}