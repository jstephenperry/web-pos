/**
 * Payment Provider Registry
 *
 * Central registry for managing multiple payment providers.
 * Implements factory pattern for creating provider instances.
 */

import { BasePaymentProvider } from './base-provider';
import {
  PaymentProviderType,
  ProviderConfig,
  TenantConfig,
  ProviderHealthCheck,
} from './types';

/**
 * Provider factory function type
 */
type ProviderFactory = (config: ProviderConfig) => BasePaymentProvider;

/**
 * Payment Provider Registry
 *
 * Manages registration and instantiation of payment providers
 */
export class PaymentProviderRegistry {
  private static instance: PaymentProviderRegistry;
  private factories: Map<PaymentProviderType, ProviderFactory>;
  private providers: Map<string, BasePaymentProvider>; // key: `${tenantId}:${providerType}`
  private tenantConfigs: Map<string, TenantConfig>;

  private constructor() {
    this.factories = new Map();
    this.providers = new Map();
    this.tenantConfigs = new Map();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): PaymentProviderRegistry {
    if (!PaymentProviderRegistry.instance) {
      PaymentProviderRegistry.instance = new PaymentProviderRegistry();
    }
    return PaymentProviderRegistry.instance;
  }

  /**
   * Register a payment provider factory
   *
   * @param type - Provider type
   * @param factory - Factory function that creates provider instance
   */
  registerProvider(type: PaymentProviderType, factory: ProviderFactory): void {
    if (this.factories.has(type)) {
      console.warn(`Provider ${type} is already registered. Overwriting.`);
    }

    this.factories.set(type, factory);
    console.log(`✅ Registered payment provider: ${type}`);
  }

  /**
   * Unregister a payment provider
   *
   * @param type - Provider type
   */
  unregisterProvider(type: PaymentProviderType): void {
    this.factories.delete(type);

    // Remove all provider instances of this type
    const keysToDelete: string[] = [];
    for (const [key, provider] of this.providers.entries()) {
      if (provider.getProviderType() === type) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.providers.delete(key));
    console.log(`Unregistered payment provider: ${type}`);
  }

  /**
   * Register a tenant configuration
   *
   * @param config - Tenant configuration
   */
  registerTenant(config: TenantConfig): void {
    this.tenantConfigs.set(config.id, config);
    console.log(`✅ Registered tenant: ${config.name} (${config.id})`);
  }

  /**
   * Get tenant configuration
   *
   * @param tenantId - Tenant ID
   * @returns Tenant configuration
   */
  getTenantConfig(tenantId: string): TenantConfig | undefined {
    return this.tenantConfigs.get(tenantId);
  }

  /**
   * Get provider instance for a tenant
   *
   * @param tenantId - Tenant ID
   * @param providerType - Provider type (defaults to tenant's primary provider)
   * @returns Provider instance
   */
  getProvider(tenantId: string, providerType?: PaymentProviderType): BasePaymentProvider {
    const tenantConfig = this.tenantConfigs.get(tenantId);

    if (!tenantConfig) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    if (!tenantConfig.active) {
      throw new Error(`Tenant ${tenantId} is not active`);
    }

    // Use specified provider or tenant's primary provider
    const requestedProvider = providerType || tenantConfig.paymentProviders.primary;
    const providerKey = `${tenantId}:${requestedProvider}`;

    // Return cached instance if exists
    if (this.providers.has(providerKey)) {
      return this.providers.get(providerKey)!;
    }

    // Create new instance
    const provider = this.createProvider(tenantId, requestedProvider);
    this.providers.set(providerKey, provider);

    return provider;
  }

