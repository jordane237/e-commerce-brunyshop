import { describe, expect, it } from 'vitest';

import { renderTemplate } from './template.registry';

describe('contact templates (MKT-02)', () => {
  it('renders the support notification with all request fields', () => {
    const result = renderTemplate('contact.message', 'v1', {
      contactId: 'msg-1',
      name: 'Awa Mbarga',
      email: 'awa@example.cm',
      phone: '+237699000001',
      subjectLabel: 'Une commande',
      orderReference: 'BRN-2611-7K3F',
      message: 'Bonjour, où en est ma commande ?',
      submittedAt: '2026-11-16T10:30:00.000Z',
    });

    expect(result.subject).toContain('Une commande');
    expect(result.html).toContain('awa@example.cm');
    expect(result.html).toContain('BRN-2611-7K3F');
    expect(result.text).toContain('Bonjour, où en est ma commande ?');
    expect(result.text).not.toContain('[MISSING_');
  });

  it('escapes untrusted HTML in e-mail bodies while keeping text raw', () => {
    const result = renderTemplate('contact.message', 'v1', {
      contactId: 'msg-2',
      name: 'Awa <b>Mbarga</b>',
      email: 'awa@example.cm',
      phone: 'Non renseigné',
      subjectLabel: 'Autre demande',
      orderReference: 'Non renseignée',
      message: '<script>alert("x")</script> & fin',
      submittedAt: '2026-11-16T10:30:00.000Z',
    });

    expect(result.html).not.toContain('<script>alert');
    expect(result.html).not.toContain('<b>Mbarga</b>');
    expect(result.html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; fin');
    expect(result.text).toContain('<script>alert("x")</script> & fin');
  });

  it('strips CR/LF from an interpolated subject', () => {
    const result = renderTemplate('contact.message', 'v1', {
      contactId: 'msg-3',
      name: 'Awa\r\nBcc: intrus@example.com',
      email: 'awa@example.cm',
      phone: 'Non renseigné',
      subjectLabel: 'Autre demande',
      orderReference: 'Non renseignée',
      message: 'Message suffisamment long.',
      submittedAt: '2026-11-16T10:30:00.000Z',
    });

    expect(result.subject).not.toMatch(/[\r\n]/);
    expect(result.subject).toContain('Awa Bcc: intrus@example.com');
  });

  it('renders the visitor confirmation with the canonical response time', () => {
    const result = renderTemplate('contact.confirmation', 'v1', {
      name: 'Awa',
      subjectLabel: 'Une livraison',
    });

    expect(result.subject).toContain('bien reçu');
    expect(result.html).toContain('sous 24 h ouvrées');
    expect(result.text).toContain('sous 24 h ouvrées');
  });
});
