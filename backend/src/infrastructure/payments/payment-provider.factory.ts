import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FakePaymentProvider } from './fake-payment.provider';
import { PaymentProvider } from './payment.provider';

@Injectable()
export class PaymentProviderFactory {
  private readonly provider: PaymentProvider;

  constructor(
    private readonly config: ConfigService,
    private readonly fakeProvider: FakePaymentProvider,
  ) {
    const providerName = this.config.get<string>('PAYMENT_PROVIDER', 'fake');
    switch (providerName) {
      case 'fake':
        this.provider = this.fakeProvider;
        break;
      default:
        throw new Error(
          `PaymentProvider inconnu : '${providerName}'. Valeurs acceptées : fake, campay, cinetpay, flutterwave, notchpay.`,
        );
    }
  }

  getProvider(): PaymentProvider {
    return this.provider;
  }
}
