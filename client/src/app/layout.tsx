import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/hooks/useAuth";
import { GoogleOAuthProvider } from "@/components/providers/google-oauth-provider";
import { Toaster } from "sonner";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { ABTestProvider } from "@/components/analytics/ABTest";
import CriticalCSS from "@/components/performance/CriticalCSS";
import { StructuredData } from "@/components/seo/StructuredData";
import AccessibilityProvider from "@/components/accessibility/AccessibilityProvider";
import KeyboardNavigation from "@/components/accessibility/KeyboardNavigation";
import SkipLinks from "@/components/accessibility/SkipLinks";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";
import PWAStatus from "@/components/pwa/PWAStatus";
import { ExitIntentProvider } from "@/components/marketing/ExitIntentProvider";
import VentoraFeedbackWidget from "@/components/VentoraFeedbackWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: false, // Prevent CLS
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: false, // Only preload critical fonts
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
  adjustFontFallback: false, // Prevent CLS
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.gathergrove.club'),
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
    verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  }),
  title: {
    default: "GatherGrove - Club Management Software for Communities",
    template: "%s | GatherGrove",
  },
  description: "Replace your club's spreadsheets in 5 minutes. Members, dues, events & communications - one dashboard for hobby clubs and nonprofits. Free 30-day trial.",
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-40x40.png', sizes: '40x40', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-touch-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/apple-touch-icon-167x167.png', sizes: '167x167', type: 'image/png' }
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: "GatherGrove - Club Management Software for Communities",
    description: "Replace your club's spreadsheets in 5 minutes. Members, dues, events & communications in one dashboard. Built for hobby clubs and nonprofits. Free 30-day trial.",
    type: "website",
    url: "https://www.gathergrove.club",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'GatherGrove - Club Management Platform for Hobby Communities',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GatherGrove - Club Management Software for Communities",
    description: "Replace your club's spreadsheets in 5 minutes. Members, dues, events & communications in one dashboard. Built for hobby clubs and nonprofits. Free 30-day trial.",
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Critical resource preloading - prioritize most important connections */}
        {/* BUG FIX F-05: Use environment variable instead of hardcoded localhost, only in development */}
        {process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_API_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL} />
        )}
        {/* NEW-003: __name polyfill - must be a raw inline <script> in <head>, not next/script,
            because next/script strategy="beforeInteractive" queues via self.__next_s and executes
            AFTER inline theme scripts that already reference __name. */}
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <script dangerouslySetInnerHTML={{ __html: `if(typeof __name==="undefined"){var __defProp=Object.defineProperty;var __name=function(t,v){__defProp(t,"name",{value:v,configurable:true});return t}}` }} />

        {/* Preconnect for analytics (eliminates DNS + TCP + TLS setup time) */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://us.i.posthog.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://us-assets.i.posthog.com" crossOrigin="anonymous" />
        {/* DNS prefetch for analytics (lower priority) */}
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        
        {/* Note: Removed hardcoded modulepreload for main-app.js and webpack.js
            Next.js uses content-hashed filenames (e.g., main-app-abc123.js)
            which makes static preload links invalid. Next.js handles module
            preloading automatically through its build system. */}
        
        {/* Preload critical resources for pages that use them */}
        {/* Note: horizontal-logo.png preload removed to prevent warnings on login page */}
        
        {/* RSS feed for content discovery */}
        <link rel="alternate" type="application/rss+xml" title="GatherGrove Club Management Resources" href="/feed.xml" />

        {/* LLM content discovery */}
        <link rel="alternate" type="text/plain" title="LLM Content" href="/llms.txt" />
        <link rel="alternate" type="text/plain" title="LLM Full Content" href="/llms-full.txt" />
        <link rel="alternate" type="text/plain" title="LLM Pricing Reference" href="/llms-pricing.txt" />
        <link rel="alternate" type="text/plain" title="LLM Glossary Reference" href="/llms-glossary.txt" />
        <link rel="alternate" type="text/plain" title="LLM How-to Reference" href="/llms-how-to.txt" />
        <link rel="alternate" type="text/plain" title="LLM Alternatives Reference" href="/llms-alternatives.txt" />
        <link rel="alternate" type="application/json" title="AI Data Reference" href="/ai-data.json" />

        {/* Resource hints for better loading */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        <link rel="prefetch" href="/register" />
        <link rel="prefetch" href="/login" />
        
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SkipLinks />
        <CriticalCSS />
        <StructuredData />
        <QueryProvider>
          <ThemeProvider>
            <GoogleOAuthProvider>
              <AuthProvider>
                <PostHogProvider>
                <ABTestProvider>
                  <AccessibilityProvider>
                    <KeyboardNavigation>
                      <ExitIntentProvider variant="lead-magnet" delay={30000}>
                        <main id="main-content">
                          {children}
                        </main>
                      </ExitIntentProvider>
                      <Toaster richColors />
                      
                      {/* PWA Features */}
                      <PWAInstallPrompt />
                      
                      {/* PWA Status in footer area */}
                      <div className="fixed bottom-4 right-4 z-40">
                        <PWAStatus compact />
                      </div>

                      <VentoraFeedbackWidget />
                    </KeyboardNavigation>
                  </AccessibilityProvider>
                </ABTestProvider>
                </PostHogProvider>
              </AuthProvider>
            </GoogleOAuthProvider>

            {/* Load analytics components after initial render */}
            <GoogleAnalytics />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
