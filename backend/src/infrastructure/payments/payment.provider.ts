// payment.provider.ts
// Port hexagonal pour les prestataires de paiement (PAY-02).
// Aucune dépendance métier vers un prestataire précis : les implémentations
// (FakePaymentProvider, puis Campay/CinetPay/Flutterwave/NotchPay en PAY-03)
// sont interchangeables via configuration (PAYMENT_PROVIDER).

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

// =============================================================================
// Statut commun (agnostique du prestataire)
// =============================================================================

export enum PaymentProviderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

// =============================================================================
// Types communs (DTO) — agnostiques du prestataire
// =============================================================================

export interface InitiatePaymentParams {
  orderId: string;
  reference: string; // référence commande (BRN-YYMM-XXXX)
  amount: number; // XAF (entier)
  currency: 'XAF';
  customerPhone?: string;
  customerEmail?: string;
  returnUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface InitiatePaymentResult {
  providerRef: string;
  status: PaymentProviderStatus;
  redirectUrl?: string;
  instructions?: string;
  rawResponse?: Record<string, unknown>;
}

export interface VerifyWebhookParams {
  rawBody: Buffer | string;
  headers: Record<string, string>;
}

export interface VerifyWebhookResult {
  valid: boolean;
  eventType?: string;
  providerRef?: string;
  orderReference?: string;
  amount?: number;
  status?: PaymentProviderStatus;
  paidAt?: Date;
  rawEvent?: Record<string, unknown>;
}

export interface RefundPaymentParams {
  providerRef: string;
  amount: number; // XAF
  reason?: string;
}

export interface RefundPaymentResult {
  providerRef: string;
  refundRef: string;
  status: PaymentProviderStatus;
  refundedAt: Date;
}

export interface GetPaymentStatusParams {
  providerRef: string;
}

export interface GetPaymentStatusResult {
  providerRef: string;
  status: PaymentProviderStatus;
  amount?: number;
  paidAt?: Date;
  rawResponse?: Record<string, unknown>;
}

// =============================================================================
// Interface PaymentProvider (port)
// =============================================================================

export interface PaymentProvider {
  readonly name: string;
  initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult>;
  verifyWebhook(params: VerifyWebhookParams): Promise<VerifyWebhookResult>;
  refund(params: RefundPaymentParams): Promise<RefundPaymentResult>;
  status(params: GetPaymentStatusParams): Promise<GetPaymentStatusResult>;
}
