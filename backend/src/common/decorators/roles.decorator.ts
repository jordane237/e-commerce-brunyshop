import { SetMetadata } from '@nestjs/common';

// Declares the roles allowed to reach a route (RBAC, cachier §2 and §9:
// /admin/* routes require STOCK, ORDER, ADMIN or SUPER_ADMIN).
export const ROLES_KEY = 'requiredRoles';

export type RoleName =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'ORDER_MANAGER'
  | 'STOCK_MANAGER'
  | 'LIVREUR'
  | 'CUSTOMER';

export const Roles = (...roles: RoleName[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
