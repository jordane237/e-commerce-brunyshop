import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CartController } from './cart.controller';
import { CartPricingService } from './cart-pricing.service';
import { CartStockService } from './cart-stock.service';
import { CartValidationService } from './cart-validation.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CartController],
  providers: [CartPricingService, CartStockService, CartValidationService],
  exports: [CartPricingService, CartStockService, CartValidationService],
})
export class CartModule {}
