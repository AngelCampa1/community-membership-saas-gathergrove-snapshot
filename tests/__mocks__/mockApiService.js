/**
 * Mock API Service for Deployment Tests
 * Provides comprehensive mocking for all API endpoints to enable offline testing
 */

const MockAdapter = require('axios-mock-adapter');

class MockApiService {
  constructor() {
    this.mockAdapter = null;
    this.isInitialized = false;
  }

  /**
   * Initialize mock API service
   * @param {*} axiosInstance - Axios instance to mock
   */
  initialize(axiosInstance) {
    if (this.isInitialized) {
      console.warn('🔄 MockApiService already initialized, skipping...');
      return;
    }

    console.log('🔧 Initializing MockApiService...');
    this.mockAdapter = new MockAdapter(axiosInstance);
    this.setupMockEndpoints();
    this.isInitialized = true;
    console.log('✅ MockApiService initialized successfully');
  }

  /**
   * Setup all mock API endpoints
   */
  setupMockEndpoints() {
    this.setupHealthEndpoints();
    this.setupAuthEndpoints();
    this.setupClubEndpoints();
    this.setupMemberEndpoints();
    this.setupEventEndpoints();
    this.setupGenericEndpoints();
  }

  /**
   * Setup health check endpoints
   */
  setupHealthEndpoints() {
    // Basic health check
    this.mockAdapter.onGet('/api/v1/health').reply(200, {
      Status: 'Healthy',
      Timestamp: new Date().toISOString(),
      Version: '1.0.0-test',
      Environment: 'Test'
    });

    // Deep health check with services
    this.mockAdapter.onGet('/api/v1/health/deep').reply(200, {
      Status: 'Healthy',
      Database: {
        Status: 'Connected',
        ConnectionString: 'mocked-connection',
        ResponseTime: 15,
        LastCheck: new Date().toISOString()
      },
      Services: {
        EmailService: 'Available',
        PaymentService: 'Available',
        CacheService: 'Available',
        FileStorageService: 'Available'
      },
      Memory: {
        Used: '128MB',
        Total: '512MB',
        Usage: '25%'
      }
    });

    // Debug information
    this.mockAdapter.onGet('/api/v1/health/debug').reply(200, {
      Environment: 'Test',
      DatabaseConnectivity: {
        CanConnect: true,
        ConnectionString: 'mocked-connection-string',
        ResponseTime: 12,
        ActiveConnections: 5,
        MaxConnections: 100
      },
      Configuration: {
        HasDefaultConnection: true,
        HasJwtSecret: true,
        HasSentry: true,
        HasEmailConfiguration: true,
        HasPaymentConfiguration: true
      },
      Performance: {
        AverageResponseTime: '45ms',
        RequestsPerSecond: 150,
        ErrorRate: '0.1%'
      },
      Version: '1.0.0-test',
      Timestamp: new Date().toISOString(),
      ServerTime: new Date().toISOString()
    });
  }

  /**
   * Setup authentication endpoints
   */
  setupAuthEndpoints() {
    // Unauthorized requests (no token)
    this.mockAdapter.onGet('/api/v1/admin/clubs').reply(401, {
      message: 'Unauthorized - JWT token required'
    });

    // Login endpoint
    this.mockAdapter.onPost('/api/v1/auth/login').reply((config) => {
      const data = JSON.parse(config.data);
      
      if (data.email === 'test@example.com' && data.password === 'password') {
        return [200, {
          user: {
            id: 1,
            email: 'test@example.com',
            fullName: 'Test User',
            roles: ['User']
          },
          token: 'mock-jwt-token',
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        }];
      }
      
      return [401, { message: 'Invalid credentials' }];
    });

    // Register endpoint
    this.mockAdapter.onPost('/api/v1/auth/register').reply((config) => {
      const data = JSON.parse(config.data);
      
      if (data.email && data.password && data.fullName) {
        return [201, {
          user: {
            id: Math.floor(Math.random() * 1000),
            email: data.email,
            fullName: data.fullName,
            roles: ['User']
          },
          message: 'User registered successfully'
        }];
      }
      
      return [400, { message: 'Invalid registration data' }];
    });

    // Password reset endpoints
    this.mockAdapter.onPost('/api/v1/auth/forgot-password').reply(200, {
      message: 'Password reset email sent if account exists'
    });

    this.mockAdapter.onPost('/api/v1/auth/reset-password').reply(200, {
      message: 'Password reset successfully'
    });
  }

  /**
   * Setup club management endpoints
   */
  setupClubEndpoints() {
    const mockClub = {
      id: 1,
      name: 'Test Club',
      description: 'Mock club for testing',
      tier: 'Premium',
      memberCount: 150,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: new Date().toISOString()
    };

    // Get clubs
    this.mockAdapter.onGet(/\/api\/v1\/clubs$/).reply(200, [mockClub]);
    
    // Get specific club
    this.mockAdapter.onGet(/\/api\/v1\/clubs\/\d+$/).reply(200, mockClub);
    
    // Create club
    this.mockAdapter.onPost('/api/v1/clubs').reply(201, mockClub);
    
    // Update club
    this.mockAdapter.onPut(/\/api\/v1\/clubs\/\d+$/).reply(200, mockClub);
    
    // Delete club
    this.mockAdapter.onDelete(/\/api\/v1\/clubs\/\d+$/).reply(200, {
      message: 'Club deleted successfully'
    });
  }

