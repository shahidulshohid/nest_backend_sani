import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Req, Query, UseGuards, Headers, RawBodyRequest } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus, PaymentStatus } from 'generated/prisma/enums';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { StripeService } from 'src/common/stripe/stripe.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService ,private stripe:StripeService) {}


 @Post('webhook/stripe')
  async webHook(@Req() request: any) {  
    const signature = request.headers['stripe-signature'];
    
    if (!signature) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'Missing stripe-signature header',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const payload = request.rawBody;
      await this.stripe.handleStripeWebhook(payload, signature);
      
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Webhook processed successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Webhook processing failed',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrder(@Req() req: any, @Body() createOrderDto: any) {
    try {
      const userId = req.user?.userId;
      const result = await this.orderService.createOrder(userId, createOrderDto);
        const session = await this.stripe.createStripeSession(result);

      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: 'Order created successfully',
        data:{
        result,
        paymentUrl: session.url,
        sessionId: session.id
        }
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to create order',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async getAllOrders(@Query() query: Record<string, any>) {
    try {
      const result = await this.orderService.getAllOrders(query);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Orders retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: 'Failed to retrieve orders',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


 @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  async getMyOrders(@Req() req: any, @Query() query: Record<string, any>) {
    try {
      const userId = req.user?.userId;
      const result = await this.orderService.getOrdersByUser(userId, query);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'My orders retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: 'Failed to retrieve my orders',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('my-stats')
  async getMyStats(@Req() req: any) {
    try {
      const userId = req.user?.id;
      const result = await this.orderService.getUserOrderStats(userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Order statistics retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: 'Failed to retrieve order statistics',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getSingleOrder(@Param('id') id: string) {
    try {
      const result = await this.orderService.getSingleOrder(id);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Order retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: error.message || 'Order not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Post(':id/payment-session')
  async createPaymentSession(@Req() req: any, @Param('id') id: string) {
    try {
      const userId = req.user?.id;
      const result = await this.orderService.createPaymentSession(id, userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Payment session created successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to create payment session',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id/status/:status')
  async updateOrderStatus(@Param('id') id: string, @Param('status') status: string) {
    try {
      if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
        throw new Error('Invalid order status');
      }
      
      const result = await this.orderService.updateOrderStatus(id, status as OrderStatus);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Order status updated successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to update order status',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id/payment-status/:status')
  async updatePaymentStatus(@Param('id') id: string, @Param('status') status: string) {
    try {
      if (!Object.values(PaymentStatus).includes(status as PaymentStatus)) {
        throw new Error('Invalid payment status');
      }
      
      const result = await this.orderService.updatePaymentStatus(id, status as PaymentStatus);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Payment status updated successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to update payment status',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id')
  async updateOrder(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    try {
      const result = await this.orderService.updateOrder(id, updateOrderDto);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Order updated successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to update order',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id/cancel')
  async cancelOrder(@Req() req: any, @Param('id') id: string) {
    try {
      const userId = req.user?.id;
      const result = await this.orderService.cancelOrder(id, userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Order cancelled successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to cancel order',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async deleteOrder(@Param('id') id: string) {
    try {
      const result = await this.orderService.deleteOrder(id);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: result.message,
        data: null,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: error.message || 'Failed to delete order',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}