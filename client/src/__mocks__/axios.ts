/**
 * Axios Mock for Client Tests
 *
 * IMPORTANT: This mock now supports MSW (Mock Service Worker) for boundary mocking.
 *
 * - When OFFLINE_TESTS=true: Uses mocked responses (for legacy tests)
 * - When OFFLINE_TESTS is NOT set: Passes through to real axios, allowing MSW to intercept
 *
 * This follows the boundary mocking principle: HTTP mocking should happen at the HTTP layer
 * via MSW, not by mocking axios itself.
 */

export interface MockAxiosInstance {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
  patch: jest.Mock;
  create: jest.Mock;
  interceptors: {
    request: {
      use: jest.Mock;
      eject: jest.Mock;
    };
    response: {
      use: jest.Mock;
      eject: jest.Mock;
    };
  };
  defaults: {
    baseURL: string;
    timeout: number;
    headers: Record<string, string>;
    withCredentials?: boolean;
  };
}

// Import real axios for pass-through mode
const realAxios = jest.requireActual('axios');

// Custom adapter that uses global fetch (which is mocked by our MSW setup)
const fetchAdapter = async (config: any) => {
  const url = config.baseURL ? `${config.baseURL}${config.url || ''}` : config.url;
  const fullUrl = new URL(url, config.url?.startsWith('http') ? undefined : 'http://localhost:8050');

  // Add query params
  if (config.params) {
    Object.keys(config.params).forEach(key => {
      fullUrl.searchParams.append(key, config.params[key]);
    });
  }

  try {
    const response = await fetch(fullUrl.toString(), {
      method: config.method?.toUpperCase() || 'GET',
      headers: config.headers || {},
      body: config.data ? JSON.stringify(config.data) : undefined,
    });

    const data = response.headers.get('content-type')?.includes('application/json')
      ? await response.json()
      : await response.text();

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      config,
      request: {},
    };
  } catch (error) {
    const axiosError: any = new Error(error instanceof Error ? error.message : 'Network Error');
    axiosError.config = config;
    axiosError.isAxiosError = true;
    throw axiosError;
  }
};

const mockResponse = (data: any, status: number = 200) => ({
  data,
  status,
  statusText: status < 400 ? 'OK' : 'Error',
  headers: {},
  config: {} as any,
});

const mockError = (status: number, message: string, code?: string) => {
  const error: any = new Error(message);
  error.response = {
    status,
    data: { message },
    headers: {},
  };
  error.config = {};
  error.code = code;
  error.isAxiosError = true; // Mark as axios error for axios.isAxiosError() checks
  return error;
};

