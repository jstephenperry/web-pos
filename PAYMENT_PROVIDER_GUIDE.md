# Payment Provider Integration Guide

This guide explains how to use the provider-agnostic payment middleware and how to integrate new payment processors into your white-label POS system.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quick Start](#quick-start)
3. [Tenant Configuration](#tenant-configuration)
4. [Using Payment Providers](#using-payment-providers)
5. [Integrating New Providers](#integrating-new-providers)
6. [Multi-Tenancy](#multi-tenancy)
7. [Testing](#testing)
8. [Production Deployment](#production-deployment)

## Architecture Overview

### Design Principles

The payment provider abstraction layer follows these principles:

1. **Provider Agnostic**: Write code once, swap providers without changing application logic
2. **Multi-Tenant**: Support multiple tenants with different providers and configurations
3. **Type Safe**: Full TypeScript support with comprehensive type definitions
4. **Extensible**: Easy to add new payment providers
5. **Testable**: Mock provider for development and testing
6. **Fault Tolerant**: Automatic fallback to secondary providers

### Components

```
payment-providers/
├── types.ts                    # Core type definitions
├── base-provider.ts            # Abstract base class
├── provider-registry.ts        # Provider factory and registry
├── config-examples.ts          # Sample configurations
├── initialize.ts               # Initialization logic
├── index.ts                    # Public API exports
└── providers/
    ├── mock-provider.ts        # Mock implementation
    ├── stripe-provider.ts      # Stripe integration
    ├── square-provider.ts      # Square integration
    └── [your-provider].ts      # Your custom providers
```

## Quick Start

### 1. Initialize the System

In your application startup (e.g., `app/layout.tsx` or `app/page.tsx`):

```typescript
import { initializePaymentSystem } from '@/lib/payment-providers/initialize';

// Initialize once on app start
if (typeof window === 'undefined') {
  initializePaymentSystem();
}
```

### 2. Process a Payment

```typescript
import { getCurrentProvider } from '@/lib/payment-providers/initialize';
import { PaymentRequest, PaymentMethodType } from '@/lib/payment-providers';

async function processPayment(cardDetails: any, amount: number) {
  // Get the provider for current tenant
  const provider = await getCurrentProvider();

  // Create payment request
  const request: PaymentRequest = {
    amount: amount,
    currency: 'USD',
    paymentMethod: PaymentMethodType.CARD,
    card: cardDetails,
    captureImmediately: true,
    description: 'POS Purchase',
  };

  // Process payment
  const response = await provider.processPayment(request);

  if (response.success) {
    console.log('Payment successful!', response.transactionId);
    return response;
  } else {
    console.error('Payment failed:', response.errorMessage);
    throw new Error(response.errorMessage);
  }
}
```

### 3. Refund a Payment

```typescript
import { getCurrentProvider } from '@/lib/payment-providers/initialize';

async function refundPayment(transactionId: string, amount?: number) {
  const provider = await getCurrentProvider();

  const response = await provider.refundPayment({
    transactionId,
    amount, // Partial refund if specified
    reason: 'Customer request',
  });

  return response;
}
```

## Tenant Configuration

### Single Tenant Mode

For single-tenant deployments (one business using the system):

```bash
# .env
TENANT_MODE=single
TENANT_ID=my-business
TENANT_NAME=My Business Name

# Provider configuration
PRIMARY_PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
```

### Multi-Tenant Mode

For white-label deployments (multiple businesses):

```typescript
// config-examples.ts
export const myTenants: TenantConfig[] = [
  {
    id: 'tenant-1',
    name: 'Coffee Shop',
    slug: 'coffee-shop',

    branding: {
      companyName: 'Sunrise Coffee',
      primaryColor: '#8B4513',
      supportEmail: 'support@sunrisecoffee.com',
    },

    paymentProviders: {
      primary: PaymentProviderType.SQUARE,
      fallback: PaymentProviderType.STRIPE,
      configs: {
        [PaymentProviderType.SQUARE]: {
          enabled: true,
          credentials: {
            accessToken: process.env.TENANT1_SQUARE_TOKEN,
          },
        },
      },
    },

    settings: {
      currency: 'USD',
      taxRate: 0.0825,
    },

    active: true,
  },
  // More tenants...
];
```

### Tenant Resolution

Determine which tenant to use based on:

1. **Subdomain**: `coffee-shop.yourpos.com` → tenant-1
2. **Custom Domain**: `pos.sunrisecoffee.com` → tenant-1
3. **User Authentication**: Logged-in user's tenant
4. **URL Parameter**: `?tenant=coffee-shop`

```typescript
export function getTenantFromRequest(req: Request): string {
  const hostname = new URL(req.url).hostname;
  const subdomain = hostname.split('.')[0];

  // Map subdomain to tenant ID
  const tenantMap: Record<string, string> = {
    'coffee-shop': 'tenant-1',
    'retail-store': 'tenant-2',
  };

  return tenantMap[subdomain] || 'default';
}
```

## Using Payment Providers

### Process Payment

```typescript
const response = await provider.processPayment({
  amount: 29.99,
  currency: 'USD',
  paymentMethod: PaymentMethodType.CARD,
  card: {
    number: '4242424242424242',
    expiryMonth: 12,
    expiryYear: 25,
    cvv: '123',
    cardholderName: 'John Doe',
  },
  description: 'Coffee purchase',
  metadata: {
    orderId: 'order-123',
    items: ['Latte', 'Croissant'],
  },
});
```

### Authorize and Capture (Two-Step)

```typescript
// Step 1: Authorize (hold funds)
const authResponse = await provider.processPayment({
  amount: 29.99,
  currency: 'USD',
  paymentMethod: PaymentMethodType.CARD,
  card: cardDetails,
  captureImmediately: false, // Don't capture yet
});

// Later... Step 2: Capture (charge the card)
const captureResponse = await provider.capturePayment({
  transactionId: authResponse.transactionId,
  amount: 29.99, // Or partial amount
});
```

### Refund

```typescript
// Full refund
const refund = await provider.refundPayment({
  transactionId: 'txn_123',
  reason: 'Customer requested refund',
});

// Partial refund
const partialRefund = await provider.refundPayment({
  transactionId: 'txn_123',
  amount: 10.00, // Refund $10 of a $29.99 transaction
  reason: 'Item was damaged',
});
```

### Void (Cancel Authorization)

```typescript
const voidResponse = await provider.voidPayment({
  transactionId: 'txn_123',
  reason: 'Customer cancelled order',
});
```

### Tokenization (Save Payment Method)

```typescript
// Create token
const token = await provider.createPaymentToken(cardDetails);

// Use token for future payments
const response = await provider.processPayment({
  amount: 29.99,
  currency: 'USD',
  paymentMethod: PaymentMethodType.CARD,
  paymentToken: token, // Use token instead of card details
});
```

## Integrating New Providers

### Step 1: Create Provider Class

Create a new file in `providers/` directory:

```typescript
// providers/your-provider.ts
import { BasePaymentProvider } from '../base-provider';
import { /* import types */ } from '../types';

export class YourPaymentProvider extends BasePaymentProvider {
  private client: any; // Your provider's SDK client

  async initialize(): Promise<void> {
    // Validate configuration
    this.validateConfig();

    // Initialize provider SDK
    this.client = new YourProviderSDK({
      apiKey: this.config.credentials.apiKey,
      environment: this.config.testMode ? 'sandbox' : 'production',
    });

    this.log('info', 'YourProvider initialized');
  }

  getCapabilities(): ProviderCapabilities {
    return {
      supportsAuthorization: true,
      supportsCapture: true,
      supportsRefund: true,
      // ... list all capabilities
    };
  }

  async healthCheck(): Promise<ProviderHealthCheck> {
    const startTime = Date.now();

    try {
      await this.client.ping(); // Test connection

      return {
        provider: PaymentProviderType.CUSTOM,
        healthy: true,
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        provider: PaymentProviderType.CUSTOM,
        healthy: false,
        lastChecked: new Date(),
        error: error.message,
      };
    }
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Call your provider's API
      const result = await this.client.payments.create({
        amount: request.amount,
        currency: request.currency,
        // ... map our request to provider's format
      });

      // Map provider's response to our standard format
      return {
        transactionId: this.generateTransactionId(),
        providerTransactionId: result.id,
        status: this.mapStatus(result.status),
        success: result.status === 'succeeded',
        amount: request.amount,
        currency: request.currency,
        // ... complete mapping
      };
    } catch (error) {
      throw new ProviderOperationError(
        PaymentProviderType.CUSTOM,
        'processPayment',
        error.message,
        error
      );
    }
  }

  // Implement other required methods...
}
```

### Step 2: Register Provider

```typescript
// initialize.ts
import { YourPaymentProvider } from './providers/your-provider';

export function initializeProviders(): void {
  const registry = getProviderRegistry();

  registry.registerProvider(
    PaymentProviderType.CUSTOM,
    (config) => new YourPaymentProvider(config)
  );
}
```

### Step 3: Configure in Tenant

```typescript
const tenantConfig: TenantConfig = {
  // ...
  paymentProviders: {
    primary: PaymentProviderType.CUSTOM,
    configs: {
      [PaymentProviderType.CUSTOM]: {
        provider: PaymentProviderType.CUSTOM,
        enabled: true,
        testMode: false,
        credentials: {
          apiKey: process.env.YOUR_PROVIDER_API_KEY,
          merchantId: process.env.YOUR_PROVIDER_MERCHANT_ID,
        },
      },
    },
  },
};
```

## Multi-Tenancy

### Automatic Fallback

Configure primary and fallback providers:

```typescript
const tenantConfig: TenantConfig = {
  // ...
  paymentProviders: {
    primary: PaymentProviderType.STRIPE,
    fallback: PaymentProviderType.SQUARE, // Use if Stripe fails
    configs: {
      // Both providers configured
    },
  },
};
```

Usage:

```typescript
// Automatically uses fallback if primary fails
const provider = await registry.getProviderWithFallback(tenantId);
const response = await provider.processPayment(request);
```

### Provider Health Checks

Monitor provider health:

```typescript
const healthChecks = await registry.healthCheckAllProviders(tenantId);

healthChecks.forEach(check => {
  console.log(`${check.provider}: ${check.healthy ? '✅' : '❌'}`);
  if (!check.healthy) {
    console.error(`Error: ${check.error}`);
  }
});
```

### White-Labeling

Each tenant can have custom branding:

```typescript
const tenantConfig = registry.getTenantConfig(tenantId);

// Apply branding
document.documentElement.style.setProperty(
  '--primary-color',
  tenantConfig.branding.primaryColor
);

// Use tenant logo
<img src={tenantConfig.branding.logo} alt="Logo" />

// Support contact
<a href={`mailto:${tenantConfig.branding.supportEmail}`}>
  Contact Support
</a>
```

## Testing

### Mock Provider

Use the mock provider for development:

```typescript
// .env.development
PRIMARY_PAYMENT_PROVIDER=mock
ENABLE_MOCK_PAYMENTS=true
```

The mock provider simulates payment processing with configurable outcomes:

- **CVV 999**: Always succeeds
- **CVV 000**: Always fails
- **CVV 666**: Card declined
- **Any other**: 90% success rate

### Test Credentials

Each provider has test/sandbox credentials:

```bash
# Stripe Test
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...

# Square Sandbox
SQUARE_ACCESS_TOKEN=EAAAl...  # Sandbox token
SQUARE_APPLICATION_ID=sandbox-sq0idb-...
```

### Integration Tests

```typescript
import { PaymentProviderRegistry } from '@/lib/payment-providers';

describe('Payment Processing', () => {
  let registry: PaymentProviderRegistry;

  beforeEach(() => {
    registry = PaymentProviderRegistry.getInstance();
    // Register mock provider and tenant
  });

  it('should process payment successfully', async () => {
    const provider = registry.getProvider('test-tenant');

    const response = await provider.processPayment({
      amount: 10.00,
      currency: 'USD',
      paymentMethod: PaymentMethodType.CARD,
      card: {
        cvv: '999', // Mock: always succeeds
        // ...
      },
    });

    expect(response.success).toBe(true);
    expect(response.status).toBe(TransactionStatus.CAPTURED);
  });
});
```

## Production Deployment

### Environment Variables

```bash
# Production .env
TENANT_MODE=env
TENANT_ID=production-tenant
TENANT_NAME=Your Business

# Primary provider
PRIMARY_PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Fallback provider (optional)
FALLBACK_PAYMENT_PROVIDER=square
SQUARE_ACCESS_TOKEN=EAAAl...
SQUARE_LOCATION_ID=L...

# Security
ENABLE_MOCK_PAYMENTS=false
REQUIRE_AUTHENTICATION=true
```

### Security Checklist

- [ ] **Disable mock provider** in production (`ENABLE_MOCK_PAYMENTS=false`)
- [ ] **Use live credentials** (not test/sandbox keys)
- [ ] **Enable HTTPS** for all API calls
- [ ] **Validate webhooks** with signature verification
- [ ] **Log all transactions** for audit trail
- [ ] **Monitor provider health** and switch to fallback if needed
- [ ] **Rotate credentials** regularly
- [ ] **Implement rate limiting** on payment endpoints
- [ ] **Use tokenization** to avoid storing card data
- [ ] **Comply with PCI DSS** requirements

### Monitoring

```typescript
// Set up health check cron job
setInterval(async () => {
  const tenants = registry.listTenants();

  for (const tenant of tenants) {
    const healthChecks = await registry.healthCheckAllProviders(tenant.id);

    healthChecks.forEach(check => {
      if (!check.healthy) {
        // Alert: Provider is down!
        sendAlert({
          severity: 'critical',
          message: `${check.provider} is unhealthy for tenant ${tenant.id}`,
          error: check.error,
        });
      }
    });
  }
}, 5 * 60 * 1000); // Every 5 minutes
```

### Webhook Handling

```typescript
// app/api/webhooks/[provider]/route.ts
export async function POST(
  request: Request,
  { params }: { params: { provider: string } }
) {
  const signature = request.headers.get('stripe-signature');
  const payload = await request.text();

  const provider = registry.getProvider(tenantId, params.provider);

  // Verify webhook signature
  const isValid = await provider.verifyWebhookSignature(payload, signature);

  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  // Process webhook event
  const event = await provider.parseWebhookEvent(payload);

  // Handle event (update database, send notifications, etc.)
  await handleWebhookEvent(event);

  return new Response('OK', { status: 200 });
}
```

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Square Payments API](https://developer.squareup.com/reference/square/payments-api)
- [PCI DSS Compliance](https://www.pcisecuritystandards.org/)
- [Payment Provider Comparison](https://www.g2.com/categories/payment-processing)

## Support

For questions or issues:

1. Check the [Security Guide](SECURITY.md)
2. Review [API Documentation](apps/web-frontend/src/lib/payment-providers/)
3. Open a GitHub issue with details

---

**Last Updated:** 2025-01-19
**Version:** 1.0.0
