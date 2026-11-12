// notifications.module.ts
// Module NTF-01 : file BullMQ par canal, workers, adaptateurs, templates,
// sanitizer et contrôleur admin.

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { QueueService } from './queue.service';
import { EmailAdapter } from './adapters/email.adapter';
import { SmsAdapter } from './adapters/sms.adapter';
import { WhatsAppAdapter } from './adapters/whatsapp.adapter';
import { EmailWorker } from './workers/email.worker';
import { SmsWorker } from './workers/sms.worker';
import { WhatsAppWorker } from './workers/whatsapp.worker';
import {
  NOTIFICATIONS_EMAIL_QUEUE,
  NOTIFICATIONS_SMS_QUEUE,
  NOTIFICATIONS_WHATSAPP_QUEUE,
} from './queue.constants';

@Module({
  imports: [
    DatabaseModule,
    BullModule.registerQueue(
      { name: NOTIFICATIONS_EMAIL_QUEUE },
      { name: NOTIFICATIONS_SMS_QUEUE },
      { name: NOTIFICATIONS_WHATSAPP_QUEUE },
    ),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    QueueService,
    EmailAdapter,
    SmsAdapter,
    WhatsAppAdapter,
    EmailWorker,
    SmsWorker,
    WhatsAppWorker,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
