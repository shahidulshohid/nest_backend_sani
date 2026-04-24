import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { StripeModule } from 'src/common/stripe/stripe.module';
import { WebhookModule } from 'src/common/webhook/webhook.module';

@Module({
    imports:[StripeModule,WebhookModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
})
export class SubscriptionModule {}
