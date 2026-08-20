// Mock Next.js navigation hooks for testing
export const useRouter = jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
  pathname: '/test',
  query: {},
  asPath: '/test',
  route: '/test',
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
}));

export const useSearchParams = jest.fn(() => ({
  get: jest.fn(),
  getAll: jest.fn(),
  has: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  toString: jest.fn(() => ''),
}));

export const usePathname = jest.fn(() => '/test');

export const useParams = jest.fn(() => ({}));

export const notFound = jest.fn();