  /**
   * Get provider with automatic fallback
   *
   * Attempts to use primary provider, falls back to secondary if primary fails
   *
   * @param tenantId - Tenant ID
   * @returns Provider instance
   */
  async getProviderWithFallback(tenantId: string): Promise<BasePaymentProvider> {
    const tenantConfig = this.tenantConfigs.get(tenantId);

    if (!tenantConfig) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const primary = tenantConfig.paymentProviders.primary;
    const fallback = tenantConfig.paymentProviders.fallback;

    try {
      const provider = this.getProvider(tenantId, primary);

      // Check if primary provider is healthy
      const health = await provider.healthCheck();
      if (health.healthy) {
        return provider;
      }

      console.warn(`Primary provider ${primary} is unhealthy for tenant ${tenantId}`);
    } catch (error) {
      console.error(`Failed to get primary provider ${primary} for tenant ${tenantId}:`, error);
    }

    // Try fallback provider
    if (fallback) {
      try {
        const provider = this.getProvider(tenantId, fallback);
        console.log(`Using fallback provider ${fallback} for tenant ${tenantId}`);
        return provider;
      } catch (error) {
        console.error(`Failed to get fallback provider ${fallback} for tenant ${tenantId}:`, error);
      }
    }

    throw new Error(`No healthy payment provider available for tenant ${tenantId}`);
  }

  /**
   * Create a new provider instance
   *
   * @param tenantId - Tenant ID
   * @param providerType - Provider type
   * @returns Provider instance
   */
  private createProvider(tenantId: string, providerType: PaymentProviderType): BasePaymentProvider {
    const factory = this.factories.get(providerType);

    if (!factory) {
      throw new Error(`Provider ${providerType} is not registered`);
    }

    const tenantConfig = this.tenantConfigs.get(tenantId)!;
    const providerConfig = tenantConfig.paymentProviders.configs[providerType];

    if (!providerConfig) {
      throw new Error(`Provider ${providerType} not configured for tenant ${tenantId}`);
    }

    if (!providerConfig.enabled) {
      throw new Error(`Provider ${providerType} is disabled for tenant ${tenantId}`);
    }

    const provider = factory(providerConfig);

    // Initialize provider asynchronously
    provider.initialize().catch(error => {
      console.error(`Failed to initialize provider ${providerType} for tenant ${tenantId}:`, error);
    });

    return provider;
  }

  /**
   * List all registered provider types
   *
   * @returns Array of provider types
   */
  listProviders(): PaymentProviderType[] {
    return Array.from(this.factories.keys());
  }

  /**
   * List all registered tenants
   *
   * @returns Array of tenant configurations
   */
  listTenants(): TenantConfig[] {
    return Array.from(this.tenantConfigs.values());
  }

  /**
   * Health check for all providers of a tenant
   *
   * @param tenantId - Tenant ID
   * @returns Health check results
   */
  async healthCheckAllProviders(tenantId: string): Promise<ProviderHealthCheck[]> {
    const tenantConfig = this.tenantConfigs.get(tenantId);

    if (!tenantConfig) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const providers = Object.keys(tenantConfig.paymentProviders.configs) as PaymentProviderType[];
    const healthChecks: ProviderHealthCheck[] = [];

    for (const providerType of providers) {
      try {
        const provider = this.getProvider(tenantId, providerType);
        const health = await provider.healthCheck();
        healthChecks.push(health);
      } catch (error) {
        healthChecks.push({
          provider: providerType,
          healthy: false,
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return healthChecks;
  }

  /**
   * Clear provider cache
   * Useful for testing or when configurations change
   *
   * @param tenantId - Optional tenant ID to clear specific tenant's providers
   */
  clearCache(tenantId?: string): void {
    if (tenantId) {
      // Clear only providers for specific tenant
      const keysToDelete: string[] = [];
      for (const key of this.providers.keys()) {
        if (key.startsWith(`${tenantId}:`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.providers.delete(key));
      console.log(`Cleared provider cache for tenant ${tenantId}`);
    } else {
      // Clear all providers
      this.providers.clear();
      console.log('Cleared all provider cache');
    }
  }

  /**
   * Reset registry (for testing)
   */
  reset(): void {
    this.factories.clear();
    this.providers.clear();
    this.tenantConfigs.clear();
    console.log('Reset payment provider registry');
  }
}

/**
 * Convenience function to get registry instance
 */
export function getProviderRegistry(): PaymentProviderRegistry {
  return PaymentProviderRegistry.getInstance();
}
