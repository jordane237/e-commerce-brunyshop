import { describe, expect, it } from 'vitest';

import { FakePaymentProvider } from './fake-payment.provider';
import { PaymentProviderStatus } from './payment.provider';

describe('FakePaymentProvider', () => {
  it('name = fake', () => {
    expect(new FakePaymentProvider().name).toBe('fake');
  });

  it('initiate par défaut → SUCCEEDED, providerRef fake_*, redirectUrl', async () => {
    const provider = new FakePaymentProvider();
    const result = await provider.initiate({
      orderId: 'order-1',
      reference: 'BRN-2611-ABCD',
      amount: 25000,
      currency: 'XAF',
      returnUrl: 'https://example.com/retour',
    });
    expect(result.providerRef).toMatch(/^fake_/);
    expect(result.status).toBe(PaymentProviderStatus.SUCCEEDED);
    expect(result.redirectUrl).toContain(result.providerRef);
    expect(result.instructions).toContain('factice');
  });

  it('initiate avec simulateStatus = FAILED → FAILED, pas de paidAt', async () => {
    const provider = new FakePaymentProvider();
    const result = await provider.initiate({
      orderId: 'order-1',
      reference: 'BRN-2611-ABCD',
      amount: 25000,
      currency: 'XAF',
      metadata: { simulateStatus: PaymentProviderStatus.FAILED },
    });
    expect(result.status).toBe(PaymentProviderStatus.FAILED);
    const st = await provider.status({ providerRef: result.providerRef });
    expect(st.paidAt).toBeUndefined();
  });

  it('verifyWebhook signature valide → valid true', async () => {
    const provider = new FakePaymentProvider();
    const result = await provider.verifyWebhook({
      rawBody: JSON.stringify({
        providerRef: 'fake_1',
        orderReference: 'BRN',
        amount: 1000,
        status: 'SUCCEEDED',
      }),
      headers: { 'x-fake-signature': 'fake-valid' },
    });
    expect(result.valid).toBe(true);
    expect(result.providerRef).toBe('fake_1');
    expect(result.amount).toBe(1000);
  });

  it('verifyWebhook signature invalide → valid false', async () => {
    const provider = new FakePaymentProvider();
    const result = await provider.verifyWebhook({
      rawBody: '{}',
      headers: { 'x-fake-signature': 'nope' },
    });
    expect(result.valid).toBe(false);
  });

  it('verifyWebhook payload invalide → valid false', async () => {
    const provider = new FakePaymentProvider();
    const result = await provider.verifyWebhook({
      rawBody: 'not-json',
      headers: { 'x-fake-signature': 'fake-valid' },
    });
    expect(result.valid).toBe(false);
  });

  it('refund OK → REFUNDED, refundRef', async () => {
    const provider = new FakePaymentProvider();
    const init = await provider.initiate({
      orderId: 'o',
      reference: 'r',
      amount: 5000,
      currency: 'XAF',
    });
    const refund = await provider.refund({
      providerRef: init.providerRef,
      amount: 2000,
      reason: 'test',
    });
    expect(refund.status).toBe(PaymentProviderStatus.REFUNDED);
    expect(refund.refundRef).toMatch(/^fake_refund_/);
  });

  it('refund montant > payé → throw', async () => {
    const provider = new FakePaymentProvider();
    const init = await provider.initiate({
      orderId: 'o',
      reference: 'r',
      amount: 5000,
      currency: 'XAF',
    });
    await expect(
      provider.refund({ providerRef: init.providerRef, amount: 9999 }),
    ).rejects.toThrow();
  });

  it('refund providerRef inconnu → throw', async () => {
    const provider = new FakePaymentProvider();
    await expect(provider.refund({ providerRef: 'nope', amount: 1 })).rejects.toThrow();
  });

  it('status inconnu → throw', async () => {
    const provider = new FakePaymentProvider();
    await expect(provider.status({ providerRef: 'nope' })).rejects.toThrow();
  });

  it('clear vide la map', async () => {
    const provider = new FakePaymentProvider();
    const init = await provider.initiate({
      orderId: 'o',
      reference: 'r',
      amount: 1000,
      currency: 'XAF',
    });
    provider.clear();
    await expect(provider.status({ providerRef: init.providerRef })).rejects.toThrow();
  });
});
