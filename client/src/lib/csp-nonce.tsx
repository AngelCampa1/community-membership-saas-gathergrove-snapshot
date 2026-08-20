import { headers } from 'next/headers';
import React from 'react';

/**
 * BUG FIX #23: Utility to get CSP nonce for inline scripts
 *
 * Usage in Server Components:
 * ```tsx
 * import { getNonce } from '@/lib/csp-nonce';
 *
 * export default function Page() {
 *   const nonce = getNonce();
 *
 *   return (
 *     <script
 *       nonce={nonce}
 *       dangerouslySetInnerHTML={{
 *         __html: `console.log('This inline script is allowed by CSP');`
 *       }}
 *     />
 *   );
 * }
 * ```
 *
 * For Client Components, pass the nonce as a prop from the parent Server Component.
 */

/**
 * Get the CSP nonce from the request headers
 * Only works in Server Components (Next.js 13+ App Router)
 */
export async function getNonce(): Promise<string | undefined> {
  try {
    // Next.js 15: headers() is async and must be awaited.
    const headersList = await headers();
    return headersList.get('x-nonce') || undefined;
  } catch {
    // headers() can only be called in Server Components
    // If this errors, we're likely in a Client Component
    console.warn('getNonce() can only be called in Server Components');
    return undefined;
  }
}

/**
 * React component wrapper that provides nonce to children
 * Use this to pass nonce to client components
 */
export async function WithNonce({ children }: { children: (nonce?: string) => React.ReactNode }) {
  const nonce = await getNonce();
  return <>{children(nonce)}</>;
}
