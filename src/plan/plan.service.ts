import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PlanService {

  private stripe:Stripe

  constructor(  private configService: ConfigService,
  private prisma: PrismaService){ const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    
    if (!apiKey) {
      throw new Error('Stripe API key is not defined');
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });}


  
 async create(payload: CreatePlanDto) {


    const product = await this.stripe.products.create({
    name: payload.planName,
    description: payload.description!,
    active: true,
    metadata: {
      planCategory: payload.planCategory,
    },
  });

  
  const priceConfig: any = {
    currency: "usd",
    unit_amount: Math.round(payload.amount * 100),
    active: true,
    product: product.id,
    metadata: {
      planCategory: payload.planCategory, 
    },
  };


  const price = await  this.stripe.prices.create(priceConfig);

  const result = await this.prisma.$transaction(async (tx) => {


    const dbPlan = await tx.plan.create({
      data: {
        amount: payload.amount || 0,
        planName: payload.planName,
        PlanType: payload.PlanType,
        planCategory: payload.planCategory, 
        currency: "usd",
        interval: payload.interval,
        intervalCount: payload.intervalCount,
        productId: product.id,
        priceId: price.id,
        active: payload.active ?? true, 
        description: payload.description,
        features: payload.features || [],
        whatsOffered: payload.whatsOffered || [],
        xpReward: payload?.xpReward
      },
    });

    return dbPlan;
  }, {
    maxWait: 5000,
    timeout: 10000,
  });


    return result
  }



  async findAll() {

    const result=await this.prisma.plan.findMany({})

    return result
  }



 async findOne(id: string) {

  if(!id){

    throw new  BadRequestException("plan id is required !")
  }

    const result=await this.prisma.plan.findFirst({where:{id}})

  if(!result?.id){

    throw new NotFoundException("plan is not found !")
  }

    return result
  }

