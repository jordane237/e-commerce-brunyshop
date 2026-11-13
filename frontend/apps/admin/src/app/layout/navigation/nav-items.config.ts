import { IconName } from '@bruny/ui';

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'ORDER_MANAGER' | 'STOCK_MANAGER' | 'LIVREUR';

export interface NavItem {
  id: string;
  label: string;
  icon: IconName;
  route: string;
  roles: AdminRole[];
  /** Priorité d'affichage dans la barre basse mobile (les plus petites d'abord). */
  mobilePriority?: number;
}

/**
 * Source unique des menus et des droits d'affichage.
 *
 * La sidebar et la barre basse filtrent cette liste avec les rôles de la
 * session ; les routes utilisent les mêmes rôles via `roleGuard`. Le backend
 * reste l'autorité de sécurité (voir SECURITY-NOTE.md).
 */
export const ADMIN_NAV_ITEMS: readonly NavItem[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: 'layout-dashboard',
    route: '/',
    roles: ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'STOCK_MANAGER'],
    mobilePriority: 10,
  },
  {
    id: 'products',
    label: 'Produits',
    icon: 'package',
    route: '/produits',
    roles: ['SUPER_ADMIN', 'ADMIN', 'STOCK_MANAGER'],
    mobilePriority: 20,
  },
  {
    id: 'stock',
    label: 'Stock',
    icon: 'layers',
    route: '/stock',
    roles: ['SUPER_ADMIN', 'ADMIN', 'STOCK_MANAGER'],
    mobilePriority: 30,
  },
  {
    id: 'orders',
    label: 'Commandes',
    icon: 'shopping-bag',
    route: '/commandes',
    roles: ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'],
    mobilePriority: 20,
  },
  {
    id: 'shipments',
    label: 'Livraisons',
    icon: 'truck',
    route: '/livraisons',
    roles: ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'],
    mobilePriority: 30,
  },
  {
    id: 'my-deliveries',
    label: 'Mes livraisons',
    icon: 'navigation',
    route: '/livraisons/mes-livraisons',
    roles: ['LIVREUR'],
    mobilePriority: 10,
  },
  {
    id: 'customers',
    label: 'Clients',
    icon: 'users',
    route: '/clients',
    roles: ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'],
    mobilePriority: 40,
  },
  {
    id: 'users',
    label: 'Utilisateurs',
    icon: 'user-cog',
    route: '/utilisateurs',
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    id: 'promotions',
    label: 'Promotions',
    icon: 'tag',
    route: '/promotions',
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    id: 'reviews',
    label: 'Avis',
    icon: 'star',
    route: '/avis',
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: 'settings',
    route: '/parametres',
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    id: 'audit',
    label: 'Audit',
    icon: 'history',
    route: '/audit',
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
];

/** Rôles déclarés pour un module : utilisés par les routes et les menus. */
export function navRoles(id: string): string[] {
  const item = ADMIN_NAV_ITEMS.find((navItem) => navItem.id === id);
  if (!item) {
    throw new Error(`Module de navigation inconnu : ${id}`);
  }
  return [...item.roles];
}

/** Le profil reste accessible par le menu utilisateur et la barre basse. */
export const ADMIN_PROFILE_ITEM: NavItem = {
  id: 'profile',
  label: 'Mon profil',
  icon: 'user',
  route: '/profil',
  roles: ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'STOCK_MANAGER', 'LIVREUR'],
  mobilePriority: 100,
};

export const ADMIN_ROLES: readonly AdminRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'ORDER_MANAGER',
  'STOCK_MANAGER',
  'LIVREUR',
];

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super administrateur',
  ADMIN: 'Administrateur',
  ORDER_MANAGER: 'Gestionnaire de commandes',
  STOCK_MANAGER: 'Gestionnaire de stock',
  LIVREUR: 'Livreur',
  CUSTOMER: 'Client',
};
