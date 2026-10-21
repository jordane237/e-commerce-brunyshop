import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { BACKGROUND_QUEUE } from './queue.constants';

@Module({
  imports: [BullModule.registerQueue({ name: BACKGROUND_QUEUE })],
  providers: [QueueService],
  exports: [BullModule, QueueService],
})
export class QueueModule {}
