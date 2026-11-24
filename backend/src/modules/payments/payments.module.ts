import { Module } from '@nestjs/common';

import { PAYMENT_PROVIDER } from '../../infrastructure/payments/payment.provider';
import { FakePaymentProvider } from '../../infrastructure/payments/fake-payment.provider';
import { PaymentProviderFactory } from '../../infrastructure/payments/payment-provider.factory';

@Module({
  providers: [
    FakePaymentProvider,
    PaymentProviderFactory,
    {
      provide: PAYMENT_PROVIDER,
      useFactory: (factory: PaymentProviderFactory) => factory.getProvider(),
      inject: [PaymentProviderFactory],
    },
  ],
  exports: [PAYMENT_PROVIDER, PaymentProviderFactory],
})
export class PaymentsModule {}
