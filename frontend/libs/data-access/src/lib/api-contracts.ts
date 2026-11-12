// Contrats d'entrée générés depuis `backend/openapi.json` (TEC-09).
// `generated/api-types.ts` est produit par `pnpm api:generate` : ne jamais
// l'éditer à la main. Ce fichier ne fait que donner des noms stables aux
// schémas réellement documentés par le backend.
import type { components } from '../generated/api-types';

export type LoginDto = components['schemas']['LoginDto'];
export type RegisterDto = components['schemas']['RegisterDto'];
export type ForgotPasswordDto = components['schemas']['ForgotPasswordDto'];
export type ResetPasswordDto = components['schemas']['ResetPasswordDto'];
export type TwoFactorVerifyDto = components['schemas']['TwoFactorVerifyDto'];
export type CreateProductDto = components['schemas']['CreateProductDto'];
export type CreateProductVariantDto = components['schemas']['CreateProductVariantDto'];

/** Schémas OpenAPI disponibles (utile pour dériver un type ponctuel). */
export type ApiSchemas = components['schemas'];
