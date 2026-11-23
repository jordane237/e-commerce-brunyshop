import { Module } from '@nestjs/common';

import { PricingModule } from '../../common/pricing/pricing.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CartController } from './cart.controller';
import { CartPricingService } from './cart-pricing.service';
import { CartStockService } from './cart-stock.service';
import { CartValidationService } from './cart-validation.service';

@Module({
  imports: [DatabaseModule, PricingModule],
  controllers: [CartController],
  providers: [CartPricingService, CartStockService, CartValidationService],
  exports: [CartPricingService, CartStockService, CartValidationService],
})
export class CartModule {}
