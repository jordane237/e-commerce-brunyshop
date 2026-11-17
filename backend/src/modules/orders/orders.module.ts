import { Module } from '@nestjs/common';

import { CacheModule } from '../../infrastructure/cache/cache.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { CartModule } from '../cart/cart.module';
import { InventoryModule } from '../inventory/inventory.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrderCreatedListener } from './listeners/order-created.listener';
import { OrderAttemptService } from './order-attempt.service';
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
  controllers: [OrdersController],
  providers: [OrdersService, OrderReferenceGenerator, OrderAttemptService, OrderCreatedListener],
  exports: [OrdersService],
})
export class OrdersModule {}
