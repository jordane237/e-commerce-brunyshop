// Shared pricing rules (RG-PRX-02) exposed as a NestJS service.
import { Module } from '@nestjs/common';

import { PricingService } from './pricing.service';

@Module({
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