  /**
   * Setup member management endpoints
   */
  setupMemberEndpoints() {
    const mockMember = {
      id: 1,
      clubId: 1,
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phoneNumber: '(555) 123-4567',
      membershipType: 'Individual',
      status: 'Active',
      joinDate: '2023-01-15',
      createdAt: '2023-01-15T00:00:00Z',
      updatedAt: new Date().toISOString()
    };

    const mockMembers = Array.from({ length: 10 }, (_, i) => ({
      ...mockMember,
      id: i + 1,
      fullName: `Test Member ${i + 1}`,
      email: `member${i + 1}@example.com`
    }));

    // Get members
    this.mockAdapter.onGet(/\/api\/v1\/clubs\/\d+\/members$/).reply(200, mockMembers);
    
    // Get specific member
    this.mockAdapter.onGet(/\/api\/v1\/clubs\/\d+\/members\/\d+$/).reply(200, mockMember);
    
    // Create member
    this.mockAdapter.onPost(/\/api\/v1\/clubs\/\d+\/members$/).reply(201, mockMember);
    
    // Update member
    this.mockAdapter.onPut(/\/api\/v1\/clubs\/\d+\/members\/\d+$/).reply(200, mockMember);
    
    // Delete member
    this.mockAdapter.onDelete(/\/api\/v1\/clubs\/\d+\/members\/\d+$/).reply(200, {
      message: 'Member deleted successfully'
    });
  }

  /**
   * Setup event management endpoints
   */
  setupEventEndpoints() {
    const mockEvent = {
      id: 1,
      clubId: 1,
      title: 'Test Event',
      description: 'Mock event for testing',
      startDate: '2024-06-15T18:00:00Z',
      endDate: '2024-06-15T20:00:00Z',
      location: 'Test Venue',
      maxAttendees: 50,
      currentAttendees: 25,
      status: 'Active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: new Date().toISOString()
    };

    const mockEvents = Array.from({ length: 5 }, (_, i) => ({
      ...mockEvent,
      id: i + 1,
      title: `Test Event ${i + 1}`,
      startDate: new Date(Date.now() + (i + 1) * 86400000).toISOString()
    }));

    // Get events
    this.mockAdapter.onGet(/\/api\/v1\/clubs\/\d+\/events$/).reply(200, mockEvents);
    
    // Get specific event
    this.mockAdapter.onGet(/\/api\/v1\/clubs\/\d+\/events\/\d+$/).reply(200, mockEvent);
    
    // Create event
    this.mockAdapter.onPost(/\/api\/v1\/clubs\/\d+\/events$/).reply(201, mockEvent);
    
    // Update event
    this.mockAdapter.onPut(/\/api\/v1\/clubs\/\d+\/events\/\d+$/).reply(200, mockEvent);
    
    // Delete event
    this.mockAdapter.onDelete(/\/api\/v1\/clubs\/\d+\/events\/\d+$/).reply(200, {
      message: 'Event deleted successfully'
    });
  }

  /**
   * Setup generic fallback endpoints
   */
  setupGenericEndpoints() {
    // Generic GET requests return 404 if not matched above
    this.mockAdapter.onGet().reply(404, {
      message: 'Endpoint not found in mock service'
    });

    // Generic POST requests return 400 for bad requests
    this.mockAdapter.onPost().reply(400, {
      message: 'Invalid request data'
    });

    // Generic PUT requests return 404 for not found
    this.mockAdapter.onPut().reply(404, {
      message: 'Resource not found for update'
    });

    // Generic DELETE requests return 404 for not found
    this.mockAdapter.onDelete().reply(404, {
      message: 'Resource not found for deletion'
    });

    // Generic PATCH requests return 404 for not found
    this.mockAdapter.onPatch().reply(404, {
      message: 'Resource not found for patch'
    });
  }

  /**
   * Add network delays to simulate real API behavior
   */
  addNetworkDelays() {
    console.log('🔄 Adding network delays to mock responses...');
    
    this.mockAdapter.onAny().reply((config) => {
      return new Promise((resolve) => {
        const delay = Math.random() * 100 + 50; // 50-150ms delay
        setTimeout(() => {
          resolve([200, { message: 'Delayed response' }]);
        }, delay);
      });
    });
  }

  /**
   * Simulate service failures
   */
  simulateFailures(failureRate = 0.1) {
    console.log(`🔄 Simulating ${(failureRate * 100).toFixed(1)}% failure rate...`);
    
    this.mockAdapter.onAny().reply(() => {
      if (Math.random() < failureRate) {
        return [500, { message: 'Simulated service failure' }];
      }
      return [200, { message: 'Success' }];
    });
  }

  /**
   * Reset all mocks
   */
  reset() {
    if (this.mockAdapter) {
      this.mockAdapter.reset();
      console.log('🔄 Mock adapter reset');
    }
  }

  /**
   * Restore original axios behavior
   */
  restore() {
    if (this.mockAdapter) {
      this.mockAdapter.restore();
      console.log('🔄 Mock adapter restored');
    }
    this.isInitialized = false;
  }

  /**
   * Get mock statistics
   */
  getStats() {
    if (!this.mockAdapter) {
      return { initialized: false };
    }

    return {
      initialized: this.isInitialized,
      history: this.mockAdapter.history,
      handlerCount: Object.keys(this.mockAdapter.handlers).length
    };
  }
}

// Export singleton instance
module.exports = new MockApiService();