import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/database/database.module';
import type { AdminCatalogOptionsDto } from './dto/admin-catalog-options.dto';

// Options de saisie du formulaire produit admin. Contrairement à
// GET /categories (public), aucune restriction sur les produits publiés :
// un brouillon doit pouvoir cibler une catégorie ou une marque encore vide.
@Injectable()
export class AdminCatalogOptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOptions(): Promise<AdminCatalogOptionsDto> {
    const [categories, brands] = await Promise.all([
      this.prisma.category.findMany({
        orderBy: [{ position: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, slug: true, parentId: true },
      }),
      this.prisma.brand.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true },
      }),
    ]);

    return { categories, brands };
  }
}
