import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers

  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Disable unnecessary browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  // XSS Protection (legacy but still useful for older browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Content Security Policy
  // Note: Adjusted for Next.js requirements with 'unsafe-eval' and 'unsafe-inline'
  // In production, you should tighten these policies
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-eval needed for Next.js dev
    "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for styled-jsx and Tailwind
    "img-src 'self' data: blob:", // data: and blob: for base64 and dynamic images
    "font-src 'self' data:",
    "connect-src 'self'", // API calls to same origin
    "frame-ancestors 'none'", // Similar to X-Frame-Options
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspDirectives);

  // Strict Transport Security (HSTS) - only in production with HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|assets).*)',
  ],
};
