// templates.spec.ts
// Tests unitaires NTF-01 : registre, rendu, fallback de version.

import { describe, expect, it, beforeEach } from 'vitest';
import { renderTemplate, interpolate, resolveTemplate, TEMPLATES } from './template.registry';

describe('notification templates (NTF-01)', () => {
  beforeEach(() => {
    // stub
  });

  describe('renderTemplate', () => {
    it('rend les variables du template avec les données fournies', () => {
      const result = renderTemplate('auth.register.welcome', 'v1', {
        firstName: 'Fatou',
        lastName: 'Ngozi',
        catalogUrl: 'https://brunyshop.cm/catalogue',
        supportUrl: 'https://brunyshop.cm/support',
      });

      expect(result.subject).toBe('Bienvenue chez BrunyShop, Fatou !');
      expect(result.html).toContain('Fatou Ngozi');
      expect(result.html).toContain('https://brunyshop.cm/catalogue');
      expect(result.text).toContain('Fatou Ngozi');
      expect(result.text).toContain('https://brunyshop.cm/catalogue');
    });

    it('remplace tous les champs {{var}} du template', () => {
      const result = renderTemplate('order.shipped', 'v1', {
        firstName: 'Jean',
        orderRef: 'BRN-2026-ABC123',
        carrier: 'DHL Cameroun',
        trackingUrl: 'https://suivi.brunyshop.cm/BRN-2026-ABC123',
        estimatedDays: '3',
        supportUrl: 'https://brunyshop.cm/support',
      });

      expect(result.subject).toBe('Votre commande BRN-2026-ABC123 est expédiée');
      expect(result.html).toContain('BRN-2026-ABC123');
      expect(result.html).toContain('DHL Cameroun');
      expect(result.html).toContain('3 jours ouvrés');
    });

    it('remplace les variables manquantes par [MISSING_var]', () => {
      const result = renderTemplate('auth.register.welcome', 'v1', {
        firstName: 'Théophile',
        // lastName manquant volontairement
      });

      expect(result.subject).toBe('Bienvenue chez BrunyShop, Théophile !');
      expect(result.html).toContain('Théophile [MISSING_lastName]');
      expect(result.text).toContain('[MISSING_catalogUrl]');
    });
  });

  describe('interpolate', () => {
    it('ne modifie pas les chaînes sans variables', () => {
      expect(interpolate('Aucune variable ici', {})).toBe('Aucune variable ici');
    });

    it('gère les valeurs non-string', () => {
      const template = 'Montant : {{amount}} FCFA, Actif : {{active}}';
      const result = interpolate(template, { amount: 5000, active: true });
      expect(result).toBe('Montant : 5000 FCFA, Actif : true');
    });

    it('gère null et undefined comme valeurs manquantes', () => {
      const template = 'Valeur : {{val}}';
      expect(interpolate(template, { val: null })).toBe('Valeur : [MISSING_val]');
      expect(interpolate(template, { val: undefined })).toBe('Valeur : [MISSING_val]');
    });
  });

  describe('resolveTemplate', () => {
    it('retourne le template demandé s’il existe', () => {
      const template = resolveTemplate('order.confirmed', 'v1');
      expect(template.key).toBe('order.confirmed');
      expect(template.version).toBe('v1');
      expect(template.subject).toBe('Commande confirmée — {{[orderRef]}} (BrunyShop)');
    });

    it('lève une erreur si la version demandée n’existe pas', () => {
      expect(() => resolveTemplate('order.confirmed', 'v2')).toThrow(
        'Notification template not found: order.confirmed',
      );
    });

    it('lève une erreur si le template n’existe pas', () => {
      expect(() => resolveTemplate('unknown.template', 'v1')).toThrow(
        'Notification template not found: unknown.template',
      );
    });
  });

  describe('registre TEMPLATES', () => {
    it('contient tous les templates requis par la cahier', () => {
      const required = [
        'auth.register.welcome',
        'auth.login.new-device',
        'order.confirmed',
        'order.shipped',
        'order.delivered',
        'password.reset',
      ];

      for (const key of required) {
        expect(TEMPLATES[key]).toBeDefined();
        expect(Object.keys(TEMPLATES[key]!).length).toBeGreaterThan(0);
      }
    });

    it('chaque template possède subject, html et text non vides', () => {
      for (const versions of Object.values(TEMPLATES)) {
        for (const template of Object.values(versions)) {
          expect(template.subject.trim().length).toBeGreaterThan(0);
          expect(template.html.trim().length).toBeGreaterThan(0);
          expect(template.text.trim().length).toBeGreaterThan(0);
        }
      }
    });

    it('les templates sont en français (pas de contenu placeholder générique)', () => {
      for (const versions of Object.values(TEMPLATES)) {
        for (const template of Object.values(versions)) {
          expect(template.subject.toLowerCase()).toContain(
            Array.from(TEMPLATES.keys()).some((k) => k.includes('welcome')) ||
              template.subject.includes('Bienvenue'),
          );
        }
      }
    });
  });
});
