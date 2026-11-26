import { BadRequestException } from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import type { PrismaService } from '../../infrastructure/database/database.module';

export type DeliveryZoneClient = PrismaService | Prisma.TransactionClient;

export interface DeliveryZoneRow {
  id: string;
  name: string;
  cities: string[];
  fee: number;
  estimatedDays: number;
  modes: string[];
  isActive: boolean;
}

function normalizeCity(city: string): string {
  return city.trim().toLocaleLowerCase('fr');
}

export async function resolveDeliveryZone(
  client: DeliveryZoneClient,
  city: string,
  deliveryZoneId: string | undefined,
): Promise<DeliveryZoneRow> {
  const normalizedCity = normalizeCity(city);

  if (deliveryZoneId !== undefined) {
    const zone = await client.deliveryZone.findUnique({
      where: { id: deliveryZoneId },
      select: {
        id: true,
        name: true,
        cities: true,
        fee: true,
        estimatedDays: true,
        modes: true,
        isActive: true,
      },
    });
    if (zone === null || !zone.isActive) {
      throw new BadRequestException({
        code: 'DELIVERY_ZONE_NOT_FOUND',
        message: 'Cette zone de livraison n’existe plus. Choisissez une autre adresse.',
        errors: [{ field: 'deliveryZoneId', message: 'Zone introuvable.' }],
      });
    }
    if (!zone.cities.some((value: string) => normalizeCity(value) === normalizedCity)) {
      throw new BadRequestException({
        code: 'DELIVERY_ZONE_MISMATCH',
        message: `La ville ${city.trim()} ne fait pas partie de la zone choisie.`,
        errors: [{ field: 'address.city', message: 'Ville hors de la zone sélectionnée.' }],
      });
    }
    return zone;
  }

  const zones = await client.deliveryZone.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      cities: true,
      fee: true,
      estimatedDays: true,
      modes: true,
      isActive: true,
    },
    orderBy: { name: 'asc' },
  });
  const zone = zones.find((candidate: DeliveryZoneRow) =>
    candidate.cities.some((value: string) => normalizeCity(value) === normalizedCity),
  );
  if (zone === undefined) {
    throw new BadRequestException({
      code: 'DELIVERY_ZONE_NOT_FOUND',
      message: `Nous ne livrons pas encore à ${city.trim()}.`,
      errors: [{ field: 'address.city', message: 'Ville non desservie.' }],
    });
  }
  return zone;
}
