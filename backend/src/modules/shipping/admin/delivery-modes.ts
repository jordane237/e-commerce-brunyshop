import { DeliveryMode } from '../../../generated/prisma/client';

export const DELIVERY_MODES = ['HOME', 'RELAY', 'PICKUP'] as const;
export type DeliveryModeValue = (typeof DELIVERY_MODES)[number];

export function isDeliveryMode(value: string): value is DeliveryModeValue {
  return (DELIVERY_MODES as readonly string[]).includes(value);
}

export const DELIVERY_MODE_LABELS: Record<DeliveryModeValue, string> = {
  HOME: 'Livraison à domicile',
  RELAY: 'Point relais',
  PICKUP: 'Retrait',
};

export type PrismaDeliveryMode = DeliveryMode;
