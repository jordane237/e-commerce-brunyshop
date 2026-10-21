export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export interface PaymentRequest {
  orderId: string;
  amountXaf: number;
  method: string;
}

export interface PaymentInitiation {
  providerReference: string;
  status: 'PENDING';
}

export interface PaymentProvider {
  initiate(request: PaymentRequest): Promise<PaymentInitiation>;
}

/** Development placeholder; it never captures money or confirms an order. */
export class FakePaymentProvider implements PaymentProvider {
  async initiate(request: PaymentRequest): Promise<PaymentInitiation> {
    if (!Number.isSafeInteger(request.amountXaf) || request.amountXaf <= 0) {
      throw new Error('Payment amount must be a positive XAF integer');
    }
    return { providerReference: `fake_${request.orderId}`, status: 'PENDING' };
  }
}
