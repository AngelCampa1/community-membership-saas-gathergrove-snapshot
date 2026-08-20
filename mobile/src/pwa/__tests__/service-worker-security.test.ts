import fs from 'fs';
import path from 'path';
import vm from 'vm';

class TestHeaders {
  private readonly values = new Map<string, string>();

  constructor(init?: Record<string, string> | TestHeaders) {
    if (init instanceof TestHeaders) {
      for (const [name, value] of init.entries()) {
        this.set(name, value);
      }
      return;
    }

    for (const [name, value] of Object.entries(init || {})) {
      this.set(name, value);
    }
  }

  get(name: string) {
    return this.values.get(name.toLowerCase()) || null;
  }

  has(name: string) {
    return this.values.has(name.toLowerCase());
  }

  set(name: string, value: string) {
    this.values.set(name.toLowerCase(), value);
  }

  entries() {
    return this.values.entries();
  }
}

function loadServiceWorkerContext(relativePath: string) {
  const source = fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
  const context = {
    console: { log: jest.fn(), error: jest.fn(), warn: jest.fn() },
    Request,
    Headers: TestHeaders,
    URL,
    Response,
    Blob,
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
    registration: {
      sync: { register: jest.fn() },
    },
  };

  vm.createContext(context);
  vm.runInContext(source, context);
  return context as typeof context & {
    shouldBypassCache: (request: Request) => boolean;
    normalizeNotificationUrl: (url?: string) => string;
    validateQueuedSyncAction?: (action: unknown) => RequestInit & { url: string } | null;
  };
}

describe('mobile service worker security controls', () => {
  it.each([
    ['public/service-worker.js'],
    ['src/pwa/service-worker.js'],
  ])('%s bypasses cache for sensitive requests', (serviceWorkerPath) => {
    const context = loadServiceWorkerContext(serviceWorkerPath);
    const requestFor = (url: string) => ({
      url,
      method: 'GET',
      credentials: 'same-origin',
      cache: 'default',
      headers: new TestHeaders(),
    } as unknown as Request);

    expect(context.shouldBypassCache(requestFor('https://gathergrove.club/api/v1/events'))).toBe(true);
    expect(context.shouldBypassCache(requestFor('https://gathergrove.club/payment/abc123'))).toBe(true);
    expect(context.shouldBypassCache(requestFor('https://gathergrove.club/static/js/bundle.js'))).toBe(false);

    expect(context.shouldBypassCache({
      url: 'https://gathergrove.club/static/js/bundle.js',
      method: 'GET',
      credentials: 'same-origin',
      cache: 'default',
      headers: { Authorization: 'Bearer token' },
    } as unknown as Request)).toBe(true);
  });

  it.each([
    ['public/service-worker.js'],
    ['src/pwa/service-worker.js'],
  ])('%s normalizes notification click URLs', (serviceWorkerPath) => {
    const context = loadServiceWorkerContext(serviceWorkerPath);

    expect(context.normalizeNotificationUrl('https://evil.example/login')).toBe('/');
    expect(context.normalizeNotificationUrl('/activate-account?token=secret')).toBe('/');
    expect(context.normalizeNotificationUrl('/resources')).toBe('/resources');
  });

  it('src/pwa/service-worker.js rejects cross-origin queued actions before replay', () => {
    const context = loadServiceWorkerContext('src/pwa/service-worker.js');

    expect(context.validateQueuedSyncAction?.({
      url: 'https://attacker.example/api/v1/members',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { name: 'Mallory' },
    })).toBeNull();

    const validAction = context.validateQueuedSyncAction?.({
      url: '/api/v1/clubs/1/members',
      method: 'POST',
      headers: new TestHeaders({
        'content-type': 'application/json',
        'x-injected-header': 'drop-me',
      }),
      body: { name: 'Alice' },
    });

    expect(validAction?.url).toBe('https://gathergrove.club/api/v1/clubs/1/members');
    expect((validAction?.headers as Headers).get('content-type')).toBe('application/json');
    expect((validAction?.headers as Headers).has('x-injected-header')).toBe(false);
  });

  it('../client/public/sw.js rejects cross-origin queued actions before replay', () => {
    const context = loadServiceWorkerContext('../client/public/sw.js');

    expect(context.validateQueuedSyncAction?.({
      url: 'https://attacker.example/api/v1/events',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { name: 'Bad event' },
    })).toBeNull();

    const validAction = context.validateQueuedSyncAction?.({
      url: '/api/v1/events',
      method: 'PATCH',
      headers: new TestHeaders({
        accept: 'application/json',
        'x-arbitrary': 'drop-me',
      }),
      body: JSON.stringify({ id: 1 }),
    });

    expect(validAction?.url).toBe('https://gathergrove.club/api/v1/events');
    expect((validAction?.headers as Headers).get('accept')).toBe('application/json');
    expect((validAction?.headers as Headers).has('x-arbitrary')).toBe(false);
  });
});
