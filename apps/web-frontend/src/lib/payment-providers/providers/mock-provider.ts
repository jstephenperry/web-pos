/**
 * Mock Payment Provider
 *
 * Simple mock implementation for testing and development.
 * Simulates payment processing without hitting real APIs.
 */

import { BasePaymentProvider } from '../base-provider';
import {
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  CaptureRequest,
  VoidRequest,
  ProviderCapabilities,
  ProviderHealthCheck,
  TransactionStatus,
  PaymentProviderType,
  PaymentMethodType,
} from '../types';

export class MockPaymentProvider extends BasePaymentProvider {
  private transactions: Map<string, PaymentResponse> = new Map();

  async initialize(): Promise<void> {
    this.validateConfig();
    this.log('info', 'Mock provider initialized');
  }

  getCapabilities(): ProviderCapabilities {
    return {
      supportsAuthorization: true,
      supportsCapture: true,
      supportsRefund: true,
      supportsPartialRefund: true,
      supportsVoid: true,
      supportsRecurring: false,
      supportsTokenization: true,
      supportsCustomerProfiles: false,
      supports3DS: false,
      supportsSCA: false,
      supportedPaymentMethods: [
        PaymentMethodType.CARD,
        PaymentMethodType.CASH,
      ],
      supportedCurrencies: ['USD', 'EUR', 'GBP'],
      supportedCountries: ['US', 'GB', 'CA', 'AU'],
      supportsWebhooks: false,
      webhookEvents: [],
    };
  }

