import { Module } from '@nestjs/common';

import { CacheModule } from '../../infrastructure/cache/cache.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { MailModule } from '../../infrastructure/mail/mail.module';
import { AuthController, MeController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [DatabaseModule, CacheModule, MailModule],
  controllers: [AuthController, MeController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
