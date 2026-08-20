import apiClient from './apiClient';
import {
  EventPaymentOverview,
  IssueRefundRequest,
  RecordManualPaymentRequest,
  EventRefundResponse,
  ManualPaymentResponse,
} from '@/types/eventPayment';

export const eventPaymentAdminService = {
  getPaymentOverview: async (clubId: number, eventId: number): Promise<EventPaymentOverview> => {
    const response = await apiClient.get<EventPaymentOverview>(
      `/clubs/${clubId}/events/${eventId}/payments/admin/overview`
    );
    return response.data;
  },

  issueRefund: async (
    clubId: number,
    eventId: number,
    request: IssueRefundRequest
  ): Promise<EventRefundResponse> => {
    const response = await apiClient.post<EventRefundResponse>(
      `/clubs/${clubId}/events/${eventId}/payments/admin/refund`,
      request
    );
    return response.data;
  },

  recordManualPayment: async (
    clubId: number,
    eventId: number,
    request: RecordManualPaymentRequest
  ): Promise<ManualPaymentResponse> => {
    const response = await apiClient.post<ManualPaymentResponse>(
      `/clubs/${clubId}/events/${eventId}/payments/admin/manual-payment`,
      request
    );
    return response.data;
  },

  exportPaymentData: async (
    clubId: number,
    eventId: number,
    format: string = 'csv'
  ): Promise<Blob> => {
    const response = await apiClient.get(
      `/clubs/${clubId}/events/${eventId}/payments/admin/export?format=${format}`,
      { responseType: 'blob' }
    );
    return response.data;
  },
};

