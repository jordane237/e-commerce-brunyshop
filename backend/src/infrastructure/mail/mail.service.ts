import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

// Minimal SMTP sender (dev target: Mailpit on 11025). Queueing (BullMQ)
// replaces direct sending at the notifications step.
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly fromAddress: string;

  constructor(config: ConfigService) {
    const host = config.get<string>('SMTP_HOST') ?? 'localhost';
    const port = Number(config.get<string>('SMTP_PORT') ?? '11025');
    const user = config.get<string>('SMTP_USER');
    const password = config.get<string>('SMTP_PASSWORD');
    this.fromAddress =
      config.get<string>('MAIL_FROM') ?? 'BRUNY SHOPPING <no-reply@brunyshop.local>';
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      auth: user && password ? { user, pass: password } : undefined,
    });
  }

  async sendPasswordResetCode(to: string, code: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.fromAddress,
      to,
      subject: 'BRUNY SHOPPING — Réinitialisation de votre mot de passe',
      text: [
        'Bonjour,',
        '',
        `Votre code de réinitialisation est : ${code}`,
        '',
        'Il expire dans 15 minutes et ne peut être utilisé qu’une fois.',
        'Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.',
        '',
        'BRUNY SHOPPING',
      ].join('\n'),
    });
    this.logger.log(`password reset mail queued for ${this.maskRecipient(to)}`);
  }

  private maskRecipient(address: string): string {
    const [local, domain] = address.split('@');
    if (!domain || !local) return '[REDACTED]';
    return `${local.slice(0, 1)}***@${domain}`;
  }
}
