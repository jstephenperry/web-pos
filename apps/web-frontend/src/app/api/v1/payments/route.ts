import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { paymentRequestSchema, validateData, formatZodError } from '@/lib/validation';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import type { PaymentRequest, PaymentResponse } from '@/app/pos/pos.types';

// Request size limit (1MB for payment requests)
const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB

/**
 * Get secure CORS headers based on request origin
 * Never uses wildcard (*) - only allows explicitly configured origins
 */
function getCorsHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Vary': 'Origin', // Important for caching
  };

  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
  const origin = request.headers.get('origin');

  // In development with no configured origins, allow localhost/127.0.0.1
  if (process.env.NODE_ENV === 'development' && allowedOrigins.length === 0) {
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      headers['Access-Control-Allow-Origin'] = origin;
      return headers;
    }
  }

  // Check if origin is in allowed list
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  // If no matching origin, don't set Access-Control-Allow-Origin header
  // Browser will block the request due to CORS policy

  return headers;
}

/**
 * POST /api/v1/payments
 *
 * Process a payment transaction
 * This is a MOCK implementation for prototype purposes
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Rate limiting check
  const rateLimitResult = rateLimit(request, {
    maxRequests: 10, // 10 requests
    windowMs: 60 * 1000, // per minute (stricter for payment endpoints)
  });

  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    // Check content length
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      logger.warn('Request payload too large', {
        size: contentLength,
        limit: MAX_REQUEST_SIZE,
      });

      return NextResponse.json(
        {
          status: 'ERROR',
          errorCode: 'PAYLOAD_TOO_LARGE',
          errorMessage: 'Request payload exceeds maximum size limit',
        } as PaymentResponse,
        { status: 413 }
      );
    }

    // Parse request body
    const body = await request.json();

    logger.info('Payment request received', {
      merchantReference: body.merchantReference,
      amount: body.amount,
      currency: body.currencyCode,
    });

    // Validate request data
    const validation = validateData(paymentRequestSchema, body);

    if (!validation.success) {
      const errors = formatZodError(validation.error);
      logger.warn('Payment validation failed', { errors });

      return NextResponse.json(
        {
          status: 'ERROR',
          errorCode: 'VALIDATION_ERROR',
          errorMessage: 'Invalid payment request data',
          errors,
        } as PaymentResponse,
        { status: 400 }
      );
    }

    const paymentRequest: PaymentRequest = validation.data;

    // Check if mock payments are enabled
    const enableMockPayments = process.env.ENABLE_MOCK_PAYMENTS === 'true';

    // In production, mock payments should be disabled
    if (process.env.NODE_ENV === 'production' && enableMockPayments) {
      logger.error('Mock payments are enabled in production environment!', {
        environment: process.env.NODE_ENV,
      });
    }

    // If mock payments are disabled, return error indicating integration needed
    if (!enableMockPayments) {
      logger.warn('Payment attempt with mock payments disabled', {
        merchantReference: paymentRequest.merchantReference,
        amount: paymentRequest.amount,
      });

      return NextResponse.json(
        {
          status: 'ERROR',
          errorCode: 'SERVICE_UNAVAILABLE',
          errorMessage: 'Payment processing is currently unavailable. Please contact support.',
        } as PaymentResponse,
        { status: 503 }
      );
    }

    // Simulate payment processing delay (100-500ms)
    const processingDelay = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, processingDelay));

    // Mock payment processing logic (only when enabled)
    const mockResult = await processMockPayment(paymentRequest);

    // Log payment result
    logger.payment(
      mockResult.status === 'AUTHORIZED' || mockResult.status === 'CAPTURED' ? 'success' : 'failed',
      {
        amount: mockResult.amount,
        currency: mockResult.currencyCode,
        status: mockResult.status,
        transactionId: mockResult.transactionId,
        errorCode: mockResult.errorCode,
        last4: mockResult.last4,
      }
    );

    logger.performance('Payment processing', Date.now() - startTime, {
      status: mockResult.status,
    });

    // Return appropriate status code
    const statusCode =
      mockResult.status === 'AUTHORIZED' || mockResult.status === 'CAPTURED'
        ? 200
        : mockResult.status === 'DECLINED'
        ? 402
        : 500;

    // Add rate limit headers to response
    const headers = getRateLimitHeaders(request, {
      maxRequests: 10,
      windowMs: 60 * 1000,
    });

    // Add secure CORS headers
    const corsHeaders = getCorsHeaders(request);
    Object.assign(headers, corsHeaders);

    return NextResponse.json(mockResult, { status: statusCode, headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Payment processing error', { error: errorMessage }, error as Error);

    return NextResponse.json(
      {
        status: 'ERROR',
        errorCode: 'INTERNAL_ERROR',
        errorMessage: 'An error occurred while processing the payment',
      } as PaymentResponse,
      { status: 500 }
    );
  }
}

/**
 * Mock Payment Processing Logic
 *
 * In a real application, this would integrate with a payment processor like:
 * - Stripe
 * - Square
 * - PayPal
 * - Authorize.net
 * - Braintree
 * etc.
 */
