"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakePaymentProvider = exports.PAYMENT_PROVIDER = void 0;
exports.PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
/** Development placeholder; it never captures money or confirms an order. */
class FakePaymentProvider {
    async initiate(request) {
        if (!Number.isSafeInteger(request.amountXaf) || request.amountXaf <= 0) {
            throw new Error('Payment amount must be a positive XAF integer');
        }
        return { providerReference: `fake_${request.orderId}`, status: 'PENDING' };
    }
}
exports.FakePaymentProvider = FakePaymentProvider;