async update(planId: string, payload: UpdatePlanDto) {
  let newPriceId: string | null = null;
  let oldPriceId: string | null = null; 
  let stripePriceCreated = false;
  let productIdToUse: string;

  try {

    const existingPlan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!existingPlan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    oldPriceId = existingPlan.priceId;
    productIdToUse = existingPlan.productId;
    try {
      await this.stripe.products.retrieve(productIdToUse);
    } catch (err: any) {
      if (err.code === "resource_missing") {
        console.warn(
          `Stripe product ${productIdToUse} not found. Creating new product...`
        );

        const newProduct = await this.stripe.products.create({
          name: payload.planName ?? existingPlan.planName,
          description: payload.description ?? existingPlan.description ?? "",
          active: payload.active ?? existingPlan.active ?? true,
          metadata: {
            planCategory: payload.planCategory ?? existingPlan.planCategory,
          },
        });

        productIdToUse = newProduct.id;

        await this.prisma.plan.update({
          where: { id: planId },
          data: { productId: productIdToUse },
        });
      } else {
        throw err;
      }
    }

    const updateData: any = {
      productId: productIdToUse,
    };

    if (payload.planName !== undefined) updateData.planName = payload.planName;
    if (payload.amount !== undefined) updateData.amount = payload.amount;
    if (payload.currency !== undefined) updateData.currency = payload.currency;
    if (payload.interval !== undefined) updateData.interval = payload.interval;
    if (payload.intervalCount !== undefined) updateData.intervalCount = payload.intervalCount;
    if (payload.freeTrialDays !== undefined) updateData.freeTrialDays = payload.freeTrialDays;
    if (payload.active !== undefined) updateData.active = payload.active;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.features !== undefined) updateData.features = payload.features;
    if (payload.PlanType !== undefined) updateData.PlanType = payload.PlanType;
    if (payload.planCategory !== undefined) updateData.planCategory = payload.planCategory;
    if (payload.xpReward !== undefined) updateData.xpReward = payload.xpReward;
    if (payload.whatsOffered !== undefined) updateData.whatsOffered = payload.whatsOffered;
    if (
      payload.planName !== undefined ||
      payload.description !== undefined ||
      payload.active !== undefined ||
      payload.planCategory !== undefined
    ) {
      await this.stripe.products.update(productIdToUse, {
        name: payload.planName ?? existingPlan.planName,
        description: payload.description ?? existingPlan.description ?? "",
        active: payload.active ?? existingPlan.active ?? true,
        metadata: {
          planCategory: payload.planCategory ?? existingPlan.planCategory,
        },
      });
    }

    try {
      await this.stripe.products.retrieve(productIdToUse);
    } catch {
      throw new BadRequestException(
        `Stripe product ${productIdToUse} is invalid. Cannot create price.`
      );
    }

    const currentAmount = Number(existingPlan.amount) || 0;
    const currentCurrency = String(existingPlan.currency || 'usd').toLowerCase();
    const currentInterval = existingPlan.interval;
    const currentIntervalCount = Number(existingPlan.intervalCount) || 1;
    
    let pricingChanged = false;
    const changeDetails: string[] = [];

    if (payload.amount !== undefined) {
      const newAmount = Number(payload.amount) || 0;
      if (newAmount !== currentAmount) {
        pricingChanged = true;
        changeDetails.push(`amount: ${currentAmount} → ${newAmount}`);
      }
    }

    if (payload.currency !== undefined) {
      const newCurrency = String(payload.currency).toLowerCase();
      if (newCurrency !== currentCurrency) {
        pricingChanged = true;
        changeDetails.push(`currency: ${currentCurrency} → ${newCurrency}`);
      }
    }

    if (payload.interval !== undefined && payload.interval !== currentInterval) {
      pricingChanged = true;
      changeDetails.push(`interval: ${currentInterval} → ${payload.interval}`);
    }

    if (payload.intervalCount !== undefined) {
      const newIntervalCount = Number(payload.intervalCount) || 1;
      if (newIntervalCount !== currentIntervalCount) {
        pricingChanged = true;
        changeDetails.push(`intervalCount: ${currentIntervalCount} → ${newIntervalCount}`);
      }
    }

    console.log("Pricing changed:", pricingChanged);
    if (changeDetails.length > 0) {
      console.log("Changes:", changeDetails.join(', '));
    }
    if (pricingChanged) {
      console.log("🔄 Creating new Stripe price...");

      const finalAmount = payload.amount !== undefined ? Number(payload.amount) : currentAmount;
      const finalCurrency = (payload.currency ?? existingPlan.currency ?? 'usd').toLowerCase();
      const finalInterval = payload.interval ?? existingPlan.interval ?? 'month';
      const finalIntervalCount = payload.intervalCount !== undefined ? Number(payload.intervalCount) : currentIntervalCount;
      const finalPlanCategory = payload.planCategory ?? existingPlan.planCategory ?? '';

      const priceConfig: Stripe.PriceCreateParams = {
        currency: finalCurrency,
        unit_amount: Math.round(finalAmount * 100),
        active: true,
        product: productIdToUse,
        recurring: {
          interval: finalInterval as Stripe.PriceCreateParams.Recurring.Interval,
          interval_count: finalIntervalCount,
        },
        metadata: {
          planCategory: finalPlanCategory,
        },
      };

      const newPrice = await this.stripe.prices.create(priceConfig);
      newPriceId = newPrice.id;
      stripePriceCreated = true;

      if (oldPriceId) {
        try {
          await this.stripe.prices.update(oldPriceId, { active: false });
        
        } catch (err: any) {
          if (err.code === "resource_missing") {

          } else {
            throw err;
          }
        }
      }

      updateData.priceId = newPriceId;
    } else {
   
      if (existingPlan.priceId) {
        updateData.priceId = existingPlan.priceId;
      
      }
    }

 
    const updatedPlan = await this.prisma.$transaction(async (tx) => {
      return tx.plan.update({
        where: { id: planId },
        data: updateData,
      });
    });

 
    return updatedPlan;

  } catch (error) {
   
    console.error(error);

    if (stripePriceCreated && newPriceId) {
      try {
        await this.stripe.prices.update(newPriceId, { active: false });
        console.log(`Rolled back new price: ${newPriceId}`);
      } catch (rollbackErr) {
        console.error("Failed to rollback Stripe price:", rollbackErr);
      }
    }

    throw error;
  }
}


 async remove(id: string) {

  console.log(id)
   if (!id) {
    throw new BadRequestException('Plan id is required');
  }
    const isExistPaln=await this.prisma.plan.findFirst({where:{id}})

  console.log(isExistPaln)
    if(!isExistPaln){
      throw new NotFoundException("plan is not found !")
    }

    const result=await this.prisma.plan.delete({where:{id}})

    return result
  }
}