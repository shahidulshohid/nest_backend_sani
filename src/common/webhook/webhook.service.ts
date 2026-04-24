import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "src/prisma.service";
import Stripe from "stripe";
import { StripeService } from "../stripe/stripe.service";
import { Interval, PaymentStatus } from "generated/prisma/enums";

@Injectable()
export class WebhookService {
  constructor(
    private readonly stripe: StripeService,
    private prisma: PrismaService,
  ) {}

  calculateEndDate(
    startDate: Date,
    interval: Interval,
    intervalCount: number,
  ): Date {
    const endDate = new Date(startDate);

    switch (interval) {
      case 'week':
        endDate.setDate(endDate.getDate() + 7 * intervalCount);
        break;

      case 'month':
        endDate.setMonth(endDate.getMonth() + intervalCount);
        if (endDate.getDate() !== startDate.getDate()) {
          endDate.setDate(0);
        }
        break;

      case 'year':
        endDate.setFullYear(endDate.getFullYear() + intervalCount);
        break;

      default:
        throw new BadRequestException(`Unsupported interval: ${interval}`);
    }

    return endDate;
  }

  async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    const payment = await this.prisma.subscription.findFirst({
      where: { stripePaymentId: paymentIntent.id },
      include: { plan: true },
    });

    if (!payment) {
      throw new NotFoundException(
        `Payment not found for ID: ${paymentIntent.id}`,
      );
    }

    if (!payment.plan) {
      throw new NotFoundException(
        'Plan not found for this subscription',
      );
    }

    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException(
        'Payment intent is not in succeeded state',
      );
    }

    const startDate = new Date();
    const endDate = this.calculateEndDate(
      startDate,
      payment.plan.interval,
      payment.plan.intervalCount,
    );

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: payment.userId },
        data: {
          isSubscribed: true,
          planExpiration: endDate,
        },
      }),
      this.prisma.subscription.update({
        where: { id: payment.id },
        data: {
          paymentStatus: PaymentStatus.COMPLETED,
          startDate,
          endDate,
        },
      }),
    ]);
  }

  async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    const payment = await this.prisma.subscription.findFirst({
      where: { stripePaymentId: paymentIntent.id },
    });

    if (!payment) {
      throw new NotFoundException(
        `Payment not found for ID: ${paymentIntent.id}`,
      );
    }

    await this.prisma.subscription.update({
      where: { id: payment.id },
      data: {
        paymentStatus: PaymentStatus.CANCELED,
        endDate: new Date(),
      },
    });
  }
}
