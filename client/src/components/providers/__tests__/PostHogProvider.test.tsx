/**
 * Tests for PostHogProvider.tsx
 *
 * Mocking boundary (per project rules):
 *   - posthog-js         → external SDK
 *   - posthog-js/react   → external SDK
 *   - @/hooks/useAuth    → auth context (session boundary)
 *
 * Strategy for env-var isolation:
 *   `POSTHOG_KEY` is a module-level constant captured on first import.
 *   We obtain two variants of the component:
 *
 *   1. "No-key" variant — the top-level static import, which fires before any
 *      test setup, capturing `undefined` (setupTests.ts does not set the var).
 *
 *   2. "Key-present" variant — loaded once via `jest.isolateModules`, setting
 *      the env var first and re-mocking React with `jest.requireActual` so
 *      the component shares the same React singleton as `@testing-library/react`.
 *
 *   Both variants are loaded ONCE in a module-level `beforeAll`-equivalent
 *   block (using module-level variables populated via `isolateModules` at the
 *   top of the file, before any describe blocks run).
 */

import React from 'react';
import { render, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// External boundary mocks
// Factories must be self-contained (no outer-scope variable references)
// because Jest hoists jest.mock() calls above all other statements.
// ---------------------------------------------------------------------------
jest.mock('posthog-js', () => ({
  __esModule: true,
  default: {
    __loaded: true,
    identify: jest.fn(),
    reset: jest.fn(),
  },
}));

jest.mock('posthog-js/react', () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Typed references — obtained after mock registration, before tests run
// ---------------------------------------------------------------------------
import posthog from 'posthog-js';
import { useAuth } from '@/hooks/useAuth';

const mockIdentify = posthog.identify as jest.Mock;
const mockReset = posthog.reset as jest.Mock;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// ---------------------------------------------------------------------------
// "No-key" variant — static import captures POSTHOG_KEY === undefined
// (setupTests.ts does not define NEXT_PUBLIC_POSTHOG_KEY)
// ---------------------------------------------------------------------------
import { PostHogProvider as PostHogProviderNoKey } from '../PostHogProvider';

// ---------------------------------------------------------------------------
// "Key-present" variant — loaded once, shared by Suites A and C
// ---------------------------------------------------------------------------
let PostHogProviderWithKey!: React.FC<{ children: React.ReactNode }>;

{
  // Snapshot React singleton before anything resets the registry
  const ReactSingleton = jest.requireActual<typeof React>('react');

  process.env.NEXT_PUBLIC_POSTHOG_KEY = 'test-key';

  jest.isolateModules(() => {
    jest.mock('react', () => ReactSingleton);

    jest.mock('posthog-js', () => ({
      __esModule: true,
      default: { __loaded: true, identify: mockIdentify, reset: mockReset },
    }));

    jest.mock('posthog-js/react', () => ({
      PostHogProvider: ({ children }: { children: React.ReactNode }) => (
        <>{children}</>
      ),
    }));

    jest.mock('@/hooks/useAuth', () => ({
      useAuth: mockUseAuth,
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    PostHogProviderWithKey = (
      require('../PostHogProvider') as {
        PostHogProvider: React.FC<{ children: React.ReactNode }>;
      }
    ).PostHogProvider;
  });

  // Restore for other test files
  delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type MockUser = {
  userId: number;
  email: string;
  fullName: string;
  role: string;
  clubId: number;
  clubName: string;
  clubTier: string;
  isOnboardingCompleted: boolean;
};

function makeUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    userId: 42,
    email: 'test@test.com',
    fullName: 'Test User',
    role: 'Admin',
    clubId: 1,
    clubName: 'Test Club',
    clubTier: 'Grow',
    isOnboardingCompleted: true,
    ...overrides,
  };
}

function makeAuthContext(user: MockUser | null) {
  return {
    user,
    loading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    refreshSession: jest.fn(),
    completeOnboarding: jest.fn(),
    clearError: jest.fn(),
    retryLastOperation: jest.fn(),
  };
}

// ---------------------------------------------------------------------------
// Suite A — POSTHOG_KEY present
// ---------------------------------------------------------------------------
describe('PostHogProvider — POSTHOG_KEY present', () => {
  const PostHogProvider = PostHogProviderWithKey;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(makeAuthContext(null) as any);
  });

  // a) Children render when key is set
  it('renders children when POSTHOG_KEY is set', async () => {
    let getByText!: ReturnType<typeof render>['getByText'];

    await act(async () => {
      ({ getByText } = render(
        <PostHogProvider>
          <span>hello world</span>
        </PostHogProvider>
      ));
    });

    expect(getByText('hello world')).toBeInTheDocument();
  });

  // c) posthog.identify called when user is present
  it('calls posthog.identify with userId string and trait object when user is logged in', async () => {
    mockUseAuth.mockReturnValue(makeAuthContext(makeUser()) as any);

    await act(async () => {
      render(
        <PostHogProvider>
          <div>child</div>
        </PostHogProvider>
      );
    });

    expect(mockIdentify).toHaveBeenCalledTimes(1);
    expect(mockIdentify).toHaveBeenCalledWith('42', {
      email: 'test@test.com',
      name: 'Test User',
      role: 'Admin',
      club_id: 1,
      club_name: 'Test Club',
      club_tier: 'Grow',
    });
  });

  // d) posthog.reset called when user transitions to null
  it('calls posthog.reset when the user logs out', async () => {
    mockUseAuth.mockReturnValue(makeAuthContext(makeUser()) as any);

    let rerender!: ReturnType<typeof render>['rerender'];

    await act(async () => {
      ({ rerender } = render(
        <PostHogProvider>
          <div>child</div>
        </PostHogProvider>
      ));
    });

    mockUseAuth.mockReturnValue(makeAuthContext(null) as any);

    await act(async () => {
      rerender(
        <PostHogProvider>
          <div>child</div>
        </PostHogProvider>
      );
    });

    expect(mockReset).toHaveBeenCalled();
  });

  // Extra: posthog.reset NOT called when initial auth state has no user
  // (reset only fires on logout transition: identified → null)
  it('does NOT call posthog.reset when initial auth state has no user', async () => {
    await act(async () => {
      render(
        <PostHogProvider>
          <div />
        </PostHogProvider>
      );
    });

    expect(mockReset).not.toHaveBeenCalled();
    expect(mockIdentify).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Suite B — POSTHOG_KEY absent
// ---------------------------------------------------------------------------
describe('PostHogProvider — POSTHOG_KEY absent', () => {
  const PostHogProvider = PostHogProviderNoKey;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(makeAuthContext(null) as any);
  });

  // b) Children still render with no key (no crash)
  it('renders children without crashing when POSTHOG_KEY is missing', async () => {
    let getByText!: ReturnType<typeof render>['getByText'];

    await act(async () => {
      ({ getByText } = render(
        <PostHogProvider>
          <span>no key child</span>
        </PostHogProvider>
      ));
    });

    expect(getByText('no key child')).toBeInTheDocument();
  });

  // e) posthog.identify NOT called when key is missing, even with a user
  it('does not call posthog.identify when POSTHOG_KEY is missing, even when user is present', async () => {
    mockUseAuth.mockReturnValue(makeAuthContext(makeUser()) as any);

    await act(async () => {
      render(
        <PostHogProvider>
          <div>child</div>
        </PostHogProvider>
      );
    });

    expect(mockIdentify).not.toHaveBeenCalled();
  });

  // Extra: posthog.reset NOT called when key is missing and user is null
  it('does not call posthog.reset when POSTHOG_KEY is missing and user is null', async () => {
    await act(async () => {
      render(
        <PostHogProvider>
          <div>child</div>
        </PostHogProvider>
      );
    });

    expect(mockReset).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Suite C — PostHogIdentity trait mapping (key present, same module as Suite A)
// ---------------------------------------------------------------------------
describe('PostHogIdentity — identify trait mapping', () => {
  const PostHogProvider = PostHogProviderWithKey;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stringifies userId when passing it as the distinct_id', async () => {
    mockUseAuth.mockReturnValue(makeAuthContext(makeUser({ userId: 99 })) as any);

    await act(async () => {
      render(
        <PostHogProvider>
          <div />
        </PostHogProvider>
      );
    });

    expect(mockIdentify).toHaveBeenCalledWith('99', expect.any(Object));
  });

  it('maps user fields to the expected PostHog trait keys', async () => {
    const user = makeUser({
      email: 'member@club.com',
      fullName: 'Jane Doe',
      role: 'Member',
      clubId: 7,
      clubName: 'Book Club',
      clubTier: 'Standard',
    });
    mockUseAuth.mockReturnValue(makeAuthContext(user) as any);

    await act(async () => {
      render(
        <PostHogProvider>
          <div />
        </PostHogProvider>
      );
    });

    expect(mockIdentify).toHaveBeenCalledWith(String(user.userId), {
      email: 'member@club.com',
      name: 'Jane Doe',
      role: 'Member',
      club_id: 7,
      club_name: 'Book Club',
      club_tier: 'Standard',
    });
  });
});
