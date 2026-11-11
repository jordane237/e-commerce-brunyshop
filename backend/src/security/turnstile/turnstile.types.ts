export type TurnstileFailureReason =
  | 'empty-token'
  | 'invalid-token'
  | 'timeout'
  | 'network-error'
  | 'http-error'
  | 'invalid-response'
  | 'internal-error';

export interface TurnstileVerifyResult {
  success: boolean;
  skipped?: boolean;
  unavailable?: boolean;
  reason?: TurnstileFailureReason;
  errorCodes?: string[];
}
