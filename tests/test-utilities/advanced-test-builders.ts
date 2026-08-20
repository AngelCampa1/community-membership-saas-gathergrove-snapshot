/**
 * 🧪 ADVANCED TEST BUILDERS - TDD-First Quality Framework
 * Production-ready test data factories and utilities
 */

import { faker } from '@faker-js/faker';
import { EventResponse, User, LoginResponse } from '../../mobile/src/types';

export interface TestDataOptions {
  seed?: number;
  locale?: string;
}

export class TestDataBuilder {
  private static instance: TestDataBuilder;
  
  constructor(options: TestDataOptions = {}) {
    if (options.seed) {
      faker.seed(options.seed);
    }
    if (options.locale) {
      faker.setLocale(options.locale);
    }
  }

  static getInstance(options?: TestDataOptions): TestDataBuilder {
    if (!TestDataBuilder.instance) {
      TestDataBuilder.instance = new TestDataBuilder(options);
    }
    return TestDataBuilder.instance;
  }

  /**
   * User Test Data Factory
   */
  static createUser(overrides: Partial<User> = {}): User {
    return {
      id: faker.datatype.number({ min: 1, max: 10000 }),
      email: faker.internet.email().toLowerCase(),
      fullName: faker.name.findName(),
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      role: faker.helpers.arrayElement(['Admin', 'Member', 'Officer']),
      clubId: faker.datatype.number({ min: 1, max: 100 }),
      clubTier: faker.helpers.arrayElement(['Seed', 'Grow', 'Bloom', 'Harvest']),
      isOnboardingCompleted: faker.datatype.boolean(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      ...overrides
    };
  }

  /**
   * Event Test Data Factory
   */
  static createEvent(overrides: Partial<EventResponse> = {}): EventResponse {
    const baseDate = faker.date.future();
    return {
      id: faker.datatype.number({ min: 1, max: 10000 }),
      clubId: faker.datatype.number({ min: 1, max: 100 }),
      name: faker.lorem.words({ min: 2, max: 5 }),
      eventDateTime: baseDate.toISOString(),
      location: `${faker.address.streetAddress()}, ${faker.address.city()}`,
      description: `<p>${faker.lorem.paragraphs(2, '\n\n')}</p>`,
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      attendeeCount: faker.datatype.number({ min: 0, max: 100 }),
      totalRsvpCount: faker.datatype.number({ min: 0, max: 150 }),
      maxAttendees: faker.datatype.number({ min: 20, max: 200 }),
      isActive: true,
      ...overrides
    };
  }

  /**
   * Login Response Test Data Factory
   */
  static createLoginResponse(overrides: Partial<LoginResponse> = {}): LoginResponse {
    return {
      token: TestDataBuilder.createJWTToken(),
      userId: faker.datatype.number({ min: 1, max: 10000 }),
      fullName: faker.name.findName(),
      email: faker.internet.email().toLowerCase(),
      role: faker.helpers.arrayElement(['Admin', 'Member', 'Officer']),
      clubId: faker.datatype.number({ min: 1, max: 100 }),
      clubTier: faker.helpers.arrayElement(['Seed', 'Grow', 'Bloom', 'Harvest']),
      isOnboardingCompleted: faker.datatype.boolean(),
      message: 'Login successful',
      ...overrides
    };
  }

  /**
   * JWT Token Generator for Testing
   */
  static createJWTToken(payload: Record<string, any> = {}): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const defaultPayload = {
      userId: faker.datatype.number({ min: 1, max: 10000 }),
      email: faker.internet.email(),
      role: 'Member',
      clubId: faker.datatype.number({ min: 1, max: 100 }),
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
      iat: Math.floor(Date.now() / 1000),
      ...payload
    };
    const encodedPayload = btoa(JSON.stringify(defaultPayload));
    const signature = btoa('test-signature');
    
    return `${header}.${encodedPayload}.${signature}`;
  }

  /**
   * API Error Response Factory
   */
  static createAPIError(
    status: number = 500,
    message: string = 'Internal Server Error',
    code?: string
  ) {
    const error = new Error(message) as any;
    error.response = {
      status,
      data: {
        error: message,
        code,
        timestamp: new Date().toISOString()
      }
    };
    return error;
  }

  /**
   * Edge Case Data Generators
   */
  static createEdgeCaseData() {
    return {
      emptyString: '',
      nullValue: null,
      undefinedValue: undefined,
      longString: faker.lorem.words(1000).substring(0, 255), // Max typical DB varchar
      specialCharacters: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      unicodeString: '🎉🌟✨🎯🚀💡🔥⚡🌈🦄',
      sqlInjection: "'; DROP TABLE users; --",
      xssPayload: '<script>alert("XSS")</script>',
      largeNumber: Number.MAX_SAFE_INTEGER,
      negativeNumber: -999999,
      floatNumber: 123.456789,
      booleanTrue: true,
      booleanFalse: false,
      arrayEmpty: [],
      arrayLarge: Array(1000).fill(null).map(() => faker.datatype.number()),
      objectEmpty: {},
      objectNested: {
        level1: {
          level2: {
            level3: faker.lorem.word()
          }
        }
      }
    };
  }

