import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { StripeService } from '../stripe/stripe.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [WebhookService,StripeService,    
    PrismaService ],
    exports: [WebhookService]
})
export class WebhookModule {}
