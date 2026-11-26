import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';

import type { ApplicationConfig } from '../../../config/configuration';
import { PrismaService } from '../../../infrastructure/database/database.module';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SUFFIX_LENGTH = 4;
const MAX_ATTEMPTS = 5;

/**
 * Génère une référence de commande lisible et non devinable : BRN-YYMM-XXXX.
 *
 * - préfixe configurable (`ORDER_REFERENCE_PREFIX`, défaut `BRN`) ;
 * - `YYMM` = année et mois de création ;
 * - 4 caractères tirés d'un alphabet de 32 symboles sans I/O/0/1 (ambigus à
 *   l'oral ou à la saisie), soit ~1 million de combinaisons par mois ;
 * - `crypto.randomBytes` : pas de prédictibilité (jamais `Math.random`) ;
 * - unicité pré-vérifiée en base, 5 tentatives avant échec explicite. La
 *   contrainte `@unique` reste le garde-fou concurrent.
 */
@Injectable()
export class OrderReferenceGenerator {
  private readonly prefix: string;

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const application = config.get<ApplicationConfig>('app');
    this.prefix = (application?.orders.referencePrefix ?? 'BRN').toUpperCase();
  }

  async generate(at: Date = new Date()): Promise<string> {
    const yymm = `${String(at.getFullYear()).slice(-2)}${String(at.getMonth() + 1).padStart(2, '0')}`;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const reference = `${this.prefix}-${yymm}-${this.randomSuffix()}`;
      const existing = await this.prisma.order.findUnique({
        where: { reference },
        select: { id: true },
      });
      if (existing === null) {
        return reference;
      }
    }

    throw new InternalServerErrorException({
      code: 'REFERENCE_GENERATION_FAILED',
      message: 'Impossible de générer une référence de commande unique.',
    });
  }

  // Rejection sampling: 256 is a multiple of 32, so every symbol is equally
  // likely and no modulo bias is introduced.
  private randomSuffix(): string {
    const bytes = randomBytes(SUFFIX_LENGTH);
    let suffix = '';
    for (let index = 0; index < SUFFIX_LENGTH; index += 1) {
      suffix += ALPHABET[bytes[index] % ALPHABET.length];
    }
    return suffix;
  }
}
