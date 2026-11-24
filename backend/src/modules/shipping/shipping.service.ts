import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/database/database.module';
import type { DeliveryZoneDto } from './dto/delivery-zone.dto';

/**
 * Lecture des zones de livraison pour le tunnel de commande (ORD-03).
 *
 * Aucun montant n'est calculé ici : les frais sont lus en base et restent la
 * source de vérité, `OrdersService` les revérifie à la création de la commande.
 */
@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  async listZones(): Promise<DeliveryZoneDto[]> {
    const zones = await this.prisma.deliveryZone.findMany({
      where: { isActive: true },
      orderBy: [{ fee: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, cities: true, fee: true, estimatedDays: true, modes: true },
    });

    return zones.map((zone) => ({
      id: zone.id,
      name: zone.name,
      cities: zone.cities,
      fee: zone.fee,
      estimatedDays: zone.estimatedDays,
      modes: zone.modes,
    }));
  }
}
