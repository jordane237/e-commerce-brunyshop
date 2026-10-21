import { Module } from '@nestjs/common';
import {
  PAYMENT_PROVIDER,
  FakePaymentProvider,
} from '../../infrastructure/payments/payment.provider';

@Module({
  providers: [{ provide: PAYMENT_PROVIDER, useClass: FakePaymentProvider }],
  exports: [PAYMENT_PROVIDER],
})
export class PaymentsModule {}
