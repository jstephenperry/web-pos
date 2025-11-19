/**
 * Payment Provider Configuration Examples
 *
 * Sample configurations for different tenants and providers.
 * Use these as templates for your actual tenant configurations.
 */

import {
  TenantConfig,
  ProviderConfig,
  PaymentProviderType,
} from './types';

/**
 * Example: Mock provider configuration (for development/testing)
 */
export const mockProviderConfig: ProviderConfig = {
  provider: PaymentProviderType.MOCK,
  enabled: true,
  testMode: true,
  credentials: {
    // Mock provider doesn't need real credentials
    apiKey: 'mock-api-key',
  },
  features: {
    enableTokenization: true,
    enableRecurring: false,
    enable3DS: false,
    autoCapture: true,
  },
  timeout: 10000,
};

/**
 * Example: Stripe provider configuration
 */
export const stripeProviderConfig: ProviderConfig = {
  provider: PaymentProviderType.STRIPE,
  enabled: true,
  testMode: process.env.NODE_ENV !== 'production',
  credentials: {
    publicKey: process.env.STRIPE_PUBLIC_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
  },
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  apiVersion: '2023-10-16',
  features: {
    enableTokenization: true,
    enableRecurring: true,
    enable3DS: true,
    autoCapture: false, // Use manual capture for more control
  },
  timeout: 30000,
};

/**
 * Example: Square provider configuration
 */
export const squareProviderConfig: ProviderConfig = {
  provider: PaymentProviderType.SQUARE,
  enabled: true,
  testMode: process.env.NODE_ENV !== 'production',
  credentials: {
    accessToken: process.env.SQUARE_ACCESS_TOKEN || '',
    applicationId: process.env.SQUARE_APPLICATION_ID || '',
    locationId: process.env.SQUARE_LOCATION_ID || '',
  },
  webhookSecret: process.env.SQUARE_WEBHOOK_SECRET,
  features: {
    enableTokenization: true,
    enableRecurring: true,
    enable3DS: true,
    autoCapture: true, // Square always auto-captures
  },
  timeout: 30000,
};

/**
 * Example: Default tenant configuration
 *
 * This represents the main/default tenant for single-tenant deployments
 */
