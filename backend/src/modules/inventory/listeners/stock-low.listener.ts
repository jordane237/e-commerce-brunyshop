import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';

import { PrismaService } from '../../../infrastructure/database/database.module';
import { AuditLogService } from '../../audit/audit.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { StockLowEvent } from '../events/stock-low.event';
import { STOCK_AUDIT_ACTIONS } from '../stock-audit.actions';

const INTERNAL_STOCK_ROLES = ['SUPER_ADMIN', 'ADMIN', 'STOCK_MANAGER'];

@Injectable()
export class StockLowListener {
  private readonly logger = new Logger(StockLowListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly auditLog: AuditLogService,
    private readonly config: ConfigService,
  ) {}

  @OnEvent(StockLowEvent.NAME)
  async handle(event: StockLowEvent): Promise<void> {
    if (this.config.get<boolean>('app.stock.lowAlertEnabled') === false) return;

    const payload = event.payload;
    const current = await this.prisma.productVariant.findUnique({
      where: { id: payload.variantId },
      select: {
        stock: true,
        reservedStock: true,
        lowStockThreshold: true,
        product: { select: { deletedAt: true } },
      },
    });
    if (current === null || current.product.deletedAt !== null) return;

    const available = Math.max(0, current.stock - current.reservedStock);
    if (available > current.lowStockThreshold) return;

    // Verrou logique anti-spam : un seul événement concurrent peut passer de
    // NULL à une date. Les autres voient count = 0 et s'arrêtent.
    const claimed = await this.prisma.productVariant.updateMany({
      where: { id: payload.variantId, lowStockAlertSentAt: null },
      data: { lowStockAlertSentAt: new Date() },
    });
    if (claimed.count === 0) return;

    const admins = await this.prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        roles: {
          some: {
            role: { name: { in: INTERNAL_STOCK_ROLES } },
          },
        },
      },
      select: { id: true, email: true },
    });

    const adminUrl = this.config.get<string>('app.publicAdminUrl') ?? '';
    const templateData = {
      productName: payload.productName,
      sku: payload.sku,
      size: payload.size,
      color: payload.color,
      currentStock: current.stock,
      availableStock: available,
      threshold: current.lowStockThreshold,
      stockUrl: `${adminUrl}/stock?variant=${payload.variantId}`,
    };
    const metadata = {
      variantId: payload.variantId,
      productId: payload.productId,
      availableStock: available,
      threshold: current.lowStockThreshold,
    };

    const deliveries = admins.flatMap((admin) => {
      const jobs = [
        this.notifications.enqueueInApp(admin.id, admin.id, 'stock.low', 'v1', templateData, {
          metadata,
        }),
      ];
      if (admin.email !== null) {
        jobs.push(
          this.notifications.enqueueEmail(admin.id, admin.email, 'stock.low', 'v1', templateData, {
            metadata,
          }),
        );
      }
      return jobs;
    });

    const results = await Promise.allSettled(deliveries);
    const failures = results.filter((result) => result.status === 'rejected');
    if (failures.length > 0) {
      this.logger.warn(
        { variantId: payload.variantId, failureCount: failures.length },
        'Certaines notifications d’alerte stock bas ont échoué',
      );
    }

    await this.auditLog.record(this.prisma, {
      userId: null,
      action: STOCK_AUDIT_ACTIONS.STOCK_LOW_ALERT_SENT,
      entity: 'ProductVariant',
      entityId: payload.variantId,
      after: {
        ...metadata,
        productName: payload.productName,
        sku: payload.sku,
        notifiedAdmins: admins.length,
        failedDeliveries: failures.length,
      },
    });
  }
}
