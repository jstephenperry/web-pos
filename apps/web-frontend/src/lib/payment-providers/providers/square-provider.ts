/**
 * Square Payment Provider
 *
 * Integration with Square payment processing.
 * https://developer.squareup.com/docs/payments-api/overview
 *
 * Setup:
 * 1. npm install square
 * 2. Set credentials in provider config
 * 3. Register provider with registry
 */

import { BasePaymentProvider, ProviderOperationError } from '../base-provider';
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

/**
 * Square Provider Implementation
 *
 * Note: This is a skeleton implementation. To use in production:
 * 1. Install Square SDK: npm install square
 * 2. Uncomment the import below
 * 3. Implement the methods using Square SDK
 * 4. Add error handling and retry logic
 */

// Uncomment when Square SDK is installed:
// import { Client, Environment } from 'square';

export class SquarePaymentProvider extends BasePaymentProvider {
  // private client: Client;

  async initialize(): Promise<void> {
    this.validateConfig();

    const { accessToken } = this.config.credentials;

    if (!accessToken) {
      throw new Error('Square accessToken is required');
    }

    // Initialize Square SDK
    // this.client = new Client({
    //   accessToken,
    //   environment: this.config.testMode ? Environment.Sandbox : Environment.Production,
    // });

    this.log('info', 'Square provider initialized', {
      testMode: this.config.testMode,
    });
  }

  getCapabilities(): ProviderCapabilities {
    return {
      supportsAuthorization: false, // Square doesn't support auth-only
      supportsCapture: false,
      supportsRefund: true,
      supportsPartialRefund: true,
      supportsVoid: true, // Within 24 hours
      supportsRecurring: true,
      supportsTokenization: true,
      supportsCustomerProfiles: true,
      supports3DS: true,
      supportsSCA: true,
      supportedPaymentMethods: [
        PaymentMethodType.CARD,
        PaymentMethodType.DIGITAL_WALLET, // Apple Pay, Google Pay
        PaymentMethodType.CASH,
      ],
      supportedCurrencies: [
        'USD', 'CAD', 'GBP', 'EUR', 'AUD', 'JPY',
      ],
      supportedCountries: ['US', 'CA', 'GB', 'AU', 'JP', 'FR', 'ES', 'IT', 'IE'],
      supportsWebhooks: true,
      webhookEvents: [
        'payment.created',
        'payment.updated',
        'refund.created',
        'refund.updated',
      ],
    };
  }

