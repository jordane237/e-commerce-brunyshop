import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { TurnstileModule } from '../../security/turnstile/turnstile.module';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

@Module({
  imports: [DatabaseModule, TurnstileModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
