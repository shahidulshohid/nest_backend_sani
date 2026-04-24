import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { StripeModule } from 'src/common/stripe/stripe.module';

@Module({

  imports:[StripeModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
