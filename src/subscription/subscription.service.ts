import { BadGatewayException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { PrismaService } from 'src/prisma.service';
import { StripeService } from 'src/common/stripe/stripe.service';
import Stripe from 'stripe';
import { WebhookService } from 'src/common/webhook/webhook.service';


@Injectable()


export class SubscriptionService {

constructor(  private readonly prisma: PrismaService,
  private readonly stripe: StripeService, private webhook:WebhookService){}

async create(userId: string, planId: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException("User not found");
  }

  const plan = await this.prisma.plan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new NotFoundException("Plan not found");
  }

  const startDate = new Date();
  let endDate: Date | null = null;

  if (plan.interval === "month") {
    endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + (plan.intervalCount || 1));

    if (endDate.getDate() !== startDate.getDate()) {
      endDate.setDate(0);
    }
  } else if (plan.interval === "year") {
    endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + (plan.intervalCount || 1));
  }

  const paymentIntent = await this.stripe.stripe.paymentIntents.create({
    amount: Math.round(plan.amount * 100),
    currency: "usd",
    metadata: {
      userId: user.id,
      planId,
      planType: plan.PlanType,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return await this.prisma.$transaction(async (tx) => {
    const existingSubscription = await tx.subscription.findUnique({
      where: { userId: user.id },
    });

    let subscription;
    if (existingSubscription?.paymentStatus === "PENDING") {
      subscription = await tx.subscription.update({
        where: { userId: user.id },
        data: {
          planId,
          stripePaymentId: paymentIntent.id,
          startDate,
          amount: plan.amount,
          endDate: endDate,
          paymentStatus: "PENDING",
        },
      });
    } else {
      subscription = await tx.subscription.create({
        data: {
          userId: user.id,
          planId,
          startDate,
          amount: plan.amount,
          stripePaymentId: paymentIntent.id,
          paymentStatus: "PENDING",
          endDate,
        },
      });
    }

    return {
      subscription,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      planType: plan.PlanType,
    };
  }, {
    maxWait: 5000,
    timeout: 10000,
  });
}

  async findAll() {

    const result=await this.prisma.subscription.findMany({})
    return result
  }

  async findOne(id: string) {
      if(!id){
      throw new BadGatewayException("subscription id is required !")
    }

    const isExistsubscription=await this.prisma.subscription.findFirst({where:{id}})

    if(!isExistsubscription){
      throw new NotFoundException("subscription is not found !")
    }


    return isExistsubscription
  }


async getMySubscription (userId :string){
const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException( "User not found");
  }

  const result = await this.prisma.subscription.findFirst({
    where: { user: { id: userId } },
    include: {
      user: {
        select: {
          id: true,
         fullName:true,
          profilePic: true,
          email: true,
          role: true,
          isSubscribed: true,
          planExpiration: true,
        },
      },
      plan: true,
    },
  });

  if (!result) {
    throw new NotFoundException("Subscription not found!");
  }

  return result;

  }

  update(id: number, updateSubscriptionDto: UpdateSubscriptionDto) {



    return `This action updates a #${id} subscription`;
  }

async  remove(id: string) {


 if(!id){
      throw new BadGatewayException("subscription id is required !")
    }

     const result=await this.prisma.subscription.delete({where:{id}})

    return result
  }

async HandleStripeWebhook (event:Stripe.Event){

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await  this.webhook.handlePaymentIntentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await this.webhook.handlePaymentIntentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  } catch (error) {
    console.error("Error handling Stripe webhook:", error);
    throw new InternalServerErrorException( "Webhook handling failed");
  }
};



}


