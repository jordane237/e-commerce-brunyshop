// BRUNY SHOPPING — matrice RBAC (cahier des charges §2).
//
// Source documentaire unique des permissions par rôle. Le runtime applique les
// rôles via @Roles ; cette matrice sert au seed, aux tests et à la revue de
// sécurité. Toute route non publique doit être couverte par @Roles ou rester
// explicitement authentifiée sans rôle métier.
import type { RoleName } from '../decorators/roles.decorator';

export type PermissionKey =
  | 'dashboard:read'
  | 'product:read'
  | 'product:write'
  | 'product:delete'
  | 'order:read'
  | 'order:write'
  | 'order:cancel'
  | 'stock:read'
  | 'stock:write'
  | 'shipment:read'
  | 'shipment:write'
  | 'user:read'
  | 'user:write'
  | 'user:delete'
  | 'coupon:read'
  | 'coupon:write'
  | 'setting:read'
  | 'setting:write'
  | 'audit:read'
  | 'notification:read'
  | 'size-guide:read'
  | 'size-guide:write'
  | 'media:write';

export const ALL_PERMISSIONS: readonly PermissionKey[] = [
  'dashboard:read',
  'product:read',
  'product:write',
  'product:delete',
  'order:read',
  'order:write',
  'order:cancel',
  'stock:read',
  'stock:write',
  'shipment:read',
  'shipment:write',
  'user:read',
  'user:write',
  'user:delete',
  'coupon:read',
  'coupon:write',
  'setting:read',
  'setting:write',
  'audit:read',
  'notification:read',
  'size-guide:read',
  'size-guide:write',
  'media:write',
];

export const ROLE_PERMISSIONS: Readonly<Record<RoleName, readonly PermissionKey[]>> = {
  SUPER_ADMIN: ALL_PERMISSIONS,
  // Tout sauf la suppression d'un utilisateur, réservée au SUPER_ADMIN.
  ADMIN: ALL_PERMISSIONS.filter((permission) => permission !== 'user:delete'),
  ORDER_MANAGER: [
    'order:read',
    'order:write',
    'order:cancel',
    'product:read',
    'stock:read',
    'shipment:read',
    'shipment:write',
    'user:read',
    'coupon:read',
    'notification:read',
    'size-guide:read',
  ],
  // Le gestionnaire de stock édite le catalogue, les médias et les guides de
  // tailles, mais ne touche ni aux commandes, ni aux utilisateurs, ni aux avis.
  STOCK_MANAGER: [
    'product:read',
    'product:write',
    'stock:read',
    'stock:write',
    'media:write',
    'size-guide:read',
    'size-guide:write',
  ],
  // Le livreur ne voit que les commandes/livraisons nécessaires à sa tournée.
  LIVREUR: ['order:read', 'shipment:read', 'shipment:write'],
  // CUSTOMER n'a aucune permission d'administration : ses accès personnels
  // sont contrôlés par le filtrage userId (IDOR), pas par cette matrice.
  CUSTOMER: ['product:read', 'order:read', 'order:write'],
};

export function permissionsFor(role: RoleName): readonly PermissionKey[] {
  return ROLE_PERMISSIONS[role];
}
