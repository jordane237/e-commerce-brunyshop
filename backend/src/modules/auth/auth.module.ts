import { Module } from '@nestjs/common';

import { CacheModule } from '../../infrastructure/cache/cache.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { MailModule } from '../../infrastructure/mail/mail.module';
import { AuditLogService } from '../audit/audit.service'; /* eslint-disable-line no-restricted-imports */
import { AuthController, MeController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [DatabaseModule, CacheModule, MailModule],
  controllers: [AuthController, MeController],
  providers: [AuthService, AuditLogService],
  exports: [AuthService],
})
export class AuthModule {}
