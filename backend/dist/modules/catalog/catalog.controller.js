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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const create_product_dto_1 = require("./dto/create-product.dto");
const list_products_dto_1 = require("./dto/list-products.dto");
const catalog_service_1 = require("./catalog.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let CatalogController = class CatalogController {
    catalog;
    constructor(catalog) {
        this.catalog = catalog;
    }
    listProducts(query) {
        return this.catalog.listProducts(query);
    }
    getProduct(slug) {
        return this.catalog.getProduct(slug);
    }
    listCategories() {
        return this.catalog.listCategories();
    }
    createProduct(dto, user, request) {
        return this.catalog.createProduct(dto, user.id, request.ip);
    }
};
exports.CatalogController = CatalogController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('products'),
    (0, swagger_1.ApiOperation)({ summary: 'Liste paginée du catalogue public' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_products_dto_1.ListProductsDto]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "listProducts", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('products/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Détail public d’un produit publié' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "getProduct", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Catégories ayant des produits publiés' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "listCategories", null);
__decorate([
    (0, common_1.Post)('admin/products'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STOCK_MANAGER'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Création d’un produit en brouillon avec variantes' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_product_dto_1.CreateProductDto, Object, Object]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "createProduct", null);
exports.CatalogController = CatalogController = __decorate([
    (0, swagger_1.ApiTags)('catalog'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [catalog_service_1.CatalogService])
], CatalogController);
