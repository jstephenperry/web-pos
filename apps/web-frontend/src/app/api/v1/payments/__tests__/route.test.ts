/**
 * @jest-environment node
 */
import { POST, GET, OPTIONS } from '../route';
import type { PaymentRequest, PaymentResponse } from '@/app/pos/pos.types';

// Mock NextRequest
const createMockRequest = (body: any) => {
  return {
    json: async () => body,
    headers: new Map(),
  } as any;
};

describe('Payment API Route', () => {
  describe('POST /api/v1/payments', () => {
    it('processes a valid payment successfully', async () => {
      const paymentRequest: PaymentRequest = {
        merchantReference: 'TEST-123',
        amount: 10.50,
        currencyCode: 'USD',
        card: {
          number: '4111111111111111',
          expiryMonth: 12,
          expiryYear: 25,
          cvv: '123',
          cardholderName: 'Test User',
        },
        description: 'Test payment',
      };

      const request = createMockRequest(paymentRequest);
      const response = await POST(request);
      const data: PaymentResponse = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('AUTHORIZED');
      expect(data.merchantReference).toBe('TEST-123');
      expect(data.amount).toBe(10.50);
      expect(data.transactionId).toBeDefined();
      expect(data.authorizationCode).toBeDefined();
      expect(data.last4).toBe('1111');
      expect(data.cardBrand).toBe('Visa');
    });

    it('handles declined payment with CVV 000', async () => {
      const paymentRequest: PaymentRequest = {
        merchantReference: 'TEST-DECLINED',
        amount: 50.00,
        currencyCode: 'USD',
        card: {
          number: '4111111111111111',
          expiryMonth: 12,
          expiryYear: 25,
          cvv: '000', // Special CVV for declined scenario
          cardholderName: 'Test User',
        },
        description: 'Test declined payment',
      };

      const request = createMockRequest(paymentRequest);
      const response = await POST(request);
      const data: PaymentResponse = await response.json();

      expect(response.status).toBe(402);
      expect(data.status).toBe('DECLINED');
      expect(data.errorCode).toBe('DECLINED_INSUFFICIENT_FUNDS');
      expect(data.errorMessage).toContain('insufficient funds');
    });

    it('handles invalid CVV with CVV 999', async () => {
      const paymentRequest: PaymentRequest = {
        merchantReference: 'TEST-INVALID-CVV',
        amount: 25.00,
        currencyCode: 'USD',
        card: {
          number: '4111111111111111',
          expiryMonth: 12,
          expiryYear: 25,
          cvv: '999', // Special CVV for invalid CVV scenario
          cardholderName: 'Test User',
        },
        description: 'Test invalid CVV',
      };

      const request = createMockRequest(paymentRequest);
      const response = await POST(request);
      const data: PaymentResponse = await response.json();

      expect(response.status).toBe(402);
      expect(data.status).toBe('DECLINED');
      expect(data.errorCode).toBe('INVALID_CVV');
      expect(data.errorMessage).toContain('CVV');
    });

    it('handles processor failure with CVV 666', async () => {
      const paymentRequest: PaymentRequest = {
        merchantReference: 'TEST-PROCESSOR-ERROR',
        amount: 100.00,
        currencyCode: 'USD',
        card: {
          number: '4111111111111111',
          expiryMonth: 12,
          expiryYear: 25,
          cvv: '666', // Special CVV for processor error scenario
          cardholderName: 'Test User',
        },
        description: 'Test processor error',
      };

      const request = createMockRequest(paymentRequest);
      const response = await POST(request);
      const data: PaymentResponse = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('ERROR');
      expect(data.errorCode).toBe('PROCESSOR_FAILURE');
      expect(data.errorMessage).toContain('processor');
    });

    it('validates required fields', async () => {
      const invalidRequest = {
        // Missing required fields
        amount: 10.00,
      };

      const request = createMockRequest(invalidRequest);
      const response = await POST(request);
      const data: PaymentResponse = await response.json();

      expect(response.status).toBe(400);
      expect(data.status).toBe('ERROR');
      expect(data.errorCode).toBe('VALIDATION_ERROR');
    });

    it('handles malformed JSON', async () => {
      const request = {
        json: async () => { throw new Error('Invalid JSON'); },
        headers: new Map(),
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('ERROR');
      expect(data.errorCode).toBe('INTERNAL_ERROR');
    });

    it('identifies Mastercard correctly', async () => {
      const paymentRequest: PaymentRequest = {
        merchantReference: 'TEST-MASTERCARD',
        amount: 15.00,
        currencyCode: 'USD',
        card: {
          number: '5555555555554444', // Mastercard test number
          expiryMonth: 12,
          expiryYear: 25,
          cvv: '123',
          cardholderName: 'Test User',
        },
        description: 'Test Mastercard',
      };

      const request = createMockRequest(paymentRequest);
      const response = await POST(request);
      const data: PaymentResponse = await response.json();

      expect(response.status).toBe(200);
      expect(data.cardBrand).toBe('Mastercard');
      expect(data.last4).toBe('4444');
    });

    it('identifies American Express correctly', async () => {
      const paymentRequest: PaymentRequest = {
        merchantReference: 'TEST-AMEX',
        amount: 20.00,
        currencyCode: 'USD',
        card: {
          number: '378282246310005', // Amex test number
          expiryMonth: 12,
          expiryYear: 25,
          cvv: '1234',
          cardholderName: 'Test User',
        },
        description: 'Test American Express',
      };

      const request = createMockRequest(paymentRequest);
      const response = await POST(request);
      const data: PaymentResponse = await response.json();

      expect(response.status).toBe(200);
      expect(data.cardBrand).toBe('American Express');
      expect(data.last4).toBe('0005');
    });
  });

  describe('OPTIONS /api/v1/payments', () => {
    it('returns CORS headers', async () => {
      const response = await OPTIONS();

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400');
    });
  });

  describe('GET /api/v1/payments', () => {
    it('returns not implemented', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(501);
      expect(data.error).toBe('Method not implemented');
    });
  });
});
