"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Roles = exports.ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
// Declares the roles allowed to reach a route (RBAC, cachier §2 and §9:
// /admin/* routes require STOCK, ORDER, ADMIN or SUPER_ADMIN).
exports.ROLES_KEY = 'requiredRoles';
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_KEY, roles);
exports.Roles = Roles;
