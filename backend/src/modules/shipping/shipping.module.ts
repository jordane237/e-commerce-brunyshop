import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';

/**
 * Livraison — ORD-03 expose la lecture des zones (frais et délais réels).
 * SHP-01 étendra ce module avec les tarifs administrables et le devis (quote).
 */
@Module({
  imports: [DatabaseModule],
  controllers: [ShippingController],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}
