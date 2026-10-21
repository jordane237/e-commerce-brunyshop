import { Injectable } from '@nestjs/common';
import { Prisma, type PrismaClient } from '../../generated/prisma/client';

export interface AuditEvent {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  ip?: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditLogService {
  async record(client: Prisma.TransactionClient | PrismaClient, event: AuditEvent): Promise<void> {
    await client.auditLog.create({
      data: {
        userId: event.userId,
        action: event.action,
        entity: event.entity,
        entityId: event.entityId,
        ip: event.ip,
        before: event.before,
        after: event.after,
      },
    });
  }
}
