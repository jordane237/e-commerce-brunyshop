import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import { PrismaService } from '../../infrastructure/database/database.module';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';
import type { AccessTokenPayload } from './jwt-auth.guard';

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

// Optional authentication (CRT-01): attaches `request.user` when a valid
// access token is present, and lets the request through as a guest otherwise.
// Meant to be used on a @Public() route: the global JwtAuthGuard already
// opted out, this guard only enriches the request for audit/future cart
// ownership. An expired or malformed token is treated as a guest request —
// nothing user-scoped is returned by such routes, so nothing leaks.
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return true;
    }

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(header.slice(7));
      if (payload.typ !== 'access') {
        return true;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { roles: { include: { role: true } } },
      });
      const blocked = user?.status === 'SUSPENDED' || user?.status === 'DISABLED';
      if (!user || user.deletedAt || blocked) {
        return true;
      }

      request.user = {
        id: user.id,
        email: user.email,
        phone: user.phone,
        roles: user.roles.map((entry) => entry.role.name),
        twoFactorEnabled: user.twoFactorSecret !== null,
      };
    } catch {
      // Invalid or expired token: continue as guest.
    }
    return true;
  }
}
