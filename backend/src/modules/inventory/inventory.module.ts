import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { InventoryService } from './inventory.service';

@Module({
  imports: [DatabaseModule],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
