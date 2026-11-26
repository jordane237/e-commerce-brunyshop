import { Module } from '@nestjs/common';

import { CacheModule } from '../../infrastructure/cache/cache.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { CartModule } from '../cart/cart.module';
import { InventoryModule } from '../inventory/inventory.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminShipmentsController } from './admin-shipments.controller';
import { OrderTrackingController } from './order-tracking.controller';
import { OrderTrackingService } from './order-tracking.service';
import { OrderCreatedListener } from './listeners/order-created.listener';
import { OrderAttemptService } from './order-attempt.service';
import { OrderWorkflowService } from './order-workflow.service';
import { OrderConfirmationService } from './order-confirmation.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderReferenceGenerator } from './reference/order-reference.generator';

@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    CartModule,
    InventoryModule,
    AuditModule,
    NotificationsModule,
  ],
  controllers: [
    OrdersController,
    AdminOrdersController,
    AdminShipmentsController,
    OrderTrackingController,
  ],
  providers: [
    OrdersService,
    OrderTrackingService,
    OrderReferenceGenerator,
    OrderAttemptService,
    OrderCreatedListener,
    // ORD-02 : transitions de statut (contrôle + historique + audit).
    OrderWorkflowService,
    // PAY-01 : confirmation COD + encaissement.
    OrderConfirmationService,
  ],
  exports: [OrdersService, OrderWorkflowService],
})
export class OrdersModule {}
