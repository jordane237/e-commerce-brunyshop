import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/database.module';
import type { StockAlertsQueryDto } from './dto/stock-alerts-query.dto';

interface StockAlertRow {
  variantId: string;
  productId: string;
  productName: string;
  sku: string;
  size: string;
  color: string;
  stock: number;
  reservedStock: number;
  availableStock: number;
  threshold: number;
  status: 'LOW' | 'OUT';
  lowStockAlertSentAt: Date | null;
}

interface StockAlertCounts {
  total: number;
  lowCount: number;
  outCount: number;
}

@Injectable()
export class StockAlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: StockAlertsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const threshold = query.threshold;

    const thresholdSql =
      threshold === undefined ? Prisma.sql`v."lowStockThreshold"` : Prisma.sql`${threshold}::int`;
    const productFilter =
      query.productId === undefined ? Prisma.empty : Prisma.sql`AND p."id" = ${query.productId}`;
    const filter = Prisma.sql`
      p."deletedAt" IS NULL
      AND p."status" = 'PUBLISHED'
      AND (v."stock" - v."reservedStock") <= ${thresholdSql}
      ${productFilter}
    `;

    const [rows, counts] = await Promise.all([
      this.prisma.$queryRaw<StockAlertRow[]>(Prisma.sql`
        SELECT
          v."id" AS "variantId",
          p."id" AS "productId",
          p."name" AS "productName",
          v."sku" AS "sku",
          v."size" AS "size",
          v."color" AS "color",
          v."stock" AS "stock",
          v."reservedStock" AS "reservedStock",
          GREATEST(0, v."stock" - v."reservedStock") AS "availableStock",
          ${thresholdSql} AS "threshold",
          CASE
            WHEN v."stock" - v."reservedStock" <= 0 THEN 'OUT'
            ELSE 'LOW'
          END AS "status",
          v."lowStockAlertSentAt" AS "lowStockAlertSentAt"
        FROM "ProductVariant" v
        INNER JOIN "Product" p ON p."id" = v."productId"
        WHERE ${filter}
        ORDER BY "availableStock" ASC, v."updatedAt" DESC
        LIMIT ${limit} OFFSET ${offset}
      `),
      this.prisma.$queryRaw<StockAlertCounts[]>(Prisma.sql`
        SELECT
          COUNT(*)::int AS "total",
          COUNT(*) FILTER (WHERE v."stock" - v."reservedStock" > 0)::int AS "lowCount",
          COUNT(*) FILTER (WHERE v."stock" - v."reservedStock" <= 0)::int AS "outCount"
        FROM "ProductVariant" v
        INNER JOIN "Product" p ON p."id" = v."productId"
        WHERE ${filter}
      `),
    ]);

    const totals = counts[0] ?? { total: 0, lowCount: 0, outCount: 0 };
    return {
      data: rows.map((row) => ({
        ...row,
        availableStock: Number(row.availableStock),
        lowStockAlertSentAt: row.lowStockAlertSentAt?.toISOString() ?? null,
      })),
      meta: {
        total: Number(totals.total),
        page,
        limit,
        totalPages: Math.ceil(Number(totals.total) / limit),
        lowCount: Number(totals.lowCount),
        outCount: Number(totals.outCount),
      },
    };
  }
}
