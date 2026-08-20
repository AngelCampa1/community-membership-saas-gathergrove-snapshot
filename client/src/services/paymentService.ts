import apiClient from './apiClient';
import { ErrorHandler } from '@/lib/errorHandler';

interface RequestPaymentRequest {
  amount: number;
  description: string;
}

interface PaymentResponse {
  paymentId: number;
  memberId: number;
  clubId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
  isPartialPayment?: boolean;
  expectedDuesAmount?: number;
  outstandingBalance?: number;
  paymentStatusMessage?: string;
}

interface UpdatePaymentRequest {
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
}

export interface PaymentPageResponse {
  clubName: string;
  memberName: string;
  membershipType: string;
  amount: number;
  description: string;
  isValid: boolean;
  stripePublishableKey: string;
  isStripeConnected?: boolean;
}

interface ProcessPaymentRequest {
  paymentMethodId: string;
}

// Base origin for the PUBLIC guest payment-page endpoints below
// (getPaymentPage / processPayment). These two endpoints are intentionally
// called with a raw `fetch` rather than `apiClient`: they are unauthenticated
// guest flows, and apiClient's response interceptor turns any 401 into an
// `auth:session-expired` event that redirects to /login — which would be wrong
// for a guest with no session. Raw fetch keeps the guest payment page working.
// We derive the origin by stripping the `/api/v1` suffix from the configured
// API base URL (then re-append `/api/v1/...` per call), so this resolves
// correctly in dev (:8050) and prod (api.gathergrove.club) alike.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8050';

interface ClubPaymentResponse {
  paymentId: number;
  memberId: number;
  memberName: string;
  memberEmail: string;
  membershipTypeName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
  isPartialPayment: boolean;
  expectedDuesAmount?: number;
  outstandingBalance?: number;
}

export const paymentService = {
  /**
   * Admin function to request payment from a member
   */
  async requestPayment(clubId: number, memberId: number, request: RequestPaymentRequest): Promise<void> {
    try {
      await apiClient.post(`/clubs/${clubId}/members/${memberId}/request-payment`, request);
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'requesting payment from member',
        action: 'Please verify the payment details and try again',
        customMessages: {
          400: 'Invalid payment request. Please check the amount and description',
          403: 'You do not have permission to request payments from this member',
          404: 'Member not found or has been removed',
          409: 'A payment request is already pending for this member'
        }
      });
    }
  },

  /**
   * Get payment page details for a secure token (Public endpoint)
   */
  async getPaymentPage(token: string): Promise<PaymentPageResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/payment-page/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw { 
          response: { 
            status: response.status, 
            data: error 
          }, 
          message: error.message || 'Request failed' 
        };
      }

      return response.json();
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading payment page',
        action: 'Please check the payment link and try again',
        customMessages: {
          400: 'Invalid payment link. Please check the URL',
          404: 'Payment link not found or has expired',
          410: 'This payment link has expired. Please contact the club for a new link'
        }
      });
    }
  },

  /**
   * Process payment for a secure token (Public endpoint)
   */
  async processPayment(token: string, request: ProcessPaymentRequest): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/payment-page/${token}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw { 
          response: { 
            status: response.status, 
            data: error 
          }, 
          message: error.message || 'Request failed' 
        };
      }
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'processing payment',
        action: 'Please check your payment method and try again',
        customMessages: {
          400: 'Invalid payment information. Please verify your payment method',
          402: 'Payment failed. Your card was declined - please try a different payment method',
          404: 'Payment link not found or has expired',
          409: 'Payment is already being processed. Please wait',
          410: 'This payment link has expired. Please contact the club for assistance'
        }
      });
    }
  },

  /**
   * Get all payments for a specific member
   */
  async getMemberPayments(clubId: number, memberId: number): Promise<PaymentResponse[]> {
    try {
      const response = await apiClient.get<PaymentResponse[]>(`/clubs/${clubId}/members/${memberId}/payments`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading member payments',
        action: 'Please try again',
        customMessages: {
          403: 'You do not have permission to view payments for this member',
          404: 'Member not found'
        }
      });
    }
  },

  /**
   * Get a specific payment by ID
   */
  async getPayment(clubId: number, memberId: number, paymentId: number): Promise<PaymentResponse> {
    try {
      const response = await apiClient.get<PaymentResponse>(`/clubs/${clubId}/members/${memberId}/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading payment details',
        action: 'Please try again',
        customMessages: {
          403: 'You do not have permission to view this payment',
          404: 'Payment not found'
        }
      });
    }
  },

  /**
   * Update a payment
   */
  async updatePayment(clubId: number, memberId: number, paymentId: number, request: UpdatePaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await apiClient.put<PaymentResponse>(`/clubs/${clubId}/members/${memberId}/payments/${paymentId}`, request);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'updating payment',
        action: 'Please verify the payment details and try again',
        customMessages: {
          400: 'Invalid payment data. Only manual payments (Cash/Check) can be edited',
          403: 'You do not have permission to edit this payment',
          404: 'Payment not found'
        }
      });
    }
  },

  /**
   * Delete a payment
   */
  async deletePayment(clubId: number, memberId: number, paymentId: number): Promise<void> {
    try {
      await apiClient.delete(`/clubs/${clubId}/members/${memberId}/payments/${paymentId}`);
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'deleting payment',
        action: 'Please try again',
        customMessages: {
          400: 'Cannot delete this payment. Only manual payments (Cash/Check) can be deleted',
          403: 'You do not have permission to delete this payment',
          404: 'Payment not found'
        }
      });
    }
  },

  /**
   * Get all payments for a club for a specific year
   */
  async getClubPayments(clubId: number, year?: number): Promise<ClubPaymentResponse[]> {
    try {
      const params = year ? { year } : {};
      const response = await apiClient.get<ClubPaymentResponse[]>(`/clubs/${clubId}/payments`, { params });
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading club payments',
        action: 'Please try again',
        customMessages: {
          403: 'You do not have permission to view club payments',
          404: 'Club not found'
        }
      });
    }
  },
};

export type { RequestPaymentRequest, ProcessPaymentRequest, PaymentResponse, UpdatePaymentRequest, ClubPaymentResponse }; 