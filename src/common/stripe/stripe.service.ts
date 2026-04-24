import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentStatus } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  public stripe: Stripe;

  constructor(private readonly configService: ConfigService ,private prisma:PrismaService) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey) throw new Error('Stripe API key is missing');

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }

async createStripeSession(order: any) {
    try {
      const line_items = [
        ...order.orderItems.map((item: any) => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.product?.name || 'Product',
              description: item.product?.description || '',
              images: item.product?.imageUrl ? [item.product.imageUrl] : [],
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        })),
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Shipping Cost',
              description: 'Delivery charge',
            },
            unit_amount: Math.round(order.shippingCost * 100),
          },
          quantity: 1,
        },
      ];

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items,
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
        metadata: { orderId: order.id },
      });

      return session;
    } catch (error) {
      console.error('Stripe session creation error:', error);
      throw new BadRequestException('Payment session creation failed');
    }
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err: any) {
      console.log('Webhook signature verification failed.', err.message);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        try {
          await this.prisma.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: PaymentStatus.PAID,
              orderStatus: OrderStatus.COMPLETED,
              paymentMethod: 'Stripe',
              updatedAt: new Date(),
            },
          });

          console.log(`Order ${orderId} payment confirmed via webhook`);
        } catch (error) {
          console.error('Error updating order after payment:', error);
        }
      }
    }

    return { received: true };
  }

  async verifyPayment(sessionId: string) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);

      return {
        paymentStatus: session.payment_status,
        orderId: session.metadata?.orderId,
        sessionStatus: session.status,
      };
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw new BadRequestException('Payment verification failed');
    }
  }

  async retrieveSession(sessionId: string) {
    try {
      return await this.stripe.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      throw new BadRequestException('Failed to retrieve session');
    }
  }

  async createPaymentIntent(amount: number, currency: string = 'usd') {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
      });

      return paymentIntent;
    } catch (error) {
      console.error('Payment intent creation error:', error);
      throw new BadRequestException('Payment intent creation failed');
    }
  }

}
