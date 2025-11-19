/**
 * Secure LocalStorage Utility
 *
 * Provides encrypted storage for sensitive data in localStorage.
 * Uses Web Crypto API (AES-GCM) for encryption.
 *
 * Security features:
 * - AES-256-GCM encryption
 * - Unique IV (initialization vector) for each encryption
 * - HMAC integrity verification (via GCM's authentication tag)
 * - Key derivation from configured secret
 * - Automatic expiration support
 */

interface StorageOptions {
  expiresIn?: number; // Expiration time in milliseconds
}

interface StoredData<T> {
  data: T;
  iv: string; // Initialization vector (base64)
  expiresAt?: number; // Unix timestamp
}

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM

/**
 * Get or generate encryption key from environment variable
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyHex = process.env.CART_ENCRYPTION_KEY;

  if (!keyHex) {
    // In development without a key, use a deterministic fallback
    // This allows the app to work but data won't be secure
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  CART_ENCRYPTION_KEY not set. Using insecure fallback key for development.');
      const fallbackKey = new Uint8Array(32).fill(0); // Weak key for dev only
      return crypto.subtle.importKey('raw', fallbackKey, ALGORITHM, false, ['encrypt', 'decrypt']);
    }

    throw new Error('CART_ENCRYPTION_KEY environment variable is required for secure storage');
  }

  // Convert hex string to Uint8Array
  const keyBytes = new Uint8Array(
    keyHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  );

  if (keyBytes.length !== 32) {
    throw new Error('CART_ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }

  // Import the key for use with Web Crypto API
  return crypto.subtle.importKey('raw', keyBytes, ALGORITHM, false, ['encrypt', 'decrypt']);
}

/**
 * Encrypt data using AES-GCM
 */
async function encrypt<T>(data: T): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
  const key = await getEncryptionKey();

  // Generate random IV for this encryption
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Convert data to JSON string then to ArrayBuffer
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(JSON.stringify(data));

  // Encrypt using AES-GCM
  const encrypted = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    dataBuffer
  );

  return { encrypted, iv };
}

/**
 * Decrypt data using AES-GCM
 */
async function decrypt<T>(encryptedData: ArrayBuffer, iv: Uint8Array): Promise<T> {
  const key = await getEncryptionKey();

  // Decrypt using AES-GCM
  const decrypted = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    encryptedData
  );

  // Convert ArrayBuffer back to JSON string then parse
  const decoder = new TextDecoder();
  const jsonString = decoder.decode(decrypted);

  return JSON.parse(jsonString);
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Securely store data in localStorage with encryption
 */
export async function setSecureItem<T>(
  key: string,
  value: T,
  options?: StorageOptions
): Promise<void> {
  try {
    // Encrypt the data
    const { encrypted, iv } = await encrypt(value);

    // Prepare stored data with IV and optional expiration
    const storedData: StoredData<string> = {
      data: arrayBufferToBase64(encrypted),
      iv: arrayBufferToBase64(iv),
    };

    if (options?.expiresIn) {
      storedData.expiresAt = Date.now() + options.expiresIn;
    }

    // Store in localStorage
    localStorage.setItem(key, JSON.stringify(storedData));
  } catch (error) {
    console.error('Failed to securely store item:', error);
    throw new Error('Failed to encrypt and store data');
  }
}

/**
 * Retrieve and decrypt data from localStorage
 */
export async function getSecureItem<T>(key: string): Promise<T | null> {
  try {
    const storedValue = localStorage.getItem(key);

    if (!storedValue) {
      return null;
    }

    const storedData: StoredData<string> = JSON.parse(storedValue);

    // Check expiration
    if (storedData.expiresAt && Date.now() > storedData.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    // Convert base64 back to ArrayBuffer
    const encryptedData = base64ToArrayBuffer(storedData.data);
    const iv = new Uint8Array(base64ToArrayBuffer(storedData.iv));

    // Decrypt the data
    const decrypted = await decrypt<T>(encryptedData, iv);

    return decrypted;
  } catch (error) {
    console.error('Failed to retrieve secure item:', error);

    // If decryption fails (e.g., key changed), remove the corrupted data
    localStorage.removeItem(key);

    return null;
  }
}

/**
 * Remove item from secure storage
 */
export function removeSecureItem(key: string): void {
  localStorage.removeItem(key);
}

/**
 * Check if a secure item exists and is not expired
 */
export function hasSecureItem(key: string): boolean {
  try {
    const storedValue = localStorage.getItem(key);

    if (!storedValue) {
      return false;
    }

    const storedData: StoredData<string> = JSON.parse(storedValue);

    // Check expiration
    if (storedData.expiresAt && Date.now() > storedData.expiresAt) {
      localStorage.removeItem(key);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Clear all items from localStorage
 * Use with caution!
 */
export function clearSecureStorage(): void {
  localStorage.clear();
}

/**
 * Fallback to unencrypted storage (for environments without encryption key)
 * Only use in development!
 */
export function setItem<T>(key: string, value: T): void {
  if (process.env.NODE_ENV === 'production') {
    console.error('Unencrypted storage should not be used in production!');
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to store item:', error);
  }
}

/**
 * Fallback to retrieve unencrypted data
 * Only use in development!
 */
export function getItem<T>(key: string): T | null {
  if (process.env.NODE_ENV === 'production') {
    console.error('Unencrypted storage should not be used in production!');
    return null;
  }

  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Failed to retrieve item:', error);
    return null;
  }
}
