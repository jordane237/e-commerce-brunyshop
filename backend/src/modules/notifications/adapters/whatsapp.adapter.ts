// whatsapp.adapter.ts
// Adaptateur WhatsApp factice NTF-01 : log sanitisé + buffer in-memory pour tests.
// En production, le vrai provider sera injecté via WHATSAPP_DRIVER.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { WhatsAppProvider } from './notification-provider.interface';
import { sanitizePhone } from '../sanitizers/notification-sanitizer';

@Injectable()
export class WhatsAppAdapter implements WhatsAppProvider {
  private readonly logger = new Logger(WhatsAppAdapter.name);
  private readonly sent: {
    to: string;
    templateName: string;
    templateData: Record<string, string>;
    messageId: string;
  }[] = [];
  private readonly driver = this.config.get<string>('WHATSAPP_DRIVER');

  constructor(private readonly config: ConfigService) {
    this.logger.log(`WhatsAppAdapter driver=${this.driver ?? 'console'}`);
  }

  async send(
    payload: Parameters<WhatsAppProvider['send']>[0],
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const messageId = this.messageId();
    if (this.driver === 'console' || this.driver === 'fake') {
      this.logger.warn(
        `[WHATSAPP-FAKE] to=${sanitizePhone(payload.to)} template=${payload.templateName} dataKeys=${Object.keys(payload.templateData).join(',')}`,
      );
      this.sent.push({
        to: payload.to,
        templateName: payload.templateName,
        templateData: payload.templateData,
        messageId,
      });
      return { success: true, messageId };
    }

    // Production placeholder : implémentation à ajouter dans un futur ticket.
    throw new Error(`WhatsApp provider "${this.driver}" not implemented yet (NTF-01 MVP).`);
  }

  clear(): void {
    this.sent.length = 0;
  }

  sentMessages(): ReadonlyArray<{
    to: string;
    templateName: string;
    templateData: Record<string, string>;
    messageId: string;
  }> {
    return this.sent;
  }

  private messageId(): string {
    return `fake-wa-${randomUUID()}`;
  }
}
