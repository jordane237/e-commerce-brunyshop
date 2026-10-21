"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../infrastructure/database/database.module");
const audit_service_1 = require("../audit/audit.service");
const productSelection = {
    id: true,
    name: true,
    slug: true,
    description: true,
    basePrice: true,
    promoPrice: true,
    promoStart: true,
    promoEnd: true,
    category: { select: { id: true, name: true, slug: true } },
    brand: { select: { id: true, name: true, slug: true, logo: true } },
    images: { orderBy: { position: 'asc' } },
    variants: {
        select: { id: true, sku: true, color: true, size: true, price: true, stock: true },
        orderBy: [{ color: 'asc' }, { size: 'asc' }],
    },
};
let CatalogService = class CatalogService {
    prisma;
    auditLog;
    constructor(prisma, auditLog) {
        this.prisma = prisma;
        this.auditLog = auditLog;
    }
    async listProducts(query) {
        const clauses = [{ status: 'PUBLISHED', deletedAt: null }];
        if (query.category) {
            clauses.push({ category: { slug: query.category } });
        }
        if (query.q?.trim()) {
            clauses.push({
                OR: [
                    { name: { contains: query.q.trim(), mode: 'insensitive' } },
                    { description: { contains: query.q.trim(), mode: 'insensitive' } },
                    { brand: { name: { contains: query.q.trim(), mode: 'insensitive' } } },
                ],
            });
        }
        if (query.size || query.color) {
            clauses.push({
                variants: {
                    some: {
                        ...(query.size ? { size: query.size } : {}),
                        ...(query.color
                            ? { color: { equals: query.color, mode: 'insensitive' } }
                            : {}),
                    },
                },
            });
        }
        if (query.minPrice !== undefined || query.maxPrice !== undefined) {
            clauses.push({
                basePrice: {
                    ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
                    ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
                },
            });
        }
        const where = { AND: clauses };
        const orderBy = query.sort === 'price_asc'
            ? { basePrice: 'asc' }
            : query.sort === 'price_desc'
                ? { basePrice: 'desc' }
                : query.sort === 'name'
                    ? { name: 'asc' }
                    : { createdAt: 'desc' };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.product.findMany({
                where,
                select: productSelection,
                orderBy,
                skip: (query.page - 1) * query.limit,
                take: query.limit,
            }),
            this.prisma.product.count({ where }),
        ]);
        return {
            items,
            pagination: {
                page: query.page,
                limit: query.limit,
                total,
                pages: Math.ceil(total / query.limit),
            },
        };
    }
    async getProduct(slug) {
        const product = await this.prisma.product.findFirst({
            where: { slug, status: 'PUBLISHED', deletedAt: null },
            select: productSelection,
        });
        if (!product)
            throw new common_1.NotFoundException({ code: 'PRODUCT_NOT_FOUND' });
        return product;
    }
    listCategories() {
        return this.prisma.category.findMany({
            where: {
                OR: [
                    { products: { some: { status: 'PUBLISHED', deletedAt: null } } },
                    {
                        children: {
                            some: { products: { some: { status: 'PUBLISHED', deletedAt: null } } },
                        },
                    },
                ],
            },
            orderBy: [{ position: 'asc' }, { name: 'asc' }],
            select: {
                id: true,
                name: true,
                slug: true,
                position: true,
                parent: { select: { id: true, name: true, slug: true } },
                children: {
                    where: { products: { some: { status: 'PUBLISHED', deletedAt: null } } },
                    orderBy: [{ position: 'asc' }, { name: 'asc' }],
                    select: { id: true, name: true, slug: true, position: true },
                },
            },
        });
    }
    async createProduct(dto, userId, ip) {
        return this.prisma.$transaction(async (transaction) => {
            const product = await transaction.product.create({
                data: {
                    name: dto.name.trim(),
                    slug: dto.slug,
                    description: dto.description.trim(),
                    categoryId: dto.categoryId,
                    brandId: dto.brandId,
                    basePrice: dto.basePrice,
                    status: 'DRAFT',
                    variants: {
                        create: dto.variants.map((variant) => ({
                            sku: variant.sku.trim(),
                            color: variant.color.trim(),
                            size: variant.size.trim(),
                            price: variant.price,
                            stock: variant.stock,
                        })),
                    },
                },
                select: productSelection,
            });
            await this.auditLog.record(transaction, {
                userId,
                action: 'catalog.product.create',
                entity: 'Product',
                entityId: product.id,
                ip,
                after: { slug: product.slug, name: product.name, status: 'DRAFT' },
            });
            return product;
        });
    }
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_module_1.PrismaService,
        audit_service_1.AuditLogService])
], CatalogService);
