/**
 * Payment Provider Initialization
 *
 * Initializes the payment provider registry with available providers and tenants.
 * Call this once when your application starts.
 */

import { getProviderRegistry } from './provider-registry';
import { MockPaymentProvider } from './providers/mock-provider';
import { StripePaymentProvider } from './providers/stripe-provider';
import { SquarePaymentProvider } from './providers/square-provider';
import {
  defaultTenantConfig,
  exampleTenants,
  loadTenantFromEnv,
} from './config-examples';
import { PaymentProviderType } from './types';

/**
 * Initialize payment providers
 *
 * Registers all available payment providers with the registry
 */
export function initializeProviders(): void {
  const registry = getProviderRegistry();

  console.log('🔧 Initializing payment providers...');

  // Register available providers
  registry.registerProvider(
    PaymentProviderType.MOCK,
    (config) => new MockPaymentProvider(config)
  );

  registry.registerProvider(
    PaymentProviderType.STRIPE,
    (config) => new StripePaymentProvider(config)
  );

  registry.registerProvider(
    PaymentProviderType.SQUARE,
    (config) => new SquarePaymentProvider(config)
  );

  // Add more providers here as you implement them:
  // registry.registerProvider(
  //   PaymentProviderType.AUTHORIZE_NET,
  //   (config) => new AuthorizeNetProvider(config)
  // );

  console.log('✅ Payment providers registered');
}

/**
 * Initialize tenants
 *
 * Registers tenant configurations based on environment
 */
export function initializeTenants(): void {
  const registry = getProviderRegistry();

  console.log('🔧 Initializing tenants...');

  // Determine which tenants to load based on environment
  const mode = process.env.TENANT_MODE || 'single'; // single, multi, env

  if (mode === 'single') {
    // Single-tenant mode: use default tenant
    registry.registerTenant(defaultTenantConfig);
    console.log('✅ Registered default tenant');
  } else if (mode === 'multi') {
    // Multi-tenant mode: register all example tenants
    exampleTenants.forEach(tenant => {
      registry.registerTenant(tenant);
    });
    console.log(`✅ Registered ${exampleTenants.length} tenants`);
  } else if (mode === 'env') {
    // Environment-based mode: load tenant from environment variables
    const tenant = loadTenantFromEnv();
    registry.registerTenant(tenant);
    console.log(`✅ Registered tenant from environment: ${tenant.name}`);
  }
}

/**
 * Initialize everything
 *
 * Convenience function to initialize both providers and tenants
 */
export function initializePaymentSystem(): void {
  console.log('🚀 Initializing payment system...');

  initializeProviders();
  initializeTenants();

  console.log('✅ Payment system initialized successfully');
}

/**
 * Get the active tenant ID
 *
 * Determines which tenant to use based on environment or subdomain
 */
export function getActiveTenantId(): string {
  // In a real application, you might determine this from:
  // - Subdomain (e.g., coffee-shop.yourpos.com -> coffee-shop-123)
  // - Custom domain (e.g., pos.sunrisecoffee.com -> coffee-shop-123)
  // - User session/authentication
  // - Environment variable

  const mode = process.env.TENANT_MODE || 'single';

  if (mode === 'single' || mode === 'env') {
    return process.env.TENANT_ID || 'default';
  }

  // For multi-tenant mode, you would implement tenant resolution here
  // Example: extract from subdomain
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];

    // Map subdomain to tenant ID
    const tenantMap: Record<string, string> = {
      'sunrise-coffee': 'coffee-shop-123',
      'urban-outfitters': 'retail-store-456',
    };

    return tenantMap[subdomain] || 'default';
  }

  return 'default';
}

/**
 * Helper: Get the current tenant's payment provider
 */
export async function getCurrentProvider() {
  const registry = getProviderRegistry();
  const tenantId = getActiveTenantId();

  return registry.getProviderWithFallback(tenantId);
}
