/**
 * Payment Provider Abstraction Layer - Type Definitions
 *
 * Provider-agnostic types for payment processing middleware.
 * Supports multiple payment processors (Stripe, Square, Authorize.net, etc.)
 */

/**
 * Supported payment provider types
 * Extend this as you add more providers
 */
export enum PaymentProviderType {
  MOCK = 'mock',
  STRIPE = 'stripe',
  SQUARE = 'square',
  AUTHORIZE_NET = 'authorize_net',
  BRAINTREE = 'braintree',
  ADYEN = 'adyen',
  CUSTOM = 'custom',
}

/**
 * Payment method types supported across providers
 */
export enum PaymentMethodType {
  CARD = 'card',
  BANK_ACCOUNT = 'bank_account',
  DIGITAL_WALLET = 'digital_wallet', // Apple Pay, Google Pay, etc.
  BUY_NOW_PAY_LATER = 'bnpl', // Afterpay, Klarna, etc.
  CASH = 'cash',
  CHECK = 'check',
}

/**
 * Transaction status (normalized across all providers)
 */
export enum TransactionStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  SETTLED = 'settled',
  DECLINED = 'declined',
  FAILED = 'failed',
  CANCELED = 'canceled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  VOIDED = 'voided',
  DISPUTED = 'disputed',
  ERROR = 'error',
}

/**
 * Card information (PCI-compliant - for tokenization only)
 */
export interface CardDetails {
  number: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  cardholderName: string;
  billingAddress?: Address;
}

/**
 * Address information
 */
export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Customer information
 */
export interface Customer {
  id?: string; // Provider's customer ID
  externalId?: string; // Your system's customer ID
  email?: string;
  phone?: string;
  name?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  metadata?: Record<string, any>;
}

/**
 * Payment request (provider-agnostic)
 */
export interface PaymentRequest {
  // Transaction details
  amount: number;
  currency: string;
  description?: string;
  reference?: string; // Your internal reference

  // Payment method
  paymentMethod: PaymentMethodType;
  card?: CardDetails;
  paymentToken?: string; // For stored payment methods

  // Customer information
  customer?: Customer;

  // Additional options
  captureImmediately?: boolean; // True = capture, False = authorize only
  savePaymentMethod?: boolean;
  metadata?: Record<string, any>;

  // Provider-specific options
  providerOptions?: Record<string, any>;
}

/**
 * Payment response (provider-agnostic)
 */
export interface PaymentResponse {
  // Transaction identification
  transactionId: string; // Your internal transaction ID
  providerTransactionId: string; // Provider's transaction ID
  providerReference?: string; // Provider's reference number

  // Status and result
  status: TransactionStatus;
  success: boolean;

  // Amount information
  amount: number;
  currency: string;
  capturedAmount?: number;
  refundedAmount?: number;

  // Payment method details (sanitized)
  paymentMethod: PaymentMethodType;
  cardBrand?: string;
  last4?: string;
  paymentToken?: string;

  // Authorization and codes
  authorizationCode?: string;
  avsResult?: string; // Address Verification System
  cvvResult?: string; // CVV verification

  // Error information
  errorCode?: string;
  errorMessage?: string;
  providerErrorCode?: string;
  providerErrorMessage?: string;

  // Timestamps
  timestamp: Date;
  authorizedAt?: Date;
  capturedAt?: Date;

  // Additional data
  metadata?: Record<string, any>;
  providerRawResponse?: any; // Original provider response (for debugging)
}

/**
 * Refund request
 */
export interface RefundRequest {
  transactionId: string;
  amount?: number; // Partial refund if specified
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Refund response
 */
export interface RefundResponse {
  refundId: string;
  providerRefundId: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  timestamp: Date;
}

/**
 * Capture request (for authorized-only transactions)
 */
export interface CaptureRequest {
  transactionId: string;
  amount?: number; // Partial capture if specified
  metadata?: Record<string, any>;
}

/**
 * Void/cancel request
 */
export interface VoidRequest {
  transactionId: string;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Webhook event (provider-agnostic)
 */
export interface WebhookEvent {
  id: string;
  type: string; // Event type (e.g., 'payment.succeeded', 'refund.created')
  provider: PaymentProviderType;
  transactionId?: string;
  data: any;
  timestamp: Date;
  verified: boolean; // Signature verification result
}

/**
 * Provider capabilities (what features each provider supports)
 */
export interface ProviderCapabilities {
  // Basic features
  supportsAuthorization: boolean; // Auth without capture
  supportsCapture: boolean;
  supportsRefund: boolean;
  supportsPartialRefund: boolean;
  supportsVoid: boolean;

  // Advanced features
  supportsRecurring: boolean;
  supportsTokenization: boolean;
  supportsCustomerProfiles: boolean;
  supports3DS: boolean; // 3D Secure
  supportsSCA: boolean; // Strong Customer Authentication (EU)

  // Payment methods
  supportedPaymentMethods: PaymentMethodType[];
  supportedCurrencies: string[];
  supportedCountries: string[];

  // Webhooks
  supportsWebhooks: boolean;
  webhookEvents: string[];
}

/**
 * Provider configuration (credentials and settings)
 */
export interface ProviderConfig {
  provider: PaymentProviderType;
  enabled: boolean;

  // Credentials (environment-specific)
  credentials: {
    publicKey?: string;
    secretKey?: string;
    merchantId?: string;
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    [key: string]: string | undefined;
  };

  // Settings
  testMode: boolean;
  webhookSecret?: string;
  apiVersion?: string;
  timeout?: number;

  // Feature flags
  features?: {
    enableTokenization?: boolean;
    enableRecurring?: boolean;
    enable3DS?: boolean;
    autoCapture?: boolean;
    [key: string]: boolean | undefined;
  };

  // Metadata
  metadata?: Record<string, any>;
}

/**
 * Transaction record (your system's representation)
 */
export interface Transaction {
  id: string;
  tenantId: string;
  provider: PaymentProviderType;
  providerTransactionId: string;

  status: TransactionStatus;
  type: 'payment' | 'refund' | 'void';

  amount: number;
  currency: string;

  paymentMethod: PaymentMethodType;
  cardBrand?: string;
  last4?: string;

  customer?: Customer;

  metadata?: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
  capturedAt?: Date;
  refundedAt?: Date;
  voidedAt?: Date;
}

/**
 * Tenant configuration (for white-labeling)
 */
export interface TenantConfig {
  id: string;
  name: string;
  slug: string; // URL-friendly identifier

  // Branding
  branding: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    companyName: string;
    supportEmail?: string;
    supportPhone?: string;
  };

  // Payment provider settings
  paymentProviders: {
    primary: PaymentProviderType;
    fallback?: PaymentProviderType;
    configs: Record<PaymentProviderType, ProviderConfig>;
  };

  // Business settings
  settings: {
    currency: string;
    timezone: string;
    taxRate?: number;
    country: string;
  };

  // Features
  features: {
    enableReceipts: boolean;
    enableInventory: boolean;
    enableCustomers: boolean;
    enableReporting: boolean;
    enableMultiLocation: boolean;
  };

  // Metadata
  metadata?: Record<string, any>;

  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Provider health check result
 */
export interface ProviderHealthCheck {
  provider: PaymentProviderType;
  healthy: boolean;
  responseTime?: number;
  lastChecked: Date;
  error?: string;
}
