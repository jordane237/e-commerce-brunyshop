// ORD-02 — machine à états des commandes.
//
// Source unique de vérité des transitions autorisées. Aucun controller ni
// service ne doit redéfinir localement une règle de transition : le workflow
// (`OrderWorkflowService`) et les tests consomment cette table.
//
// Hypothèses métier documentées (docs/features/ORD-02/ANALYSE-DESIGN.md) :
// - La matrice officielle n'est pas fournie dans le ticket ; elle est dérivée
//   de DSG-06/A08 §7, de DSG-04 (P11b attente de paiement) et du modèle
//   existant (`OrderStatus`).
// - `AWAITING_PAYMENT` n'est atteignable que depuis `PENDING_CONFIRMATION`
//   (paiement en ligne à venir, PAY-02) ; en MVP COD le parcours reste
//   PENDING_CONFIRMATION → CONFIRMED.
// - `CANCELLED`, `RETURNED`, `REFUNDED` et `EXCHANGED` sont terminaux : aucune
//   réouverture arbitraire. Un remboursement financier après annulation se
//   traite sur `Payment.paymentStatus`, pas en rouvrant la commande.
// - `RETURN_REQUESTED` → `RETURNED` (marchandise reçue) puis `REFUNDED`
//   (remboursement effectué) : demande, retour physique et remboursement ne
//   sont pas équivalents.
import type { RoleName } from '../../common/decorators/roles.decorator';
import type { OrderStatus } from '../../generated/prisma/client';

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'PENDING_CONFIRMATION',
  'AWAITING_PAYMENT',
  'CONFIRMED',
  'PAID',
  'PREPARING',
  'SHIPPED',
  'DELIVERED',
  'DELIVERY_FAILED',
  'CANCELLED',
  'RETURN_REQUESTED',
  'RETURNED',
  'REFUNDED',
  'EXCHANGED',
];

/** Transitions autorisées, par statut d'origine. */
export const ORDER_STATUS_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  PENDING_CONFIRMATION: ['AWAITING_PAYMENT', 'CONFIRMED', 'CANCELLED'],
  AWAITING_PAYMENT: ['PAID', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'DELIVERY_FAILED'],
  DELIVERED: ['RETURN_REQUESTED'],
  DELIVERY_FAILED: ['SHIPPED', 'CANCELLED'],
  RETURN_REQUESTED: ['RETURNED', 'REFUNDED'],
  RETURNED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
  EXCHANGED: [],
};

/** Rôles habilités à faire évoluer le statut d'une commande. */
export const ORDER_STATUS_ACTOR_ROLES: readonly RoleName[] = [
  'ORDER_MANAGER',
  'ADMIN',
  'SUPER_ADMIN',
  'LIVREUR',
];

/**
 * Transitions ouvertes au livreur : il ne constate que la livraison.
 * Confirmer, préparer, expédier, annuler ou rembourser reste du ressort de
 * l'équipe commandes (A08 §2 et §7).
 */
export const DRIVER_STATUS_TRANSITIONS: Readonly<Record<string, readonly OrderStatus[]>> = {
  SHIPPED: ['DELIVERED', 'DELIVERY_FAILED'],
  DELIVERY_FAILED: ['SHIPPED'],
};

/**
 * Transitions réservées aux administrateurs : les décisions financières
 * (remboursement, retour physique) ne sont pas déléguées au gestionnaire de
 * commandes, dont la matrice RBAC ne porte pas de permission de remboursement.
 */
export const ADMIN_ONLY_STATUS_TRANSITIONS: Readonly<Record<string, readonly OrderStatus[]>> = {
  RETURN_REQUESTED: ['REFUNDED'],
  RETURNED: ['REFUNDED'],
};

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

export function allowedTransitionsFor(status: OrderStatus): readonly OrderStatus[] {
  return ORDER_STATUS_TRANSITIONS[status];
}

function isAdmin(roles: readonly string[]): boolean {
  return roles.includes('SUPER_ADMIN') || roles.includes('ADMIN');
}

/**
 * Vérifie qu'un acteur peut réaliser cette transition précise.
 * Le livreur est limité aux constats de livraison ; `ADMIN`/`SUPER_ADMIN`
 * disposent de toutes les transitions valides ; `ORDER_MANAGER` de toutes sauf
 * les décisions financières.
 */
export function canRoleTransition(
  roles: readonly string[],
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  if (!canTransition(from, to)) {
    return false;
  }
  if (isAdmin(roles)) {
    return true;
  }

  const adminOnly = ADMIN_ONLY_STATUS_TRANSITIONS[from] ?? [];
  if (roles.includes('ORDER_MANAGER')) {
    return !adminOnly.includes(to);
  }

  if (roles.includes('LIVREUR')) {
    const driverTargets = DRIVER_STATUS_TRANSITIONS[from] ?? [];
    return driverTargets.includes(to);
  }

  return false;
}
