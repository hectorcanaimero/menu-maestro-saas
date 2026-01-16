import { describe, it, expect, beforeEach } from 'vitest';
import {
  setSecureItem,
  getSecureItem,
  removeSecureItem,
  clearSecureStorage,
  hasSecureItem,
} from './secureStorage';

describe('secureStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('setSecureItem and getSecureItem', () => {
    it('should encrypt and store data', async () => {
      const testData = { name: 'Test', value: 123 };
      await setSecureItem('test-key', testData);

      // Verify data is stored in localStorage with prefix
      const stored = localStorage.getItem('pideai_secure_test-key');
      expect(stored).toBeTruthy();
      expect(stored).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 pattern
    });

    it('should decrypt and retrieve data', async () => {
      const testData = { name: 'Test', value: 123, nested: { foo: 'bar' } };
      await setSecureItem('test-key', testData);

      const retrieved = await getSecureItem<typeof testData>('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent key', async () => {
      const result = await getSecureItem('non-existent');
      expect(result).toBeNull();
    });

    it('should handle different data types', async () => {
      // String
      await setSecureItem('string', 'Hello World');
      expect(await getSecureItem<string>('string')).toBe('Hello World');

      // Number
      await setSecureItem('number', 42);
      expect(await getSecureItem<number>('number')).toBe(42);

      // Boolean
      await setSecureItem('boolean', true);
      expect(await getSecureItem<boolean>('boolean')).toBe(true);

      // Array
      await setSecureItem('array', [1, 2, 3]);
      expect(await getSecureItem<number[]>('array')).toEqual([1, 2, 3]);

      // Object
      await setSecureItem('object', { a: 1, b: 'two' });
      expect(await getSecureItem<{ a: number; b: string }>('object')).toEqual({
        a: 1,
        b: 'two',
      });
    });

    it('should handle cart data structure', async () => {
      const cartData = [
        {
          id: 'product-1',
          name: 'Pizza',
          price: 10.99,
          quantity: 2,
          image_url: 'https://example.com/pizza.jpg',
          cartItemId: 'product-1',
          extras: [
            { id: 'extra-1', name: 'Cheese', price: 2.0 },
            { id: 'extra-2', name: 'Pepperoni', price: 3.0 },
          ],
        },
      ];

      await setSecureItem('cart', cartData);
      const retrieved = await getSecureItem<typeof cartData>('cart');
      expect(retrieved).toEqual(cartData);
    });

    it('should handle customer data structure', async () => {
      const customerData = {
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '+1234567890',
        delivery_address: '123 Main St',
        address_number: '456',
        address_complement: 'Apt 2B',
        address_neighborhood: 'Downtown',
        address_zipcode: '12345',
      };

      await setSecureItem('checkout_data', customerData);
      const retrieved = await getSecureItem<typeof customerData>('checkout_data');
      expect(retrieved).toEqual(customerData);
    });
  });

  describe('removeSecureItem', () => {
    it('should remove stored item', async () => {
      await setSecureItem('test', 'data');
      expect(await getSecureItem('test')).toBe('data');

      removeSecureItem('test');
      expect(await getSecureItem('test')).toBeNull();
    });

    it('should not throw when removing non-existent item', () => {
      expect(() => removeSecureItem('non-existent')).not.toThrow();
    });
  });

  describe('clearSecureStorage', () => {
    it('should clear all secure items', async () => {
      await setSecureItem('item1', 'value1');
      await setSecureItem('item2', 'value2');
      await setSecureItem('item3', 'value3');

      expect(await getSecureItem('item1')).toBe('value1');
      expect(await getSecureItem('item2')).toBe('value2');
      expect(await getSecureItem('item3')).toBe('value3');

      clearSecureStorage();

      expect(await getSecureItem('item1')).toBeNull();
      expect(await getSecureItem('item2')).toBeNull();
      expect(await getSecureItem('item3')).toBeNull();
    });

    it('should not clear non-secure items in localStorage', async () => {
      localStorage.setItem('regular-item', 'regular-value');
      await setSecureItem('secure-item', 'secure-value');

      clearSecureStorage();

      expect(localStorage.getItem('regular-item')).toBe('regular-value');
      expect(await getSecureItem('secure-item')).toBeNull();
    });
  });

  describe('hasSecureItem', () => {
    it('should return true for existing item', async () => {
      await setSecureItem('test', 'data');
      expect(hasSecureItem('test')).toBe(true);
    });

    it('should return false for non-existent item', () => {
      expect(hasSecureItem('non-existent')).toBe(false);
    });

    it('should return false after item is removed', async () => {
      await setSecureItem('test', 'data');
      expect(hasSecureItem('test')).toBe(true);

      removeSecureItem('test');
      expect(hasSecureItem('test')).toBe(false);
    });
  });

  describe('encryption security', () => {
    it('should generate different encrypted output for same data', async () => {
      await setSecureItem('test1', 'same-data');
      const encrypted1 = localStorage.getItem('pideai_secure_test1');

      await setSecureItem('test2', 'same-data');
      const encrypted2 = localStorage.getItem('pideai_secure_test2');

      // Different IVs should produce different encrypted outputs
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle large data sets', async () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        price: Math.random() * 100,
        quantity: Math.floor(Math.random() * 10),
      }));

      await setSecureItem('large-data', largeArray);
      const retrieved = await getSecureItem<typeof largeArray>('large-data');

      expect(retrieved).toEqual(largeArray);
      expect(retrieved).toHaveLength(1000);
    });

    it('should handle special characters and unicode', async () => {
      const testData = {
        english: 'Hello World',
        spanish: '¡Hola Mundo!',
        emoji: '🍕🎉✨',
        symbols: '@#$%^&*()',
        chinese: '你好世界',
        arabic: 'مرحبا بالعالم',
      };

      await setSecureItem('unicode-test', testData);
      const retrieved = await getSecureItem<typeof testData>('unicode-test');

      expect(retrieved).toEqual(testData);
    });
  });

  describe('error handling', () => {
    it('should return null when decryption fails', async () => {
      // Manually corrupt the stored data
      localStorage.setItem('pideai_secure_corrupted', 'invalid-base64-!!!');

      const result = await getSecureItem('corrupted');
      expect(result).toBeNull();

      // Should also remove corrupted data
      expect(localStorage.getItem('pideai_secure_corrupted')).toBeNull();
    });

    it('should handle empty strings', async () => {
      await setSecureItem('empty', '');
      const retrieved = await getSecureItem<string>('empty');
      expect(retrieved).toBe('');
    });

    it('should handle null values', async () => {
      await setSecureItem('null-value', null);
      const retrieved = await getSecureItem('null-value');
      expect(retrieved).toBeNull();
    });
  });
});
