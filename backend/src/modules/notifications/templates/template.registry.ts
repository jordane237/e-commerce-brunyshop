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
import { OrderShippedV1 } from './fr/order.shipped.v1';
import { OrderDeliveredV1 } from './fr/order.delivered.v1';
import { PasswordResetV1 } from './fr/password.reset.v1';

export const TEMPLATES: Record<string, Record<string, NotificationTemplate>> = {
  'auth.register.welcome': { v1: AuthRegisterWelcomeV1 },
  'auth.login.new-device': { v1: AuthLoginNewDeviceV1 },
  'order.confirmed': { v1: OrderConfirmedV1 },
  'order.shipped': { v1: OrderShippedV1 },
  'order.delivered': { v1: OrderDeliveredV1 },
  'password.reset': { v1: PasswordResetV1 },
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
    subject: interpolate(template.subject, data),
    html: interpolate(template.html, data),
    text: interpolate(template.text, data),
  };
}

/**
 * Interpole les variables {{var}} du template avec les valeurs fournies.
 * Les variables absentes de `data` sont remplacées par [MISSING_var] plutôt
 * que laissées en clair, pour que le rendu soit toujours explicite.
 */
export function interpolate(template: string, data: TemplateData): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, name) => {
    const value = data[name];
    if (value === null || value === undefined) {
      return `[MISSING_${name}]`;
    }
    return String(value);
  });
}
