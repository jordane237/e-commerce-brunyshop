import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AdminDeliveryZonesController } from './admin/admin-delivery-zones.controller';
import { AdminDeliveryZonesService } from './admin/admin-delivery-zones.service';
import { ShippingController } from './shipping.controller';
import { ShippingQuoteService } from './shipping-quote.service';
import { ShippingService } from './shipping.service';

/**
 * Livraison — ORD-03 expose la lecture des zones (frais et délais réels).
 * SHP-01 étendra ce module avec les tarifs administrables et le devis (quote).
 */
@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [ShippingController, AdminDeliveryZonesController],
  providers: [ShippingService, ShippingQuoteService, AdminDeliveryZonesService],
  exports: [ShippingService, ShippingQuoteService, AdminDeliveryZonesService],
})
export class ShippingModule {}
