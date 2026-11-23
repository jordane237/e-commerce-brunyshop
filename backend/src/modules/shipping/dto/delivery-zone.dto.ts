import { ApiProperty } from '@nestjs/swagger';

/**
 * Zone de livraison exposée à la boutique (ORD-03).
 *
 * Les frais et délais proviennent de la table `DeliveryZone` seedée par TEC-07 :
 * le tunnel de commande ne calcule jamais un montant lui-même, il affiche ces
 * valeurs et transmet `deliveryZoneId` à `POST /orders`, qui les revérifie.
 *
 * SHP-01 remplacera cet endpoint de lecture par un devis complet (quote) ;
 * celui-ci reste volontairement minimal et public.
 */
export class DeliveryZoneDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Douala Centre' })
  name!: string;

  @ApiProperty({ type: [String], example: ['Douala', 'Bonabéri'] })
  cities!: string[];

  @ApiProperty({ description: 'Frais de livraison en XAF entier', example: 1500 })
  fee!: number;

  @ApiProperty({ description: 'Délai estimé en jours ouvrés', example: 1 })
  estimatedDays!: number;
}
