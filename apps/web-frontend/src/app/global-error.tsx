'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to structured logger and any error reporting service
    logger.error('Global application error', { digest: error.digest }, error);

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // Example: Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backgroundColor: '#f3f4f6',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            padding: '2rem',
            maxWidth: '28rem',
            width: '100%',
            textAlign: 'center',
          }}>
            <div style={{
              width: '5rem',
              height: '5rem',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                style={{ height: '3rem', width: '3rem', color: 'white' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '0.75rem',
            }}>
              Critical Error
            </h2>

            <p style={{
              color: '#6b7280',
              marginBottom: '1.5rem',
            }}>
              A critical error occurred. The application needs to reload.
            </p>

            {process.env.NODE_ENV === 'development' && error.message && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: '#fee2e2',
                borderRadius: '0.375rem',
                textAlign: 'left',
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  color: '#991b1b',
                  wordBreak: 'break-word',
                }}>
                  {error.message}
                </p>
                {error.digest && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#dc2626',
                    marginTop: '0.5rem',
                  }}>
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  borderRadius: '0.375rem',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>

              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937',
                  borderRadius: '0.375rem',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
