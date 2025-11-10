/**
 * Rate Limiting Utility
 *
 * Simple in-memory rate limiter for API routes.
 * For production, use Redis-based rate limiting (e.g., upstash/ratelimit)
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// NOTE: In production with multiple instances, use Redis instead
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get client identifier from request
 * Uses IP address or X-Forwarded-For header
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from headers (when behind proxy/load balancer)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // Try x-real-ip header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to user-agent or unknown
  const userAgent = request.headers.get('user-agent');
  return userAgent || 'unknown';
}

/**
 * Rate limit middleware
 *
 * @param request - The Next.js request object
 * @param config - Rate limit configuration
 * @returns null if allowed, NextResponse if rate limited
 */
export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = {
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes default
  }
): NextResponse | null {
  const identifier = getClientIdentifier(request);
  const key = `${identifier}:${request.nextUrl.pathname}`;
  const now = Date.now();

  // Get or create entry
  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired one
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
    return null; // Allow request
  }

  // Increment counter
  entry.count++;

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000);

    logger.warn('Rate limit exceeded', {
      identifier,
      path: request.nextUrl.pathname,
      count: entry.count,
      limit: config.maxRequests,
      resetInSeconds,
    });

    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`,
        retryAfter: resetInSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': resetInSeconds.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString(),
        },
      }
    );
  }

  // Update entry
  rateLimitStore.set(key, entry);

  // Request allowed
  return null;
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  request: NextRequest,
  config: RateLimitConfig
): Record<string, string> {
  const identifier = getClientIdentifier(request);
  const key = `${identifier}:${request.nextUrl.pathname}`;
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': config.maxRequests.toString(),
    };
  }

  const remaining = Math.max(0, config.maxRequests - entry.count);

  return {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': entry.resetTime.toString(),
  };
}
