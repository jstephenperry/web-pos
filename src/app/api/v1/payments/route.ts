import { NextRequest, NextResponse } from 'next/server';
import type { PaymentRequest, PaymentResponse } from '@/app/pos/pos.types';

/**
 * POST /api/v1/payments
 *
 * Process a payment transaction
 * This is a MOCK implementation for testing purposes
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: PaymentRequest = await request.json();

    // Basic validation
    if (!body.merchantReference || !body.amount || !body.card) {
      return NextResponse.json(
        {
          status: 'ERROR',
          errorCode: 'VALIDATION_ERROR',
          errorMessage: 'Invalid payment request data',
        } as PaymentResponse,
        { status: 400 }
      );
    }

    // Simulate payment processing delay (100-300ms)
    const processingDelay = Math.floor(Math.random() * 200) + 100;
    await new Promise((resolve) => setTimeout(resolve, processingDelay));

    // Mock payment processing logic
    const mockResult = await processMockPayment(body);

    // Return appropriate status code
    const statusCode =
      mockResult.status === 'AUTHORIZED' || mockResult.status === 'CAPTURED'
        ? 200
        : mockResult.status === 'DECLINED'
        ? 402
        : 500;

    return NextResponse.json(mockResult, { status: statusCode });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Payment processing error:', errorMessage);

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
 * In a real application, this would integrate with a payment processor
 */
async function processMockPayment(request: PaymentRequest): Promise<PaymentResponse> {
  const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
  const last4 = request.card.number.slice(-4);

  // Determine card brand from number
  const cardBrand = getCardBrand(request.card.number);

  // Mock scenarios based on card CVV for testing different outcomes
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

  // Scenario 4: Success (default)
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
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
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
