// notification-sanitizer.spec.ts

// Tests unitaires NTF-01 : masquage email, téléphone, payload récursif.

import { describe, expect, it } from 'vitest';
import {
  sanitizeEmail,
  sanitizePhone,
  sanitizeNotificationPayload,
} from './notification-sanitizer';

describe('notification-sanitizer (NTF-01)', () => {
  describe('sanitizeEmail', () => {
    it('masque la partie locale tout en conservant le domaine', () => {
      expect(sanitizeEmail('test@example.com')).toBe('t***@example.com');
    });

    it('ne masque pas un seul caractère local', () => {
      expect(sanitizeEmail('a@example.com')).toBe('a***@example.com');
    });

    it('gère les emails minuscules et avec espaces', () => {
      expect(sanitizeEmail('  John.Doe@BrunyShop.CM  ')).toBe('j***@brunyshop.cm');
    });

    it('retourne [INVALID] pour un email invalide', () => {
      expect(sanitizeEmail('')).toBe('[INVALID]');
      expect(sanitizeEmail('no-at-sign')).toBe('[INVALID]');
      expect(sanitizeEmail('@example.com')).toBe('[INVALID]');
      expect(sanitizeEmail('test@')).toBe('[INVALID]');
    });
  });

  describe('sanitizePhone', () => {
    it('masque le milieu du numéro téléphone', () => {
      expect(sanitizePhone('+237612345678')).toBe('+2376****78');
    });

    it('garde les 4 premiers et 2 derniers chiffres', () => {
      expect(sanitizePhone('0612345678')).toBe('0612****78');
    });

    it('nettoie les caractères non numériques sauf + initial', () => {
      expect(sanitizePhone('+237 6 12 34 56 78')).toBe('+2376****78');
    });

    it('retourne [INVALID] pour un numéro trop court', () => {
      expect(sanitizePhone('')).toBe('[INVALID]');
      expect(sanitizePhone('12')).toBe('[INVALID]');
      expect(sanitizePhone('abc')).toBe('[INVALID]');
    });
  });

  describe('sanitizeNotificationPayload', () => {
    it('masque les champs email, to, phone, recipient', () => {
      const payload = {
        to: 'client@brunyshop.cm',
        phone: '+237612345678',
        recipient: 'admin@brunyshop.local',
        channel: 'EMAIL',
        templateKey: 'order.confirmed',
        message: 'Contenu du message SMS',
      };

      const sanitized = sanitizeNotificationPayload(payload) as Record<string, unknown>;

      expect(sanitized.to).toBe('c***@brunyshop.cm');
      expect(sanitized.phone).toBe('+2376****78');
      expect(sanitized.recipient).toBe('a***@brunyshop.local');
      expect(sanitized.channel).toBe('EMAIL');
      expect(sanitized.templateKey).toBe('order.confirmed');
      expect(sanitized.message).toBe('[INVALID]');
    });

    it('masque récursivement dans les objets imbriqués', () => {
      const payload = {
        user: {
          email: 'nested@example.com',
          phone: '+237698765432',
        },
        metadata: {
          billing: {
            to: 'facture@exemple.fr',
          },
        },
      };

      const sanitized = sanitizeNotificationPayload(payload) as Record<string, unknown>;

      expect((sanitized.user as Record<string, unknown>).email).toBe('n***@example.com');
      expect((sanitized.user as Record<string, unknown>).phone).toBe('+2376****32');
      expect((sanitized.metadata as Record<string, unknown>).billing).toEqual({
        to: 'f***@exemple.fr',
      });
    });

    it('gère les tableaux', () => {
      const payload = {
        recipients: ['a@x.com', 'b@y.com', '+237611111111'],
      };

      const sanitized = sanitizeNotificationPayload(payload) as Record<string, unknown>;

      const recipients = sanitized.recipients as unknown[];
      expect(recipients[0]).toBe('a***@x.com');
      expect(recipients[1]).toBe('b***@y.com');
      expect(recipients[2]).toBe('+2376****11');
    });

    it('ne modifie pas les nombres et booléens', () => {
      const payload = {
        count: 42,
        active: true,
        amount: 12345,
      };

      const sanitized = sanitizeNotificationPayload(payload) as Record<string, unknown>;

      expect(sanitized.count).toBe(42);
      expect(sanitized.active).toBe(true);
      expect(sanitized.amount).toBe(12345);
    });

    it('retourne [INVALID] pour les chaînes ne ressemblant ni à un email ni à un téléphone', () => {
      const payload = {
        name: 'Jean Dupont',
        message: 'Bonjour tout le monde',
      };

      const sanitized = sanitizeNotificationPayload(payload) as Record<string, unknown>;

      // message et name ne sont pas dans les champs PII exceptés si courte
      // longueur, mais ici message fait partie des champs ignorés à masquer
      // par notre politique (message complet).
      expect(sanitized.message).toBe('[INVALID]');
      expect(sanitized.name).toBe('[INVALID]');
    });
  });
});
