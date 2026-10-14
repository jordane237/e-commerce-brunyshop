import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  type Type,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';
// Value import: emitDecoratorMetadata needs the class for constructor DI.
import { PrismaService } from '../../infrastructure/database/database.module';

// Claims of a short-lived access token (cachier §10.2: kept in memory by the
// client, 10-15 minutes).
export interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: string[];
  typ: 'access';
  iat?: number;
  exp?: number;
}

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

// Global authentication guard: every route requires a valid Bearer access
// token unless explicitly marked @Public (refusal by default).
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) {
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED' });
    }

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token);
    } catch {
      throw new UnauthorizedException({ code: 'INVALID_TOKEN' });
    }
    if (payload.typ !== 'access') {
      throw new UnauthorizedException({ code: 'INVALID_TOKEN' });
    }

    // Identity is re-read from the database: role/status changes apply
    // immediately, a deleted or disabled account never passes (§10.1 IDOR).
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { roles: { include: { role: true } } },
    });
    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      throw new UnauthorizedException({ code: 'INVALID_TOKEN' });
    }

    request.user = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      roles: user.roles.map((entry) => entry.role.name),
      twoFactorEnabled: user.twoFactorSecret !== null,
    };
    return true;
  }
}

// Factory-friendly marker used by AppModule registration.
export const jwtAuthGuardProvider: Type<JwtAuthGuard> = JwtAuthGuard;
