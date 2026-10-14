import { SetMetadata } from '@nestjs/common';

// Key marking a route as reachable without an access token.
export const IS_PUBLIC_KEY = 'isPublic';

// Opt a route out of the global JwtAuthGuard (cachier §9: catalogue et
// endpoints authentification eux-mêmes).
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
