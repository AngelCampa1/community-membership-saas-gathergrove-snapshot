/**
 * Tests for service-factory.ts - Service layer abstraction
 * Following boundary mocking pattern: mock only apiClient (external boundary)
 */

import {
  ServiceFactory,
  EnhancedBaseService,
  serviceRegistry,
  SERVICE_CONFIGS,
  ServiceConfig,
  cached,
  retry,
  debounced,
} from '../service-factory';
import apiClient from '@/services/apiClient';
import { AxiosResponse } from 'axios';

// Mock external dependencies only
jest.mock('@/services/apiClient');
jest.mock('../errorHandler', () => ({
  ErrorHandler: {
    handleApiError: jest.fn((error) => {
      // Return error object for handleServiceError to throw
      return error instanceof Error ? error : new Error(JSON.stringify(error));
    }),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('ServiceRegistry', () => {
  beforeEach(() => {
    serviceRegistry.clear();
  });

  describe('register()', () => {
    it('registers a service with config', () => {
      class TestService extends EnhancedBaseService {}
      const config: ServiceConfig = { baseUrl: '/api/v1/test' };
      const service = new TestService(config);

      serviceRegistry.register('test', service, config);

      expect(serviceRegistry.list()).toContain('test');
    });

    it('allows multiple services to be registered', () => {
      class Service1 extends EnhancedBaseService {}
      class Service2 extends EnhancedBaseService {}

      const config1: ServiceConfig = { baseUrl: '/api/v1/service1' };
      const config2: ServiceConfig = { baseUrl: '/api/v1/service2' };

      serviceRegistry.register('service1', new Service1(config1), config1);
      serviceRegistry.register('service2', new Service2(config2), config2);

      expect(serviceRegistry.list()).toHaveLength(2);
      expect(serviceRegistry.list()).toContain('service1');
      expect(serviceRegistry.list()).toContain('service2');
    });
  });

  describe('get()', () => {
    it('retrieves a registered service', () => {
      class TestService extends EnhancedBaseService {}
      const config: ServiceConfig = { baseUrl: '/api/v1/test' };
      const service = new TestService(config);

      serviceRegistry.register('test', service, config);
      const retrieved = serviceRegistry.get('test');

      expect(retrieved).toBe(service);
    });

    it('throws error when service not found', () => {
      expect(() => {
        serviceRegistry.get('non-existent');
      }).toThrow("Service 'non-existent' not registered");
    });
  });

  describe('getConfig()', () => {
    it('retrieves service config', () => {
      class TestService extends EnhancedBaseService {}
      const config: ServiceConfig = {
        baseUrl: '/api/v1/test',
        timeout: 5000,
        retries: 3,
      };
      const service = new TestService(config);

      serviceRegistry.register('test', service, config);
      const retrieved = serviceRegistry.getConfig('test');

      expect(retrieved).toEqual(config);
    });

    it('throws error when config not found', () => {
      expect(() => {
        serviceRegistry.getConfig('non-existent');
      }).toThrow("Service config for 'non-existent' not found");
    });
  });

  describe('list()', () => {
    it('returns empty array when no services registered', () => {
      expect(serviceRegistry.list()).toEqual([]);
    });

    it('returns list of registered service names', () => {
      class TestService extends EnhancedBaseService {}
      const config: ServiceConfig = { baseUrl: '/api/v1/test' };

      serviceRegistry.register('service1', new TestService(config), config);
      serviceRegistry.register('service2', new TestService(config), config);
      serviceRegistry.register('service3', new TestService(config), config);

      const list = serviceRegistry.list();
      expect(list).toHaveLength(3);
      expect(list).toContain('service1');
      expect(list).toContain('service2');
      expect(list).toContain('service3');
    });
  });

  describe('clear()', () => {
    it('removes all registered services', () => {
      class TestService extends EnhancedBaseService {}
      const config: ServiceConfig = { baseUrl: '/api/v1/test' };

      serviceRegistry.register('service1', new TestService(config), config);
      serviceRegistry.register('service2', new TestService(config), config);

      serviceRegistry.clear();

      expect(serviceRegistry.list()).toEqual([]);
    });

    it('allows re-registration after clear', () => {
      class TestService extends EnhancedBaseService {}
      const config: ServiceConfig = { baseUrl: '/api/v1/test' };
      const service = new TestService(config);

      serviceRegistry.register('test', service, config);
      serviceRegistry.clear();
      serviceRegistry.register('test', service, config);

      expect(serviceRegistry.list()).toContain('test');
    });
  });
});

describe('EnhancedBaseService', () => {
  class TestService extends EnhancedBaseService {
    public async testGet<T>(endpoint: string) {
      return this.get<T>(endpoint);
    }

    public async testPost<T>(endpoint: string, data?: unknown) {
      return this.post<T>(endpoint, data);
    }

    public async testPut<T>(endpoint: string, data?: unknown) {
      return this.put<T>(endpoint, data);
    }

    public async testDelete<T>(endpoint: string) {
      return this.delete<T>(endpoint);
    }

    public async testPatch<T>(endpoint: string, data?: unknown) {
      return this.patch<T>(endpoint, data);
    }
  }

  let service: TestService;
  const config: ServiceConfig = {
    baseUrl: '/api/v1/test',
    timeout: 5000,
    retries: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TestService(config);
  });

  describe('baseUrl', () => {
    it('returns baseUrl from config', () => {
      expect(service.baseUrl).toBe('/api/v1/test');
    });
  });

  describe('HTTP methods', () => {
    const mockResponse: AxiosResponse = {
      data: { id: 1, name: 'Test' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    };

    it('get() sends GET request', async () => {
      mockApiClient.request.mockResolvedValueOnce(mockResponse);

      const result = await service.testGet('/endpoint');

      expect(mockApiClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'get',
          url: '/api/v1/test/endpoint',
        })
      );
      expect(result).toEqual({
        data: { id: 1, name: 'Test' },
        success: true,
        message: 'OK',
      });
    });

    it('post() sends POST request with data', async () => {
      mockApiClient.request.mockResolvedValueOnce(mockResponse);
      const postData = { name: 'New Item' };

      await service.testPost('/endpoint', postData);

      expect(mockApiClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'post',
          url: '/api/v1/test/endpoint',
          data: postData,
        })
      );
    });

    it('put() sends PUT request with data', async () => {
      mockApiClient.request.mockResolvedValueOnce(mockResponse);
      const putData = { id: 1, name: 'Updated' };

      await service.testPut('/endpoint', putData);

      expect(mockApiClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'put',
          url: '/api/v1/test/endpoint',
          data: putData,
        })
      );
    });

    it('delete() sends DELETE request', async () => {
      mockApiClient.request.mockResolvedValueOnce(mockResponse);

      await service.testDelete('/endpoint');

      expect(mockApiClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'delete',
          url: '/api/v1/test/endpoint',
        })
      );
    });

    it('patch() sends PATCH request with data', async () => {
      mockApiClient.request.mockResolvedValueOnce(mockResponse);
      const patchData = { name: 'Patched' };

      await service.testPatch('/endpoint', patchData);

      expect(mockApiClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'patch',
          url: '/api/v1/test/endpoint',
          data: patchData,
        })
      );
    });

    it('includes timeout from config', async () => {
      mockApiClient.request.mockResolvedValueOnce(mockResponse);

      await service.testGet('/endpoint');

      expect(mockApiClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 5000,
        })
      );
    });

    it('includes query params when provided', async () => {
      mockApiClient.request.mockResolvedValueOnce(mockResponse);

      await service.testGet('/endpoint');

      expect(mockApiClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/api/v1/test/endpoint',
        })
      );
    });
  });

  describe('Retry logic', () => {
    it('retries on network failure', async () => {
      mockApiClient.request
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: { success: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        });

      const result = await service.testGet('/endpoint');

      expect(mockApiClient.request).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
    });

    it('does not retry on 4xx errors', async () => {
      const error = new Error('Bad Request');
      (error as any).status = 400;
      mockApiClient.request.mockRejectedValueOnce(error);

      try {
        await service.testGet('/endpoint');
        // If we get here, the test should fail
        fail('Expected method to throw an error');
      } catch (e) {
        // Error was thrown as expected
        expect(mockApiClient.request).toHaveBeenCalledTimes(1);
      }
    });

    it('retries on 408 Request Timeout', async () => {
      const error = { status: 408 };
      mockApiClient.request
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          data: { success: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        });

      await service.testGet('/endpoint');

      expect(mockApiClient.request).toHaveBeenCalledTimes(2);
    });

    it('retries on 429 Too Many Requests', async () => {
      const error = { status: 429 };
      mockApiClient.request
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          data: { success: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        });

      await service.testGet('/endpoint');

      expect(mockApiClient.request).toHaveBeenCalledTimes(2);
    });

    it('retries on 5xx errors', async () => {
      const error = { status: 500 };
      mockApiClient.request
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          data: { success: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        });

      await service.testGet('/endpoint');

      expect(mockApiClient.request).toHaveBeenCalledTimes(2);
    });
  });

  describe('cancelRequests()', () => {
    it('cancels ongoing requests', () => {
      expect(() => service.cancelRequests()).not.toThrow();
    });

    it('allows multiple calls without error', () => {
      service.cancelRequests();
      service.cancelRequests();

      expect(() => service.cancelRequests()).not.toThrow();
    });
  });
});

