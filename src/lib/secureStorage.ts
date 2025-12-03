/**
 * Secure Storage Utility
 *
 * Encrypts data before storing in localStorage using Web Crypto API (AES-GCM).
 * This protects sensitive customer data from being exposed in plain text.
 *
 * Security Features:
 * - Uses AES-GCM encryption (256-bit)
 * - Generates unique IV (Initialization Vector) for each encryption
 * - Derives encryption key from device-specific fingerprint
 * - Stores encrypted data as base64 in localStorage
 */

const STORAGE_PREFIX = 'pideai_secure_';
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

/**
 * Generate a device fingerprint to use as encryption key material
 * This creates a unique key for each browser/device combination
 */
async function getDeviceFingerprint(): Promise<string> {
  const data = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset().toString(),
    screen.width + 'x' + screen.height,
    // Add a random component that persists per session
    sessionStorage.getItem('device_seed') || (() => {
      const seed = crypto.randomUUID();
      sessionStorage.setItem('device_seed', seed);
      return seed;
    })(),
  ].join('|');

  return data;
}

/**
 * Derive a cryptographic key from the device fingerprint
 */
async function deriveKey(): Promise<CryptoKey> {
  const fingerprint = await getDeviceFingerprint();

  // Convert fingerprint to array buffer
  const encoder = new TextEncoder();
  const fingerprintBuffer = encoder.encode(fingerprint);

  // Import as base key
  const baseKey = await crypto.subtle.importKey(
    'raw',
    fingerprintBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive actual encryption key using PBKDF2
  const salt = encoder.encode('pideai-secure-storage-v1');

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt and store data in localStorage
 */
export async function setSecureItem<T>(key: string, value: T): Promise<void> {
  try {
    const encryptionKey = await deriveKey();

    // Convert value to string
    const plaintext = JSON.stringify(value);
    const encoder = new TextEncoder();
    const plaintextBuffer = encoder.encode(plaintext);

    // Generate random IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv,
      },
      encryptionKey,
      plaintextBuffer
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    // Convert to base64 for storage
    const base64 = btoa(String.fromCharCode(...combined));

    // Store in localStorage
    localStorage.setItem(STORAGE_PREFIX + key, base64);
  } catch (error) {
    console.error('[SecureStorage] Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Retrieve and decrypt data from localStorage
 */
export async function getSecureItem<T>(key: string): Promise<T | null> {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key);
    if (!stored) {
      return null;
    }

    const encryptionKey = await deriveKey();

    // Convert from base64
    const combined = new Uint8Array(
      atob(stored)
        .split('')
        .map((c) => c.charCodeAt(0))
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    // Decrypt data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv,
      },
      encryptionKey,
      encryptedData
    );

    // Convert back to string and parse JSON
    const decoder = new TextDecoder();
    const plaintext = decoder.decode(decryptedBuffer);

    return JSON.parse(plaintext) as T;
  } catch (error) {
    console.error('[SecureStorage] Decryption error:', error);
    // If decryption fails, remove corrupted data
    localStorage.removeItem(STORAGE_PREFIX + key);
    return null;
  }
}

/**
 * Remove encrypted item from localStorage
 */
export function removeSecureItem(key: string): void {
  localStorage.removeItem(STORAGE_PREFIX + key);
}

/**
 * Clear all secure items from localStorage
 */
export function clearSecureStorage(): void {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith(STORAGE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}

/**
 * Check if a secure item exists
 */
export function hasSecureItem(key: string): boolean {
  return localStorage.getItem(STORAGE_PREFIX + key) !== null;
}

// Type definitions for customer data
export interface SecureCustomerData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_zipcode?: string;
}
