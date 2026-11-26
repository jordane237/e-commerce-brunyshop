import { AbstractControl, type ValidationErrors, type ValidatorFn } from '@angular/forms';

import {
  compactPhone,
  isCameroonLocalPhoneNumber,
  isCameroonPhoneNumber,
  normalizeCameroonPhone,
} from '@bruny/util';

export const CHECKOUT_STORAGE_KEY = 'bruny.checkout.v1';
export const CHECKOUT_DRAFT_VERSION = 1;
export const CHECKOUT_NAME_MAX_LENGTH = 150;
export const CHECKOUT_EMAIL_MAX_LENGTH = 254;
export const CHECKOUT_CITY_MAX_LENGTH = 100;
export const CHECKOUT_DISTRICT_MAX_LENGTH = 100;
export const CHECKOUT_LANDMARK_MAX_LENGTH = 200;
export const CHECKOUT_STEP_COUNT = 3;

export type CheckoutStep = 1 | 2 | 3;

export interface CheckoutContact {
  fullName: string;
  /** 9 chiffres locaux saisis derrière le préfixe +237. */
  phone: string;
  email: string;
}

export interface CheckoutDelivery {
  city: string;
  district: string;
  landmark: string;
  zoneId: string | null;
}

export type CheckoutPaymentMethod = 'COD' | 'MOBILE_MONEY';

export interface CheckoutPayment {
  method: CheckoutPaymentMethod;
  termsAccepted: boolean;
}

export interface CheckoutDraft {
  version: typeof CHECKOUT_DRAFT_VERSION;
  step: CheckoutStep;
  contact: CheckoutContact;
  delivery: CheckoutDelivery;
  payment: CheckoutPayment;
  idempotencyKey: string;
  updatedAt: string;
}

export const EMPTY_CHECKOUT_DRAFT: Omit<CheckoutDraft, 'idempotencyKey' | 'updatedAt'> = {
  version: CHECKOUT_DRAFT_VERSION,
  step: 1,
  contact: { fullName: '', phone: '', email: '' },
  delivery: { city: '', district: '', landmark: '', zoneId: null },
  payment: { method: 'COD', termsAccepted: false },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.slice(0, maxLength) : '';
}

/** UUID v4 utilisée comme clé d'idempotence de `POST /orders`. */
export function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function validateFullName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === '') return 'Indiquez votre nom complet.';
  if (trimmed.length < 2) return 'Votre nom doit contenir au moins 2 caractères.';
  if (trimmed.length > CHECKOUT_NAME_MAX_LENGTH) {
    return `Votre nom ne doit pas dépasser ${CHECKOUT_NAME_MAX_LENGTH} caractères.`;
  }
  if (!/\p{L}/u.test(trimmed)) return 'Votre nom doit contenir au moins une lettre.';
  return null;
}

export function validateCheckoutPhone(value: string): string | null {
  const compact = compactPhone(value);
  if (compact === '') return 'Saisissez votre numéro de téléphone.';
  if (isCameroonLocalPhoneNumber(compact) || isCameroonPhoneNumber(compact)) return null;
  return 'Saisissez un numéro camerounais à 9 chiffres (ex. 6 71 23 45 67).';
}

export function validateOptionalEmail(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (trimmed.length > CHECKOUT_EMAIL_MAX_LENGTH) return 'Cette adresse e-mail est trop longue.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
    return 'Saisissez un e-mail valide, par exemple vous@exemple.com.';
  }
  return null;
}

export function validateRequiredText(
  value: string,
  message: string,
  maxLength: number,
): string | null {
  if (value.trim() === '') return message;
  if (value.trim().length > maxLength) {
    return `Ce champ ne doit pas dépasser ${maxLength} caractères.`;
  }
  return null;
}

export const fullNameFieldValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const error = validateFullName(String(control.value ?? ''));
  return error === null ? null : { fullName: { message: error } };
};

export const checkoutPhoneFieldValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const error = validateCheckoutPhone(String(control.value ?? ''));
  return error === null ? null : { phone: { message: error } };
};