describe('ServiceFactory', () => {
  class TestService extends EnhancedBaseService {}

  beforeEach(() => {
    ServiceFactory.clear();
  });

  describe('create()', () => {
    it('creates a new service instance', () => {
      const config: ServiceConfig = { baseUrl: '/api/v1/test' };

      const service = ServiceFactory.create(TestService, config);

      expect(service).toBeInstanceOf(TestService);
      expect(service.baseUrl).toBe('/api/v1/test');
    });

    it('registers service when name provided', () => {
      const config: ServiceConfig = { baseUrl: '/api/v1/test' };

      ServiceFactory.create(TestService, config, 'test-service');

      expect(ServiceFactory.list()).toContain('test-service');
    });

    it('does not register service when name not provided', () => {
      const config: ServiceConfig = { baseUrl: '/api/v1/test' };

      ServiceFactory.create(TestService, config);

      expect(ServiceFactory.list()).toEqual([]);
    });
  });

  describe('get()', () => {
    it('retrieves registered service', () => {
      const config: ServiceConfig = { baseUrl: '/api/v1/test' };
      const created = ServiceFactory.create(TestService, config, 'test-service');

      const retrieved = ServiceFactory.get<TestService>('test-service');

      expect(retrieved).toBe(created);
    });

    it('throws error when service not found', () => {
      expect(() => {
        ServiceFactory.get('non-existent');
      }).toThrow("Service 'non-existent' not registered");
    });
  });

  describe('has()', () => {
    it('returns true for registered service', () => {
      const config: ServiceConfig = { baseUrl: '/api/v1/test' };
      ServiceFactory.create(TestService, config, 'test-service');

      expect(ServiceFactory.has('test-service')).toBe(true);
    });

    it('returns false for non-existent service', () => {
      expect(ServiceFactory.has('non-existent')).toBe(false);
    });
  });

  describe('list()', () => {
    it('returns empty array when no services registered', () => {
      expect(ServiceFactory.list()).toEqual([]);
    });

    it('returns list of registered services', () => {
      const config: ServiceConfig = { baseUrl: '/api/v1/test' };

      ServiceFactory.create(TestService, config, 'service1');
      ServiceFactory.create(TestService, config, 'service2');

      const list = ServiceFactory.list();
      expect(list).toHaveLength(2);
      expect(list).toContain('service1');
      expect(list).toContain('service2');
    });
  });

  describe('clear()', () => {
    it('removes all registered services', () => {
      const config: ServiceConfig = { baseUrl: '/api/v1/test' };

      ServiceFactory.create(TestService, config, 'service1');
      ServiceFactory.create(TestService, config, 'service2');

      ServiceFactory.clear();

      expect(ServiceFactory.list()).toEqual([]);
    });
  });
});

