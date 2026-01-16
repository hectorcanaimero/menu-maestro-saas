import { describe, it, expect } from 'vitest';
import { formatPrice } from './priceFormatter';

describe('formatPrice', () => {
  describe('basic formatting', () => {
    it('should format USD price with default settings', () => {
      const result = formatPrice(10.99, {
        currency: 'USD',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('$10.99');
    });

    it('should format price without decimals', () => {
      const result = formatPrice(10, {
        currency: 'USD',
        decimalPlaces: 0,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('$10');
    });

    it('should handle zero price', () => {
      const result = formatPrice(0, {
        currency: 'USD',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('$0.00');
    });

    it('should handle negative prices', () => {
      const result = formatPrice(-10.5, {
        currency: 'USD',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('$-10.50');
    });
  });

  describe('thousands separator', () => {
    it('should add thousands separator for large numbers', () => {
      const result = formatPrice(1234.56, {
        currency: 'USD',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('$1,234.56');
    });

    it('should handle millions', () => {
      const result = formatPrice(1234567.89, {
        currency: 'USD',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('$1,234,567.89');
    });

    it('should use custom thousands separator', () => {
      const result = formatPrice(1234.56, {
        currency: 'USD',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: '.',
      });

      expect(result).toBe('$1.234.56');
    });
  });

  describe('decimal separator', () => {
    it('should use comma as decimal separator', () => {
      const result = formatPrice(10.99, {
        currency: 'USD',
        decimalPlaces: 2,
        decimalSeparator: ',',
        thousandsSeparator: '.',
      });

      expect(result).toBe('$10,99');
    });

    it('should use custom decimal separator', () => {
      const result = formatPrice(10.99, {
        currency: 'USD',
        decimalPlaces: 2,
        decimalSeparator: '·',
        thousandsSeparator: ',',
      });

      expect(result).toBe('$10·99');
    });
  });

  describe('decimal places', () => {
    it('should format with 0 decimal places', () => {
      const result = formatPrice(10.999, {
        currency: 'USD',
        decimalPlaces: 0,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('$11'); // Rounds up
    });

    it('should format with 1 decimal place', () => {
      const result = formatPrice(10.99, {
        currency: 'USD',
        decimalPlaces: 1,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('$11.0'); // Rounds to 1 decimal
    });

    it('should format with 3 decimal places', () => {
      const result = formatPrice(10.999, {
        currency: 'USD',
        decimalPlaces: 3,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('$10.999');
    });

    it('should format with 4 decimal places for crypto', () => {
      const result = formatPrice(0.0123, {
        currency: 'BTC',
        decimalPlaces: 4,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('BTC0.0123');
    });
  });

  describe('currency symbols', () => {
    it('should format EUR price', () => {
      const result = formatPrice(10.99, {
        currency: 'EUR',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('€10.99');
    });

    it('should format GBP price', () => {
      const result = formatPrice(10.99, {
        currency: 'GBP',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('£10.99');
    });

    it('should format BRL price', () => {
      const result = formatPrice(10.99, {
        currency: 'BRL',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('R$10.99');
    });

    it('should format VES price (Bolivares)', () => {
      const result = formatPrice(10.99, {
        currency: 'VES',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('Bs10.99');
    });

    it('should format COP price (Colombian Peso)', () => {
      const result = formatPrice(10000, {
        currency: 'COP',
        decimalPlaces: 0,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('$10,000');
    });

    it('should format PEN price (Peruvian Sol)', () => {
      const result = formatPrice(10.99, {
        currency: 'PEN',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('S/10.99');
    });

    it('should use currency code for unknown currency', () => {
      const result = formatPrice(10.99, {
        currency: 'XYZ',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('XYZ10.99');
    });
  });

  describe('real-world scenarios', () => {
    it('should format pizza price in USD', () => {
      const result = formatPrice(15.99, {
        currency: 'USD',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('$15.99');
    });

    it('should format delivery fee', () => {
      const result = formatPrice(5.0, {
        currency: 'USD',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('$5.00');
    });

    it('should format cart total', () => {
      const result = formatPrice(87.45, {
        currency: 'USD',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('$87.45');
    });

    it('should format large order total', () => {
      const result = formatPrice(1250.75, {
        currency: 'USD',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('$1,250.75');
    });

    it('should format Venezuelan price with high value', () => {
      const result = formatPrice(1234567.89, {
        currency: 'VES',
        decimalPlaces: 2,
        decimalSeparator: ',',
        thousandsSeparator: '.',
      });

      expect(result).toBe('Bs1.234.567,89');
    });

    it('should format Brazilian price', () => {
      const result = formatPrice(45.9, {
        currency: 'BRL',
        decimalPlaces: 2,
        decimalSeparator: ',',
        thousandsSeparator: '.',
      });

      expect(result).toBe('R$45,90');
    });
  });

  describe('edge cases', () => {
    it('should handle very small numbers', () => {
      const result = formatPrice(0.01, {
        currency: 'USD',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('$0.01');
    });

    it('should handle very large numbers', () => {
      const result = formatPrice(999999999.99, {
        currency: 'USD',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('$999,999,999.99');
    });

    it('should round correctly', () => {
      const result = formatPrice(10.995, {
        currency: 'USD',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('$11.00'); // Rounds up
    });

    it('should handle numbers with many decimal places', () => {
      const result = formatPrice(10.123456789, {
        currency: 'USD',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result).toBe('$10.12'); // Rounds down
    });
  });

  describe('default options', () => {
    it('should use default values when options are omitted', () => {
      const result = formatPrice(10.99, {});

      expect(result).toBe('$10.99');
    });

    it('should partially override defaults', () => {
      const result = formatPrice(10.99, {
        currency: 'EUR',
      });

      expect(result).toBe('€10.99');
    });
  });
});