  /**
   * Performance Test Data Generator
   */
  static createPerformanceTestData(count: number = 1000) {
    return {
      users: Array(count).fill(null).map(() => TestDataBuilder.createUser()),
      events: Array(count).fill(null).map(() => TestDataBuilder.createEvent()),
      largePayload: {
        data: Array(count).fill(null).map(() => ({
          id: faker.datatype.uuid(),
          content: faker.lorem.paragraphs(5),
          metadata: {
            timestamp: faker.date.recent().toISOString(),
            tags: Array(10).fill(null).map(() => faker.lorem.word())
          }
        }))
      }
    };
  }

  /**
   * Concurrent Request Simulator
   */
  static createConcurrentRequests<T>(
    requestFn: () => Promise<T>,
    count: number = 10
  ): Promise<PromiseSettledResult<T>[]> {
    const requests = Array(count).fill(null).map(() => requestFn());
    return Promise.allSettled(requests);
  }

  /**
   * Time-based Test Scenarios
   */
  static createTimeScenarios() {
    const now = new Date();
    return {
      past: {
        yesterday: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        lastWeek: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        lastMonth: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        lastYear: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      },
      future: {
        tomorrow: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        nextWeek: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        nextMonth: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        nextYear: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
      },
      boundaries: {
        startOfDay: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        endOfDay: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
        startOfMonth: new Date(now.getFullYear(), now.getMonth(), 1),
        endOfMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        startOfYear: new Date(now.getFullYear(), 0, 1),
        endOfYear: new Date(now.getFullYear(), 11, 31)
      }
    };
  }

  /**
   * Reset faker seed for consistent test data
   */
  static reset(seed?: number) {
    if (seed) {
      faker.seed(seed);
    } else {
      faker.seed(12345); // Default consistent seed
    }
  }
}

/**
 * Smart Mock Factory for Services and APIs
 */
export class MockFactory {
  /**
   * Create a fully mocked service with intelligent defaults
   */
  static createServiceMock<T extends Record<string, any>>(
    service: T,
    defaultResponses: Partial<Record<keyof T, any>> = {}
  ): jest.Mocked<T> {
    const mock = {} as jest.Mocked<T>;
    
    Object.getOwnPropertyNames(service).forEach(prop => {
      if (typeof service[prop] === 'function') {
        mock[prop] = jest.fn();
        
        // Set default response if provided
        if (defaultResponses[prop]) {
          mock[prop].mockResolvedValue(defaultResponses[prop]);
        }
      }
    });
    
    return mock;
  }

  /**
   * Create HTTP response mock
   */
  static createAPIResponse<T>(
    data: T,
    status: number = 200,
    statusText: string = 'OK'
  ) {
    return {
      data,
      status,
      statusText,
      headers: {
        'content-type': 'application/json',
        'x-request-id': faker.datatype.uuid()
      },
      config: {
        url: faker.internet.url(),
        method: 'GET',
        headers: {}
      }
    };
  }

  /**
   * Create mock timer utilities
   */
  static createTimerMock() {
    jest.useFakeTimers();
    
    return {
      advanceTime: (ms: number) => jest.advanceTimersByTime(ms),
      runAllTimers: () => jest.runAllTimers(),
      runOnlyPendingTimers: () => jest.runOnlyPendingTimers(),
      clearAllTimers: () => jest.clearAllTimers(),
      restore: () => jest.useRealTimers()
    };
  }

  /**
   * Create performance monitoring mock
   */
  static createPerformanceMock() {
    const startTime = performance.now();
    
    return {
      start: startTime,
      measure: () => performance.now() - startTime,
      expectUnder: (threshold: number) => {
        const duration = performance.now() - startTime;
        expect(duration).toBeLessThan(threshold);
        return duration;
      }
    };
  }
}

/**
 * Test Environment Setup Utilities
 */
export class TestEnvironment {
  /**
   * Setup comprehensive test environment
   */
  static setup(options: { 
    mockConsole?: boolean,
    seed?: number,
    timeout?: number 
  } = {}) {
    const originalConsole = { ...console };
    
    if (options.mockConsole) {
      console.error = jest.fn();
      console.warn = jest.fn();
      console.log = jest.fn();
    }
    
    if (options.seed) {
      TestDataBuilder.reset(options.seed);
    }
    
    if (options.timeout) {
      jest.setTimeout(options.timeout);
    }
    
    return {
      restore: () => {
        if (options.mockConsole) {
          Object.assign(console, originalConsole);
        }
        jest.useRealTimers();
      }
    };
  }

  /**
   * Create isolated test context
   */
  static createContext() {
    const context = {
      mocks: new Map(),
      spies: new Map(),
      timers: MockFactory.createTimerMock(),
      performance: MockFactory.createPerformanceMock()
    };

    return {
      ...context,
      cleanup: () => {
        context.mocks.clear();
        context.spies.clear();
        context.timers.restore();
        jest.clearAllMocks();
        jest.restoreAllMocks();
      }
    };
  }
}

export default TestDataBuilder;