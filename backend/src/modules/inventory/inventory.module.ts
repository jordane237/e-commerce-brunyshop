import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StockAlertsController } from './admin/stock-alerts.controller';
import { StockAlertsService } from './admin/stock-alerts.service';
import { InventoryService } from './inventory.service';
import { StockLowListener } from './listeners/stock-low.listener';

@Module({
  imports: [DatabaseModule, NotificationsModule, AuditModule],
  controllers: [StockAlertsController],
  providers: [InventoryService, StockAlertsService, StockLowListener],
  exports: [InventoryService],
})
export class InventoryModule {}
