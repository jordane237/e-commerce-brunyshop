/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// admin-products.service.test.ts
// Tests unitaires de la couche métier admin catalogue (CAT-04).
// NOTE: dette lint locale conservée (contrainte utilisateur : ne pas modifier les mocks/logique).

import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { Prisma } from '../../../generated/prisma/client';
import type { PrismaService } from '../../../infrastructure/database/database.module';
import { AdminProductsService, CatalogActor } from './admin-products.service';
import { ACTIONS } from './catalog-audit.actions';

const ACTOR: CatalogActor = { userId: 'actor-1', ip: '127.0.0.1', userAgent: 'admin-ci/1.0' };

// ------------------------------------------------------------------ helpers

function makeProductRow(
  overrides: {
    id?: string;
    name?: string;
    slug?: string;
    description?: string;
    status?: string;
    basePrice?: number;
    promoPrice?: number | null;
    promoStart?: Date | null;
    promoEnd?: Date | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    categoryId?: string;
    brandId?: string;
    category?: { id: string; name: string; slug: string };
    brand?: { id: string; name: string; slug: string; logo: unknown };
    variants?: Array<{
      id: string;
      sku: string;
      color: string;
      size: string;
      price: number | null;
      stock: number;
      reservedStock: number;
      lowStockThreshold: number;
      version: number;
    }>;
    images?: Array<{
      id: string;
      url: string;
      alt: string | null;
      position: number;
      variantColor: string | null;
    }>;
  } = {},
): {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  basePrice: number;
  promoPrice: number | null;
  promoStart: Date | null;
  promoEnd: Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
  categoryId: string;
  brandId: string;
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string; slug: string; logo: unknown };
  variants: Array<{
    id: string;
    sku: string;
    color: string;
    size: string;
    price: number | null;
    stock: number;
    reservedStock: number;
    lowStockThreshold: number;
    version: number;
  }>;
  images: Array<{
    id: string;
    url: string;
    alt: string | null;
    position: number;
    variantColor: string | null;
  }>;
} {
  return {
    id: overrides.id ?? 'product-1',
    name: overrides.name ?? 'Air Max 90 Noir',
    slug: overrides.slug ?? 'air-max-90-noir',
    description: overrides.description ?? 'Description du produit.',
    status: overrides.status ?? 'DRAFT',
    basePrice: overrides.basePrice ?? 45000,
    promoPrice: overrides.promoPrice ?? null,
    promoStart: overrides.promoStart ?? null,
    promoEnd: overrides.promoEnd ?? null,
    seoTitle: overrides.seoTitle ?? null,
    seoDescription: overrides.seoDescription ?? null,
    categoryId: overrides.categoryId ?? 'cat-1',
    brandId: overrides.brandId ?? 'brand-1',
    category: overrides.category ?? { id: 'cat-1', name: 'Sneakers', slug: 'sneakers' },
    brand: overrides.brand ?? { id: 'brand-1', name: 'Nike', slug: 'nike', logo: null },
    variants: overrides.variants ?? [
      {
        id: 'v-1',
        sku: 'NIKE-AIRMAX90-42-NOIR',
        color: 'NOIR',
        size: '42',
        price: null,
        stock: 10,
        reservedStock: 0,
        lowStockThreshold: 5,
        version: 1,
      },
    ],
    images: overrides.images ?? [
      {
        id: 'img-1',
        url: 'https://cdn.brunyshop.cm/products/air-max-noir.jpg',
        alt: 'Air Max 90 Noir',
        position: 0,
        variantColor: null,
      },
    ],
  } as any;
}

function makeVariantRow(
  overrides: {
    id?: string;
    sku?: string;
    color?: string;
    size?: string;
    price?: number | null;
    stock?: number;
    reservedStock?: number;
    lowStockThreshold?: number;
    version?: number;
  } = {},
): {
  id: string;
  sku: string;
  color: string;
  size: string;
  price: number | null;
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
  version: number;
} {
  return {
    id: overrides.id ?? 'v-1',
    sku: overrides.sku ?? 'NIKE-AIRMAX90-42-NOIR',
    color: overrides.color ?? 'NOIR',
    size: overrides.size ?? '42',
    price: overrides.price ?? null,
    stock: overrides.stock ?? 10,
    reservedStock: overrides.reservedStock ?? 0,
    lowStockThreshold: overrides.lowStockThreshold ?? 5,
    version: overrides.version ?? 1,
  } as any;
}

