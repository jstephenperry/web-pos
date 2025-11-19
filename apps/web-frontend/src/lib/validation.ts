/**
 * Validation Schemas using Zod
 *
 * Centralized validation for all data types in the application.
 * These schemas ensure data integrity and type safety.
 */

import { z } from 'zod';

/**
 * Card Number Validation
 * - Must be 13-19 digits
 * - Common card lengths: Visa (13,16), MC (16), Amex (15), Discover (16), Diners (14)
 */
export const cardNumberSchema = z
  .string()
  .min(1, 'Card number is required')
  .transform((val) => val.replace(/\s/g, '')) // Remove spaces
  .refine(
    (val) => /^\d{13,19}$/.test(val),
    'Card number must be 13-19 digits'
  )
  .refine(
    (val) => {
      // Luhn algorithm for card validation
      let sum = 0;
      let isEven = false;
      for (let i = val.length - 1; i >= 0; i--) {
        let digit = parseInt(val[i], 10);
        if (isEven) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
        isEven = !isEven;
      }
      return sum % 10 === 0;
    },
    'Invalid card number (failed Luhn check)'
  );

/**
 * CVV Validation
 * - 3 digits for most cards
 * - 4 digits for Amex
 */
export const cvvSchema = z
  .string()
  .min(3, 'CVV must be 3-4 digits')
  .max(4, 'CVV must be 3-4 digits')
  .regex(/^\d{3,4}$/, 'CVV must be numeric');

/**
 * Expiration Date Validation (MM/YY format)
 */
export const expirationDateSchema = z
  .string()
  .min(1, 'Expiration date is required')
  .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiration date must be in MM/YY format')
  .refine(
    (val) => {
      const [month, year] = val.split('/').map(Number);
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;

      // Check if card is expired
      if (year < currentYear) return false;
      if (year === currentYear && month < currentMonth) return false;

      return true;
    },
    'Card is expired'
  );

/**
 * Cardholder Name Validation
 * Enhanced with stricter length limits and sanitization
 */
export const cardholderNameSchema = z
  .string()
  .min(1, 'Cardholder name is required')
  .min(2, 'Cardholder name must be at least 2 characters')
  .max(50, 'Cardholder name must not exceed 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Cardholder name contains invalid characters')
  .refine(
    (val) => {
      // Prevent excessive spaces or special characters
      const normalizedSpaces = val.replace(/\s+/g, ' ').trim();
      return normalizedSpaces.length >= 2 && normalizedSpaces.length <= 50;
    },
    'Cardholder name format is invalid'
  )
  .refine(
    (val) => !val.includes('  '), // No double spaces
    'Cardholder name contains excessive spaces'
  )
  .transform((val) => val.trim().replace(/\s+/g, ' ')); // Normalize spaces

/**
 * Payment Details Schema (Frontend Form)
 */
export const paymentDetailsSchema = z.object({
  cardName: cardholderNameSchema,
  cardNumber: cardNumberSchema,
  expDate: expirationDateSchema,
  cvv: cvvSchema,
});

/**
 * Product Schema
 * Enhanced with size and range validation
 */
export const productSchema = z.object({
  id: z.number().int().positive(),
  name: z.string()
    .min(1, 'Product name is required')
    .max(100, 'Product name too long')
    .trim(),
  price: z.number()
    .positive('Price must be positive')
    .min(0.01, 'Price must be at least 0.01')
    .max(99999.99, 'Price exceeds maximum limit'),
  image: z.string()
    .max(500, 'Image URL too long')
    .refine(
      (val) => val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://'),
      'Image must be a valid URL or path'
    ),
});

/**
 * Cart Item Schema
 * Enhanced with quantity limits
 */
export const cartItemSchema = productSchema.extend({
  quantity: z.number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be at least 1')
    .max(9999, 'Quantity exceeds maximum limit'),
});

/**
 * Cart Schema
 */
export const cartSchema = z.array(cartItemSchema);

/**
 * Payment Request Schema (API)
 * Enhanced with stricter amount validation and size limits
 */
export const paymentRequestSchema = z.object({
  merchantReference: z.string()
    .max(100, 'Merchant reference too long')
    .optional(),
  amount: z.number()
    .positive('Amount must be positive')
    .min(0.01, 'Amount must be at least 0.01')
    .max(999999.99, 'Amount exceeds maximum limit')
    .refine(
      (val) => {
        // Ensure amount has at most 2 decimal places (cents precision)
        const decimalPlaces = (val.toString().split('.')[1] || '').length;
        return decimalPlaces <= 2;
      },
      'Amount must have at most 2 decimal places'
    ),
  currencyCode: z.string()
    .length(3, 'Currency code must be 3 characters')
    .regex(/^[A-Z]{3}$/, 'Currency code must be uppercase letters')
    .default('USD'),
  card: z.object({
    number: cardNumberSchema,
    expiryMonth: z.number().int().min(1).max(12),
    expiryYear: z.number().int().min(0).max(99),
    cvv: cvvSchema,
    cardholderName: cardholderNameSchema,
  }),
  description: z.string()
    .max(500, 'Description too long')
    .optional(),
  recurring: z.boolean().optional().default(false),
  storeCard: z.boolean().optional().default(false),
});

/**
 * Payment Response Schema (API)
 */
export const paymentResponseSchema = z.object({
  merchantReference: z.string().optional(),
  transactionId: z.string().optional(),
  status: z.enum(['AUTHORIZED', 'CAPTURED', 'DECLINED', 'ERROR', 'PENDING']).optional(),
  amount: z.number().optional(),
  currencyCode: z.string().optional(),
  timestamp: z.string().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  authorizationCode: z.string().optional(),
  last4: z.string().optional(),
  cardBrand: z.string().optional(),
  cardToken: z.string().optional(),
  rawResponse: z.string().optional(),
});

/**
 * Environment Variables Schema
 */
export const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_TAX_RATE: z.string().transform(Number).pipe(z.number().min(0).max(100)),
  NEXT_PUBLIC_CURRENCY: z.string().length(3),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
});

/**
 * Helper function to safely parse and validate data
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Extract user-friendly error messages from Zod errors
 */
export function formatZodError(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  const issues = error.issues || [];
  issues.forEach((issue: any) => {
    const path = issue.path.join('.');
    formatted[path] = issue.message;
  });
  return formatted;
}

// Export types inferred from schemas
export type PaymentDetailsInput = z.infer<typeof paymentDetailsSchema>;
export type PaymentRequestInput = z.infer<typeof paymentRequestSchema>;
export type PaymentResponseOutput = z.infer<typeof paymentResponseSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
