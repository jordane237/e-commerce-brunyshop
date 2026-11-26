// notification-provider.interface.ts
// Interfaces communes pour les adaptateurs de notification (NTF-01).

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SmsPayload {
  to: string; // format international +237...
  message: string;
}

export interface WhatsAppPayload {
  to: string; // format international +237...
  templateName: string;
  templateData: Record<string, string>;
}

export interface NotificationProvider<T> {
  send(payload: T): Promise<SendResult>;
}

export type EmailProvider = NotificationProvider<EmailPayload>;
export type SmsProvider = NotificationProvider<SmsPayload>;
export type WhatsAppProvider = NotificationProvider<WhatsAppPayload>;
