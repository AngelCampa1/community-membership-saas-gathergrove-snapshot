import fs from 'fs';
import path from 'path';
import vm from 'vm';

function loadServiceWorkerContext() {
  const source = fs.readFileSync(path.join(process.cwd(), 'public', 'sw.js'), 'utf8');
  const context = {
    console: { log: jest.fn(), error: jest.fn(), warn: jest.fn() },
    Request,
    URL,
    Response,
    self: {
      location: { origin: 'https://gathergrove.club' },
      addEventListener: jest.fn(),
      registration: { showNotification: jest.fn() },
      skipWaiting: jest.fn(),
      clients: { claim: jest.fn() },
    },
    caches: {
      open: jest.fn(),
      keys: jest.fn(),
      match: jest.fn(),
      delete: jest.fn(),
    },
    clients: {
      matchAll: jest.fn(),
      openWindow: jest.fn(),
    },
    indexedDB: {},
  };

  vm.createContext(context);
  vm.runInContext(source, context);
  return context as typeof context & {
    shouldBypassCache: (request: Request) => boolean;
    normalizeNotificationUrl: (url?: string) => string;
  };
}

describe('client service worker security controls', () => {
  it('bypasses cache for authenticated API and tokenized requests', () => {
    const context = loadServiceWorkerContext();

    expect(context.shouldBypassCache(new Request('https://gathergrove.club/api/v1/members'))).toBe(true);
    expect(context.shouldBypassCache(new Request('https://gathergrove.club/admin/events?token=secret'))).toBe(true);
    expect(context.shouldBypassCache(new Request('https://gathergrove.club/_next/static/app.js'))).toBe(false);
  });

  it('normalizes notification click URLs to safe same-origin non-sensitive paths', () => {
    const context = loadServiceWorkerContext();

    expect(context.normalizeNotificationUrl('https://evil.example/phish')).toBe('/');
    expect(context.normalizeNotificationUrl('/reset-password?token=secret')).toBe('/');
    expect(context.normalizeNotificationUrl('/app/dashboard')).toBe('/');
    expect(context.normalizeNotificationUrl('/resources')).toBe('/resources');
  });
});
