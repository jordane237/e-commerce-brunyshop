// sku-generator.service.ts
// Génération de SKU uniques (CAT-04), alignée sur le format du seed TEC-07 :
//   {MARQUE8}-{PRODUIT10}-{TAILLE}-{COULEUR12}
// Exemple : BARRAGEF-AIRMAX90-42-NOIR
//
// Les collisions sont résolues par suffixe -2, -3… (max 50 tentatives).

import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/database.module';

const MAX_ATTEMPTS = 50;
const BRAND_LENGTH = 8;
const PRODUCT_LENGTH = 10;
const SIZE_LENGTH = 8;
const COLOR_LENGTH = 12;

export interface SkuVariantInput {
  color: string;
  size: string;
}

function segment(value: string, maxLength: number): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, maxLength);
}

/** Clé stable d'une variante, utilisée par la génération en lot. */
export function variantKey(color: string, size: string): string {
  return `${color.trim().toLowerCase()}|${size.trim().toLowerCase()}`;
}

@Injectable()
export class SkuGeneratorService {
  constructor(private readonly prisma: PrismaService) {}

  private baseSku(brandSlug: string, productSlug: string, variant: SkuVariantInput): string {
    const brand = segment(brandSlug, BRAND_LENGTH);
    const product = segment(productSlug, PRODUCT_LENGTH);
    const size = segment(variant.size, SIZE_LENGTH);
    const color = segment(variant.color, COLOR_LENGTH);
    if (brand === '' || product === '' || size === '' || color === '') {
      throw new BadRequestException({
        code: 'SKU_GENERATION_FAILED',
        message: 'Impossible de générer un SKU : marque, produit, couleur et pointure sont requis.',
      });
    }
    return `${brand}-${product}-${size}-${color}`;
  }

  /** Génère un SKU libre pour une variante, avec suffixe en cas de collision. */
  async generateSku(params: {
    brandSlug: string;
    productSlug: string;
    size: string;
    color: string;
    excludeId?: string;
  }): Promise<string> {
    const base = this.baseSku(params.brandSlug, params.productSlug, params);
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const candidate = attempt === 1 ? base : `${base}-${attempt}`;
      const existing = await this.prisma.productVariant.findUnique({
        where: { sku: candidate },
        select: { id: true },
      });
      if (existing === null || existing.id === params.excludeId) return candidate;
    }
    throw new InternalServerErrorException({
      code: 'SKU_GENERATION_FAILED',
      message: 'Impossible de générer un SKU unique pour cette variante.',
    });
  }

  /**
   * Génère tous les SKU d'un produit en une passe (couleurs × pointures).
   * Détecte les doublons internes au lot et les collisions en base.
   */
  async generateSkusForProduct(
    brandSlug: string,
    productSlug: string,
    variants: SkuVariantInput[],
  ): Promise<Map<string, string>> {
    const bases = new Map<string, string>();
    for (const variant of variants) {
      const key = variantKey(variant.color, variant.size);
      if (bases.has(key)) {
        throw new BadRequestException({
          code: 'DUPLICATE_VARIANT',
          message: `Variante en doublon : ${variant.color} / ${variant.size}.`,
        });
      }
      bases.set(key, this.baseSku(brandSlug, productSlug, variant));
    }

    const existing = await this.prisma.productVariant.findMany({
      where: { sku: { in: [...bases.values()] } },
      select: { sku: true },
    });
    const used = new Set(existing.map((row) => row.sku));

    const result = new Map<string, string>();
    for (const [key, base] of bases) {
      let candidate = base;
      let attempt = 1;
      while (used.has(candidate)) {
        attempt += 1;
        if (attempt > MAX_ATTEMPTS) {
          throw new InternalServerErrorException({
            code: 'SKU_GENERATION_FAILED',
            message: 'Trop de collisions de SKU pour ce produit.',
          });
        }
        candidate = `${base}-${attempt}`;
      }
      used.add(candidate);
      result.set(key, candidate);
    }
    return result;
  }
}
