/**
 * Environment Variable Validation
 *
 * Validates all required environment variables on application startup.
 * Throws descriptive errors if required variables are missing or invalid.
 */

interface EnvConfig {
  // API Configuration
  apiUrl: string;
  useExternalApi: boolean;

  // Keycloak Authentication
  keycloakUrl: string;
  keycloakRealm: string;
  keycloakClientId: string;

  // Application Settings
  taxRate: number;
  currency: string;
  logLevel: string;

  // Security Settings
  enableMockPayments: boolean;
  requireAuthentication: boolean;
  enableRateLimiting: boolean;
  rateLimitMaxRequests: number;
  rateLimitWindowMs: number;
  cartEncryptionKey: string | null;
}

/**
 * Validates a URL string
 */
function validateUrl(value: string, name: string): string {
  try {
    new URL(value);
    return value;
  } catch {
    throw new Error(`Invalid URL for ${name}: ${value}`);
  }
}

/**
 * Validates a positive number
 */
function validatePositiveNumber(value: string | undefined, name: string, defaultValue?: number): number {
  if (value === undefined && defaultValue !== undefined) {
    return defaultValue;
  }

  const num = Number(value);
  if (isNaN(num) || num < 0) {
    throw new Error(`${name} must be a positive number, got: ${value}`);
  }
  return num;
}

/**
 * Validates a boolean environment variable
 */
function validateBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }
  return value === 'true' || value === '1';
}

/**
 * Validates hex string for encryption key
 */
function validateHexKey(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  // Should be 64 hex characters (32 bytes)
  if (!/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error('CART_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Generate with: openssl rand -hex 32');
  }

  return value;
}

/**
 * Validates log level
 */
function validateLogLevel(value: string | undefined, defaultValue: string): string {
  const validLevels = ['debug', 'info', 'warn', 'error'];
  const level = (value || defaultValue).toLowerCase();

  if (!validLevels.includes(level)) {
    throw new Error(`LOG_LEVEL must be one of: ${validLevels.join(', ')}`);
  }

  return level;
}

/**
 * Validates currency code (ISO 4217)
 */
function validateCurrency(value: string | undefined, defaultValue: string): string {
  const currency = value || defaultValue;

  // Basic validation - 3 uppercase letters
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error(`Currency must be a 3-letter ISO 4217 code (e.g., USD, EUR, GBP), got: ${currency}`);
  }

  return currency;
}

/**
 * Loads and validates all environment variables
 */
export function validateEnv(): EnvConfig {
  const errors: string[] = [];

  try {
    // API Configuration
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    validateUrl(apiUrl, 'NEXT_PUBLIC_API_URL');

    const useExternalApi = validateBoolean(process.env.USE_EXTERNAL_API, false);

    // Keycloak Configuration
    const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8180';
    validateUrl(keycloakUrl, 'NEXT_PUBLIC_KEYCLOAK_URL');

    const keycloakRealm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'payment-realm';
    if (!keycloakRealm) {
      errors.push('NEXT_PUBLIC_KEYCLOAK_REALM is required');
    }

    const keycloakClientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'payment-web-app';
    if (!keycloakClientId) {
      errors.push('NEXT_PUBLIC_KEYCLOAK_CLIENT_ID is required');
    }

    // Application Settings
    const taxRate = validatePositiveNumber(process.env.NEXT_PUBLIC_TAX_RATE, 'NEXT_PUBLIC_TAX_RATE', 0.0825);
    if (taxRate > 1) {
      console.warn('Warning: TAX_RATE > 1 (100%). This is unusual. Use decimal format (e.g., 0.0825 for 8.25%)');
    }

    const currency = validateCurrency(process.env.NEXT_PUBLIC_CURRENCY, 'USD');
    const logLevel = validateLogLevel(process.env.LOG_LEVEL, 'info');

    // Security Settings
    const enableMockPayments = validateBoolean(process.env.ENABLE_MOCK_PAYMENTS, true);
    const requireAuthentication = validateBoolean(process.env.REQUIRE_AUTHENTICATION, true);
    const enableRateLimiting = validateBoolean(process.env.ENABLE_RATE_LIMITING, true);
    const rateLimitMaxRequests = validatePositiveNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 'RATE_LIMIT_MAX_REQUESTS', 10);
    const rateLimitWindowMs = validatePositiveNumber(process.env.RATE_LIMIT_WINDOW_MS, 'RATE_LIMIT_WINDOW_MS', 60000);

    const cartEncryptionKey = validateHexKey(process.env.CART_ENCRYPTION_KEY);

    // Production warnings
    if (process.env.NODE_ENV === 'production') {
      if (enableMockPayments) {
        console.warn('⚠️  WARNING: ENABLE_MOCK_PAYMENTS is true in production! This should be disabled.');
      }

      if (!cartEncryptionKey) {
        console.warn('⚠️  WARNING: CART_ENCRYPTION_KEY is not set. Cart data will not be encrypted in localStorage.');
      }

      if (!requireAuthentication) {
        console.warn('⚠️  WARNING: REQUIRE_AUTHENTICATION is false in production! POS will be accessible without login.');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Environment validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
    }

    return {
      apiUrl,
      useExternalApi,
      keycloakUrl,
      keycloakRealm,
      keycloakClientId,
      taxRate,
      currency,
      logLevel,
      enableMockPayments,
      requireAuthentication,
      enableRateLimiting,
      rateLimitMaxRequests,
      rateLimitWindowMs,
      cartEncryptionKey,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Environment Configuration Error:', error.message);
    }
    throw error;
  }
}

// Validate environment variables on module load (server-side only)
let envConfig: EnvConfig;

if (typeof window === 'undefined') {
  try {
    envConfig = validateEnv();
    console.log('✅ Environment variables validated successfully');
  } catch (error) {
    console.error('Failed to validate environment variables');
    // In production, we want to fail fast if configuration is invalid
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Get validated environment configuration
 * Safe to use throughout the application
 */
export function getEnvConfig(): EnvConfig {
  if (typeof window !== 'undefined') {
    // Client-side: validate on demand
    return validateEnv();
  }
  return envConfig;
}

/**
 * Type-safe environment variable access
 */
export const env = {
  get apiUrl() { return getEnvConfig().apiUrl; },
  get useExternalApi() { return getEnvConfig().useExternalApi; },
  get keycloakUrl() { return getEnvConfig().keycloakUrl; },
  get keycloakRealm() { return getEnvConfig().keycloakRealm; },
  get keycloakClientId() { return getEnvConfig().keycloakClientId; },
  get taxRate() { return getEnvConfig().taxRate; },
  get currency() { return getEnvConfig().currency; },
  get logLevel() { return getEnvConfig().logLevel; },
  get enableMockPayments() { return getEnvConfig().enableMockPayments; },
  get requireAuthentication() { return getEnvConfig().requireAuthentication; },
  get enableRateLimiting() { return getEnvConfig().enableRateLimiting; },
  get rateLimitMaxRequests() { return getEnvConfig().rateLimitMaxRequests; },
  get rateLimitWindowMs() { return getEnvConfig().rateLimitWindowMs; },
  get cartEncryptionKey() { return getEnvConfig().cartEncryptionKey; },
} as const;
