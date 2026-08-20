/**
 * Mock API Client for Client Tests
 * Provides comprehensive mocking for all API client functionality
 */

export const createMockApiClient = () => {
  const mockResponse = (data: any, status: number = 200) => ({
    data,
    status,
    statusText: status < 400 ? 'OK' : 'Error',
    headers: {},
    config: {} as any
  });

  const mockError = (status: number, message: string) => {
    const error: any = new Error(message);
    error.response = {
      status,
      data: { message },
      headers: {}
    };
    error.config = {};
    return error;
  };

  return {
    // GET requests
    get: jest.fn().mockImplementation((url: string) => {
      // Default successful responses for common endpoints
      if (url.includes('/health')) {
        return Promise.resolve(mockResponse({
          Status: 'Healthy',
          Timestamp: new Date().toISOString()
        }));
      }
      
      if (url.includes('/members')) {
        return Promise.resolve(mockResponse([
          {
            id: 1,
            fullName: 'Test Member',
            email: 'test@example.com',
            status: 'Active'
          }
        ]));
      }

      if (url.includes('/events')) {
        return Promise.resolve(mockResponse([
          {
            id: 1,
            title: 'Test Event',
            startDate: new Date().toISOString(),
            status: 'Active'
          }
        ]));
      }

      // Default 404 for unmatched routes
      return Promise.reject(mockError(404, 'Not found'));
    }),

    // POST requests
    post: jest.fn().mockImplementation((url: string, data?: any) => {
      if (url.includes('/auth/login')) {
        if (data?.email === 'test@example.com' && data?.password === 'password') {
          return Promise.resolve(mockResponse({
            user: { id: 1, email: data.email, fullName: 'Test User' },
            token: 'mock-jwt-token'
          }));
        }
        return Promise.reject(mockError(401, 'Invalid credentials'));
      }

      if (url.includes('/members')) {
        return Promise.resolve(mockResponse({
          id: Math.floor(Math.random() * 1000),
          ...data,
          createdAt: new Date().toISOString()
        }, 201));
      }

      // Default success for other POST requests
      return Promise.resolve(mockResponse({ success: true }, 201));
    }),

    // PUT requests
    put: jest.fn().mockImplementation((url: string, data?: any) => {
      return Promise.resolve(mockResponse({
        ...data,
        updatedAt: new Date().toISOString()
      }));
    }),

    // DELETE requests
    delete: jest.fn().mockImplementation(() => {
      return Promise.resolve(mockResponse({ message: 'Deleted successfully' }));
    }),

    // PATCH requests
    patch: jest.fn().mockImplementation((url: string, data?: any) => {
      return Promise.resolve(mockResponse({
        ...data,
        updatedAt: new Date().toISOString()
      }));
    }),

    // Request/Response interceptors (mock)
    interceptors: {
      request: {
        use: jest.fn()
      },
      response: {
        use: jest.fn()
      }
    },

    // Configuration
    defaults: {
      baseURL: 'http://localhost:8050/api/v1',
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    },

    // Create instance method
    create: jest.fn().mockReturnThis()
  };
};

// Export default mock
const mockApiClient = createMockApiClient();
export default mockApiClient;