  async healthCheck(): Promise<ProviderHealthCheck> {
    const startTime = Date.now();

    return {
      provider: PaymentProviderType.MOCK,
      healthy: true,
      responseTime: Date.now() - startTime,
      lastChecked: new Date(),
    };
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    this.log('info', 'Processing payment', {
      amount: request.amount,
      currency: request.currency,
    });

    // Simulate processing delay
    await this.delay(100 + Math.random() * 400);

    // Determine success based on CVV for testing
    const cvv = request.card?.cvv;
    const shouldSucceed = this.shouldSucceed(cvv);
    const shouldDecline = cvv === '666';

    const transactionId = this.generateTransactionId();
    const providerTransactionId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    let status: TransactionStatus;
    let success: boolean;
    let errorCode: string | undefined;
    let errorMessage: string | undefined;

    if (shouldDecline) {
      status = TransactionStatus.DECLINED;
      success = false;
      errorCode = 'CARD_DECLINED';
      errorMessage = 'Card was declined';
    } else if (!shouldSucceed) {
      status = TransactionStatus.FAILED;
      success = false;
      errorCode = 'PROCESSING_ERROR';
      errorMessage = 'Payment processing failed';
    } else if (request.captureImmediately === false) {
      status = TransactionStatus.AUTHORIZED;
      success = true;
    } else {
      status = TransactionStatus.CAPTURED;
      success = true;
    }

    const response: PaymentResponse = {
      transactionId,
      providerTransactionId,
      providerReference: `REF-${providerTransactionId}`,
      status,
      success,
      amount: request.amount,
      currency: request.currency,
      capturedAmount: status === TransactionStatus.CAPTURED ? request.amount : undefined,
      paymentMethod: request.paymentMethod,
      cardBrand: this.getCardBrand(request.card?.number),
      last4: request.card?.number?.slice(-4),
      authorizationCode: success ? `AUTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : undefined,
      errorCode,
      errorMessage,
      timestamp: new Date(),
      authorizedAt: success ? new Date() : undefined,
      capturedAt: status === TransactionStatus.CAPTURED ? new Date() : undefined,
      metadata: request.metadata,
    };

    // Store transaction
    this.transactions.set(transactionId, response);

    return response;
  }

  async capturePayment(request: CaptureRequest): Promise<PaymentResponse> {
    this.log('info', 'Capturing payment', { transactionId: request.transactionId });

    const original = this.transactions.get(request.transactionId);

    if (!original) {
      throw new Error('Transaction not found');
    }

    if (original.status !== TransactionStatus.AUTHORIZED) {
      throw new Error('Transaction is not in AUTHORIZED status');
    }

    await this.delay(100);

    const updated: PaymentResponse = {
      ...original,
      status: TransactionStatus.CAPTURED,
      capturedAmount: request.amount || original.amount,
      capturedAt: new Date(),
    };

    this.transactions.set(request.transactionId, updated);

    return updated;
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    this.log('info', 'Refunding payment', {
      transactionId: request.transactionId,
      amount: request.amount,
    });

    const original = this.transactions.get(request.transactionId);

    if (!original) {
      throw new Error('Transaction not found');
    }

    if (original.status !== TransactionStatus.CAPTURED && original.status !== TransactionStatus.SETTLED) {
      throw new Error('Transaction cannot be refunded');
    }

    await this.delay(100);

    const refundAmount = request.amount || original.amount;
    const refundId = `refund_${Date.now()}`;

    const response: RefundResponse = {
      refundId,
      providerRefundId: `mock_${refundId}`,
      transactionId: request.transactionId,
      amount: refundAmount,
      currency: original.currency,
      status: TransactionStatus.REFUNDED,
      success: true,
      timestamp: new Date(),
    };

    // Update original transaction
    const isPartialRefund = refundAmount < original.amount;
    const updated: PaymentResponse = {
      ...original,
      status: isPartialRefund ? TransactionStatus.PARTIALLY_REFUNDED : TransactionStatus.REFUNDED,
      refundedAmount: (original.refundedAmount || 0) + refundAmount,
    };

    this.transactions.set(request.transactionId, updated);

    return response;
  }

  async voidPayment(request: VoidRequest): Promise<PaymentResponse> {
    this.log('info', 'Voiding payment', { transactionId: request.transactionId });

    const original = this.transactions.get(request.transactionId);

    if (!original) {
      throw new Error('Transaction not found');
    }

    if (original.status !== TransactionStatus.AUTHORIZED) {
      throw new Error('Only authorized transactions can be voided');
    }

    await this.delay(100);

    const updated: PaymentResponse = {
      ...original,
      status: TransactionStatus.VOIDED,
      voidedAt: new Date(),
    };

    this.transactions.set(request.transactionId, updated);

    return updated;
  }

  async getTransaction(transactionId: string): Promise<PaymentResponse> {
    const transaction = this.transactions.get(transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return transaction;
  }

  async listTransactions(filters?: any): Promise<PaymentResponse[]> {
    const transactions = Array.from(this.transactions.values());

    if (!filters) {
      return transactions;
    }

    return transactions.filter(txn => {
      if (filters.status && txn.status !== filters.status) {
        return false;
      }

      if (filters.startDate && txn.timestamp < filters.startDate) {
        return false;
      }

      if (filters.endDate && txn.timestamp > filters.endDate) {
        return false;
      }

      return true;
    });
  }

  async createPaymentToken(cardDetails: any): Promise<string> {
    return `mock_tok_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  async deletePaymentToken(token: string): Promise<void> {
    this.log('info', 'Deleting payment token', { token });
  }

  // Helper methods

  private shouldSucceed(cvv?: string): boolean {
    if (!cvv) return true;

    // CVV-based test scenarios
    if (cvv === '000') return false; // Always fail
    if (cvv === '999') return true; // Always succeed
    if (cvv === '666') return false; // Decline

    // Default: 90% success rate
    return Math.random() > 0.1;
  }

  private getCardBrand(cardNumber?: string): string | undefined {
    if (!cardNumber) return undefined;

    const cleaned = cardNumber.replace(/\s/g, '');

    if (/^4/.test(cleaned)) return 'Visa';
    if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
    if (/^3[47]/.test(cleaned)) return 'American Express';
    if (/^6(?:011|5)/.test(cleaned)) return 'Discover';
    if (/^3(?:0[0-5]|[68])/.test(cleaned)) return 'Diners Club';
    if (/^35/.test(cleaned)) return 'JCB';

    return 'Unknown';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