  async healthCheck(): Promise<ProviderHealthCheck> {
    const startTime = Date.now();

    try {
      // Test Square API connection
      // await this.client.locationsApi.listLocations();

      return {
        provider: PaymentProviderType.SQUARE,
        healthy: true,
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        provider: PaymentProviderType.SQUARE,
        healthy: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Note: Square requires a location ID
      // You should get this from your Square account and store in config

      // Example implementation:
      /*
      const { paymentsApi } = this.client;

      const payment = await paymentsApi.createPayment({
        sourceId: request.paymentToken || 'cnon:card-nonce-ok', // Card nonce from Square.js
        idempotencyKey: this.generateIdempotencyKey(),
        amountMoney: {
          amount: BigInt(Math.round(request.amount * 100)),
          currency: request.currency,
        },
        locationId: this.config.credentials.locationId!,
        referenceId: request.reference,
        note: request.description,
        customerId: request.customer?.id,
        autocomplete: true, // Square auto-captures
      });

      return this.mapSquarePayment(payment.result.payment!);
      */

      throw new Error('Square provider not fully implemented. Install Square SDK and uncomment implementation.');
    } catch (error) {
      throw new ProviderOperationError(
        PaymentProviderType.SQUARE,
        'processPayment',
        error instanceof Error ? error.message : 'Unknown error',
        error
      );
    }
  }

  async capturePayment(request: CaptureRequest): Promise<PaymentResponse> {
    // Square doesn't support separate authorization and capture
    throw new Error('Square does not support separate capture. Use autocomplete=true when creating payment.');
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    // Implementation:
    /*
    const { refundsApi } = this.client;

    const refund = await refundsApi.refundPayment({
      idempotencyKey: this.generateIdempotencyKey(),
      paymentId: request.transactionId,
      amountMoney: request.amount ? {
        amount: BigInt(Math.round(request.amount * 100)),
        currency: 'USD', // Get from original payment
      } : undefined,
      reason: request.reason,
    });

    return this.mapSquareRefund(refund.result.refund!);
    */

    throw new Error('Not implemented');
  }

  async voidPayment(request: VoidRequest): Promise<PaymentResponse> {
    // Implementation:
    /*
    const { paymentsApi } = this.client;

    const payment = await paymentsApi.cancelPayment(request.transactionId);
    return this.mapSquarePayment(payment.result.payment!);
    */

    throw new Error('Not implemented');
  }

  async getTransaction(transactionId: string): Promise<PaymentResponse> {
    // Implementation:
    /*
    const { paymentsApi } = this.client;

    const payment = await paymentsApi.getPayment(transactionId);
    return this.mapSquarePayment(payment.result.payment!);
    */

    throw new Error('Not implemented');
  }

  async listTransactions(filters?: any): Promise<PaymentResponse[]> {
    // Implementation:
    /*
    const { paymentsApi } = this.client;

    const payments = await paymentsApi.listPayments({
      locationId: this.config.credentials.locationId,
      beginTime: filters?.startDate?.toISOString(),
      endTime: filters?.endDate?.toISOString(),
      limit: filters?.limit,
    });

    return payments.result.payments?.map(p => this.mapSquarePayment(p)) || [];
    */

    throw new Error('Not implemented');
  }

  async createPaymentToken(cardDetails: any): Promise<string> {
    // Note: Square uses card nonces which are created client-side with Square.js
    // This would typically be handled by Square Web Payments SDK on the frontend
    throw new Error('Square uses client-side tokenization with Square.js. Use Square Web Payments SDK.');
  }

  async createCustomer(customer: any): Promise<string> {
    // Implementation:
    /*
    const { customersApi } = this.client;

    const result = await customersApi.createCustomer({
      emailAddress: customer.email,
      phoneNumber: customer.phone,
      givenName: customer.name?.split(' ')[0],
      familyName: customer.name?.split(' ').slice(1).join(' '),
      referenceId: customer.externalId,
    });

    return result.result.customer!.id!;
    */

    throw new Error('Not implemented');
  }

  async verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
    try {
      // Implementation:
      /*
      const crypto = require('crypto');
      const url = 'YOUR_WEBHOOK_URL'; // From webhook configuration

      const hmac = crypto
        .createHmac('sha256', this.config.webhookSecret!)
        .update(url + payload)
        .digest('base64');

      return hmac === signature;
      */

      return false;
    } catch (error) {
      return false;
    }
  }

  // Helper methods
  /*
  private generateIdempotencyKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  private mapSquarePayment(payment: any): PaymentResponse {
    return {
      transactionId: payment.id,
      providerTransactionId: payment.id,
      status: this.mapSquareStatus(payment.status),
      success: payment.status === 'COMPLETED',
      amount: Number(payment.amountMoney.amount) / 100,
      currency: payment.amountMoney.currency,
      paymentMethod: PaymentMethodType.CARD,
      cardBrand: payment.cardDetails?.card?.cardBrand,
      last4: payment.cardDetails?.card?.last4,
      timestamp: new Date(payment.createdAt),
      metadata: { referenceId: payment.referenceId },
      providerRawResponse: payment,
    };
  }

  private mapSquareStatus(status: string): TransactionStatus {
    switch (status) {
      case 'COMPLETED':
        return TransactionStatus.CAPTURED;
      case 'PENDING':
        return TransactionStatus.PENDING;
      case 'CANCELED':
        return TransactionStatus.VOIDED;
      case 'FAILED':
        return TransactionStatus.FAILED;
      default:
        return TransactionStatus.ERROR;
    }
  }

  private mapSquareRefund(refund: any): RefundResponse {
    return {
      refundId: refund.id,
      providerRefundId: refund.id,
      transactionId: refund.paymentId,
      amount: Number(refund.amountMoney.amount) / 100,
      currency: refund.amountMoney.currency,
      status: refund.status === 'COMPLETED' ? TransactionStatus.REFUNDED : TransactionStatus.PENDING,
      success: refund.status === 'COMPLETED',
      timestamp: new Date(refund.createdAt),
    };
  }
  */
}
