module.exports = {
  ci: {
    collect: {
      startServerCommand: 'cd mobile && npm run web',
      startServerReadyPattern: 'Expo DevTools is running at',
      url: [
        'http://localhost:19006',
        'http://localhost:19006/login',
        'http://localhost:19006/dashboard',
        'http://localhost:19006/members',
        'http://localhost:19006/events'
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless --disable-gpu --disable-dev-shm-usage',
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        },
        emulatedFormFactor: 'desktop',
        internalDisableDeviceScreenEmulation: true
      }
    },
    assert: {
      assertions: {
        // PERFECT SCORES TARGET: 100/100/100/100
        'categories:performance': ['error', {minScore: 1.0}],
        'categories:accessibility': ['error', {minScore: 1.0}],
        'categories:best-practices': ['error', {minScore: 1.0}],
        'categories:seo': ['error', {minScore: 1.0}],
        'categories:pwa': ['warn', {minScore: 0.9}],
        
        // CORE WEB VITALS TARGETS
        'first-contentful-paint': ['error', {maxNumericValue: 1800}], // 1.8s
        'largest-contentful-paint': ['error', {maxNumericValue: 2500}], // 2.5s
        'first-input-delay': ['error', {maxNumericValue: 100}], // 100ms
        'cumulative-layout-shift': ['error', {maxNumericValue: 0.1}], // 0.1
        'speed-index': ['error', {maxNumericValue: 3400}], // 3.4s
        'total-blocking-time': ['warn', {maxNumericValue: 200}], // 200ms
        
        // PERFORMANCE AUDITS
        'unused-css-rules': ['warn', {maxNumericValue: 10000}], // 10KB
        'unused-javascript': ['warn', {maxNumericValue: 20000}], // 20KB
        'render-blocking-resources': ['error', {maxNumericValue: 0}],
        'uses-optimized-images': ['error', {minScore: 1.0}],
        'uses-webp-images': ['warn', {minScore: 0.8}],
        'uses-responsive-images': ['warn', {minScore: 0.8}],
        'offscreen-images': ['warn', {maxNumericValue: 10000}], // 10KB
        'uses-rel-preconnect': ['warn', {minScore: 0.8}],
        'uses-rel-preload': ['warn', {minScore: 0.8}],
        
        // ACCESSIBILITY AUDITS
        'color-contrast': ['error', {minScore: 1.0}],
        'heading-order': ['error', {minScore: 1.0}],
        'alt-text': ['error', {minScore: 1.0}],
        'aria-allowed-attr': ['error', {minScore: 1.0}],
        'aria-required-attr': ['error', {minScore: 1.0}],
        'aria-valid-attr-value': ['error', {minScore: 1.0}],
        'button-name': ['error', {minScore: 1.0}],
        'bypass': ['error', {minScore: 1.0}],
        'document-title': ['error', {minScore: 1.0}],
        'duplicate-id-aria': ['error', {minScore: 1.0}],
        'form-field-multiple-labels': ['error', {minScore: 1.0}],
        'frame-title': ['error', {minScore: 1.0}],
        'html-has-lang': ['error', {minScore: 1.0}],
        'html-lang-valid': ['error', {minScore: 1.0}],
        'image-alt': ['error', {minScore: 1.0}],
        'input-image-alt': ['error', {minScore: 1.0}],
        'label': ['error', {minScore: 1.0}],
        'link-name': ['error', {minScore: 1.0}],
        'list': ['error', {minScore: 1.0}],
        'listitem': ['error', {minScore: 1.0}],
        'meta-refresh': ['error', {minScore: 1.0}],
        'meta-viewport': ['error', {minScore: 1.0}],
        'object-alt': ['error', {minScore: 1.0}],
        'tabindex': ['error', {minScore: 1.0}],
        'td-headers-attr': ['error', {minScore: 1.0}],
        'th-has-data-cells': ['error', {minScore: 1.0}],
        'valid-lang': ['error', {minScore: 1.0}],
        
        // SEO AUDITS
        'meta-description': ['error', {minScore: 1.0}],
        'http-status-code': ['error', {minScore: 1.0}],
        'link-text': ['error', {minScore: 1.0}],
        'is-crawlable': ['error', {minScore: 1.0}],
        'robots-txt': ['warn', {minScore: 0.8}],
        'hreflang': ['warn', {minScore: 0.8}],
        'canonical': ['warn', {minScore: 0.8}],
        
        // BEST PRACTICES AUDITS
        'is-on-https': ['error', {minScore: 1.0}],
        'uses-http2': ['warn', {minScore: 0.8}],
        'no-vulnerable-libraries': ['error', {minScore: 1.0}],
        'external-anchors-use-rel-noopener': ['error', {minScore: 1.0}],
        'geolocation-on-start': ['error', {minScore: 1.0}],
        'notification-on-start': ['error', {minScore: 1.0}],
        'no-document-write': ['error', {minScore: 1.0}],
        'paste-preventing-inputs': ['error', {minScore: 1.0}],
        'image-aspect-ratio': ['warn', {minScore: 0.8}],
        'image-size-responsive': ['warn', {minScore: 0.8}]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};