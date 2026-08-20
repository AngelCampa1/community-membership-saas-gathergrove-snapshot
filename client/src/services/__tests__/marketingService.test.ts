/**
 * @jest-environment jsdom
 *
 * Marketing Service Tests
 *
 * Tests lead capture and marketing analytics following boundary mocking pattern:
 * - Mock ONLY the apiClient boundary (HTTP layer)
 * - Test REAL service logic (request formatting, error handling)
 */

import { marketingService, LeadCaptureData, LeadCaptureResponse } from '../marketingService';
import apiClient from '../apiClient';

// Mock apiClient at the HTTP boundary
jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock logger to prevent console noise
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('MarketingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  describe('captureExitIntentLead', () => {
    const mockLeadData: LeadCaptureData = {
      email: 'test@example.com',
      name: 'Test User',
      source: 'exit-intent',
      variant: 'variant-a',
      metadata: { page: 'pricing' },
    };

    const mockSuccessResponse: LeadCaptureResponse = {
      success: true,
      message: 'Lead captured successfully',
      leadId: 'lead-123',
    };

    it('should capture lead successfully', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockSuccessResponse });

      const result = await marketingService.captureExitIntentLead(mockLeadData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/marketing/leads',
        expect.objectContaining({
          email: 'test@example.com',
          name: 'Test User',
          source: 'exit-intent',
        })
      );
      expect(result.success).toBe(true);
      expect(result.leadId).toBe('lead-123');
    });

    it('should include capture timestamp', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockSuccessResponse });

      await marketingService.captureExitIntentLead(mockLeadData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/marketing/leads',
        expect.objectContaining({
          capturedAt: expect.any(String),
        })
      );
    });

    it('should include user agent', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockSuccessResponse });

      await marketingService.captureExitIntentLead(mockLeadData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/marketing/leads',
        expect.objectContaining({
          userAgent: expect.any(String),
        })
      );
    });

    it('should include referrer', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockSuccessResponse });

      await marketingService.captureExitIntentLead(mockLeadData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/marketing/leads',
        expect.objectContaining({
          referrer: expect.any(String),
        })
      );
    });

    it('should include current URL', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockSuccessResponse });

      await marketingService.captureExitIntentLead(mockLeadData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/marketing/leads',
        expect.objectContaining({
          currentUrl: expect.any(String),
        })
      );
    });

    it('should return error response on API failure', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network Error'));

      const result = await marketingService.captureExitIntentLead(mockLeadData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('technical difficulties');
    });

    it('should handle different lead sources', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockSuccessResponse });

      const newsletterLead: LeadCaptureData = {
        email: 'newsletter@example.com',
        source: 'newsletter',
      };

      await marketingService.captureExitIntentLead(newsletterLead);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/marketing/leads',
        expect.objectContaining({
          source: 'newsletter',
        })
      );
    });

    it('should include variant when provided', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockSuccessResponse });

      await marketingService.captureExitIntentLead(mockLeadData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/marketing/leads',
        expect.objectContaining({
          variant: 'variant-a',
        })
      );
    });

    it('should include metadata when provided', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockSuccessResponse });

      await marketingService.captureExitIntentLead(mockLeadData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/marketing/leads',
        expect.objectContaining({
          metadata: { page: 'pricing' },
        })
      );
    });
  });

  describe('trackEvent', () => {
    it('should track event successfully', async () => {
      mockApiClient.post.mockResolvedValue({});

      await marketingService.trackEvent('page_view', { page: 'home' });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/marketing/analytics',
        expect.objectContaining({
          eventName: 'page_view',
        })
      );
    });

    it('should include timestamp', async () => {
      mockApiClient.post.mockResolvedValue({});

      await marketingService.trackEvent('button_click', {});

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/marketing/analytics',
        expect.objectContaining({
          timestamp: expect.any(String),
        })
      );
    });

    it('should include session ID', async () => {
      mockApiClient.post.mockResolvedValue({});

      await marketingService.trackEvent('button_click', {});

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/marketing/analytics',
        expect.objectContaining({
          sessionId: expect.stringMatching(/^session_/),
        })
      );
    });

    it('should include user agent', async () => {
      mockApiClient.post.mockResolvedValue({});

      await marketingService.trackEvent('button_click', {});

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/marketing/analytics',
        expect.objectContaining({
          userAgent: expect.any(String),
        })
      );
    });

    it('should include URL', async () => {
      mockApiClient.post.mockResolvedValue({});

      await marketingService.trackEvent('button_click', {});

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/marketing/analytics',
        expect.objectContaining({
          url: expect.any(String),
        })
      );
    });

    it('should stringify data as JSON', async () => {
      mockApiClient.post.mockResolvedValue({});

      const eventData = { key: 'value', nested: { num: 123 } };
      await marketingService.trackEvent('custom_event', eventData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/marketing/analytics',
        expect.objectContaining({
          data: JSON.stringify(eventData),
        })
      );
    });

    it('should not throw on API failure', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network Error'));

      await expect(
        marketingService.trackEvent('button_click', {})
      ).resolves.toBeUndefined();
    });

    it('should handle CORS errors gracefully', async () => {
      const corsError = new Error('Network Error');
      mockApiClient.post.mockRejectedValue(corsError);

      await expect(
        marketingService.trackEvent('button_click', {})
      ).resolves.toBeUndefined();
    });

    it('should handle non-CORS errors gracefully', async () => {
      // Test error that doesn't match CORS patterns
      const genericError = new Error('Server Error 500');
      mockApiClient.post.mockRejectedValue(genericError);

      await expect(
        marketingService.trackEvent('test_event', {})
      ).resolves.toBeUndefined();
    });

    it('should generate valid session IDs', async () => {
      mockApiClient.post.mockResolvedValue({});

      await marketingService.trackEvent('event_1', {});
      await marketingService.trackEvent('event_2', {});

      const calls = mockApiClient.post.mock.calls;
      const sessionId1 = calls[0][1].sessionId;
      const sessionId2 = calls[1][1].sessionId;

      // Both calls should generate valid session IDs with expected format
      expect(sessionId1).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(sessionId2).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it('should persist session ID in storage', async () => {
      mockApiClient.post.mockResolvedValue({});

      // Mock sessionStorage.getItem to return a pre-set session ID
      (window.sessionStorage.getItem as jest.Mock).mockReturnValue('preset-session-123');

      await marketingService.trackEvent('test_event', {});

      // Should use the stored session ID
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/marketing/analytics',
        expect.objectContaining({
          sessionId: 'preset-session-123',
        })
      );
    });

    it('should track with empty data', async () => {
      mockApiClient.post.mockResolvedValue({});

      await marketingService.trackEvent('simple_event');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/marketing/analytics',
        expect.objectContaining({
          eventName: 'simple_event',
          data: JSON.stringify({}),
        })
      );
    });
  });

  describe('getLeadMagnet', () => {
    it('should fetch lead magnet successfully', async () => {
      const mockResponse = {
        downloadUrl: 'https://example.com/guide.pdf',
        fileName: 'membership-guide.pdf',
      };
      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await marketingService.getLeadMagnet('membership-guide');

      expect(mockApiClient.get).toHaveBeenCalledWith('/marketing/lead-magnets/membership-guide');
      expect(result.downloadUrl).toBe('https://example.com/guide.pdf');
      expect(result.fileName).toBe('membership-guide.pdf');
    });

    it('should throw error on failure', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Not Found'));

      await expect(marketingService.getLeadMagnet('nonexistent')).rejects.toThrow(
        'Unable to generate download link'
      );
    });

    it('should fetch different lead magnet types', async () => {
      const mockResponse = { downloadUrl: 'url', fileName: 'file.pdf' };
      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      await marketingService.getLeadMagnet('checklist');

      expect(mockApiClient.get).toHaveBeenCalledWith('/marketing/lead-magnets/checklist');
    });
  });

  describe('service export', () => {
    it('should export marketingService object', () => {
      expect(marketingService).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof marketingService.captureExitIntentLead).toBe('function');
      expect(typeof marketingService.trackEvent).toBe('function');
      expect(typeof marketingService.getLeadMagnet).toBe('function');
    });
  });
});
