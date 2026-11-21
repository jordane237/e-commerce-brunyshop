export interface OrderCreatedItem {
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Événement émis **après** le commit de la transaction de création (CA #7).
 *
 * Immuable : les listeners ne doivent pas modifier la commande, seulement
 * déclencher des effets de bord (notifications, métriques).
 */
export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly reference: string,
    public readonly userId: string | null,
    public readonly customerName: string | null,
    public readonly customerPhone: string | null,
    public readonly customerEmail: string | null,
    public readonly total: number,
    public readonly items: OrderCreatedItem[],
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export const ORDER_CREATED_EVENT = 'order.created';

export const ORDER_AUDIT_ACTIONS = {
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_RATE_LIMITED: 'ORDER_RATE_LIMITED',
} as const;
