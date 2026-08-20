/**
 * @jest-environment jsdom
 *
 * Health Service Tests
 *
 * Tests API health check functionality following boundary mocking pattern:
 * - Mock ONLY the apiClient boundary (HTTP layer)
 * - Test REAL service logic (response parsing)
 */

import { healthService, HealthResponse } from '../healthService';
import apiClient from '../apiClient';

// Mock the apiClient module at the HTTP boundary
jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('healthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkHealth', () => {
    const mockHealthyResponse: HealthResponse = {
      status: 'healthy',
      timestamp: '2025-01-15T10:30:00Z',
      version: '1.0.0',
      service: 'GatherGrove API',
    };

    it('should check health status successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockHealthyResponse });

      const result = await healthService.checkHealth();

      expect(mockApiClient.get).toHaveBeenCalledWith('/health');
      expect(result).toEqual(mockHealthyResponse);
    });

    it('should return correct status field', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockHealthyResponse });

      const result = await healthService.checkHealth();

      expect(result.status).toBe('healthy');
    });

    it('should return correct timestamp', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockHealthyResponse });

      const result = await healthService.checkHealth();

      expect(result.timestamp).toBe('2025-01-15T10:30:00Z');
    });

    it('should return correct version', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockHealthyResponse });

      const result = await healthService.checkHealth();

      expect(result.version).toBe('1.0.0');
    });

    it('should return correct service name', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockHealthyResponse });

      const result = await healthService.checkHealth();

      expect(result.service).toBe('GatherGrove API');
    });

    it('should handle unhealthy status', async () => {
      const unhealthyResponse: HealthResponse = {
        status: 'unhealthy',
        timestamp: '2025-01-15T10:30:00Z',
        version: '1.0.0',
        service: 'GatherGrove API',
      };
      mockApiClient.get.mockResolvedValue({ data: unhealthyResponse });

      const result = await healthService.checkHealth();

      expect(result.status).toBe('unhealthy');
    });

    it('should handle degraded status', async () => {
      const degradedResponse: HealthResponse = {
        status: 'degraded',
        timestamp: '2025-01-15T10:30:00Z',
        version: '1.0.0',
        service: 'GatherGrove API',
      };
      mockApiClient.get.mockResolvedValue({ data: degradedResponse });

      const result = await healthService.checkHealth();

      expect(result.status).toBe('degraded');
    });

    describe('error handling', () => {
      it('should throw error on network failure', async () => {
        mockApiClient.get.mockRejectedValue(new Error('Network Error'));

        await expect(healthService.checkHealth()).rejects.toThrow('Network Error');
      });

      it('should throw error on server error (500)', async () => {
        mockApiClient.get.mockRejectedValue(new Error('Internal Server Error'));

        await expect(healthService.checkHealth()).rejects.toThrow('Internal Server Error');
      });

      it('should throw error on service unavailable (503)', async () => {
        mockApiClient.get.mockRejectedValue(new Error('Service Unavailable'));

        await expect(healthService.checkHealth()).rejects.toThrow('Service Unavailable');
      });

      it('should throw error on timeout', async () => {
        mockApiClient.get.mockRejectedValue(new Error('Request Timeout'));

        await expect(healthService.checkHealth()).rejects.toThrow('Request Timeout');
      });

      it('should throw error on connection refused', async () => {
        mockApiClient.get.mockRejectedValue(new Error('ECONNREFUSED'));

        await expect(healthService.checkHealth()).rejects.toThrow('ECONNREFUSED');
      });
    });

    describe('response formats', () => {
      it('should handle response with different version format', async () => {
        const response: HealthResponse = {
          status: 'healthy',
          timestamp: '2025-01-15T10:30:00Z',
          version: '2.5.3-beta.1',
          service: 'GatherGrove API',
        };
        mockApiClient.get.mockResolvedValue({ data: response });

        const result = await healthService.checkHealth();

        expect(result.version).toBe('2.5.3-beta.1');
      });

      it('should handle response with ISO 8601 timestamp', async () => {
        const response: HealthResponse = {
          status: 'healthy',
          timestamp: '2025-01-15T10:30:00.123Z',
          version: '1.0.0',
          service: 'GatherGrove API',
        };
        mockApiClient.get.mockResolvedValue({ data: response });

        const result = await healthService.checkHealth();

        expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });

      it('should handle response with different service name', async () => {
        const response: HealthResponse = {
          status: 'healthy',
          timestamp: '2025-01-15T10:30:00Z',
          version: '1.0.0',
          service: 'GatherGrove Backend v2',
        };
        mockApiClient.get.mockResolvedValue({ data: response });

        const result = await healthService.checkHealth();

        expect(result.service).toBe('GatherGrove Backend v2');
      });
    });
  });

  describe('service instance', () => {
    it('should export healthService singleton', () => {
      expect(healthService).toBeDefined();
    });

    it('should have checkHealth method', () => {
      expect(typeof healthService.checkHealth).toBe('function');
    });
  });

  describe('API endpoint', () => {
    it('should call correct health endpoint', async () => {
      mockApiClient.get.mockResolvedValue({
        data: {
          status: 'healthy',
          timestamp: '2025-01-15T10:30:00Z',
          version: '1.0.0',
          service: 'GatherGrove API',
        },
      });

      await healthService.checkHealth();

      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      expect(mockApiClient.get).toHaveBeenCalledWith('/health');
    });
  });
});
