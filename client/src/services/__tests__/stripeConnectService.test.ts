/**
 * @jest-environment jsdom
 *
 * Stripe Connect Service Tests
 *
 * Tests Stripe Connect billing functionality following boundary mocking pattern:
 * - Mock ONLY the apiClient boundary (HTTP layer)
 * - Test REAL service logic (error handling, response parsing)
 */

import { stripeConnectService, StripeConnectService, StripeConnectLinkResponse, StripeConnectStatusResponse, SupportedCountriesResponse, CountryInfo } from '../stripeConnectService';
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

describe('StripeConnectService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConnectLink', () => {
    const mockLinkResponse: StripeConnectLinkResponse = {
      onboardingUrl: 'https://connect.stripe.com/express/oauth/authorize?client_id=ca_abc123',
    };

    it('should get Stripe Connect onboarding link without country parameter', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockLinkResponse });

      const result = await stripeConnectService.getConnectLink();

      expect(mockApiClient.post).toHaveBeenCalledWith('/billing/stripe-connect-link', {});
      expect(result).toEqual(mockLinkResponse);
      expect(result.onboardingUrl).toBe('https://connect.stripe.com/express/oauth/authorize?client_id=ca_abc123');
    });

    it('should get Stripe Connect onboarding link with country parameter', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockLinkResponse });

      const result = await stripeConnectService.getConnectLink({ country: 'US' });

      expect(mockApiClient.post).toHaveBeenCalledWith('/billing/stripe-connect-link', { country: 'US' });
      expect(result).toEqual(mockLinkResponse);
    });

    it('should pass different country codes correctly', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockLinkResponse });

      await stripeConnectService.getConnectLink({ country: 'GB' });
      expect(mockApiClient.post).toHaveBeenCalledWith('/billing/stripe-connect-link', { country: 'GB' });

      await stripeConnectService.getConnectLink({ country: 'CA' });
      expect(mockApiClient.post).toHaveBeenCalledWith('/billing/stripe-connect-link', { country: 'CA' });

      await stripeConnectService.getConnectLink({ country: 'AU' });
      expect(mockApiClient.post).toHaveBeenCalledWith('/billing/stripe-connect-link', { country: 'AU' });
    });

    it('should handle undefined country request', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockLinkResponse });

      const result = await stripeConnectService.getConnectLink(undefined);

      expect(mockApiClient.post).toHaveBeenCalledWith('/billing/stripe-connect-link', {});
      expect(result.onboardingUrl).toBeTruthy();
    });

    it('should throw error when API request fails', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Failed to generate link'));

      await expect(stripeConnectService.getConnectLink()).rejects.toThrow('Failed to generate link');
    });

    it('should handle network errors', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network Error'));

      await expect(stripeConnectService.getConnectLink()).rejects.toThrow('Network Error');
    });

    it('should handle unauthorized errors', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Unauthorized'));

      await expect(stripeConnectService.getConnectLink()).rejects.toThrow('Unauthorized');
    });

    it('should return correct URL format', async () => {
      const expectedUrl = 'https://connect.stripe.com/express/oauth/authorize?redirect_uri=https://example.com/callback';
      mockApiClient.post.mockResolvedValue({ data: { onboardingUrl: expectedUrl } });

      const result = await stripeConnectService.getConnectLink();

      expect(result.onboardingUrl).toMatch(/^https:\/\/connect\.stripe\.com/);
    });
  });

  describe('getSupportedCountries', () => {
    const mockCountries: CountryInfo[] = [
      { code: 'US', name: 'United States', supportsApplicationFees: true },
      { code: 'GB', name: 'United Kingdom', supportsApplicationFees: true },
      { code: 'CA', name: 'Canada', supportsApplicationFees: true },
      { code: 'AU', name: 'Australia', supportsApplicationFees: true },
      { code: 'DE', name: 'Germany', supportsApplicationFees: true },
    ];

    const mockResponse: SupportedCountriesResponse = {
      countries: mockCountries,
    };

    it('should get supported countries successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await stripeConnectService.getSupportedCountries();

      expect(mockApiClient.get).toHaveBeenCalledWith('/billing/supported-countries');
      expect(result).toEqual(mockResponse);
      expect(result.countries).toHaveLength(5);
    });

    it('should return country details with application fee support info', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await stripeConnectService.getSupportedCountries();

      const usCountry = result.countries.find(c => c.code === 'US');
      expect(usCountry).toBeDefined();
      expect(usCountry?.name).toBe('United States');
      expect(usCountry?.supportsApplicationFees).toBe(true);
    });

    it('should handle countries without application fee support', async () => {
      const mixedCountries: SupportedCountriesResponse = {
        countries: [
          { code: 'US', name: 'United States', supportsApplicationFees: true },
          { code: 'BR', name: 'Brazil', supportsApplicationFees: false },
        ],
      };
      mockApiClient.get.mockResolvedValue({ data: mixedCountries });

      const result = await stripeConnectService.getSupportedCountries();

      const brazil = result.countries.find(c => c.code === 'BR');
      expect(brazil?.supportsApplicationFees).toBe(false);
    });

    it('should return empty array when no countries available', async () => {
      mockApiClient.get.mockResolvedValue({ data: { countries: [] } });

      const result = await stripeConnectService.getSupportedCountries();

      expect(result.countries).toHaveLength(0);
    });

    it('should throw error when API request fails', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Service unavailable'));

      await expect(stripeConnectService.getSupportedCountries()).rejects.toThrow('Service unavailable');
    });

    it('should handle timeout errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Request timeout'));

      await expect(stripeConnectService.getSupportedCountries()).rejects.toThrow('Request timeout');
    });
  });

  describe('getConnectStatus', () => {
    const mockConnectedStatus: StripeConnectStatusResponse = {
      isConnected: true,
      stripeAccountId: 'acct_1234567890',
    };

    const mockDisconnectedStatus: StripeConnectStatusResponse = {
      isConnected: false,
    };

    it('should get connect status when connected', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockConnectedStatus });

      const result = await stripeConnectService.getConnectStatus();

      expect(mockApiClient.get).toHaveBeenCalledWith('/billing/stripe-connect-status');
      expect(result).toEqual(mockConnectedStatus);
      expect(result.isConnected).toBe(true);
      expect(result.stripeAccountId).toBe('acct_1234567890');
    });

    it('should get connect status when disconnected', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockDisconnectedStatus });

      const result = await stripeConnectService.getConnectStatus();

      expect(result.isConnected).toBe(false);
      expect(result.stripeAccountId).toBeUndefined();
    });

    it('should return undefined stripeAccountId when disconnected', async () => {
      mockApiClient.get.mockResolvedValue({ data: { isConnected: false } });

      const result = await stripeConnectService.getConnectStatus();

      expect(result.stripeAccountId).toBeUndefined();
    });

    it('should throw error when status check fails', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Failed to fetch status'));

      await expect(stripeConnectService.getConnectStatus()).rejects.toThrow('Failed to fetch status');
    });

    it('should handle unauthorized access', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Unauthorized'));

      await expect(stripeConnectService.getConnectStatus()).rejects.toThrow('Unauthorized');
    });

    it('should handle server errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Internal Server Error'));

      await expect(stripeConnectService.getConnectStatus()).rejects.toThrow('Internal Server Error');
    });
  });

  describe('disconnect', () => {
    it('should disconnect Stripe account successfully', async () => {
      mockApiClient.post.mockResolvedValue({ data: null });

      await stripeConnectService.disconnect();

      expect(mockApiClient.post).toHaveBeenCalledWith('/billing/stripe-disconnect');
    });

    it('should return void on successful disconnect', async () => {
      mockApiClient.post.mockResolvedValue({ data: null });

      const result = await stripeConnectService.disconnect();

      expect(result).toBeUndefined();
    });

    it('should throw error when disconnect fails', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Failed to disconnect'));

      await expect(stripeConnectService.disconnect()).rejects.toThrow('Failed to disconnect');
    });

    it('should handle conflict when account has pending payouts', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Cannot disconnect: pending payouts exist'));

      await expect(stripeConnectService.disconnect()).rejects.toThrow('Cannot disconnect: pending payouts exist');
    });

    it('should handle forbidden access', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Forbidden'));

      await expect(stripeConnectService.disconnect()).rejects.toThrow('Forbidden');
    });

    it('should handle network errors during disconnect', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network Error'));

      await expect(stripeConnectService.disconnect()).rejects.toThrow('Network Error');
    });
  });

  describe('API endpoints', () => {
    it('should use correct endpoint for getConnectLink', async () => {
      mockApiClient.post.mockResolvedValue({ data: { onboardingUrl: 'https://test.com' } });

      await stripeConnectService.getConnectLink();

      expect(mockApiClient.post).toHaveBeenCalledWith('/billing/stripe-connect-link', expect.anything());
    });

    it('should use correct endpoint for getSupportedCountries', async () => {
      mockApiClient.get.mockResolvedValue({ data: { countries: [] } });

      await stripeConnectService.getSupportedCountries();

      expect(mockApiClient.get).toHaveBeenCalledWith('/billing/supported-countries');
    });

    it('should use correct endpoint for getConnectStatus', async () => {
      mockApiClient.get.mockResolvedValue({ data: { isConnected: false } });

      await stripeConnectService.getConnectStatus();

      expect(mockApiClient.get).toHaveBeenCalledWith('/billing/stripe-connect-status');
    });

    it('should use correct endpoint for disconnect', async () => {
      mockApiClient.post.mockResolvedValue({ data: null });

      await stripeConnectService.disconnect();

      expect(mockApiClient.post).toHaveBeenCalledWith('/billing/stripe-disconnect');
    });
  });

  describe('service instance', () => {
    it('should export singleton instance', () => {
      expect(stripeConnectService).toBeDefined();
      expect(stripeConnectService).toBeInstanceOf(StripeConnectService);
    });

    it('should have all expected methods', () => {
      expect(typeof stripeConnectService.getConnectLink).toBe('function');
      expect(typeof stripeConnectService.getSupportedCountries).toBe('function');
      expect(typeof stripeConnectService.getConnectStatus).toBe('function');
      expect(typeof stripeConnectService.disconnect).toBe('function');
    });
  });

  describe('response type validation', () => {
    it('should return properly typed StripeConnectLinkResponse', async () => {
      const response: StripeConnectLinkResponse = { onboardingUrl: 'https://test.com' };
      mockApiClient.post.mockResolvedValue({ data: response });

      const result = await stripeConnectService.getConnectLink();

      // Type assertion validates interface
      const url: string = result.onboardingUrl;
      expect(url).toBe('https://test.com');
    });

    it('should return properly typed StripeConnectStatusResponse', async () => {
      const response: StripeConnectStatusResponse = { isConnected: true, stripeAccountId: 'acct_123' };
      mockApiClient.get.mockResolvedValue({ data: response });

      const result = await stripeConnectService.getConnectStatus();

      // Type assertion validates interface
      const connected: boolean = result.isConnected;
      const accountId: string | undefined = result.stripeAccountId;
      expect(connected).toBe(true);
      expect(accountId).toBe('acct_123');
    });

    it('should return properly typed SupportedCountriesResponse', async () => {
      const country: CountryInfo = { code: 'US', name: 'United States', supportsApplicationFees: true };
      const response: SupportedCountriesResponse = { countries: [country] };
      mockApiClient.get.mockResolvedValue({ data: response });

      const result = await stripeConnectService.getSupportedCountries();

      // Type assertion validates interface
      const countries: CountryInfo[] = result.countries;
      expect(countries[0].code).toBe('US');
      expect(countries[0].name).toBe('United States');
      expect(countries[0].supportsApplicationFees).toBe(true);
    });
  });
});
