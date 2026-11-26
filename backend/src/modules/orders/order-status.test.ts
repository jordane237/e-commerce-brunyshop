import { describe, expect, it } from 'vitest';

import type { OrderStatus } from '../../generated/prisma/client';
import {
  DRIVER_STATUS_TRANSITIONS,
  ORDER_STATUSES,
  ORDER_STATUS_TRANSITIONS,
  allowedTransitionsFor,
  canRoleTransition,
  canTransition,
  isOrderStatus,
} from './order-status';

// Matrice attendue, écrite explicitement : toute modification de la table
// centrale doit être un choix conscient, pas un effet de bord.
const EXPECTED: Record<OrderStatus, OrderStatus[]> = {
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

describe('table de transitions ORD-02', () => {
  it('couvre les 13 statuts du schéma, sans doublon', () => {
    expect(ORDER_STATUSES).toHaveLength(13);
    expect(new Set(ORDER_STATUSES).size).toBe(13);
    expect(Object.keys(ORDER_STATUS_TRANSITIONS).sort()).toEqual([...ORDER_STATUSES].sort());
  });

  it('correspond exactement à la matrice validée', () => {
    for (const status of ORDER_STATUSES) {
      expect(ORDER_STATUS_TRANSITIONS[status]).toEqual(EXPECTED[status]);
    }
  });

  it('autorise toutes les transitions listées', () => {
    for (const from of ORDER_STATUSES) {
      for (const to of EXPECTED[from]) {
        expect(canTransition(from, to), `${from} → ${to}`).toBe(true);
        expect(allowedTransitionsFor(from)).toContain(to);
      }
    }
  });

  it('refuse toutes les autres paires, y compris les rétrogrades', () => {
    for (const from of ORDER_STATUSES) {
      for (const to of ORDER_STATUSES) {
        if (EXPECTED[from].includes(to)) continue;
        expect(canTransition(from, to), `${from} → ${to} doit être refusé`).toBe(false);
      }
    }
  });

  it('interdit toute transition vers le même statut', () => {
    for (const status of ORDER_STATUSES) {
      expect(canTransition(status, status)).toBe(false);
    }
  });

  it('interdit les sauts non métier', () => {
    expect(canTransition('PENDING_CONFIRMATION', 'DELIVERED')).toBe(false);
    expect(canTransition('PENDING_CONFIRMATION', 'PAID')).toBe(false);
    expect(canTransition('PENDING_CONFIRMATION', 'SHIPPED')).toBe(false);
    expect(canTransition('DELIVERED', 'PENDING_CONFIRMATION')).toBe(false);
    expect(canTransition('PAID', 'PENDING_CONFIRMATION')).toBe(false);
    expect(canTransition('SHIPPED', 'PREPARING')).toBe(false);
  });

  it('traite CANCELLED, REFUNDED et EXCHANGED comme terminaux', () => {
    for (const terminal of ['CANCELLED', 'REFUNDED', 'EXCHANGED'] as OrderStatus[]) {
      expect(allowedTransitionsFor(terminal)).toEqual([]);
    }
    // RETURNED n'est pas terminal : le remboursement reste à effectuer.
    expect(allowedTransitionsFor('RETURNED')).toEqual(['REFUNDED']);
  });

  it('sépare retour demandé, retour effectué et remboursement', () => {
    expect(canTransition('DELIVERED', 'RETURN_REQUESTED')).toBe(true);
    expect(canTransition('DELIVERED', 'RETURNED')).toBe(false);
    expect(canTransition('DELIVERED', 'REFUNDED')).toBe(false);
    expect(canTransition('RETURN_REQUESTED', 'RETURNED')).toBe(true);
    expect(canTransition('RETURN_REQUESTED', 'REFUNDED')).toBe(true);
    expect(canTransition('RETURNED', 'REFUNDED')).toBe(true);
  });

  it('valide les statuts inconnus', () => {
    expect(isOrderStatus('CONFIRMED')).toBe(true);
    expect(isOrderStatus('confirmed')).toBe(false);
    expect(isOrderStatus('ARCHIVED')).toBe(false);
  });
});

describe('restrictions de rôle ORD-02', () => {
  it('accorde toutes les transitions valides à ADMIN et SUPER_ADMIN', () => {
    for (const from of ORDER_STATUSES) {
      for (const to of EXPECTED[from]) {
        expect(canRoleTransition(['ADMIN'], from, to)).toBe(true);
        expect(canRoleTransition(['SUPER_ADMIN'], from, to)).toBe(true);
      }
    }
  });

  it('limite le livreur aux constats de livraison', () => {
    expect(canRoleTransition(['LIVREUR'], 'SHIPPED', 'DELIVERED')).toBe(true);
    expect(canRoleTransition(['LIVREUR'], 'SHIPPED', 'DELIVERY_FAILED')).toBe(true);
    expect(canRoleTransition(['LIVREUR'], 'DELIVERY_FAILED', 'SHIPPED')).toBe(true);

    expect(canRoleTransition(['LIVREUR'], 'PENDING_CONFIRMATION', 'CONFIRMED')).toBe(false);
    expect(canRoleTransition(['LIVREUR'], 'CONFIRMED', 'PREPARING')).toBe(false);
    expect(canRoleTransition(['LIVREUR'], 'PREPARING', 'SHIPPED')).toBe(false);
    expect(canRoleTransition(['LIVREUR'], 'CONFIRMED', 'CANCELLED')).toBe(false);
    expect(canRoleTransition(['LIVREUR'], 'RETURN_REQUESTED', 'REFUNDED')).toBe(false);
    expect(canRoleTransition(['LIVREUR'], 'RETURNED', 'REFUNDED')).toBe(false);
    expect(Object.keys(DRIVER_STATUS_TRANSITIONS).sort()).toEqual(['DELIVERY_FAILED', 'SHIPPED']);
  });

  it('autorise ORDER_MANAGER sauf les décisions financières', () => {
    expect(canRoleTransition(['ORDER_MANAGER'], 'PENDING_CONFIRMATION', 'CONFIRMED')).toBe(true);
    expect(canRoleTransition(['ORDER_MANAGER'], 'CONFIRMED', 'PREPARING')).toBe(true);
    expect(canRoleTransition(['ORDER_MANAGER'], 'PREPARING', 'CANCELLED')).toBe(true);
    expect(canRoleTransition(['ORDER_MANAGER'], 'DELIVERED', 'RETURN_REQUESTED')).toBe(true);
    expect(canRoleTransition(['ORDER_MANAGER'], 'RETURN_REQUESTED', 'RETURNED')).toBe(true);
    expect(canRoleTransition(['ORDER_MANAGER'], 'RETURN_REQUESTED', 'REFUNDED')).toBe(false);
    expect(canRoleTransition(['ORDER_MANAGER'], 'RETURNED', 'REFUNDED')).toBe(false);
  });

  it('refuse les rôles hors périmètre commande', () => {
    expect(canRoleTransition(['STOCK_MANAGER'], 'PENDING_CONFIRMATION', 'CONFIRMED')).toBe(false);
    expect(canRoleTransition(['CUSTOMER'], 'PENDING_CONFIRMATION', 'CONFIRMED')).toBe(false);
    expect(canRoleTransition([], 'SHIPPED', 'DELIVERED')).toBe(false);
  });

  it('ne rend pas une transition interdite valide pour un admin', () => {
    expect(canRoleTransition(['SUPER_ADMIN'], 'PENDING_CONFIRMATION', 'DELIVERED')).toBe(false);
    expect(canRoleTransition(['ADMIN'], 'CANCELLED', 'CONFIRMED')).toBe(false);
  });
});
