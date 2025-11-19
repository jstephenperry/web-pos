/**
 * Payment Provider Abstraction Layer - Base Provider Interface
 *
 * Abstract base class that all payment providers must implement.
 * Ensures consistent API across different payment processors.
 */

import {
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  CaptureRequest,
  VoidRequest,
  ProviderConfig,
  ProviderCapabilities,
  WebhookEvent,
  PaymentProviderType,
  ProviderHealthCheck,
} from './types';

/**
 * Base Payment Provider Interface
 *
 * All payment providers (Stripe, Square, etc.) must implement this interface
 */
export abstract class BasePaymentProvider {
  protected config: ProviderConfig;
  protected providerType: PaymentProviderType;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.providerType = config.provider;
  }

  /**
   * Get provider type
   */
  getProviderType(): PaymentProviderType {
    return this.providerType;
  }

  /**
   * Get provider capabilities
   * Returns what features this provider supports
   */
  abstract getCapabilities(): ProviderCapabilities;

  /**
   * Initialize the provider
   * Load SDK, validate credentials, etc.
   */
  abstract initialize(): Promise<void>;

  /**
   * Health check
   * Verify provider is reachable and credentials are valid
   */
  abstract healthCheck(): Promise<ProviderHealthCheck>;

  // ============================================================================
  // Core Payment Operations
  // ============================================================================

  /**
   * Process a payment
   *
   * @param request - Payment request details
   * @returns Payment response with transaction details
   */
  abstract processPayment(request: PaymentRequest): Promise<PaymentResponse>;

  /**
   * Capture a previously authorized payment
   *
   * @param request - Capture request details
   * @returns Payment response with capture details
   */
  abstract capturePayment(request: CaptureRequest): Promise<PaymentResponse>;

  /**
   * Refund a payment (full or partial)
   *
   * @param request - Refund request details
   * @returns Refund response
   */
  abstract refundPayment(request: RefundRequest): Promise<RefundResponse>;

  /**
   * Void/cancel an authorized payment
   *
   * @param request - Void request details
   * @returns Payment response
   */
  abstract voidPayment(request: VoidRequest): Promise<PaymentResponse>;

  // ============================================================================
  // Transaction Management
  // ============================================================================

  /**
   * Get transaction details by ID
   *
   * @param transactionId - Provider's transaction ID
   * @returns Payment response with transaction details
   */
  abstract getTransaction(transactionId: string): Promise<PaymentResponse>;

  /**
   * List transactions with optional filters
   *
   * @param filters - Filter criteria
   * @returns Array of payment responses
   */
  abstract listTransactions(filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    customerId?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaymentResponse[]>;

  // ============================================================================
  // Tokenization (optional, check capabilities)
  // ============================================================================

  /**
   * Create a payment token for storing payment method
   *
   * @param cardDetails - Card information to tokenize
   * @returns Payment token
   */
  async createPaymentToken?(cardDetails: any): Promise<string>;

  /**
   * Delete a stored payment token
   *
   * @param token - Token to delete
   */
  async deletePaymentToken?(token: string): Promise<void>;

  // ============================================================================
  // Customer Management (optional, check capabilities)
  // ============================================================================

  /**
   * Create a customer profile
   *
   * @param customer - Customer details
   * @returns Customer ID
   */
  async createCustomer?(customer: any): Promise<string>;

  /**
   * Get customer details
   *
   * @param customerId - Provider's customer ID
   * @returns Customer details
   */
  async getCustomer?(customerId: string): Promise<any>;

  /**
   * Update customer details
   *
   * @param customerId - Provider's customer ID
   * @param updates - Fields to update
   */
  async updateCustomer?(customerId: string, updates: any): Promise<void>;

  /**
   * Delete a customer profile
   *
   * @param customerId - Provider's customer ID
   */
  async deleteCustomer?(customerId: string): Promise<void>;

  // ============================================================================
  // Webhooks (optional, check capabilities)
  // ============================================================================

  /**
   * Verify webhook signature
   *
   * @param payload - Webhook payload
   * @param signature - Webhook signature
   * @returns True if signature is valid
   */
  async verifyWebhookSignature?(payload: string, signature: string): Promise<boolean>;

  /**
   * Parse webhook event
   *
   * @param payload - Webhook payload
   * @returns Normalized webhook event
   */
  async parseWebhookEvent?(payload: string): Promise<WebhookEvent>;

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Validate configuration
   * Ensures all required credentials are present
   */
  protected validateConfig(): void {
    if (!this.config.enabled) {
      throw new Error(`Provider ${this.providerType} is not enabled`);
    }

    if (!this.config.credentials) {
      throw new Error(`Provider ${this.providerType} missing credentials`);
    }
  }

  /**
   * Normalize error from provider
   * Converts provider-specific errors to standard format
   */
  protected normalizeError(error: any): {
    errorCode: string;
    errorMessage: string;
    providerErrorCode?: string;
    providerErrorMessage?: string;
  } {
    return {
      errorCode: 'PROVIDER_ERROR',
      errorMessage: error?.message || 'Unknown provider error',
      providerErrorCode: error?.code || error?.type,
      providerErrorMessage: error?.message,
    };
  }

  /**
   * Generate internal transaction ID
   * Override this if you want custom ID generation
   */
  protected generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Log provider activity
   * Override for custom logging
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logData = {
      provider: this.providerType,
      message,
      ...data,
    };

    if (level === 'error') {
      console.error('[PaymentProvider]', logData);
    } else if (level === 'warn') {
      console.warn('[PaymentProvider]', logData);
    } else {
      console.log('[PaymentProvider]', logData);
    }
  }
}

/**
 * Provider initialization error
 */
export class ProviderInitializationError extends Error {
  constructor(provider: PaymentProviderType, message: string) {
    super(`Failed to initialize ${provider}: ${message}`);
    this.name = 'ProviderInitializationError';
  }
}

/**
 * Provider operation error
 */
export class ProviderOperationError extends Error {
  public providerErrorCode?: string;
  public providerErrorMessage?: string;

  constructor(
    provider: PaymentProviderType,
    operation: string,
    message: string,
    providerError?: any
  ) {
    super(`${provider} ${operation} failed: ${message}`);
    this.name = 'ProviderOperationError';
    this.providerErrorCode = providerError?.code;
    this.providerErrorMessage = providerError?.message;
  }
}
