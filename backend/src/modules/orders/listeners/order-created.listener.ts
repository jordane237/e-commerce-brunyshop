import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';

import type { ApplicationConfig } from '../../../config/configuration';
import { PrismaService } from '../../../infrastructure/database/database.module';
import { formatXaf } from '../../cart/cart.utils';
import { NotificationsService } from '../../notifications/notifications.service';
import { ORDER_CREATED_EVENT, OrderCreatedEvent } from '../events/order-created.event';

const INTERNAL_ORDER_ROLES = ['SUPER_ADMIN', 'ADMIN'];

/**
 * Notifications de création de commande (CA #7).
 *
 * Fire-and-forget : une erreur d'envoi ne doit jamais faire échouer la réponse
 * HTTP, la commande étant déjà commitée. Chaque échec est journalisé avec des
 * données personnelles masquées.
 */
@Injectable()
export class OrderCreatedListener {
  private readonly logger = new Logger(OrderCreatedListener.name);
  private readonly supportUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    config: ConfigService,
  ) {
    const application = config.get<ApplicationConfig>('app');
    this.supportUrl = `${application?.publicAppUrl ?? 'https://brunyshop.cm'}/contact`;
  }

  @OnEvent(ORDER_CREATED_EVENT, { async: true })
  async handle(event: OrderCreatedEvent): Promise<void> {
    try {
      await this.notifyCustomer(event);
      await this.notifyAdmins(event);
      this.logger.log(
        `Notifications de commande envoyées: orderId=${event.orderId} reference=${event.reference}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Échec des notifications de commande: orderId=${event.orderId} reference=${
          event.reference
        } cause=${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async notifyCustomer(event: OrderCreatedEvent): Promise<void> {
    if (event.customerPhone !== null) {
      await this.notifications.enqueueSms(
        event.userId,
        event.customerPhone,
        'order.created',
        'v1',
        this.templateData(event),
        { metadata: { orderId: event.orderId } },
      );
    }
    if (event.customerEmail !== null) {
      await this.notifications.enqueueEmail(
        event.userId,
        event.customerEmail,
        'order.created',
        'v1',
        this.templateData(event),
        { metadata: { orderId: event.orderId } },
      );
    }
  }

  private async notifyAdmins(event: OrderCreatedEvent): Promise<void> {
    const admins = await this.prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        email: { not: null },
        roles: {
          some: { role: { name: { in: INTERNAL_ORDER_ROLES } } },
        },
      },
      select: { id: true, email: true },
    });

    for (const admin of admins) {
      if (admin.email === null) continue;
      await this.notifications.enqueueEmail(
        admin.id,
        admin.email,
        'order.created.admin',
        'v1',
        {
          reference: event.reference,
          customerName: event.customerName ?? 'Client invité',
          customerPhone: event.customerPhone ?? 'Non renseigné',
          total: formatXaf(event.total),
          itemCount: event.items.reduce((sum, item) => sum + item.quantity, 0),
          itemsSummary: event.items
            .map(
              (item) =>
                `${item.productName} · ${item.size} · ${item.color} × ${item.quantity} — ${formatXaf(
                  item.unitPrice * item.quantity,
                )}`,
            )
            .join('\n'),
          createdAt: event.occurredAt.toISOString(),
        },
        { metadata: { orderId: event.orderId } },
      );
    }
  }

  private templateData(event: OrderCreatedEvent): Record<string, unknown> {
    return {
      customerName: event.customerName ?? 'cher client',
      reference: event.reference,
      total: formatXaf(event.total),
      supportUrl: this.supportUrl,
    };
  }
}
