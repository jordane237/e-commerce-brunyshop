import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../infrastructure/database/database.module';
import { ShippingQuoteService } from './shipping-quote.service';

function makePrisma(overrides: { zone?: unknown; zones?: unknown[]; setting?: unknown }) {
  return {
    deliveryZone: {
      findUnique: vi.fn().mockResolvedValue(overrides.zone ?? null),
      findMany: vi.fn().mockResolvedValue(overrides.zones ?? []),
    },
    setting: {
      findUnique: vi.fn().mockResolvedValue(overrides.setting ?? null),
    },
  } as unknown as PrismaService;
}

describe('ShippingQuoteService', () => {
  it('retourne un devis disponible pour une ville couverte', async () => {
    const zone = {
      id: 'zone-1',
      name: 'Douala Centre',
      cities: ['Douala'],
      fee: 1500,
      estimatedDays: 1,
      modes: ['HOME', 'RELAY'],
      isActive: true,
    };
    const service = new ShippingQuoteService(makePrisma({ zone, zones: [zone] }));

    const result = await service.quote({ city: 'Douala' });

    expect(result.available).toBe(true);
    expect(result.fee).toBe(1500);
    expect(result.estimatedDays).toBe(1);
    expect(result.modes).toEqual(['HOME', 'RELAY']);
    expect(result.zone?.id).toBe('zone-1');
    expect(result.whatsapp).toBeNull();
  });

  it('retourne available=false et WhatsApp pour une ville hors zone', async () => {
    const service = new ShippingQuoteService(
      makePrisma({
        zones: [],
        setting: { value: '+237679176296' },
      }),
    );

    const result = await service.quote({ city: 'Kribi' });

    expect(result.available).toBe(false);
    expect(result.fee).toBeNull();
    expect(result.modes).toEqual([]);
    expect(result.message).toContain('Kribi');
    expect(result.whatsapp?.phone).toBe('+237679176296');
    expect(result.whatsappUrl).toContain('wa.me');
  });

  it('retourne available=false si la zone choisie est inactive', async () => {
    const service = new ShippingQuoteService(
      makePrisma({
        zone: {
          id: 'zone-1',
          name: 'Douala Centre',
          cities: ['Douala'],
          fee: 1500,
          estimatedDays: 1,
          modes: ['HOME'],
          isActive: false,
        },
        setting: null,
      }),
    );

    const result = await service.quote({ city: 'Douala', deliveryZoneId: 'zone-1' });

    expect(result.available).toBe(false);
    expect(result.whatsapp).toBeNull();
  });
});
