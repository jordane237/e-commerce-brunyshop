import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { SettingsService } from './settings.service';

@Module({
  imports: [DatabaseModule],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
