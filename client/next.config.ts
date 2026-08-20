import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';
import path from 'path';
import { getSeoRedirects } from './src/lib/seo-content-config';

const nextConfig: NextConfig = {
  // Disable development overlays and indicators completely
  devIndicators: {
    position: 'bottom-right',
  },
  // Disable error overlays in development
  compiler: {
    removeConsole: false, // Keep console.log for debugging
  },
  // Disable overlay that shows compilation errors
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  eslint: {
    // ESLint is enforced by the pre-commit gate (`npm run lint` -> local
    // `eslint --cache .`), not at build time. The built-in `next lint` step is
    // disabled because it resolves a mismatched Next major via npx in this
    // toolchain; running it here would break the build for a non-code reason.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Production source is type-clean and enforced at build time. We point Next
    // at tsconfig.typecheck.json (the same config the pre-commit gate uses), which
    // covers all of src/ but excludes test/mocks/test-utils — those run under jest
    // with jest-only types (jest-dom matchers, MSW) and are checked there, not here.
    tsconfigPath: './tsconfig.typecheck.json',
  },
  images: {
    // Use Cloudflare's /cdn-cgi/image/ API for on-the-fly WebP/AVIF conversion.
    // The built-in Next.js optimizer doesn't run on Cloudflare Workers; the
    // custom loader delegates resizing to Cloudflare's edge instead.
    // Requires Cloudflare Pro or higher (image resizing add-on).
    loader: 'custom',
    loaderFile: './src/lib/cloudflare-image-loader.ts',
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', 'date-fns', 'd3', 'recharts', 'framer-motion', 'chart.js', 'react-chartjs-2'],
    webVitalsAttribution: ['CLS', 'LCP'],
    optimizeServerReact: true,
    serverMinification: true,
  },
  modularizeImports: {
    '@heroicons/react/24/outline': {
      transform: '@heroicons/react/24/outline/{{member}}',
    },
    '@heroicons/react/24/solid': {
      transform: '@heroicons/react/24/solid/{{member}}',
    },
    'lodash': {
      transform: 'lodash/{{member}}',
    },
  },
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  poweredByHeader: false,
  generateEtags: true,
  webpack(config) {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        '@sentry/nextjs': path.resolve(process.cwd(), 'src/__stubs__/sentry.ts'),
      };
    }

    return config;
  },
  async headers() {
    // Determine if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Build CSP based on environment
    // Note: Using 'unsafe-inline' for production because Next.js App Router generates
    // inline scripts for React Server Components that require it. Implementing proper
    // nonce-based CSP with Next.js requires middleware and is complex to set up correctly.
    const scriptSrc = isDevelopment
      ? "'self' 'unsafe-eval' 'unsafe-inline' https://widgets.ventoralabs.com https://crm.ventoralabs.com https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://accounts.google.com https://appleid.cdn-apple.com https://static.cloudflareinsights.com https://us-assets.i.posthog.com"
      : "'self' 'unsafe-inline' https://widgets.ventoralabs.com https://crm.ventoralabs.com https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://accounts.google.com https://appleid.cdn-apple.com https://static.cloudflareinsights.com https://us-assets.i.posthog.com";

    const devConnectSrc = isDevelopment
      ? ' http://localhost:5284 ws://localhost:5284 wss://localhost:5284 http://localhost:8050 ws://localhost:8050 wss://localhost:8050 http://localhost:3050 ws://localhost:3050 wss://localhost:3050'
      : '';

    const contentSecurityPolicy = `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://widgets.ventoralabs.com https://crm.ventoralabs.com https://api.stripe.com https://api-gathergrove-staging.azurewebsites.net https://api-gathergrove-prod.azurewebsites.net https://api.gathergrove.club https://www.google-analytics.com https://analytics.google.com https://www.google.com https://*.ingest.sentry.io https://appleid.apple.com https://cloudflareinsights.com https://static.cloudflareinsights.com https://us.i.posthog.com https://us-assets.i.posthog.com${devConnectSrc} wss://api.gathergrove.club; frame-src 'self' https://js.stripe.com https://accounts.google.com; object-src 'none'; base-uri 'self'; form-action 'self'; ${isDevelopment ? '' : 'upgrade-insecure-requests; block-all-mixed-content; '}frame-ancestors 'none'`;

    return [
      {
        // All paths EXCEPT sitemap.xml and robots.txt — Google's sitemap
        // parser can fail with "Sitemap could not be read" when security
        // headers (CSP, HSTS, Permissions-Policy) are present on XML responses.
        source: '/((?!sitemap\\.xml|robots\\.txt).*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=(), payment=(self "https://js.stripe.com"), fullscreen=(self), accelerometer=(), autoplay=(), encrypted-media=(), gyroscope=(), picture-in-picture=()'
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none'
          },
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400'
          },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/(.*).webp',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/(.*).avif',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
    ];
  },
  async redirects() {
    return [
      ...getSeoRedirects(),
      // Note: non-www → www canonical redirect is handled in middleware.ts
      // to avoid opennextjs-cloudflare misinterpreting /:path* in next.config.ts redirects
      {
        source: '/robots933456.txt',
        destination: '/robots.txt',
        permanent: false
      }
    ];
  },
};

// Wrap with Sentry only when DSN is configured (keeps dev/test environments clean)
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: true,
      widenClientFileUpload: true,
      sourcemaps: {
        deleteSourcemapsAfterUpload: true,
      },
      disableLogger: true,
    })
  : nextConfig;
