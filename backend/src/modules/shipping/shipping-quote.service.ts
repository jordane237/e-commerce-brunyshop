import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/database/database.module';
import {
  resolveDeliveryZone as resolveDeliveryZoneCommon,
  type DeliveryZoneRow,
} from '../../common/shipping/delivery-zones';
import type {
  ShippingQuoteDto,
  ShippingQuoteWhatsAppDto,
  ShippingQuoteZoneDto,
} from './dto/shipping-quote.dto';
import type { ShippingQuoteRequestDto } from './dto/shipping-quote-request.dto';

/**
 * Service centralisé de devis de livraison (SHP-02).
 *
 * Source de vérité unique pour la résolution de zone, les frais, le délai et
 * les modes de livraison. `POST /shipping/quote` et `OrdersService` utilisent
 * la même logique ; les montants envoyés par le client ne sont jamais retenus.
 */
@Injectable()
export class ShippingQuoteService {
  constructor(private readonly prisma: PrismaService) {}

  async quote(input: ShippingQuoteRequestDto): Promise<ShippingQuoteDto> {
    const city = input.city.trim();
    const zone = await this.findZone(city, input.deliveryZoneId);

    if (zone === null) {
      const whatsapp = await this.buildWhatsAppLink(city);
      const message = `Nous ne livrons pas encore à ${city}. Contactez la boutique via WhatsApp pour une solution alternative.`;
      return {
        available: false,
        city,
        zone: null,
        fee: null,
        estimatedDays: null,
        modes: [],
        message,
        whatsapp,
        whatsappUrl: whatsapp?.url ?? null,
        whatsappMessage: whatsapp?.message ?? null,
        whatsappPhone: whatsapp?.phone ?? null,
      };
    }

    const zoneDto: ShippingQuoteZoneDto = {
      id: zone.id,
      name: zone.name,
      fee: zone.fee,
      estimatedDays: zone.estimatedDays,
      modes: zone.modes,
    };

    return {
      available: true,
      city,
      zone: zoneDto,
      fee: zone.fee,
      estimatedDays: zone.estimatedDays,
      modes: zone.modes,
      message: null,
      whatsapp: null,
      whatsappUrl: null,
      whatsappMessage: null,
      whatsappPhone: null,
    };
  }

  resolveDeliveryZone(
    client: Parameters<typeof resolveDeliveryZoneCommon>[0],
    city: string,
    deliveryZoneId: string | undefined,
  ): ReturnType<typeof resolveDeliveryZoneCommon> {
    return resolveDeliveryZoneCommon(client, city, deliveryZoneId);
  }

  private async findZone(
    city: string,
    deliveryZoneId: string | undefined,
  ): Promise<DeliveryZoneRow | null> {
    const normalizedCity = city.trim().toLocaleLowerCase('fr');

    if (deliveryZoneId !== undefined) {
      const zone = await this.prisma.deliveryZone.findUnique({
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
      if (zone === null || !zone.isActive) return null;
      if (!zone.cities.some((value) => value.trim().toLocaleLowerCase('fr') === normalizedCity)) {
        return null;
      }
      return zone;
    }

    const zones = await this.prisma.deliveryZone.findMany({
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
    return (
      zones.find((candidate) =>
        candidate.cities.some((value) => value.trim().toLocaleLowerCase('fr') === normalizedCity),
      ) ?? null
    );
  }

  private async buildWhatsAppLink(city: string): Promise<ShippingQuoteWhatsAppDto | null> {
    const setting = await this.prisma.setting.findUnique({
      where: { key: 'support.whatsapp' },
      select: { value: true },
    });
    const phone = typeof setting?.value === 'string' ? setting.value.trim() : '';
    if (phone === '') return null;

    const digits = phone.replace(/[^0-9]/g, '');
    if (digits === '') return null;

    const message = `Bonjour, je souhaite savoir si la livraison est disponible pour ${city}.`;
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;

    return { phone, url, message };
  }
}

// Alias pour les conventions de nommage possibles des tests/consommateurs.
export { ShippingQuoteService as DeliveryQuoteService };
