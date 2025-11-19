/**
 * Payment Provider Abstraction Layer
 *
 * Provider-agnostic payment processing middleware.
 * Supports multiple payment processors with a unified API.
 *
 * @example
 * ```typescript
 * import { getProviderRegistry, MockPaymentProvider } from '@/lib/payment-providers';
 *
 * // Register a provider
 * const registry = getProviderRegistry();
 * registry.registerProvider(PaymentProviderType.MOCK, (config) => new MockPaymentProvider(config));
 *
 * // Register a tenant
 * registry.registerTenant(tenantConfig);
 *
 * // Get provider and process payment
 * const provider = registry.getProvider('tenant-id');
 * const response = await provider.processPayment(paymentRequest);
 * ```
 */

// Core types
export * from './types';

// Base provider
export { BasePaymentProvider, ProviderInitializationError, ProviderOperationError } from './base-provider';

// Provider registry
export { PaymentProviderRegistry, getProviderRegistry } from './provider-registry';

// Provider implementations
export { MockPaymentProvider } from './providers/mock-provider';
export { StripePaymentProvider } from './providers/stripe-provider';
export { SquarePaymentProvider } from './providers/square-provider';

// Re-export commonly used types
export type {
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  CaptureRequest,
  VoidRequest,
  TenantConfig,
  ProviderConfig,
  ProviderCapabilities,
  Transaction,
  WebhookEvent,
} from './types';

export {
  PaymentProviderType,
  PaymentMethodType,
  TransactionStatus,
} from './types';
