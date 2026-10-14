import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

// RBAC guard (cachier §2 matrix, §10.1 "RBAC par garde sur chaque route").
// Runs after JwtAuthGuard: routes without @Roles stay authenticated but
// reachable by any logged-in account (clients included).
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<RequestWithUser>();
    if (!user) {
      // Defensive: the global JwtAuthGuard always runs first.
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED' });
    }

    // SUPER_ADMIN holds every right (cachier §2).
    if (user.roles.includes('SUPER_ADMIN') || required.some((role) => user.roles.includes(role))) {
      return true;
    }
    throw new ForbiddenException({ code: 'FORBIDDEN' });
  }
}