export const optionalEmailFieldValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const error = validateOptionalEmail(String(control.value ?? ''));
  return error === null ? null : { email: { message: error } };
};

/** Numéro complet attendu par `POST /orders` (+237XXXXXXXXX). */
export function toOrderPhone(localPhone: string): string {
  return normalizeCameroonPhone(localPhone);
}

export interface CheckoutContactErrors {
  fullName: string | null;
  phone: string | null;
  email: string | null;
}

export function validateContact(contact: CheckoutContact): CheckoutContactErrors {
  return {
    fullName: validateFullName(contact.fullName),
    phone: validateCheckoutPhone(contact.phone),
    email: validateOptionalEmail(contact.email),
  };
}

export function isContactValid(contact: CheckoutContact): boolean {
  const errors = validateContact(contact);
  return errors.fullName === null && errors.phone === null && errors.email === null;
}

export function isDeliveryValid(delivery: CheckoutDelivery): boolean {
  return (
    delivery.zoneId !== null &&
    validateRequiredText(delivery.city, 'Indiquez votre ville.', CHECKOUT_CITY_MAX_LENGTH) ===
      null &&
    validateRequiredText(
      delivery.district,
      'Indiquez votre quartier.',
      CHECKOUT_DISTRICT_MAX_LENGTH,
    ) === null &&
    validateRequiredText(
      delivery.landmark,
      'Indiquez un point de repère pour le livreur.',
      CHECKOUT_LANDMARK_MAX_LENGTH,
    ) === null
  );
}

/**
 * Restaure un brouillon persisté en ignorant toute donnée invalide.
 * Une étape n'est conservée que si les étapes précédentes sont complètes.
 */
export function sanitizeCheckoutDraft(value: unknown): CheckoutDraft | null {
  if (!isRecord(value)) return null;
  if (value['version'] !== CHECKOUT_DRAFT_VERSION) return null;

  const contactValue = isRecord(value['contact']) ? value['contact'] : {};
  const deliveryValue = isRecord(value['delivery']) ? value['delivery'] : {};
  const paymentValue = isRecord(value['payment']) ? value['payment'] : {};

  const contact: CheckoutContact = {
    fullName: asString(contactValue['fullName'], CHECKOUT_NAME_MAX_LENGTH),
    phone: asString(contactValue['phone'], 20),
    email: asString(contactValue['email'], CHECKOUT_EMAIL_MAX_LENGTH),
  };

  const zoneId = typeof deliveryValue['zoneId'] === 'string' ? deliveryValue['zoneId'] : null;
  const delivery: CheckoutDelivery = {
    city: asString(deliveryValue['city'], CHECKOUT_CITY_MAX_LENGTH),
    district: asString(deliveryValue['district'], CHECKOUT_DISTRICT_MAX_LENGTH),
    landmark: asString(deliveryValue['landmark'], CHECKOUT_LANDMARK_MAX_LENGTH),
    zoneId,
  };

  const payment: CheckoutPayment = {
    method: paymentValue['method'] === 'MOBILE_MONEY' ? 'MOBILE_MONEY' : 'COD',
    termsAccepted: paymentValue['termsAccepted'] === true,
  };

  const requestedStep = value['step'];
  let step: CheckoutStep =
    requestedStep === 3 || requestedStep === 2 || requestedStep === 1 ? requestedStep : 1;
  // On ne restaure jamais une étape dont les prérequis ont disparu.
  if (step >= 2 && !isContactValid(contact)) step = 1;
  if (step >= 3 && !isDeliveryValid(delivery)) step = isContactValid(contact) ? 2 : 1;

  const idempotencyKey =
    typeof value['idempotencyKey'] === 'string' && /^[0-9a-f-]{36}$/i.test(value['idempotencyKey'])
      ? value['idempotencyKey']
      : createIdempotencyKey();

  return {
    version: CHECKOUT_DRAFT_VERSION,
    step,
    contact,
    delivery,
    payment,
    idempotencyKey,
    updatedAt:
      typeof value['updatedAt'] === 'string' ? value['updatedAt'] : new Date().toISOString(),
  };
}
