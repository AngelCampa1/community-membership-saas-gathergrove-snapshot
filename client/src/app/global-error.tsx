'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#ffffff' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '480px' }}>
            <h1 style={{ fontSize: '4rem', fontWeight: 700, color: '#16a34a', margin: '0 0 0.5rem' }}>
              500
            </h1>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 1rem' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#6b7280', margin: '0 0 2rem' }}>
              An unexpected error occurred. Our team has been notified.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{
                  padding: '0.625rem 1.5rem',
                  background: '#16a34a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Try again
              </button>
              <Link
                href="/"
                style={{
                  padding: '0.625rem 1.5rem',
                  background: '#f3f4f6',
                  color: '#111827',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  textDecoration: 'none',
                  fontWeight: 500,
                  display: 'inline-block',
                }}
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