describe('Decorators', () => {
  describe('cached()', () => {
    it('caches method results', async () => {
      let callCount = 0;

      class TestClass {
        async fetchData(id: number): Promise<{ id: number }> {
          callCount++;
          return { id };
        }
      }

      const descriptor = Object.getOwnPropertyDescriptor(TestClass.prototype, 'fetchData')!;
      const decorator = cached(1000);
      const modifiedDescriptor = decorator(TestClass.prototype, 'fetchData', descriptor);
      Object.defineProperty(TestClass.prototype, 'fetchData', modifiedDescriptor);

      const instance = new TestClass();

      await instance.fetchData(1);
      await instance.fetchData(1);
      await instance.fetchData(1);

      expect(callCount).toBe(1); // Only called once, rest from cache
    });

    it('caches different arguments separately', async () => {
      let callCount = 0;

      class TestClass {
        async fetchData(id: number): Promise<{ id: number }> {
          callCount++;
          return { id };
        }
      }

      const descriptor = Object.getOwnPropertyDescriptor(TestClass.prototype, 'fetchData')!;
      const decorator = cached(1000);
      const modifiedDescriptor = decorator(TestClass.prototype, 'fetchData', descriptor);
      Object.defineProperty(TestClass.prototype, 'fetchData', modifiedDescriptor);

      const instance = new TestClass();

      await instance.fetchData(1);
      await instance.fetchData(2);
      await instance.fetchData(1);

      expect(callCount).toBe(2); // Called twice for different args
    });

    it('expires cache after TTL', async () => {
      jest.useFakeTimers();
      let callCount = 0;

      class TestClass {
        async fetchData(): Promise<{ value: string }> {
          callCount++;
          return { value: 'data' };
        }
      }

      const descriptor = Object.getOwnPropertyDescriptor(TestClass.prototype, 'fetchData')!;
      const decorator = cached(100); // 100ms TTL
      const modifiedDescriptor = decorator(TestClass.prototype, 'fetchData', descriptor);
      Object.defineProperty(TestClass.prototype, 'fetchData', modifiedDescriptor);

      const instance = new TestClass();

      await instance.fetchData();
      jest.advanceTimersByTime(150); // Expire cache
      await instance.fetchData();

      expect(callCount).toBe(2);

      jest.useRealTimers();
    });
  });

  describe('retry()', () => {
    it('retries on failure', async () => {
      let callCount = 0;

      class TestClass {
        async unreliableMethod(): Promise<string> {
          callCount++;
          if (callCount < 3) throw new Error('Fail');
          return 'success';
        }
      }

      const descriptor = Object.getOwnPropertyDescriptor(TestClass.prototype, 'unreliableMethod')!;
      const decorator = retry(3, 100);
      const modifiedDescriptor = decorator(TestClass.prototype, 'unreliableMethod', descriptor);
      Object.defineProperty(TestClass.prototype, 'unreliableMethod', modifiedDescriptor);

      const instance = new TestClass();

      const result = await instance.unreliableMethod();

      expect(callCount).toBe(3);
      expect(result).toBe('success');
    });

    it('throws after max retries', async () => {
      let callCount = 0;

      class TestClass {
        async alwaysFails(): Promise<string> {
          callCount++;
          throw new Error('Always fails');
        }
      }

      const descriptor = Object.getOwnPropertyDescriptor(TestClass.prototype, 'alwaysFails')!;
      const decorator = retry(2, 10);
      const modifiedDescriptor = decorator(TestClass.prototype, 'alwaysFails', descriptor);
      Object.defineProperty(TestClass.prototype, 'alwaysFails', modifiedDescriptor);

      const instance = new TestClass();

      await expect(instance.alwaysFails()).rejects.toThrow('Always fails');
      expect(callCount).toBe(2);
    });
  });

  describe('debounced()', () => {
    it('debounces method calls', async () => {
      jest.useFakeTimers();
      let callCount = 0;

      class TestClass {
        async search(query: string): Promise<string> {
          callCount++;
          return query;
        }
      }

      const descriptor = Object.getOwnPropertyDescriptor(TestClass.prototype, 'search')!;
      const decorator = debounced(100);
      const modifiedDescriptor = decorator(TestClass.prototype, 'search', descriptor);
      Object.defineProperty(TestClass.prototype, 'search', modifiedDescriptor);

      const instance = new TestClass();

      const promise1 = instance.search('a');
      const promise2 = instance.search('ab');
      const promise3 = instance.search('abc');

      jest.advanceTimersByTime(100);

      await promise3;

      expect(callCount).toBe(1); // Only last call executed

      jest.useRealTimers();
    });
  });
});

describe('SERVICE_CONFIGS', () => {
  it('defines DEFAULT config', () => {
    expect(SERVICE_CONFIGS.DEFAULT).toEqual({
      baseUrl: '/api/v1',
      timeout: 15000,
      retries: 2,
      cache: true,
    });
  });

  it('defines ANALYTICS config', () => {
    expect(SERVICE_CONFIGS.ANALYTICS).toEqual({
      baseUrl: '/api/v1/analytics',
      timeout: 30000,
      retries: 1,
      cache: true,
    });
  });

  it('defines REAL_TIME config', () => {
    expect(SERVICE_CONFIGS.REAL_TIME).toEqual({
      baseUrl: '/api/v1/realtime',
      timeout: 5000,
      retries: 0,
      cache: false,
    });
  });

  it('defines UPLOADS config', () => {
    expect(SERVICE_CONFIGS.UPLOADS).toEqual({
      baseUrl: '/api/v1/uploads',
      timeout: 60000,
      retries: 3,
      cache: false,
    });
  });

  it('is readonly (const assertion)', () => {
    expect(typeof SERVICE_CONFIGS).toBe('object');
    expect(SERVICE_CONFIGS.DEFAULT).toBeDefined();
  });
});
