import { SetMetadata } from '@nestjs/common';

// Declares the roles allowed to reach a route (RBAC, cachier §2 and §9:
// /admin/* routes require STOCK, ORDER, ADMIN or SUPER_ADMIN).
export const ROLES_KEY = 'requiredRoles';

export const Roles = (...roles: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
