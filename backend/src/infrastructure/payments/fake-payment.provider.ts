import { Injectable } from '@nestjs/common';

import {
  PaymentProvider,
  PaymentProviderStatus,
  type GetPaymentStatusParams,
  type GetPaymentStatusResult,
  type InitiatePaymentParams,
  type InitiatePaymentResult,
  type RefundPaymentParams,
  type RefundPaymentResult,
  type VerifyWebhookParams,
  type VerifyWebhookResult,
} from './payment.provider';

interface FakePaymentRecord {
  status: PaymentProviderStatus;
  amount: number;
  orderReference: string;
  paidAt?: Date;
}

@Injectable()
export class FakePaymentProvider implements PaymentProvider {
  readonly name = 'fake';

  private readonly fakePayments = new Map<string, FakePaymentRecord>();

  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const providerRef = `fake_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const simulateStatus =
      (params.metadata?.simulateStatus as PaymentProviderStatus | undefined) ??
      PaymentProviderStatus.SUCCEEDED;

    this.fakePayments.set(providerRef, {
      status: simulateStatus,
      amount: params.amount,
      orderReference: params.reference,
      paidAt: simulateStatus === PaymentProviderStatus.SUCCEEDED ? new Date() : undefined,
    });

    return {
      providerRef,
      status: simulateStatus,
      redirectUrl: params.returnUrl
        ? `${params.returnUrl}?providerRef=${providerRef}&status=${simulateStatus}`
        : undefined,
      instructions: 'Paiement factice (dev) — aucun débit réel.',
    };
  }

  async verifyWebhook(params: VerifyWebhookParams): Promise<VerifyWebhookResult> {
    try {
      const raw =
        typeof params.rawBody === 'string' ? params.rawBody : params.rawBody.toString('utf-8');
      const payload = JSON.parse(raw) as Record<string, unknown>;
      const signature = params.headers['x-fake-signature'];
      if (signature !== 'fake-valid') {
        return { valid: false };
      }
      const status =
        (payload.status as PaymentProviderStatus | undefined) ?? PaymentProviderStatus.SUCCEEDED;
      return {
        valid: true,
        eventType: (payload.eventType as string | undefined) ?? 'payment.succeeded',
        providerRef: payload.providerRef as string | undefined,
        orderReference: payload.orderReference as string | undefined,
        amount: payload.amount as number | undefined,
        status,
        paidAt: payload.paidAt ? new Date(String(payload.paidAt)) : new Date(),
        rawEvent: payload,
      };
    } catch {
      return { valid: false };
    }
  }

  async refund(params: RefundPaymentParams): Promise<RefundPaymentResult> {
    const existing = this.fakePayments.get(params.providerRef);
    if (!existing) {
      throw new Error(`Fake payment not found: ${params.providerRef}`);
    }
    if (params.amount > existing.amount) {
      throw new Error(`Refund amount ${params.amount} exceeds paid amount ${existing.amount}`);
    }
    existing.status = PaymentProviderStatus.REFUNDED;
    this.fakePayments.set(params.providerRef, existing);
    const refundRef = `fake_refund_${Date.now()}`;
    return {
      providerRef: params.providerRef,
      refundRef,
      status: PaymentProviderStatus.REFUNDED,
      refundedAt: new Date(),
    };
  }

  async status(params: GetPaymentStatusParams): Promise<GetPaymentStatusResult> {
    const existing = this.fakePayments.get(params.providerRef);
    if (!existing) {
      throw new Error(`Fake payment not found: ${params.providerRef}`);
    }
    return {
      providerRef: params.providerRef,
      status: existing.status,
      amount: existing.amount,
      paidAt: existing.paidAt,
    };
  }

  clear(): void {
    this.fakePayments.clear();
  }
}
