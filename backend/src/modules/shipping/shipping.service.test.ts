import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../infrastructure/database/database.module';
import { ShippingService } from './shipping.service';

describe('ShippingService', () => {
  function createService(zones: unknown[]) {
    const findMany = vi.fn().mockResolvedValue(zones);
    const prisma = { deliveryZone: { findMany } } as unknown as PrismaService;
    return { service: new ShippingService(prisma), findMany };
  }

  it('retourne les zones triées par frais croissants', async () => {
    const { service, findMany } = createService([
      {
        id: 'zone-1',
        name: 'Douala Centre',
        cities: ['Douala', 'Bonabéri'],
        fee: 1500,
        estimatedDays: 1,
      },
    ]);

    const zones = await service.listZones();

    expect(findMany).toHaveBeenCalledWith({
      orderBy: [{ fee: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, cities: true, fee: true, estimatedDays: true },
    });
    expect(zones).toEqual([
      {
        id: 'zone-1',
        name: 'Douala Centre',
        cities: ['Douala', 'Bonabéri'],
        fee: 1500,
        estimatedDays: 1,
      },
    ]);
  });

  it('retourne une liste vide quand aucune zone n’est configurée', async () => {
    const { service } = createService([]);
    await expect(service.listZones()).resolves.toEqual([]);
  });
});
