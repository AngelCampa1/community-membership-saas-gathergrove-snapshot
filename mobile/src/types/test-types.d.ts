/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Test Type Definitions
 * Enhanced types for better testing experience and reduced 'any' usage
 */

// Mock ServiceWorker types for PWA tests
export interface MockServiceWorkerRegistration {
  showNotification: jest.Mock;
  sync: { register: jest.Mock };
  pushManager: {
    subscribe: jest.Mock;
    getSubscription: jest.Mock;
  };
  active?: {
    postMessage: jest.Mock;
  };
  waiting?: {
    postMessage: jest.Mock;
  };
  installing?: any;
  addEventListener: jest.Mock;
}

export interface MockServiceWorker {
  register: jest.Mock;
  ready: Promise<MockServiceWorkerRegistration>;
  addEventListener: jest.Mock;
  controller: any;
}

// SignalR connection mock types
export interface MockSignalRConnection {
  start: jest.Mock<Promise<void>>;
  stop: jest.Mock<Promise<void>>;
  invoke: jest.Mock<Promise<any>>;
  on: jest.Mock<void>;
  off: jest.Mock<void>;
  onclose: jest.Mock<void>;
  onreconnecting: jest.Mock<void>;
  onreconnected: jest.Mock<void>;
  state: 'Connected' | 'Disconnected' | 'Connecting' | 'Disconnecting';
}

// Enhanced auth service test types
export interface MockAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiryTime: number;
}

export interface MockAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export interface MockAxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: any;
}

export interface MockAxiosError {
  response?: MockAxiosResponse;
  request?: any;
  message: string;
  config: any;
  code?: string;
}

// PWA specific mock types
export interface MockCacheStorage {
  open: jest.Mock;
  match: jest.Mock;
  keys: jest.Mock;
  delete: jest.Mock;
}

export interface MockNavigator {
  serviceWorker: MockServiceWorker;
  onLine: boolean;
  connection?: {
    effectiveType: string;
  };
  permissions?: {
    query: jest.Mock;
  };
}

export interface MockNotificationAPI {
  permission: NotificationPermission;
  requestPermission: jest.Mock;
}

// Testing utility types
export interface TestRenderOptions {
  wrapper?: React.ComponentType<any>;
  queries?: any;
}

export interface TestScreenProps {
  navigation?: any;
  route?: any;
}

// Common test data interfaces
export interface TestEvent {
  id: string;
  title: string;
  date: string;
  attendeeCount: number;
}

export interface TestMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  membershipStatus: string;
}

// Mock intersection observer
export interface MockIntersectionObserver {
  observe: jest.Mock;
  unobserve: jest.Mock;
  disconnect: jest.Mock;
}

// Mock message channel for service worker communication
export interface MockMessageChannel {
  port1: {
    onmessage: ((event: MessageEvent) => void) | null;
    postMessage: jest.Mock;
  };
  port2: MessagePort;
}