export const defaultTenantConfig: TenantConfig = {
  id: 'default',
  name: 'Default Tenant',
  slug: 'default',

  branding: {
    companyName: 'Web POS',
    logo: '/logo.png',
    primaryColor: '#4F46E5',
    secondaryColor: '#10B981',
    supportEmail: 'support@example.com',
    supportPhone: '+1-555-0100',
  },

  paymentProviders: {
    primary: PaymentProviderType.MOCK,
    fallback: undefined,
    configs: {
      [PaymentProviderType.MOCK]: mockProviderConfig,
      [PaymentProviderType.STRIPE]: stripeProviderConfig,
      [PaymentProviderType.SQUARE]: squareProviderConfig,
      [PaymentProviderType.AUTHORIZE_NET]: {} as ProviderConfig, // Not configured
      [PaymentProviderType.BRAINTREE]: {} as ProviderConfig,
      [PaymentProviderType.ADYEN]: {} as ProviderConfig,
      [PaymentProviderType.CUSTOM]: {} as ProviderConfig,
    },
  },

  settings: {
    currency: 'USD',
    timezone: 'America/New_York',
    taxRate: 0.0825, // 8.25%
    country: 'US',
  },

  features: {
    enableReceipts: true,
    enableInventory: false,
    enableCustomers: false,
    enableReporting: false,
    enableMultiLocation: false,
  },

  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Example: Multi-tenant configurations
 *
 * Different tenants with different payment providers and branding
 */
export const exampleTenants: TenantConfig[] = [
  // Tenant 1: Coffee shop using Square
  {
    id: 'coffee-shop-123',
    name: 'Sunrise Coffee',
    slug: 'sunrise-coffee',

    branding: {
      companyName: 'Sunrise Coffee',
      logo: '/tenants/sunrise-coffee/logo.png',
      primaryColor: '#8B4513',
      secondaryColor: '#D2691E',
      supportEmail: 'support@sunrisecoffee.com',
    },

    paymentProviders: {
      primary: PaymentProviderType.SQUARE,
      fallback: PaymentProviderType.MOCK,
      configs: {
        [PaymentProviderType.SQUARE]: {
          ...squareProviderConfig,
          credentials: {
            accessToken: process.env.COFFEE_SHOP_SQUARE_TOKEN || '',
            applicationId: process.env.COFFEE_SHOP_SQUARE_APP_ID || '',
            locationId: process.env.COFFEE_SHOP_SQUARE_LOCATION || '',
          },
        },
        [PaymentProviderType.MOCK]: mockProviderConfig,
        [PaymentProviderType.STRIPE]: {} as ProviderConfig,
        [PaymentProviderType.AUTHORIZE_NET]: {} as ProviderConfig,
        [PaymentProviderType.BRAINTREE]: {} as ProviderConfig,
        [PaymentProviderType.ADYEN]: {} as ProviderConfig,
        [PaymentProviderType.CUSTOM]: {} as ProviderConfig,
      },
    },

    settings: {
      currency: 'USD',
      timezone: 'America/Los_Angeles',
      taxRate: 0.0975,
      country: 'US',
    },

    features: {
      enableReceipts: true,
      enableInventory: true,
      enableCustomers: true,
      enableReporting: true,
      enableMultiLocation: false,
    },

    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },

  // Tenant 2: Retail store using Stripe
  {
    id: 'retail-store-456',
    name: 'Urban Outfitters',
    slug: 'urban-outfitters',

    branding: {
      companyName: 'Urban Outfitters',
      logo: '/tenants/urban-outfitters/logo.png',
      primaryColor: '#000000',
      secondaryColor: '#FFFFFF',
      supportEmail: 'help@urbanoutfitters.com',
      supportPhone: '+1-555-0200',
    },

    paymentProviders: {
      primary: PaymentProviderType.STRIPE,
      fallback: undefined,
      configs: {
        [PaymentProviderType.STRIPE]: {
          ...stripeProviderConfig,
          credentials: {
            publicKey: process.env.RETAIL_STRIPE_PUBLIC_KEY || '',
            secretKey: process.env.RETAIL_STRIPE_SECRET_KEY || '',
          },
          webhookSecret: process.env.RETAIL_STRIPE_WEBHOOK_SECRET,
        },
        [PaymentProviderType.MOCK]: {} as ProviderConfig,
        [PaymentProviderType.SQUARE]: {} as ProviderConfig,
        [PaymentProviderType.AUTHORIZE_NET]: {} as ProviderConfig,
        [PaymentProviderType.BRAINTREE]: {} as ProviderConfig,
        [PaymentProviderType.ADYEN]: {} as ProviderConfig,
        [PaymentProviderType.CUSTOM]: {} as ProviderConfig,
      },
    },

    settings: {
      currency: 'USD',
      timezone: 'America/New_York',
      taxRate: 0.08875,
      country: 'US',
    },

    features: {
      enableReceipts: true,
      enableInventory: true,
      enableCustomers: true,
      enableReporting: true,
      enableMultiLocation: true,
    },

    active: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
];

/**
 * Get tenant configuration by ID or slug
 */
export function getTenantConfig(idOrSlug: string): TenantConfig | undefined {
  return exampleTenants.find(
    t => t.id === idOrSlug || t.slug === idOrSlug
  ) || (idOrSlug === 'default' ? defaultTenantConfig : undefined);
}

/**
 * Load tenant configuration from environment variables
 *
 * This allows you to configure a tenant without hardcoding values
 */
export function loadTenantFromEnv(): TenantConfig {
  const tenantId = process.env.TENANT_ID || 'default';
  const tenantName = process.env.TENANT_NAME || 'Default Tenant';

  return {
    id: tenantId,
    name: tenantName,
    slug: tenantId,

    branding: {
      companyName: process.env.COMPANY_NAME || tenantName,
      logo: process.env.COMPANY_LOGO,
      primaryColor: process.env.PRIMARY_COLOR || '#4F46E5',
      secondaryColor: process.env.SECONDARY_COLOR || '#10B981',
      supportEmail: process.env.SUPPORT_EMAIL,
      supportPhone: process.env.SUPPORT_PHONE,
    },

    paymentProviders: {
      primary: (process.env.PRIMARY_PAYMENT_PROVIDER as PaymentProviderType) || PaymentProviderType.MOCK,
      fallback: process.env.FALLBACK_PAYMENT_PROVIDER as PaymentProviderType,
      configs: {
        [PaymentProviderType.MOCK]: mockProviderConfig,
        [PaymentProviderType.STRIPE]: stripeProviderConfig,
        [PaymentProviderType.SQUARE]: squareProviderConfig,
        [PaymentProviderType.AUTHORIZE_NET]: {} as ProviderConfig,
        [PaymentProviderType.BRAINTREE]: {} as ProviderConfig,
        [PaymentProviderType.ADYEN]: {} as ProviderConfig,
        [PaymentProviderType.CUSTOM]: {} as ProviderConfig,
      },
    },

    settings: {
      currency: process.env.NEXT_PUBLIC_CURRENCY || 'USD',
      timezone: process.env.TIMEZONE || 'America/New_York',
      taxRate: parseFloat(process.env.NEXT_PUBLIC_TAX_RATE || '0'),
      country: process.env.COUNTRY || 'US',
    },

    features: {
      enableReceipts: process.env.ENABLE_RECEIPTS !== 'false',
      enableInventory: process.env.ENABLE_INVENTORY === 'true',
      enableCustomers: process.env.ENABLE_CUSTOMERS === 'true',
      enableReporting: process.env.ENABLE_REPORTING === 'true',
      enableMultiLocation: process.env.ENABLE_MULTI_LOCATION === 'true',
    },

    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