async function processMockPayment(request: PaymentRequest): Promise<PaymentResponse> {
  const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
  const last4 = request.card.number.slice(-4);

  // Determine card brand from number
  const cardBrand = getCardBrand(request.card.number);

  // Mock scenarios based on card number or CVV
  // This allows testing different payment scenarios

  // Scenario 1: Declined - CVV = 000
  if (request.card.cvv === '000') {
    return {
      merchantReference: request.merchantReference,
      transactionId,
      status: 'DECLINED',
      amount: request.amount,
      currencyCode: request.currencyCode,
      timestamp: new Date().toISOString(),
      errorCode: 'DECLINED_INSUFFICIENT_FUNDS',
      errorMessage: 'The card was declined due to insufficient funds',
      last4,
      cardBrand,
    };
  }

  // Scenario 2: Invalid CVV - CVV = 999
  if (request.card.cvv === '999') {
    return {
      merchantReference: request.merchantReference,
      transactionId,
      status: 'DECLINED',
      amount: request.amount,
      currencyCode: request.currencyCode,
      timestamp: new Date().toISOString(),
      errorCode: 'INVALID_CVV',
      errorMessage: 'The CVV code is invalid',
      last4,
      cardBrand,
    };
  }

  // Scenario 3: Processor error - CVV = 666
  if (request.card.cvv === '666') {
    return {
      merchantReference: request.merchantReference,
      transactionId,
      status: 'ERROR',
      amount: request.amount,
      currencyCode: request.currencyCode,
      timestamp: new Date().toISOString(),
      errorCode: 'PROCESSOR_FAILURE',
      errorMessage: 'Payment processor is temporarily unavailable',
      last4,
      cardBrand,
    };
  }

  // Scenario 4: Random 5% failure rate for testing
  if (Math.random() < 0.05) {
    const errorScenarios = [
      { code: 'DECLINED_GENERIC', message: 'The card was declined' },
      { code: 'EXPIRED_CARD', message: 'The card has expired' },
      { code: 'CARD_NOT_SUPPORTED', message: 'This card type is not supported' },
    ];
    const scenario = errorScenarios[Math.floor(Math.random() * errorScenarios.length)];

    return {
      merchantReference: request.merchantReference,
      transactionId,
      status: 'DECLINED',
      amount: request.amount,
      currencyCode: request.currencyCode,
      timestamp: new Date().toISOString(),
      errorCode: scenario.code,
      errorMessage: scenario.message,
      last4,
      cardBrand,
    };
  }

  // Scenario 5: Success (default)
  return {
    merchantReference: request.merchantReference,
    transactionId,
    status: 'AUTHORIZED',
    amount: request.amount,
    currencyCode: request.currencyCode,
    timestamp: new Date().toISOString(),
    authorizationCode: `AUTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    last4,
    cardBrand,
  };
}

/**
 * Determine card brand from card number
 */
function getCardBrand(cardNumber: string): string {
  const number = cardNumber.replace(/\s/g, '');

  if (/^4/.test(number)) return 'Visa';
  if (/^5[1-5]/.test(number)) return 'Mastercard';
  if (/^3[47]/.test(number)) return 'American Express';
  if (/^6(?:011|5)/.test(number)) return 'Discover';
  if (/^3(?:0[0-5]|[68])/.test(number)) return 'Diners Club';
  if (/^35/.test(number)) return 'JCB';

  return 'Unknown';
}

/**
 * OPTIONS /api/v1/payments
 *
 * CORS preflight request handler
 */
export async function OPTIONS(request: NextRequest) {
  const headers = getCorsHeaders(request);

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

/**
 * GET /api/v1/payments
 *
 * Not implemented - would typically return payment history
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'Method not implemented',
      message: 'Use POST to process payments',
    },
    { status: 501 }
  );
}
