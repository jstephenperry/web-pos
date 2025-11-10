/**
 * Tests for validation schemas
 */

import {
  cardNumberSchema,
  cvvSchema,
  expirationDateSchema,
  cardholderNameSchema,
  paymentDetailsSchema,
  validateData,
  formatZodError,
} from '../validation';

describe('Validation Schemas', () => {
  describe('cardNumberSchema', () => {
    it('should accept valid card numbers', () => {
      const validCards = [
        '4532015112830366', // Visa
        '5425233430109903', // Mastercard
        '374245455400126',  // Amex
      ];

      validCards.forEach((card) => {
        const result = cardNumberSchema.safeParse(card);
        expect(result.success).toBe(true);
      });
    });

    it('should accept card numbers with spaces', () => {
      const result = cardNumberSchema.safeParse('4532 0151 1283 0366');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('4532015112830366'); // Spaces removed
      }
    });

    it('should reject invalid card numbers', () => {
      const invalidCards = [
        '',
        '123', // Too short
        '1234567890123456', // Fails Luhn check
        'abcd1234567890', // Contains letters
      ];

      invalidCards.forEach((card) => {
        const result = cardNumberSchema.safeParse(card);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('cvvSchema', () => {
    it('should accept valid CVV codes', () => {
      const validCVVs = ['123', '4567'];

      validCVVs.forEach((cvv) => {
        const result = cvvSchema.safeParse(cvv);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid CVV codes', () => {
      const invalidCVVs = [
        '',
        '12', // Too short
        '12345', // Too long
        'abc', // Not numeric
      ];

      invalidCVVs.forEach((cvv) => {
        const result = cvvSchema.safeParse(cvv);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('expirationDateSchema', () => {
    it('should accept valid future expiration dates', () => {
      // Get a date 2 years in the future
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      const month = String(futureDate.getMonth() + 1).padStart(2, '0');
      const year = String(futureDate.getFullYear() % 100).padStart(2, '0');
      const expDate = `${month}/${year}`;

      const result = expirationDateSchema.safeParse(expDate);
      expect(result.success).toBe(true);
    });

    it('should reject expired dates', () => {
      const result = expirationDateSchema.safeParse('01/20'); // January 2020
      expect(result.success).toBe(false);
    });

    it('should reject invalid formats', () => {
      const invalidFormats = [
        '',
        '1/23', // Missing leading zero
        '13/25', // Invalid month
        '00/25', // Invalid month
        '12/2025', // Wrong year format
        'invalid',
      ];

      invalidFormats.forEach((date) => {
        const result = expirationDateSchema.safeParse(date);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('cardholderNameSchema', () => {
    it('should accept valid cardholder names', () => {
      const validNames = [
        'John Doe',
        'Mary-Jane Smith',
        "O'Brien",
        'Jean-Pierre',
      ];

      validNames.forEach((name) => {
        const result = cardholderNameSchema.safeParse(name);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid cardholder names', () => {
      const invalidNames = [
        '',
        'A', // Too short
        'John123', // Contains numbers
        'John@Doe', // Contains invalid character
      ];

      invalidNames.forEach((name) => {
        const result = cardholderNameSchema.safeParse(name);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('paymentDetailsSchema', () => {
    it('should validate complete payment details', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      const month = String(futureDate.getMonth() + 1).padStart(2, '0');
      const year = String(futureDate.getFullYear() % 100).padStart(2, '0');

      const validPayment = {
        cardName: 'John Doe',
        cardNumber: '4532015112830366',
        expDate: `${month}/${year}`,
        cvv: '123',
      };

      const result = paymentDetailsSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
    });

    it('should reject incomplete payment details', () => {
      const invalidPayment = {
        cardName: 'John Doe',
        cardNumber: '4532015112830366',
        // Missing expDate and cvv
      };

      const result = paymentDetailsSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
    });
  });

  describe('validateData helper', () => {
    it('should return success for valid data', () => {
      const result = validateData(cvvSchema, '123');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('123');
      }
    });

    it('should return error for invalid data', () => {
      const result = validateData(cvvSchema, 'invalid');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('formatZodError helper', () => {
    it('should format Zod errors into user-friendly messages', () => {
      const result = cvvSchema.safeParse('');
      expect(result.success).toBe(false);

      if (!result.success) {
        const formatted = formatZodError(result.error);
        expect(formatted).toHaveProperty('');
        expect(typeof formatted['']).toBe('string');
      }
    });
  });
});