type TxMock = {
  product: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  productVariant: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
  category: { findUnique: ReturnType<typeof vi.fn> };
  brand: { findUnique: ReturnType<typeof vi.fn> };
  orderItem: { findMany: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
  stockMovement: { create: ReturnType<typeof vi.fn> };
  auditLog: { create: ReturnType<typeof vi.fn> };
};

function makeTxMock(
  productCreate: TxMock['product']['create'],
  existingProduct: ReturnType<typeof makeProductRow>,
): TxMock {
  return {
    product: {
      create: productCreate,
      findUnique: vi.fn().mockResolvedValue(existingProduct),
      update: vi.fn().mockImplementation(async (args) => {
        if (args.where.id === 'product-1') {
          return { ...existingProduct, ...args.data, id: args.where.id } as any;
        }
        throw new Prisma.PrismaClientKnownRequestError('P2025', 'not found', {});
      }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    productVariant: {
      create: vi.fn(),
      update: vi.fn().mockImplementation(async (args) => {
        const before = existingProduct.variants.find((v) => v.id === args.where.id);
        if (!before) throw new BadRequestException({ code: 'VARIANT_NOT_OWNED', message: '' });
        return { ...before, ...args.data, id: args.where.id, version: before.version + 1 } as any;
      }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      findUnique: vi.fn().mockImplementation(async (args) => {
        return existingProduct.variants.find((v) => v.sku === args.where.sku) ?? null;
      }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    category: { findUnique: vi.fn().mockResolvedValue(null) },
    brand: { findUnique: vi.fn().mockResolvedValue(null) },
    orderItem: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
    stockMovement: { create: vi.fn() },
    auditLog: { create: vi.fn() },
  };
}

function makeService({
  productCreate = vi.fn().mockResolvedValue(makeProductRow({ id: 'p-new' })),
  existingProduct = makeProductRow({ id: 'product-1' }),
  categoryId = 'cat-1',
  brandSlug = 'nike',
  brandName = 'Nike',
  categorySlug = 'sneakers',
  existingSlug = undefined as string | undefined,
  variantFindUnique = vi.fn().mockResolvedValue(null),
  variantFindMany = vi.fn().mockResolvedValue([]),
  orderItemFindMany = vi.fn().mockResolvedValue([]),
  skuGenerator = vi.fn().mockResolvedValue(new Map([['noir|42', 'NIKE-AIRMAX90-42-NOIR']])),
  slugGenerator = vi.fn().mockResolvedValue('air-max-90-noir'),
}: {
  productCreate?: typeof productCreate;
  existingProduct?: typeof existingProduct;
  categoryId?: string;
  brandSlug?: string;
  brandName?: string;
  categorySlug?: string;
  existingSlug?: string;
  variantFindUnique?: typeof variantFindUnique;
  variantFindMany?: typeof variantFindMany;
  orderItemFindMany?: typeof orderItemFindMany;
  skuGenerator?: typeof skuGenerator;
  slugGenerator?: typeof slugGenerator;
} = {}) {
  // Mocks partagés pour que le service les récupère via `this.prisma.productVariant.findUnique` etc.
  const productFindUnique = vi.fn();
  const categoryFindUnique = vi.fn();
  const brandFindUnique = vi.fn();
  const productVariantFindUnique = variantFindUnique;
  const productVariantFindMany = variantFindMany;
  const orderItemFindManyMock = orderItemFindMany;

  // Le service résout les relations avant la transaction.
  productFindUnique.mockResolvedValue(
    existingSlug ? { id: 'product-existing', slug: existingSlug } : null,
  );
  categoryFindUnique.mockResolvedValue({ id: categoryId, name: 'Cat', slug: categorySlug });
  brandFindUnique.mockResolvedValue({ id: 'brand-1', name: brandName, slug: brandSlug });

  const transactionMock = vi.fn<(fn: (tx: TxMock) => unknown) => unknown>();
  const prismaMock: Partial<PrismaService> & { $transaction: typeof transactionMock } = {
    product: {
      findUnique: productFindUnique,
      create: productCreate,
      update: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn().mockResolvedValue(1),
    },
    productVariant: {
      findUnique: productVariantFindUnique,
      findMany: productVariantFindMany,
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    category: { findUnique: categoryFindUnique },
    brand: { findUnique: brandFindUnique },
    orderItem: { findMany: orderItemFindMany, count: vi.fn().mockResolvedValue(0) },
    stockMovement: { create: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: transactionMock,
  } as any;

  const slugGen = { generateUniqueSlug: slugGenerator };
  const skuGen = { generateSkusForProduct: skuGenerator };

  const service = new AdminProductsService(
    prismaMock as PrismaService,
    { record: vi.fn() } as any,
    { invalidateProducts: vi.fn().mockResolvedValue(undefined) } as any,
    slugGen as any,
    skuGen as any,
  );

  return {
    service,
    prisma: prismaMock,
    txMock: (pc: TxMock['product']['create']) => makeTxMock(pc, existingProduct),
    productCreate,
    productFindUnique,
    categoryFindUnique,
    brandFindUnique,
    productVariantFindUnique,
    productVariantFindMany,
    orderItemFindMany,
    transactionMock,
    productFindUniqueResolved: (prismaMock as any).product?.findUnique ?? productFindUnique,
    skuGenerator: skuGen.generateSkusForProduct as ReturnType<typeof vi.fn>,
    slugGenerator: slugGen.generateUniqueSlug as ReturnType<typeof vi.fn>,
    invalidateProducts: (prismaMock as any).invalidateProducts,
    auditCreate: (prismaMock as any).auditLog?.create || vi.fn(),
  };
}

// ------------------------------------------------------------- create

describe('AdminProductsService.create', () => {
  it('crée un produit, génère les SKU, audit et invalide le cache', async () => {
    const variants = [
      { color: 'NOIR', size: '42', stock: 10 },
      { color: 'BLANC', size: '42', stock: 5 },
    ];
    const skuMap = new Map<string, string>();
    variants.forEach((v, idx) => {
      skuMap.set(`${v.color.toLowerCase()}|${v.size.toLowerCase()}`, `SKU-${idx + 1}`);
    });
    const createdProduct = makeProductRow({
      id: 'p-new',
      variants: [
        makeVariantRow({ id: 'v-new-1', sku: 'SKU-1', color: 'NOIR', size: '42', stock: 10 }),
        makeVariantRow({ id: 'v-new-2', sku: 'SKU-2', color: 'BLANC', size: '42', stock: 5 }),
      ],
    });

    const { service, txMock, productCreate, auditCreate, invalidateProducts } = makeService({
      skuGenerator: vi.fn().mockResolvedValue(skuMap),
      productCreate: vi.fn().mockResolvedValue(createdProduct),
    });

    const tx = txMock(productCreate);
    transactionMock.mockImplementation(async (fn) => fn(tx));

    const dto = {
      name: 'Air Max 90 Noir',
      description: 'Description.',
      categoryId: 'cat-1',
      brandId: 'brand-1',
      basePrice: 45000,
      variants: variants.map((v) => ({ ...v, price: undefined })),
    };

    const result = await service.create(dto as any, ACTOR);

    expect(result.id).toBe('p-new');
    expect(result.variants).toHaveLength(2);
    expect(tx.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Air Max 90 Noir',
          basePrice: 45000,
          variants: expect.arrayContaining([
            expect.objectContaining({ sku: 'SKU-1', color: 'NOIR', size: '42', stock: 10 }),
            expect.objectContaining({ sku: 'SKU-2', color: 'BLANC', size: '42', stock: 5 }),
          ]),
        }),
      }),
    );
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: ACTIONS.PRODUCT_CREATED, entity: 'Product' }),
    );
    expect(invalidateProducts).toHaveBeenCalledTimes(1);

    transactionMock.mockRestore();
  });

  it('génère un produit cartésien quand colors+sizes sont fournis', async () => {
    const skuMap = new Map<string, string>();
    skuMap.set('noir|40', 'SKU-1');
    skuMap.set('noir|41', 'SKU-2');
    skuMap.set('blanc|40', 'SKU-3');
    skuMap.set('blanc|41', 'SKU-4');

    const { service, txMock, productCreate, auditCreate } = makeService({
      skuGenerator: vi.fn().mockResolvedValue(skuMap),
      productCreate: vi.fn().mockResolvedValue(
        makeProductRow({
          id: 'p-cartesian',
          variants: [
            makeVariantRow({ id: 'v1', sku: 'SKU-1', color: 'NOIR', size: '40', stock: 0 }),
            makeVariantRow({ id: 'v2', sku: 'SKU-2', color: 'NOIR', size: '41', stock: 0 }),
            makeVariantRow({ id: 'v3', sku: 'SKU-3', color: 'BLANC', size: '40', stock: 0 }),
            makeVariantRow({ id: 'v4', sku: 'SKU-4', color: 'BLANC', size: '41', stock: 0 }),
          ],
        }),
      ),
    });

    const tx = txMock(productCreate);
    transactionMock.mockImplementation(async (fn) => fn(tx));

    const dto = {
      name: 'Produit Cartésien',
      description: 'Description.',
      categoryId: 'cat-1',
      brandId: 'brand-1',
      basePrice: 20000,
      colors: ['NOIR', 'BLANC'],
      sizes: ['40', '41'],
    };

    const result = await service.create(dto as any, ACTOR);

    expect(result.variants).toHaveLength(4);
    expect(tx.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          variants: expect.arrayContaining([
            expect.objectContaining({ color: 'NOIR', size: '40', stock: 0, sku: 'SKU-1' }),
            expect.objectContaining({ color: 'NOIR', size: '41', stock: 0, sku: 'SKU-2' }),
            expect.objectContaining({ color: 'BLANC', size: '40', stock: 0, sku: 'SKU-3' }),
            expect.objectContaining({ color: 'BLANC', size: '41', stock: 0, sku: 'SKU-4' }),
          ]),
        }),
      }),
    );
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: ACTIONS.PRODUCT_CREATED }),
    );
  });

  it('rejette la création avec promoPrice >= basePrice', async () => {
    const { service } = makeService();
    const dto = {
      name: 'Produit',
      description: 'Desc.',
      categoryId: 'cat-1',
      brandId: 'brand-1',
      basePrice: 45000,
      promoPrice: 45000,
      variants: [{ color: 'NOIR', size: '42', stock: 10 }],
    };
    await expect(service.create(dto as any, ACTOR)).rejects.toMatchObject({
      response: { code: 'PROMO_PRICE_INVALID' },
    });
  });

  it('rejette la création publiée sans stock', async () => {
    const { service } = makeService();
    const dto = {
      name: 'Produit',
      description: 'Desc.',
      categoryId: 'cat-1',
      brandId: 'brand-1',
      basePrice: 45000,
      status: 'PUBLISHED',
      variants: [{ color: 'NOIR', size: '42', stock: 0 }],
    };
    await expect(service.create(dto as any, ACTOR)).rejects.toMatchObject({
      response: { code: 'PUBLISHED_REQUIRES_STOCK' },
    });
  });

  it('rejette la création avec une catégorie inexistante', async () => {
    const { service, categoryFindUnique } = makeService();
    categoryFindUnique.mockResolvedValue(null);
    const dto = {
      name: 'Produit',
      description: 'Desc.',
      categoryId: 'cat-missing',
      brandId: 'brand-1',
      basePrice: 45000,
      variants: [{ color: 'NOIR', size: '42', stock: 10 }],
    };
    await expect(service.create(dto as any, ACTOR)).rejects.toMatchObject({
      response: { code: 'CATEGORY_NOT_FOUND' },
    });
  });

  it('rejette la création avec un slug déjà utilisé', async () => {
    const { service, productFindUnique } = makeService({ existingSlug: 'air-max-90-noir' });
    productFindUnique.mockResolvedValue({ id: 'p-existing', slug: 'air-max-90-noir' });
    const dto = {
      name: 'Air Max 90 Noir',
      description: 'Desc.',
      categoryId: 'cat-1',
      brandId: 'brand-1',
      basePrice: 45000,
      slug: 'air-max-90-noir',
      variants: [{ color: 'NOIR', size: '42', stock: 10 }],
    };
    await expect(service.create(dto as any, ACTOR)).rejects.toMatchObject({
      response: { code: 'SLUG_ALREADY_EXISTS' },
    });
  });

  it('rejette la création avec un doublon de couleur+pointure', async () => {
    const { service } = makeService();
    const dto = {
      name: 'Produit',
      description: 'Desc.',
      categoryId: 'cat-1',
      brandId: 'brand-1',
      basePrice: 45000,
      variants: [
        { color: 'NOIR', size: '42', stock: 10 },
        { color: 'NOIR', size: '42', stock: 5 },
      ],
    };
    await expect(service.create(dto as any, ACTOR)).rejects.toMatchObject({
      response: { code: 'DUPLICATE_VARIANT' },
    });
  });

  it('rejette la création avec promoStart >= promoEnd', async () => {
    const { service } = makeService();
    const dto = {
      name: 'Produit',
      description: 'Desc.',
      categoryId: 'cat-1',
      brandId: 'brand-1',
      basePrice: 45000,
      promoPrice: 35000,
      promoStart: '2026-12-01T00:00:00Z',
      promoEnd: '2026-11-01T00:00:00Z',
      variants: [{ color: 'NOIR', size: '42', stock: 10 }],
    };
    await expect(service.create(dto as any, ACTOR)).rejects.toMatchObject({
      response: { code: 'PROMO_WINDOW_INVALID' },
    });
  });
});

