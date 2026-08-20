import apiClient from './apiClient';

export interface StripeConnectLinkResponse {
  onboardingUrl: string;
}

export interface StripeConnectStatusResponse {
  isConnected: boolean;
  stripeAccountId?: string;
}

export interface StripeConnectLinkRequest {
  country?: string;
}

export interface SupportedCountriesResponse {
  countries: CountryInfo[];
}

export interface CountryInfo {
  code: string;
  name: string;
  supportsApplicationFees: boolean;
}

export class StripeConnectService {
  /**
   * Gets a Stripe Connect onboarding link for the club
   */
  async getConnectLink(request?: StripeConnectLinkRequest): Promise<StripeConnectLinkResponse> {
    const response = await apiClient.post<StripeConnectLinkResponse>('/billing/stripe-connect-link', request || {});
    return response.data;
  }

  /**
   * Gets the list of supported countries for Stripe Connect
   */
  async getSupportedCountries(): Promise<SupportedCountriesResponse> {
    const response = await apiClient.get<SupportedCountriesResponse>('/billing/supported-countries');
    return response.data;
  }

  /**
   * Gets the Stripe Connect status for the club
   */
  async getConnectStatus(): Promise<StripeConnectStatusResponse> {
    const response = await apiClient.get<StripeConnectStatusResponse>('/billing/stripe-connect-status');
    return response.data;
  }

  /**
   * Disconnects the club's Stripe account
   */
  async disconnect(): Promise<void> {
    await apiClient.post('/billing/stripe-disconnect');
  }
}

export const stripeConnectService = new StripeConnectService(); 