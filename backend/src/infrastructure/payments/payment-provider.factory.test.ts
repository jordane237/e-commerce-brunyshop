import { describe, expect, it, vi } from 'vitest';

import { ConfigService } from '@nestjs/config';

import { FakePaymentProvider } from './fake-payment.provider';
import { PaymentProviderFactory } from './payment-provider.factory';

describe('PaymentProviderFactory', () => {
  it("PAYMENT_PROVIDER=fake → getProvider().name = 'fake'", () => {
    const config = { get: vi.fn().mockReturnValue('fake') } as unknown as ConfigService;
    const factory = new PaymentProviderFactory(config, new FakePaymentProvider());
    expect(factory.getProvider().name).toBe('fake');
  });

  it('PAYMENT_PROVIDER invalide → throw au boot', () => {
    const config = { get: vi.fn().mockReturnValue('unknown-provider') } as unknown as ConfigService;
    expect(() => new PaymentProviderFactory(config, new FakePaymentProvider())).toThrow();
  });
});
