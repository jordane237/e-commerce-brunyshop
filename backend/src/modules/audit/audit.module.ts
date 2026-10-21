import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuditLogService } from './audit.service';

@Module({ imports: [DatabaseModule], providers: [AuditLogService], exports: [AuditLogService] })
export class AuditModule {}