// ------------------------------------------------------------- update

describe('AdminProductsService.update', () => {
  it('ne fait rien quand aucun champ pertinent n’est fourni', async () => {
    const { service, prisma, auditCreate } = makeService();
    await service.update('product-1', {}, ACTOR);
    expect(prisma.product?.update).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it('met à jour le prix et émet PRODUCT_PRICE_UPDATED', async () => {
    const existing = makeProductRow({ basePrice: 45000, promoPrice: null });
    const { service, txMock, productCreate, auditCreate, invalidateProducts } = makeService({
      existingProduct: existing,
      productCreate: vi.fn().mockResolvedValue(makeProductRow({ ...existing, basePrice: 50000 })),
    });
    const tx = txMock(productCreate);
    transactionMock.mockImplementation(async (fn) => fn(tx));

    const result = await service.update('product-1', { basePrice: 50000 }, ACTOR);

    expect(result.basePrice).toBe(50000);
    expect(tx.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ basePrice: 50000 }) }),
    );
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: ACTIONS.PRODUCT_PRICE_UPDATED }),
    );
    expect(invalidateProducts).toHaveBeenCalledTimes(1);
  });

  it('émet PRODUCT_STATUS_UPDATED quand le statut change', async () => {
    const existing = makeProductRow({ status: 'DRAFT' });
    const { service, txMock, productCreate, auditCreate } = makeService({
      existingProduct: existing,
      productCreate: vi
        .fn()
        .mockResolvedValue(makeProductRow({ ...existing, status: 'PUBLISHED' })),
    });
    const tx = txMock(productCreate);
    transactionMock.mockImplementation(async (fn) => fn(tx));

    await service.update('product-1', { status: 'PUBLISHED' }, ACTOR);

    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: ACTIONS.PRODUCT_STATUS_UPDATED }),
    );
    transactionMock.mockRestore();
  });

  it('émet PRODUCT_UPDATED quand les métadonnées changent', async () => {
    const existing = makeProductRow({ name: 'Ancien Nom', slug: 'ancien-slug' });
    const { service, txMock, productCreate, auditCreate } = makeService({
      existingProduct: existing,
      productCreate: vi
        .fn()
        .mockResolvedValue(makeProductRow({ name: 'Nouveau Nom', slug: 'nouveau-slug' })),
    });
    const tx = txMock(productCreate);
    transactionMock.mockImplementation(async (fn) => fn(tx));

    await service.update('product-1', { name: 'Nouveau Nom', slug: 'nouveau-slug' }, ACTOR);

    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: ACTIONS.PRODUCT_UPDATED }),
    );
    transactionMock.mockRestore();
  });

  it('rejette la mise à jour d’un produit introuvable', async () => {
    const { service, productFindUnique } = makeService();
    productFindUnique.mockResolvedValue(null);
    await expect(service.update('missing', {}, ACTOR)).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ------------------------------------------------------------- archive

describe('AdminProductsService.archive', () => {
  it('archive un produit et émet PRODUCT_ARCHIVED', async () => {
    const existing = makeProductRow({ status: 'PUBLISHED' });
    const { service, txMock, productCreate, auditCreate, invalidateProducts } = makeService({
      existingProduct: existing,
      productCreate: vi.fn().mockResolvedValue(makeProductRow({ status: 'ARCHIVED' })),
    });
    const tx = txMock(productCreate);
    transactionMock.mockImplementation(async (fn) => fn(tx));

    await service.archive('product-1', ACTOR);

    expect(tx.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'ARCHIVED' } }),
    );
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: ACTIONS.PRODUCT_ARCHIVED }),
    );
    expect(invalidateProducts).toHaveBeenCalledTimes(1);
    transactionMock.mockRestore();
  });

  it('ne fait rien sur un produit déjà ARCHIVED', async () => {
    const existing = makeProductRow({ status: 'ARCHIVED' });
    const { service, txMock, productCreate, auditCreate } = makeService({
      existingProduct: existing,
      productCreate: vi.fn(),
    });
    const tx = txMock(productCreate);
    transactionMock.mockImplementation(async (fn) => fn(tx));

    await service.archive('product-1', ACTOR);

    expect(tx.product.update).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
    transactionMock.mockRestore();
  });

  it('rejette l’archivage d’un produit introuvable', async () => {
    const { service, productFindUnique } = makeService();
    productFindUnique.mockResolvedValue(null);
    await expect(service.archive('missing', ACTOR)).rejects.toBeInstanceOf(NotFoundException);
  });
});

