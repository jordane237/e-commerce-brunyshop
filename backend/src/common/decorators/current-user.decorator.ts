import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

// Minimal user attached to the request by JwtAuthGuard.
export interface AuthenticatedUser {
  id: string;
  email: string | null;
  phone: string | null;
  roles: string[];
  twoFactorEnabled: boolean;
}

// Parameter decorator: @CurrentUser() gives the authenticated user.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser | undefined => {
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    return request.user;
  },
);
