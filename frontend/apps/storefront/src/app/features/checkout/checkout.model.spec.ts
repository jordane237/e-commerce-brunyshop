import { describe, expect, it } from 'vitest';

import {
  CHECKOUT_STORAGE_KEY,
  createIdempotencyKey,
  isContactValid,
  isDeliveryValid,
  sanitizeCheckoutDraft,
  validateCheckoutPhone,
  validateFullName,
  validateOptionalEmail,
  validateRequiredText,
} from './checkout.model';

describe('checkout.model', () => {
  it('accepte un nom complet valide et rejette les valeurs vides ou blanches', () => {
    expect(validateFullName('Awa Ngo Bell')).toBeNull();
    expect(validateFullName('   ')).toBe('Indiquez votre nom complet.');
    expect(validateFullName('A')).toBe('Votre nom doit contenir au moins 2 caractères.');
    expect(validateFullName('12345')).toBe('Votre nom doit contenir au moins une lettre.');
  });

  it('limite la longueur du nom à 150 caractères', () => {
    expect(validateFullName('a'.repeat(151))).toBe(
      'Votre nom ne doit pas dépasser 150 caractères.',
    );
  });

  it('accepte les numéros camerounais locaux et internationaux', () => {
    expect(validateCheckoutPhone('671234567')).toBeNull();
    expect(validateCheckoutPhone('6 71 23 45 67')).toBeNull();
    expect(validateCheckoutPhone('+237671234567')).toBeNull();
  });

  it('rejette les numéros invalides avec un message explicite', () => {
    const message = 'Saisissez un numéro camerounais à 9 chiffres (ex. 6 71 23 45 67).';
    expect(validateCheckoutPhone('')).toBe('Saisissez votre numéro de téléphone.');
    expect(validateCheckoutPhone('12345')).toBe(message);
    expect(validateCheckoutPhone('071234567')).toBe(message);
    expect(validateCheckoutPhone('+23701234567')).toBe(message);
  });

  it('rend l’e-mail facultatif mais le valide lorsqu’il est renseigné', () => {
    expect(validateOptionalEmail('')).toBeNull();
    expect(validateOptionalEmail('client@exemple.com')).toBeNull();
    expect(validateOptionalEmail('client@exemple')).toBe(
      'Saisissez un e-mail valide, par exemple vous@exemple.com.',
    );
    expect(validateOptionalEmail('pas un email')).not.toBeNull();
  });

  it('exige ville, quartier et point de repère', () => {
    expect(validateRequiredText('', 'Ville requise.', 100)).toBe('Ville requise.');
    expect(validateRequiredText('   ', 'Ville requise.', 100)).toBe('Ville requise.');
    expect(validateRequiredText('Akwa', 'Ville requise.', 100)).toBeNull();
  });

  it('valide les coordonnées et la livraison complètes', () => {
    const contact = { fullName: 'Awa Ngo', phone: '671234567', email: '' };
    expect(isContactValid(contact)).toBe(true);
    expect(isContactValid({ ...contact, phone: '123' })).toBe(false);

    const delivery = {
      city: 'Douala',
      district: 'Akwa',
      landmark: 'Face à la pharmacie',
      zoneId: 'zone-1',
    };
    expect(isDeliveryValid(delivery)).toBe(true);
    expect(isDeliveryValid({ ...delivery, zoneId: null })).toBe(false);
    expect(isDeliveryValid({ ...delivery, landmark: '  ' })).toBe(false);
  });

  it('génère des clés d’idempotence UUID v4 distinctes', () => {
    const first = createIdempotencyKey();
    const second = createIdempotencyKey();
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(first).not.toBe(second);
  });

  it('restaure un brouillon valide', () => {
    const draft = sanitizeCheckoutDraft({
      version: 1,
      step: 3,
      contact: { fullName: 'Awa Ngo', phone: '671234567', email: 'awa@exemple.com' },
      delivery: {
        city: 'Douala',
        district: 'Akwa',
        landmark: 'Face à la pharmacie',
        zoneId: 'zone-1',
      },
      payment: { method: 'COD', termsAccepted: true },
      idempotencyKey: '11111111-1111-4111-8111-111111111111',
      updatedAt: '2026-11-23T10:00:00.000Z',
    });

    expect(draft?.step).toBe(3);
    expect(draft?.contact.fullName).toBe('Awa Ngo');
    expect(draft?.idempotencyKey).toBe('11111111-1111-4111-8111-111111111111');
  });

  it('refuse un brouillon d’une autre version ou corrompu', () => {
    expect(sanitizeCheckoutDraft({ version: 2, step: 1 })).toBeNull();
    expect(sanitizeCheckoutDraft('brouillon')).toBeNull();
  });

  it('rétrograde l’étape quand les prérequis ont disparu', () => {
    const contactMissing = sanitizeCheckoutDraft({
      version: 1,
      step: 3,
      contact: { fullName: '', phone: '', email: '' },
      delivery: { city: 'Douala', district: 'Akwa', landmark: 'Repère', zoneId: 'z' },
      payment: {},
      updatedAt: '2026-11-23T10:00:00.000Z',
    });
    expect(contactMissing?.step).toBe(1);

    const deliveryMissing = sanitizeCheckoutDraft({
      version: 1,
      step: 3,
      contact: { fullName: 'Awa Ngo', phone: '671234567', email: '' },
      delivery: { city: 'Douala', district: '', landmark: '', zoneId: null },
      payment: {},
      updatedAt: '2026-11-23T10:00:00.000Z',
    });
    expect(deliveryMissing?.step).toBe(2);
  });

  it('expose une clé de stockage versionnée', () => {
    expect(CHECKOUT_STORAGE_KEY).toContain('bruny.checkout');
  });
});
