// BRUNY SHOPPING — zones de livraison (TEC-07).
//
// Au moins 5 zones, uniques par `DeliveryZone.name` (upsert). Les frais
// sont en XAF entier (montants en entier XAF, RG-PRX-01).
// Dépendances : aucune (exécuté après products.seed).
import type { PrismaClient } from '../../src/generated/prisma/client';

const ZONES = [
  { name: 'Douala Centre', cities: ['Douala', 'Bonabéri'], fee: 1500, estimatedDays: 1 },
  {
    name: 'Douala Périphérie',
    cities: ['Bonadoum', 'Ndogpassi', 'Akwa', 'Yabeta'],
    fee: 2500,
    estimatedDays: 2,
  },
  { name: 'Yaoundé', cities: ['Yaoundé'], fee: 3000, estimatedDays: 3 },
  { name: 'Bafoussam', cities: ['Bafoussam'], fee: 4000, estimatedDays: 4 },
  {
    name: 'Autres régions',
    cities: ['Bamenda', 'Buea', 'Limbe', 'Garoua', 'Ngaoundéré', 'Maroua'],
    fee: 5000,
    estimatedDays: 5,
  },
];

export async function seedDeliveryZones(prisma: PrismaClient): Promise<void> {
  for (const zone of ZONES) {
    const existing = await prisma.deliveryZone.findFirst({
      where: { name: zone.name },
    });
    if (existing) {
      await prisma.deliveryZone.update({
        where: { id: existing.id },
        data: {
          cities: zone.cities,
          fee: zone.fee,
          estimatedDays: zone.estimatedDays,
        },
      });
    } else {
      await prisma.deliveryZone.create({ data: zone });
    }
  }
}
