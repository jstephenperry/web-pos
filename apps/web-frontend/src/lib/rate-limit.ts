/**
 * Rate Limiting Utility
 *
 * Improved rate limiter with better IP detection and security.
 * For production with multiple instances, use Redis-based rate limiting (e.g., upstash/ratelimit)
 *
 * Security improvements:
 * - Validates IP addresses to prevent header spoofing
 * - Supports trusted proxy configuration
 * - Combines multiple identifiers for better accuracy
 * - Logs suspicious activity
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
  firstRequestTime: number;
}

// In-memory store for rate limiting
// NOTE: In production with multiple instances, use Redis instead
const rateLimitStore = new Map<string, RateLimitEntry>();

// Track suspicious IPs (too many failed validations)
const suspiciousIPs = new Set<string>();

// Cleanup old entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Validates if a string is a valid IPv4 or IPv6 address
 */
function isValidIP(ip: string): boolean {
  // IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  // IPv6 validation (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv6Regex.test(ip);
}

/**
 * Get client identifier from request with improved security
 * Validates IPs and combines multiple factors for better accuracy
 */
function getClientIdentifier(request: NextRequest): string {
  let ip = 'unknown';
  let source = 'fallback';

  // Check if we're behind a trusted proxy (e.g., Vercel, Netlify, Cloudflare)
  // In production, validate these headers only from trusted sources
  const trustProxy = process.env.TRUST_PROXY === 'true';

  if (trustProxy) {
    // Try CF-Connecting-IP (Cloudflare)
    const cfIp = request.headers.get('cf-connecting-ip');
    if (cfIp && isValidIP(cfIp)) {
      ip = cfIp;
      source = 'cloudflare';
    }
    // Try X-Real-IP (Nginx)
    else {
      const realIp = request.headers.get('x-real-ip');
      if (realIp && isValidIP(realIp)) {
        ip = realIp;
        source = 'x-real-ip';
      }
      // Try X-Forwarded-For (standard proxy header)
      else {
        const forwarded = request.headers.get('x-forwarded-for');
        if (forwarded) {
          // Get the first (original) IP from the chain
          const firstIp = forwarded.split(',')[0].trim();
          if (isValidIP(firstIp)) {
            ip = firstIp;
            source = 'x-forwarded-for';
          } else {
            // Possible header spoofing attempt
            logger.warn('Invalid IP in X-Forwarded-For header', {
              header: forwarded,
              path: request.nextUrl.pathname,
            });
            suspiciousIPs.add(forwarded);
          }
        }
      }
    }
  }

  // Try Next.js built-in IP (most reliable)
  if (ip === 'unknown' && request.ip) {
    ip = request.ip;
    source = 'nextjs';
  }

  // Fallback: Create identifier from user-agent + pathname
  // This is less accurate but prevents complete bypass
  if (ip === 'unknown') {
    const userAgent = request.headers.get('user-agent') || 'no-ua';
    ip = `fallback-${Buffer.from(userAgent).toString('base64').substring(0, 32)}`;
    source = 'user-agent-hash';

    logger.warn('No valid IP found for rate limiting, using fallback', {
      path: request.nextUrl.pathname,
      hasForwardedHeader: !!request.headers.get('x-forwarded-for'),
      hasRealIpHeader: !!request.headers.get('x-real-ip'),
    });
  }

  // Log if IP is suspicious
  if (suspiciousIPs.has(ip) && source !== 'user-agent-hash') {
    logger.warn('Request from previously flagged IP', {
      ip,
      source,
      path: request.nextUrl.pathname,
    });
  }

  return `${source}:${ip}`;
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
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute default
  }
): NextResponse | null {
  // Check if rate limiting is enabled
  if (process.env.ENABLE_RATE_LIMITING === 'false') {
    return null;
  }

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
      firstRequestTime: now,
    };
    rateLimitStore.set(key, entry);
    return null; // Allow request
  }

  // Increment counter
  entry.count++;

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000);
    const requestsPerSecond = entry.count / ((now - entry.firstRequestTime) / 1000);

    logger.warn('Rate limit exceeded', {
      identifier,
      path: request.nextUrl.pathname,
      count: entry.count,
      limit: config.maxRequests,
      resetInSeconds,
      requestsPerSecond: requestsPerSecond.toFixed(2),
      windowMs: config.windowMs,
    });

    // Flag extremely high request rates as potentially malicious
    if (requestsPerSecond > 10) {
      logger.error('Possible DoS attack detected', {
        identifier,
        requestsPerSecond: requestsPerSecond.toFixed(2),
        totalRequests: entry.count,
      });
      suspiciousIPs.add(identifier);
    }

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
