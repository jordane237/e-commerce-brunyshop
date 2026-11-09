// sms.adapter.ts
// Adaptateur SMS factice NTF-01 : log sanitisé + buffer in-memory pour tests.
// En production, le vrai provider sera injecté via SMS_PROVIDER.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { SmsProvider } from './notification-provider.interface';
import { sanitizePhone } from '../sanitizers/notification-sanitizer';

@Injectable()
export class SmsAdapter implements SmsProvider {
  private readonly logger = new Logger(SmsAdapter.name);
  private readonly sent: { to: string; message: string; messageId: string }[] = [];
  private readonly driver = this.config.get<string>('SMS_DRIVER');

  constructor(private readonly config: ConfigService) {
    this.logger.log(`SmsAdapter driver=${this.driver ?? 'console'}`);
  }

  async send(payload: Parameters<SmsProvider['send']>[0]): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    const messageId = this.messageId();
    if (this.driver === 'console' || this.driver === 'fake') {
      this.logger.warn(
        `[SMS-FAKE] to=${sanitizePhone(payload.to)} template=console messageLength=${
          payload.message.length
        } chars`,
      );
      this.sent.push({ to: payload.to, message: payload.message, messageId });
      return { success: true, messageId };
    }

    // Production placeholder : implémentation à ajouter dans un futur ticket.
    throw new Error(`SMS provider "${this.driver}" not implemented yet (NTF-01 MVP).`);
  }

  clear(): void {
    this.sent.length = 0;
  }

  sentMessages(): ReadonlyArray<{ to: string; message: string; messageId: string }> {
    return this.sent;
  }

  private messageId(): string {
    return `fake-sms-${randomUUID()}`;
  }
}
