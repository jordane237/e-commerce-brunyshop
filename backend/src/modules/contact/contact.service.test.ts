import type { ConfigService } from '@nestjs/config';
import type { PinoLogger } from 'nestjs-pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../infrastructure/database/database.module';
import type { AuditLogService } from '../audit/audit.service';
import type { NotificationsService } from '../notifications/notifications.service';
import { ContactService } from './contact.service';
import type { ContactDto } from './dto/contact.dto';

const CREATED_AT = new Date('2026-11-16T10:30:00.000Z');

function dto(overrides: Partial<ContactDto> = {}): ContactDto {
  return {
    name: 'Awa Mbarga',
    email: 'awa@example.cm',
    phone: '+237699000001',
    subject: 'order',
    orderReference: 'BRN-2611-7K3F',
    message: 'Bonjour, je souhaite suivre ma commande passée hier.',
    consent: true,
    turnstileToken: 'token',
    ...overrides,
  };
}

function createService() {
  const create = vi.fn().mockResolvedValue({ id: 'msg-1', createdAt: CREATED_AT });
  const enqueueEmail = vi.fn().mockResolvedValue('notification-1');
  const record = vi.fn().mockResolvedValue(undefined);
  const info = vi.fn();
  const warn = vi.fn();
  const get = vi.fn((key: string) =>
    key === 'app' ? { contactEmailTo: 'support@brunyshop.cm' } : undefined,
  );

  const service = new ContactService(
    { contactMessage: { create } } as unknown as PrismaService,
    { get } as unknown as ConfigService,
    { enqueueEmail } as unknown as NotificationsService,
    { record } as unknown as AuditLogService,
    { info, warn } as unknown as PinoLogger,
  );

  return { service, create, enqueueEmail, record, info, warn };
}

describe('ContactService (MKT-02)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists the message, notifies support and the visitor, then audits without PII', async () => {
    const { service, create, enqueueEmail, record, info } = createService();

    const result = await service.submit(dto(), {
      ipAddress: '10.0.0.4',
      userAgent: 'test-agent',
    });

    expect(result).toEqual({
      id: 'msg-1',
      receivedAt: CREATED_AT.toISOString(),
      message: 'Votre message est envoyé. Nous répondons sous 24 h ouvrées.',
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        name: 'Awa Mbarga',
        email: 'awa@example.cm',
        phone: '+237699000001',
        subject: 'order',
        orderReference: 'BRN-2611-7K3F',
        message: 'Bonjour, je souhaite suivre ma commande passée hier.',
        consent: true,
        ip: '10.0.0.4',
        userAgent: 'test-agent',
      },
      select: { id: true, createdAt: true },
    });

    expect(enqueueEmail).toHaveBeenNthCalledWith(
      1,
      null,
      'support@brunyshop.cm',
      'contact.message',
      'v1',
      expect.objectContaining({
        contactId: 'msg-1',
        email: 'awa@example.cm',
        subjectLabel: 'Une commande',
        orderReference: 'BRN-2611-7K3F',
      }),
      { metadata: { contactId: 'msg-1', subject: 'order' } },
    );
    expect(enqueueEmail).toHaveBeenNthCalledWith(
      2,
      null,
      'awa@example.cm',
      'contact.confirmation',
      'v1',
      { name: 'Awa Mbarga', subjectLabel: 'Une commande' },
      { metadata: { contactId: 'msg-1' } },
    );

    expect(record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        action: 'CONTACT_SUBMITTED',
        entity: 'ContactMessage',
        entityId: 'msg-1',
        ip: '10.0.0.4',
        after: {
          subject: 'order',
          emailMasked: 'a***@example.cm',
          hasPhone: true,
          orderReference: 'BRN-2611-7K3F',
        },
      }),
    );

    const logged = JSON.stringify(info.mock.calls);
    expect(logged).not.toContain('awa@example.cm');
    expect(logged).not.toContain('Bonjour, je souhaite');
  });

  it('silently accepts a filled honeypot without storing or notifying', async () => {
    const { service, create, enqueueEmail } = createService();

    const result = await service.submit(dto({ _honey: 'https://spam.example' }), {});

    expect(result.message).toContain('Votre message est envoyé');
    expect(create).not.toHaveBeenCalled();
    expect(enqueueEmail).not.toHaveBeenCalled();
  });

  it('does not fail the request when the visitor confirmation cannot be queued', async () => {
    const { service, enqueueEmail, record, warn } = createService();
    enqueueEmail.mockResolvedValueOnce('support-job').mockRejectedValueOnce(new Error('queue'));

    await expect(service.submit(dto(), {})).resolves.toMatchObject({ id: 'msg-1' });

    expect(record).toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ contactMessageId: 'msg-1', err: 'queue' }),
      'contact confirmation could not be enqueued',
    );
  });
});