const mockAxiosInstance: MockAxiosInstance = {
  get: jest.fn().mockImplementation((url: string, config?: any) => {
    // Use fetch adapter when OFFLINE_TESTS is not set (allows MSW to intercept via custom fetch)
    if (process.env.OFFLINE_TESTS !== 'true') {
      return fetchAdapter({ ...config, url, method: 'GET' });
    }

    // Health endpoints
    if (url.includes('/health')) {
      return Promise.resolve(mockResponse({
        Status: 'Healthy',
        Timestamp: new Date().toISOString(),
        Version: '1.0.0-test',
        Environment: 'Test'
      }));
    }

    // Members endpoints
    if (url.includes('/members')) {
      return Promise.resolve(mockResponse([
        {
          id: 1,
          clubId: 1,
          fullName: 'Test Member',
          email: 'test@example.com',
          membershipType: 'Individual',
          status: 'Active',
          joinDate: '2023-01-15',
        }
      ]));
    }

    // Events endpoints
    if (url.includes('/events')) {
      return Promise.resolve(mockResponse([
        {
          id: 1,
          clubId: 1,
          title: 'Test Event',
          description: 'Mock event for testing',
          startDate: new Date().toISOString(),
          status: 'Active',
        }
      ]));
    }

    // Clubs endpoints
    if (url.includes('/clubs')) {
      return Promise.resolve(mockResponse([
        {
          id: 1,
          name: 'Test Club',
          description: 'Mock club for testing',
          tier: 'Premium',
          memberCount: 150,
        }
      ]));
    }

    // Admin endpoints - return 401 for unauthorized
    if (url.includes('/admin')) {
      return Promise.reject(mockError(401, 'Unauthorized'));
    }

    // Default 404 for unmatched routes
    return Promise.reject(mockError(404, 'Not found'));
  }),

  post: jest.fn().mockImplementation((url: string, data?: any, config?: any) => {
    console.log(`🔄 Mock axios POST: ${url}`, data);

    // Use fetch adapter when OFFLINE_TESTS is not set (allows MSW to intercept via custom fetch)
    if (process.env.OFFLINE_TESTS !== 'true') {
      return fetchAdapter({ ...config, url, method: 'POST', data });
    }

    // Auth endpoints
    if (url.includes('/auth/login')) {
      if (data?.email === 'test@example.com' && data?.password === 'password') {
        return Promise.resolve(mockResponse({
          user: {
            id: 1,
            email: data.email,
            fullName: 'Test User',
            roles: ['User']
          },
          token: 'mock-jwt-token',
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        }));
      }
      return Promise.reject(mockError(401, 'Invalid credentials'));
    }

    if (url.includes('/auth/register')) {
      return Promise.resolve(mockResponse({
        user: {
          id: Math.floor(Math.random() * 1000),
          email: data?.email || 'test@example.com',
          fullName: data?.fullName || 'Test User',
          roles: ['User']
        },
        message: 'User registered successfully'
      }, 201));
    }

    if (url.includes('/auth/forgot-password')) {
      return Promise.resolve(mockResponse({
        message: 'Password reset email sent if account exists'
      }));
    }

    // Create operations
    if (url.includes('/members')) {
      return Promise.resolve(mockResponse({
        id: Math.floor(Math.random() * 1000),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, 201));
    }

    if (url.includes('/events')) {
      return Promise.resolve(mockResponse({
        id: Math.floor(Math.random() * 1000),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, 201));
    }

    // Default success for other POST requests
    return Promise.resolve(mockResponse({ success: true, ...data }, 201));
  }),

  put: jest.fn().mockImplementation((url: string, data?: any, config?: any) => {
    console.log(`🔄 Mock axios PUT: ${url}`, data);

    // Use fetch adapter when OFFLINE_TESTS is not set (allows MSW to intercept via custom fetch)
    if (process.env.OFFLINE_TESTS !== 'true') {
      return fetchAdapter({ ...config, url, method: 'PUT', data });
    }

    return Promise.resolve(mockResponse({
      ...data,
      updatedAt: new Date().toISOString()
    }));
  }),

  delete: jest.fn().mockImplementation((url: string, config?: any) => {
    console.log(`🔄 Mock axios DELETE: ${url}`);

    // Use fetch adapter when OFFLINE_TESTS is not set (allows MSW to intercept via custom fetch)
    if (process.env.OFFLINE_TESTS !== 'true') {
      return fetchAdapter({ ...config, url, method: 'DELETE' });
    }

    return Promise.resolve(mockResponse({
      message: 'Resource deleted successfully'
    }));
  }),

  patch: jest.fn().mockImplementation((url: string, data?: any, config?: any) => {
    console.log(`🔄 Mock axios PATCH: ${url}`, data);

    // Use fetch adapter when OFFLINE_TESTS is not set (allows MSW to intercept via custom fetch)
    if (process.env.OFFLINE_TESTS !== 'true') {
      return fetchAdapter({ ...config, url, method: 'PATCH', data });
    }

    return Promise.resolve(mockResponse({
      ...data,
      updatedAt: new Date().toISOString()
    }));
  }),

  create: jest.fn().mockImplementation((config?: any) => {
    // Return a new instance that uses fetchAdapter (for MSW interception)
    // Store config for use in requests
    const instanceConfig = {
      baseURL: config?.baseURL,
      headers: config?.headers || {},
      timeout: config?.timeout,
      withCredentials: config?.withCredentials,
    };

    // Create instance that uses fetchAdapter (DON'T spread mockAxiosInstance to avoid conflicts)
    const instance = {
      defaults: {
        ...mockAxiosInstance.defaults,
        ...instanceConfig
      },
      // Instance methods that use fetchAdapter
      get: jest.fn().mockImplementation(function(url: string, conf?: any) {
        return fetchAdapter({ ...instanceConfig, ...conf, url, method: 'GET' });
      }),
      post: jest.fn((url: string, data?: any, conf?: any) => {
        return fetchAdapter({ ...instanceConfig, ...conf, url, method: 'POST', data });
      }),
      put: jest.fn((url: string, data?: any, conf?: any) => {
        return fetchAdapter({ ...instanceConfig, ...conf, url, method: 'PUT', data });
      }),
      patch: jest.fn((url: string, data?: any, conf?: any) => {
        return fetchAdapter({ ...instanceConfig, ...conf, url, method: 'PATCH', data });
      }),
      delete: jest.fn((url: string, conf?: any) => {
        return fetchAdapter({ ...instanceConfig, ...conf, url, method: 'DELETE' });
      }),
      // Instance-specific interceptors
      interceptors: {
        request: {
          use: jest.fn().mockImplementation(() => Math.random()),
          eject: jest.fn(),
        },
        response: {
          use: jest.fn().mockImplementation(() => Math.random()),
          eject: jest.fn(),
        },
      },
      // Add other axios instance properties needed
      request: jest.fn(),
      getUri: jest.fn(),
      head: jest.fn(),
      options: jest.fn(),
      postForm: jest.fn(),
      putForm: jest.fn(),
      patchForm: jest.fn(),
    };

    return instance;
  }),

  interceptors: {
    request: {
      use: jest.fn().mockImplementation(() => Math.random()),
      eject: jest.fn(),
    },
    response: {
      use: jest.fn().mockImplementation(() => Math.random()),
      eject: jest.fn(),
    },
  },

  defaults: {
    baseURL: 'http://localhost:8050/api/v1',
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    withCredentials: true,
  },
};

// Export the mock as default
const mockAxios = mockAxiosInstance as any;

// Add static methods that exist on the real axios
mockAxios.CancelToken = {
  source: jest.fn(() => ({
    token: {},
    cancel: jest.fn(),
  })),
};

mockAxios.isCancel = jest.fn(() => false);

// Add isAxiosError method to check if an error is an axios error
mockAxios.isAxiosError = jest.fn((error: any) => {
  return error && error.isAxiosError === true;
});

// Add commonly used static methods
mockAxios.all = jest.fn((promises) => Promise.all(promises));
mockAxios.spread = jest.fn((fn) => fn);

export default mockAxios;