// --------------------------------------------------------- replaceVariants

describe('AdminProductsService.replaceVariants', () => {
  it('met à jour le stock et émet PRODUCT_STOCK_UPDATED + StockMovement', async () => {
    const existing = makeProductRow({
      variants: [makeVariantRow({ id: 'v-1', sku: 'SKU-OLD', stock: 10 })],
      brand: { id: 'brand-1', name: 'Nike', slug: 'nike', logo: null },
    });
    const { service, txMock, productCreate, auditCreate, orderItemFindMany, skuGenerator } =
      makeService({
        existingProduct: existing,
        productCreate: vi
          .fn()
          .mockResolvedValue(
            makeProductRow({
              variants: [makeVariantRow({ id: 'v-1', sku: 'SKU-OLD', stock: 15 })],
            }),
          ),
      });
    const tx = txMock(productCreate);
    transactionMock.mockImplementation(async (fn) => fn(tx));
    orderItemFindMany.mockResolvedValue([]);
    skuGenerator.mockResolvedValue(new Map());

    await service.replaceVariants(
      'product-1',
      { variants: [{ id: 'v-1', color: 'NOIR', size: '42', stock: 15 }] },
      ACTOR,
    );

    expect(tx.productVariant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ stock: 15, version: { increment: 1 } }),
      }),
    );
    expect(tx.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({ delta: 5, reason: 'ADJUSTMENT' }),
    );
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: ACTIONS.PRODUCT_STOCK_UPDATED, entity: 'ProductVariant' }),
    );
    transactionMock.mockRestore();
  });

  it('met à jour le prix et émet PRODUCT_PRICE_UPDATED', async () => {
    const existing = makeProductRow({
      variants: [makeVariantRow({ id: 'v-1', sku: 'SKU-OLD', price: null })],
      brand: { id: 'brand-1', name: 'Nike', slug: 'nike', logo: null },
    });
    const { service, txMock, productCreate, auditCreate, orderItemFindMany, skuGenerator } =
      makeService({
        existingProduct: existing,
        productCreate: vi
          .fn()
          .mockResolvedValue(
            makeProductRow({
              variants: [makeVariantRow({ id: 'v-1', sku: 'SKU-OLD', price: 5000 })],
            }),
          ),
      });
    const tx = txMock(productCreate);
    transactionMock.mockImplementation(async (fn) => fn(tx));
    orderItemFindMany.mockResolvedValue([]);
    skuGenerator.mockResolvedValue(new Map());

    await service.replaceVariants(
      'product-1',
      { variants: [{ id: 'v-1', color: 'NOIR', size: '42', price: 5000 }] },
      ACTOR,
    );

    expect(tx.productVariant.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ price: 5000 }) }),
    );
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: ACTIONS.PRODUCT_PRICE_UPDATED, entity: 'ProductVariant' }),
    );
    transactionMock.mockRestore();
  });

  it('rejette la suppression d’une variante liée à une commande (409)', async () => {
    const existing = makeProductRow({
      variants: [
        makeVariantRow({ id: 'v-1', sku: 'SKU-1', stock: 10 }),
        makeVariantRow({ id: 'v-2', sku: 'SKU-2', stock: 5 }),
      ],
      brand: { id: 'brand-1', name: 'Nike', slug: 'nike', logo: null },
    });
    const { service, orderItemFindMany, skuGenerator } = makeService({
      existingProduct: existing,
      skuGenerator: vi.fn().mockResolvedValue(new Map()),
    });
    orderItemFindMany.mockResolvedValue([{ variantId: 'v-2' }]);

    await expect(
      service.replaceVariants(
        'product-1',
        { variants: [{ id: 'v-1', color: 'NOIR', size: '42', stock: 10 }] },
        ACTOR,
      ),
    ).rejects.toMatchObject({ response: { code: 'VARIANT_HAS_ORDERS' } });
  });

  it('rejette la mise à jour d’une variante d’un autre produit', async () => {
    const existing = makeProductRow({
      variants: [makeVariantRow({ id: 'v-1', sku: 'SKU-1' })],
      brand: { id: 'brand-1', name: 'Nike', slug: 'nike', logo: null },
    });
    const { service, skuGenerator } = makeService({
      existingProduct: existing,
      skuGenerator: vi.fn().mockResolvedValue(new Map()),
    });

    await expect(
      service.replaceVariants(
        'product-1',
        { variants: [{ id: 'v-other', color: 'NOIR', size: '42', stock: 10 }] },
        ACTOR,
      ),
    ).rejects.toMatchObject({ response: { code: 'VARIANT_NOT_OWNED' } });
  });

  it('crée une nouvelle variante avec un SKU généré', async () => {
    const existing = makeProductRow({
      variants: [makeVariantRow({ id: 'v-1', sku: 'SKU-EXISTING' })],
      brand: { id: 'brand-1', name: 'Nike', slug: 'nike', logo: null },
    });
    const newVariant = makeVariantRow({
      id: 'v-new',
      sku: 'NIKE-AIRMAX90-42-BLANC',
      color: 'BLANC',
      size: '42',
      stock: 5,
    });
    const {
      service,
      txMock,
      productCreate,
      skuGenerator,
      productVariantFindMany,
      transactionMock: txGlobal,
    } = makeService({
      existingProduct: existing,
      productCreate: vi.fn().mockResolvedValue(
        makeProductRow({
          variants: [makeVariantRow({ id: 'v-1', sku: 'SKU-EXISTING' }), newVariant],
        }),
      ),
      skuGenerator: vi.fn().mockResolvedValue(new Map([['blanc|42', 'NIKE-AIRMAX90-42-BLANC']])),
    });
    const tx = txMock(productCreate);
    txGlobal.mockImplementation(async (fn) => fn(tx));
    productVariantFindMany.mockResolvedValue([]);

    const result = await service.replaceVariants(
      'product-1',
      { variants: [{ color: 'BLANC', size: '42', stock: 5 }] },
      ACTOR,
    );

    expect(result.variants).toHaveLength(2);
    expect(tx.productVariant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sku: 'NIKE-AIRMAX90-42-BLANC',
          color: 'BLANC',
          size: '42',
          stock: 5,
        }),
      }),
    );
    txGlobal.mockRestore();
  });

  it('rejette l’accès à une variante d’un autre produit', async () => {
    const existing = makeProductRow({
      variants: [makeVariantRow({ id: 'v-1', sku: 'SKU-1' })],
      brand: { id: 'brand-1', name: 'Nike', slug: 'nike', logo: null },
    });
    const { service, skuGenerator, productFindUniqueResolved } = makeService({
      existingProduct: existing,
      skuGenerator: vi.fn().mockResolvedValue(new Map()),
    });
    productFindUniqueResolved.mockResolvedValue(existing);

    await expect(
      service.replaceVariants(
        'product-1',
        { variants: [{ id: 'v-other', color: 'NOIR', size: '42', stock: 10 }] },
        ACTOR,
      ),
    ).rejects.toMatchObject({ response: { code: 'VARIANT_NOT_OWNED' } });
  });

  it('rejette une variante avec doublon de couleur+pointure dans le payload', async () => {
    const existing = makeProductRow({
      brand: { id: 'brand-1', name: 'Nike', slug: 'nike', logo: null },
    });
    const { service, skuGenerator, productFindUniqueResolved } = makeService({
      existingProduct: existing,
      skuGenerator: vi.fn().mockResolvedValue(new Map()),
    });
    productFindUniqueResolved.mockResolvedValue(existing);

    await expect(
      service.replaceVariants(
        'product-1',
        {
          variants: [
            { color: 'NOIR', size: '42', stock: 10 },
            { color: 'NOIR', size: '42', stock: 5 },
          ],
        },
        ACTOR,
      ),
    ).rejects.toMatchObject({ response: { code: 'DUPLICATE_VARIANT' } });
  });

  it('rejette la mise à jour d’un produit introuvable', async () => {
    const { service, productFindUnique } = makeService();
    productFindUnique.mockResolvedValue(null);
    await expect(
      service.replaceVariants(
        'missing',
        { variants: [{ color: 'NOIR', size: '42', stock: 10 }] },
        ACTOR,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

// --------------------------------------------------------- duplicate

describe('AdminProductsService.duplicate', () => {
  it('duplique en DRAFT avec de nouveaux SKU et émet un audit', async () => {
    const source = makeProductRow({
      id: 'source-1',
      slug: 'source-slug',
      variants: [makeVariantRow({ id: 'v-1', sku: 'SOURCE-SKU', stock: 10 })],
      images: [
        {
          id: 'img-1',
          url: 'https://cdn.example.com/img.jpg',
          alt: null,
          position: 0,
          variantColor: null,
        },
      ],
      brand: { id: 'brand-1', name: 'Nike', slug: 'nike', logo: null },
    });
    const duplicate = makeProductRow({
      id: 'dup-1',
      slug: 'source-slug-2',
      name: 'Source (copie)',
      status: 'DRAFT',
      variants: [makeVariantRow({ id: 'v-dup-1', sku: 'DUP-SKU', stock: 10 })],
      images: source.images,
    });
    const {
      service,
      txMock,
      productCreate,
      auditCreate,
      invalidateProducts,
      skuGenerator: skuGen,
      transactionMock: txGlobal,
      productFindUniqueResolved,
    } = makeService({
      existingProduct: source,
      productCreate: vi.fn().mockResolvedValue(duplicate),
      skuGenerator: vi.fn().mockResolvedValue(new Map([['noir|42', 'DUP-SKU']])),
    });
    const tx = txMock(productCreate, source);
    productFindUniqueResolved.mockResolvedValue(source);
    txGlobal.mockImplementation(async (fn) => fn(tx));

    const result = await service.duplicate('source-1', { name: 'Source (copie)' }, ACTOR);

    expect(result.status).toBe('DRAFT');
    expect(result.name).toBe('Source (copie)');
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0].sku).toBe('DUP-SKU');
    expect(tx.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'DRAFT',
          variants: expect.arrayContaining([
            expect.objectContaining({ sku: 'DUP-SKU', stock: 10 }),
          ]),
        }),
      }),
    );
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: ACTIONS.PRODUCT_DUPLICATED }),
    );
    expect(invalidateProducts).toHaveBeenCalledTimes(1);
    txGlobal.mockRestore();
  });

  it('duplique avec resetStock=true', async () => {
    const source = makeProductRow({
      variants: [makeVariantRow({ id: 'v-1', sku: 'SOURCE-SKU', stock: 10 })],
      brand: { id: 'brand-1', name: 'Nike', slug: 'nike', logo: null },
    });
    const duplicate = makeProductRow({
      id: 'dup-1',
      slug: 'source-slug-2',
      variants: [makeVariantRow({ id: 'v-dup-1', sku: 'DUP-SKU', stock: 0 })],
    });
    const {
      service,
      txMock,
      productCreate,
      skuGenerator: skuGen2,
      transactionMock: txGlobal,
      productFindUniqueResolved,
    } = makeService({
      existingProduct: source,
      productCreate: vi.fn().mockResolvedValue(duplicate),
      skuGenerator: vi.fn().mockResolvedValue(new Map([['noir|42', 'DUP-SKU']])),
    });
    const tx = txMock(productCreate, source);
    productFindUniqueResolved.mockResolvedValue(source);
    txGlobal.mockImplementation(async (fn) => fn(tx));

    const result = await service.duplicate('source-1', { resetStock: true }, ACTOR);

    expect(result.variants[0].stock).toBe(0);
    txGlobal.mockRestore();
  });

  it('duplique sans variantes quand copyVariants=false', async () => {
    const source = makeProductRow({
      brand: { id: 'brand-1', name: 'Nike', slug: 'nike', logo: null },
    });
    const duplicate = makeProductRow({ id: 'dup-1', slug: 'source-slug-2', variants: [] });
    const {
      service,
      txMock,
      productCreate,
      skuGenerator: skuGen3,
      transactionMock: txGlobal,
      productFindUniqueResolved,
    } = makeService({
      existingProduct: source,
      productCreate: vi.fn().mockResolvedValue(duplicate),
      skuGenerator: vi.fn().mockResolvedValue(new Map()),
    });
    const tx = txMock(productCreate, source);
    productFindUniqueResolved.mockResolvedValue(source);
    txGlobal.mockImplementation(async (fn) => fn(tx));

    const result = await service.duplicate('source-1', { copyVariants: false }, ACTOR);

    expect(result.variants).toHaveLength(0);
    expect(tx.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ variants: expect.anything() }),
      }),
    );
    txGlobal.mockRestore();
  });
  it('rejette la duplication d’un produit introuvable', async () => {
    const { service, productFindUniqueResolved } = makeService();
    productFindUniqueResolved.mockResolvedValue(null);
    await expect(service.duplicate('missing', {}, ACTOR)).rejects.toBeInstanceOf(NotFoundException);
  });
});
