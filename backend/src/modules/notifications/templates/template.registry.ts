// template.registry.ts
// Registre des modèles de notification versionnés (NTF-01).
// Chaque template = { key, version, subject, html, text }.
// Les variables sont injectées via {{variable}}; aucun secret n'est stocké
// dans le template (ex: token de reset → injecté via actionUrl au runtime).

export interface NotificationTemplate {
  key: string;
  version: string;
  subject: string;
  html: string;
  text: string;
}

import { AuthRegisterWelcomeV1 } from './fr/auth.register.welcome.v1';
import { AuthLoginNewDeviceV1 } from './fr/auth.login.new-device.v1';
import { OrderConfirmedV1 } from './fr/order.confirmed.v1';
import { OrderConfirmationWhatsappV1 } from './fr/order.confirmation.whatsapp.v1';
import { OrderCreatedAdminV1 } from './fr/order.created.admin.v1';
import { OrderCreatedV1 } from './fr/order.created.v1';
import { OrderShippedV1 } from './fr/order.shipped.v1';
import { OrderDeliveredV1 } from './fr/order.delivered.v1';
import { PasswordResetV1 } from './fr/password.reset.v1';
import { StockLowV1 } from './fr/stock.low.v1';
import { ContactMessageV1 } from './fr/contact.message.v1';
import { ContactConfirmationV1 } from './fr/contact.confirmation.v1';

export const TEMPLATES: Record<string, Record<string, NotificationTemplate>> = {
  'auth.register.welcome': { v1: AuthRegisterWelcomeV1 },
  'auth.login.new-device': { v1: AuthLoginNewDeviceV1 },
  'order.confirmed': { v1: OrderConfirmedV1 },
  'order.confirmation.whatsapp': { v1: OrderConfirmationWhatsappV1 },
  'order.created': { v1: OrderCreatedV1 },
  'order.created.admin': { v1: OrderCreatedAdminV1 },
  'order.shipped': { v1: OrderShippedV1 },
  'order.delivered': { v1: OrderDeliveredV1 },
  'password.reset': { v1: PasswordResetV1 },
  'stock.low': { v1: StockLowV1 },
  'contact.message': { v1: ContactMessageV1 },
  'contact.confirmation': { v1: ContactConfirmationV1 },
};

export type TemplateKey = keyof typeof TEMPLATES;
export type TemplateVersion = string;

export function resolveTemplate(key: string, version: string): NotificationTemplate {
  const versions = TEMPLATES[key];
  if (!versions) {
    throw new Error(`Notification template not found: ${key}`);
  }
  const requested = versions[version];
  if (requested) {
    return requested;
  }
  // Fallback sur la version disponible la plus récente déclarée dans le registre.
  const fallback = versions[Object.keys(versions)[0]];
  if (!fallback) {
    throw new Error(`Notification template has no available version: ${key}`);
  }
  return fallback;
}

export interface TemplateData {
  [key: string]: string | number | boolean | null | undefined;
}

export function renderTemplate(
  key: string,
  version: string,
  data: TemplateData,
): { subject: string; html: string; text: string } {
  const template = resolveTemplate(key, version);
  return {
    // A header value must never carry CR/LF from interpolated data.
    subject: interpolate(template.subject, data).replace(/[\r\n]+/g, ' '),
    // HTML bodies contain untrusted values (names, messages, addresses).
    // Escape them here so a visitor cannot inject markup into an e-mail.
    html: interpolate(template.html, data, { escapeHtml: true }),
    text: interpolate(template.text, data),
  };
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Interpole les variables {{var}} du template avec les valeurs fournies.
 * Les variables absentes de `data` sont remplacées par [MISSING_var] plutôt
 * que laissées en clair, pour que le rendu soit toujours explicite.
 */
export function interpolate(
  template: string,
  data: TemplateData,
  options?: { escapeHtml?: boolean },
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, name) => {
    const value = data[name];
    if (value === null || value === undefined) {
      return `[MISSING_${name}]`;
    }
    const text = String(value);
    return options?.escapeHtml === true ? escapeHtml(text) : text;
  });
}
