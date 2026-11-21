// email.adapter.ts
// Adaptateur email NTF-01 : Nodemailer -> Mailpit en développement,
// console en fallback si SMTP non configuré.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import type { EmailProvider } from './notification-provider.interface';

@Injectable()
export class EmailAdapter implements EmailProvider {
  private readonly logger = new Logger(EmailAdapter.name);
  private readonly transporter: Transporter | null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT'));
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASSWORD');
    const from = this.config.get<string>('MAIL_FROM') ?? 'noreply@brunyshop.cm';

    if (host && port) {
      this.transporter = createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && user !== '' ? { user, pass: pass ?? undefined } : undefined,
      });
    } else {
      this.transporter = null;
    }

    this.logger.log(
      `EmailAdapter initialized: host=${host ?? 'none'}, port=${port ?? 'none'}, from=${from}`,
    );
  }

  async send(payload: Parameters<EmailProvider['send']>[0]): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    if (!this.transporter) {
      this.logger.warn(`[EMAIL-CONSOLE] to=${payload.to} subject=${payload.subject}`);
      return { success: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.config.get<string>('MAIL_FROM') ?? 'noreply@brunyshop.cm',
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });
      return { success: true, messageId: info.messageId };
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err ? String(err.message) : String(err);
      this.logger.error({ err: message }, 'EmailAdapter.send failed');
      return { success: false, error: message };
    }
  }
}
