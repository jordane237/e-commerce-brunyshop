import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/database.module';
import { AuditLogService } from '../../audit/audit.service';
import { CatalogCacheService } from '../cache/catalog-cache.service';
import type { SizeGuideTableDto } from './dto/size-guide-table.dto';
import type { SizeGuideResponseDto } from './dto/size-guide-response.dto';
import type { UpdateSizeGuideDto } from './dto/update-size-guide.dto';
import { SIZE_GUIDE_PUBLICS, type SizeGuideEntry, type SizeGuideTable } from './size-guide.types';

export interface SizeGuideActor {
  userId: string;
  ip?: string;
  userAgent?: string;
}

const EMPTY_TABLE_ERROR = 'Le guide doit contenir au moins une pointure.';

@Injectable()
export class SizeGuidesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CatalogCacheService,
    private readonly audit: AuditLogService,
  ) {}

  async getByCategoryId(categoryId: string): Promise<SizeGuideResponseDto> {
    const cached = await this.cache.getSizeGuide(categoryId);
    if (cached !== null) return cached;

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, sizeGuideId: true },
    });
    if (!category) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Catégorie introuvable.',
      });
    }
    if (!category.sizeGuideId) {
      throw new NotFoundException({
        code: 'SIZE_GUIDE_NOT_FOUND',
        message: 'Aucun guide des tailles n’est associé à cette catégorie.',
      });
    }

    const guide = await this.prisma.sizeGuide.findUnique({
      where: { id: category.sizeGuideId },
    });
    if (!guide) {
      throw new NotFoundException({
        code: 'SIZE_GUIDE_NOT_FOUND',
        message: 'Aucun guide des tailles n’est associé à cette catégorie.',
      });
    }

    const response = this.toResponse(guide);
    await this.cache.setSizeGuide(categoryId, response);
    return response;
  }

  async update(
    id: string,
    dto: UpdateSizeGuideDto,
    actor: SizeGuideActor,
  ): Promise<SizeGuideResponseDto> {
    const guide = await this.prisma.sizeGuide.findUnique({ where: { id } });
    if (!guide) {
      throw new NotFoundException({
        code: 'SIZE_GUIDE_NOT_FOUND',
        message: 'Guide des tailles introuvable.',
      });
    }

    if (dto.name === undefined && dto.description === undefined && dto.table === undefined) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Au moins un champ (name, description ou table) est requis.',
      });
    }

    const currentTable = this.normalizeStoredTable(guide.table);
    const nextTable = dto.table ? this.normalizeTable(dto.table) : currentTable;
    const tableChanged =
      dto.table !== undefined && JSON.stringify(nextTable) !== JSON.stringify(currentTable);

    const nextName = dto.name?.trim();
    if (nextName !== undefined && nextName === '') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Le nom du guide ne peut pas être vide.',
      });
    }
    const nextDescription =
      dto.description === undefined ? undefined : dto.description.trim() || null;

    const nameChanged = nextName !== undefined && nextName !== guide.name;
    const descriptionChanged =
      nextDescription !== undefined && nextDescription !== guide.description;
    if (!tableChanged && !nameChanged && !descriptionChanged) {
      return this.toResponse(guide);
    }

    const nextVersion = tableChanged ? this.nextVersion(guide.version) : guide.version;
    const before = {
      name: guide.name,
      version: guide.version,
      counts: this.counts(currentTable),
    };
    const after = {
      name: nextName ?? guide.name,
      version: nextVersion,
      counts: this.counts(nextTable),
    };

    const data: Prisma.SizeGuideUpdateInput = {};
    if (nameChanged && nextName !== undefined) data.name = nextName;
    if (descriptionChanged) data.description = nextDescription ?? null;
    if (tableChanged) {
      data.table = nextTable as unknown as Prisma.InputJsonValue;
      data.version = nextVersion;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.sizeGuide.update({ where: { id }, data });
      await this.audit.record(tx, {
        userId: actor.userId,
        action: 'SIZE_GUIDE_UPDATED',
        entity: 'SizeGuide',
        entityId: id,
        ip: actor.ip,
        userAgent: actor.userAgent,
        before,
        after,
      });
      return saved;
    });

    await this.cache.invalidateSizeGuides();
    return this.toResponse(updated);
  }

  /** Sorts each public by EU and rejects duplicates / empty tables. */
  private normalizeTable(input: SizeGuideTableDto | SizeGuideTable): SizeGuideTable {
    const normalized: SizeGuideTable = {};
    let total = 0;

    for (const publicName of SIZE_GUIDE_PUBLICS) {
      const rows = input[publicName];
      if (rows === undefined) continue;
      if (!Array.isArray(rows)) {
        throw this.invalidTable(`Le tableau ${publicName} doit être une liste.`);
      }
      const seen = new Set<number>();
      const entries: SizeGuideEntry[] = rows.map((row) => {
        if (
          !Number.isFinite(row.eu) ||
          !Number.isFinite(row.us) ||
          !Number.isFinite(row.uk) ||
          !Number.isFinite(row.cm) ||
          row.eu <= 0 ||
          row.us <= 0 ||
          row.uk <= 0 ||
          row.cm <= 0
        ) {
          throw this.invalidTable('Chaque pointure doit avoir EU, US, UK et cm positifs.');
        }
        if (seen.has(row.eu)) {
          throw this.invalidTable(
            `La pointure EU ${row.eu} est présente deux fois (${publicName}).`,
          );
        }
        seen.add(row.eu);
        return { eu: row.eu, us: row.us, uk: row.uk, cm: row.cm };
      });
      if (entries.length === 0) continue;
      entries.sort((left, right) => left.eu - right.eu);
      normalized[publicName] = entries;
      total += entries.length;
    }

    if (total === 0) throw this.invalidTable(EMPTY_TABLE_ERROR);
    return normalized;
  }

  private normalizeStoredTable(value: Prisma.JsonValue): SizeGuideTable {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw this.invalidTable('Le guide stocké est invalide.');
    }
    return this.normalizeTable(value as unknown as SizeGuideTable);
  }

  private invalidTable(message: string): BadRequestException {
    return new BadRequestException({ code: 'VALIDATION_ERROR', message });
  }

  private nextVersion(version: string): string {
    const match = /^v(\d+)$/.exec(version);
    return `v${(match ? Number(match[1]) : 1) + 1}`;
  }

  private counts(table: SizeGuideTable): Record<string, number> {
    return {
      men: table.men?.length ?? 0,
      women: table.women?.length ?? 0,
      kids: table.kids?.length ?? 0,
    };
  }

  private toResponse(guide: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    table: Prisma.JsonValue;
    version: string;
    publishedAt: Date | null;
    updatedAt: Date;
  }): SizeGuideResponseDto {
    return {
      id: guide.id,
      name: guide.name,
      slug: guide.slug,
      description: guide.description,
      table: this.normalizeStoredTable(guide.table),
      version: guide.version,
      publishedAt: guide.publishedAt,
      updatedAt: guide.updatedAt,
    };
  }
}
