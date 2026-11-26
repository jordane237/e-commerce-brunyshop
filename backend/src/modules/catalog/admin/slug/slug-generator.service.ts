// slug-generator.service.ts
// Génération de slug unique pour le catalogue (CAT-04).
// Aucune dépendance externe : normalisation NFD + suppression des accents.

import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/database.module';

const MAX_ATTEMPTS = 100;
// Laisse de la place au suffixe -NN sans dépasser les 180 caractères du DTO.
const MAX_SLUG_LENGTH = 150;

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '');
}

@Injectable()
export class SlugGeneratorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Slugifie `base` puis suffixe -2, -3… jusqu'à trouver un slug libre.
   * `excludeId` permet de conserver son propre slug lors d'une mise à jour.
   */
  async generateUniqueSlug(base: string, excludeId?: string): Promise<string> {
    const root = slugify(base);
    if (root === '') {
      throw new BadRequestException({
        code: 'INVALID_SLUG',
        message: 'Le nom fourni ne permet pas de générer un slug valide.',
      });
    }

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const candidate = attempt === 1 ? root : `${root}-${attempt}`;
      const existing = await this.prisma.product.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (existing === null || existing.id === excludeId) return candidate;
    }

    throw new InternalServerErrorException({
      code: 'SLUG_GENERATION_FAILED',
      message: 'Impossible de générer un slug unique, réessayez avec un autre nom.',
    });
  }
}
