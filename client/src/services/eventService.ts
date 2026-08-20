import apiClient from './apiClient';
import { ErrorHandler } from '@/lib/errorHandler';
import { CreateEventRequest, UpdateEventRequest, EventResponse, EventRsvpResponse, UpdateRsvpRequest, SendEventInvitationsRequest, SendEventInvitationsResponse, PublicEventResponse, PaymentLinkResponse, PayEventRequest, EventPaymentResponse, NonMemberEventPaymentRequest, NonMemberEventPaymentResponse, MembershipTypeOption } from '@/types/event';
import {
  EventSeries,
  MultiSessionEvent,
  WaitlistEntry,
  WaitlistReorderRequest,
  WaitlistNotification,
  QRCodeData,
  QRCodeOptions,
  QRCodeAnalytics,
  QRCodeHistoryEntry,
  BulkQRCodeRequest,
  FeedbackSurvey,
  SurveyResponse,
  FeedbackAnalytics,
  FeedbackTemplate,
  FeedbackInvitation,
  EventMetrics as EventMetricsAnalytics,
  EventAnalyticsData,
  ComparativeAnalysis,
  PredictiveInsights,
  PerformanceBenchmarkData,
  AnalyticsExportRequest
} from '@/types/analytics';

export const eventService = {
  /**
   * Get all events for a club, optionally filtered by upcoming/past
   */
  async getEventsByClub(clubId: number, filter?: 'upcoming' | 'past'): Promise<EventResponse[]> {
    try {
      const params = filter ? { filter } : undefined;
      const response = await apiClient.get<EventResponse[]>(`/clubs/${clubId}/events`, { params });
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading events',
        action: 'Please try refreshing the page',
        customMessages: {
          403: 'You do not have permission to view events in this club', 
          404: 'Club not found or you do not have access to it'
        }
      });
    }
  },

  /**
   * Get a specific event by ID
   */
  async getEventById(clubId: number, eventId: number): Promise<EventResponse> {
    try {
      const response = await apiClient.get<EventResponse>(`/clubs/${clubId}/events/${eventId}`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading event details',
        action: 'Please try refreshing the page or go back to the events list',
        customMessages: {
          404: 'Event not found or has been cancelled',
          403: 'You do not have permission to view this event'
        }
      });
    }
  },

  /**
   * Create a new event
   */
  async createEvent(clubId: number, event: CreateEventRequest): Promise<EventResponse> {
    try {
      const response = await apiClient.post<EventResponse>(`/clubs/${clubId}/events`, event);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'creating event',
        action: 'Please check the event details and try again',
        customMessages: {
          400: 'Please verify all event details are correct',
          403: 'You do not have permission to create events',
          409: 'An event with this name already exists at this time'
        }
      });
    }
  },

  /**
   * Update an existing event
   */
  async updateEvent(clubId: number, eventId: number, event: UpdateEventRequest): Promise<EventResponse> {
    try {
      const response = await apiClient.put<EventResponse>(`/clubs/${clubId}/events/${eventId}`, event);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'updating event',
        action: 'Please check the event details and try again',
        customMessages: {
          400: 'Please verify all event details are correct',
          404: 'Event not found or has been cancelled',
          403: 'You do not have permission to edit this event',
          409: 'Cannot update event - RSVPs may already be collected'
        }
      });
    }
  },

  /**
   * Delete an event
   */
  async deleteEvent(clubId: number, eventId: number): Promise<void> {
    try {
      await apiClient.delete(`/clubs/${clubId}/events/${eventId}`);
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'deleting event',
        action: 'Please try again or contact support@gathergrove.club if the issue persists',
        customMessages: {
          404: 'Event not found or has already been deleted',
          403: 'You do not have permission to delete this event',
          409: 'Cannot delete event - members have already RSVP\'d'
        }
      });
    }
  },

  /**
   * Update or create an RSVP for a member and event
   */
  async updateRsvp(clubId: number, eventId: number, memberId: number, rsvp: UpdateRsvpRequest): Promise<EventRsvpResponse> {
    try {
      const response = await apiClient.put<EventRsvpResponse>(`/clubs/${clubId}/events/${eventId}/rsvps/${memberId}`, rsvp);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'updating RSVP',
        action: 'Please try again or contact event organizers',
        customMessages: {
          404: 'Event not found or registration has closed',
          403: 'You do not have permission to RSVP for this event',
          409: 'RSVP deadline has passed or event is at capacity'
        }
      });
    }
  },

  /**
   * Get all RSVPs for a specific event
   */
  async getEventRsvps(clubId: number, eventId: number): Promise<EventRsvpResponse[]> {
    try {
      const response = await apiClient.get<EventRsvpResponse[]>(`/clubs/${clubId}/events/${eventId}/rsvps`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading event RSVPs',
        action: 'Please try refreshing the page',
        customMessages: {
          404: 'Event not found or has been cancelled',
          403: 'You do not have permission to view RSVPs for this event'
        }
      });
    }
  },

  /**
   * Get an RSVP for a specific member and event
   */
  async getMemberRsvp(clubId: number, eventId: number, memberId: number): Promise<EventRsvpResponse | null> {
    try {
      const response = await apiClient.get<EventRsvpResponse>(`/clubs/${clubId}/events/${eventId}/rsvps/${memberId}`);
      return response.data;
    } catch (error) {
      // For this method, 404 is expected when no RSVP exists - return null
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number } };
        if (axiosError.response?.status === 404) {
          return null;
        }
      }
      
      throw ErrorHandler.handleApiError(error, {
        context: 'checking RSVP status',
        action: 'Please try refreshing the page',
        customMessages: {
          403: 'You do not have permission to view this RSVP information'
        }
      });
    }
  },

  /**
   * Send invitations for an event to specified or all club members
   */
  async sendEventInvitations(clubId: number, eventId: number, request: SendEventInvitationsRequest): Promise<SendEventInvitationsResponse> {
    try {
      const response = await apiClient.post<SendEventInvitationsResponse>(`/clubs/${clubId}/events/${eventId}/invitations`, request);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'sending event invitations',
        action: 'Please try again or contact support@gathergrove.club if the issue persists',
        customMessages: {
          404: 'Event not found or has been cancelled',
          403: 'You do not have permission to send invitations for this event',
          409: 'Invitations have already been sent or event has passed',
          402: 'Your club subscription does not include invitation features. Please upgrade to Grow tier.'
        }
      });
    }
  },

  // Advanced Event Management Methods

  /**
   * Get event series for a club
   */
  async getEventSeries(clubId: number): Promise<EventSeries[]> {
    try {
      const response = await apiClient.get<EventSeries[]>(`/clubs/${clubId}/event-series`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading event series',
        action: 'Please try refreshing the page',
      });
    }
  },

  /**
   * Create a new event series
   */
  async createEventSeries(clubId: number, seriesData: Omit<EventSeries, 'id' | 'createdAt' | 'updatedAt'>): Promise<EventSeries> {
    try {
      const response = await apiClient.post<EventSeries>(`/clubs/${clubId}/event-series`, seriesData);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'creating event series',
        action: 'Please check the series details and try again',
      });
    }
  },

  /**
   * Delete an event series
   */
  async deleteEventSeries(clubId: number, seriesId: number): Promise<void> {
    try {
      await apiClient.delete(`/clubs/${clubId}/event-series/${seriesId}`);
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'deleting event series',
        action: 'Please try again',
      });
    }
  },

  /**
   * Get event waitlist
   */
  async getEventWaitlist(clubId: number, eventId: number): Promise<WaitlistEntry[]> {
    try {
      const response = await apiClient.get<WaitlistEntry[]>(`/clubs/${clubId}/events/${eventId}/waitlist`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading event waitlist',
        action: 'Please try refreshing the page',
      });
    }
  },

  /**
   * Add member to waitlist
   */
  async addToWaitlist(clubId: number, eventId: number, memberData: Omit<WaitlistEntry, 'id' | 'position' | 'joinedAt' | 'status'>): Promise<WaitlistEntry> {
    try {
      const response = await apiClient.post<WaitlistEntry>(`/clubs/${clubId}/events/${eventId}/waitlist`, memberData);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'adding to waitlist',
        action: 'Please try again',
      });
    }
  },

  /**
   * Remove member from waitlist
   */
  async removeFromWaitlist(clubId: number, eventId: number, entryId: number): Promise<void> {
    try {
      await apiClient.delete(`/clubs/${clubId}/events/${eventId}/waitlist/${entryId}`);
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'removing from waitlist',
        action: 'Please try again',
      });
    }
  },

  /**
   * Promote member from waitlist to event
   */
  async promoteFromWaitlist(clubId: number, eventId: number, entryId: number): Promise<void> {
    try {
      await apiClient.post(`/clubs/${clubId}/events/${eventId}/waitlist/${entryId}/promote`);
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'promoting from waitlist',
        action: 'Please try again',
      });
    }
  },

  /**
   * Reorder waitlist entries
   */
  async reorderWaitlist(clubId: number, eventId: number, reorderData: WaitlistReorderRequest[]): Promise<void> {
    try {
      await apiClient.put(`/clubs/${clubId}/events/${eventId}/waitlist/reorder`, { entries: reorderData });
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'reordering waitlist',
        action: 'Please try again',
      });
    }
  },

  /**
   * Send notifications to waitlist
   */
  async notifyWaitlist(clubId: number, eventId: number, notificationData: WaitlistNotification): Promise<{ sent: number; failed: number }> {
    try {
      const response = await apiClient.post<{ sent: number; failed: number }>(`/clubs/${clubId}/events/${eventId}/waitlist/notify`, notificationData);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'sending waitlist notifications',
        action: 'Please try again',
      });
    }
  },

  /**
   * Create multi-session event
   */
  async createMultiSessionEvent(clubId: number, eventData: Omit<MultiSessionEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<MultiSessionEvent> {
    try {
      const response = await apiClient.post<MultiSessionEvent>(`/clubs/${clubId}/multi-session-events`, eventData);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'creating multi-session event',
        action: 'Please check the event details and try again',
      });
    }
  },

  /**
   * Update multi-session event
   */
  async updateMultiSessionEvent(clubId: number, eventId: number, eventData: Partial<Omit<MultiSessionEvent, 'id' | 'clubId' | 'createdAt' | 'updatedAt'>>): Promise<MultiSessionEvent> {
    try {
      const response = await apiClient.put<MultiSessionEvent>(`/clubs/${clubId}/multi-session-events/${eventId}`, eventData);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'updating multi-session event',
        action: 'Please check the event details and try again',
      });
    }
  },

  /**
   * Get multi-session event details
   */
  async getMultiSessionEvent(clubId: number, eventId: number): Promise<MultiSessionEvent> {
    try {
      const response = await apiClient.get<MultiSessionEvent>(`/clubs/${clubId}/multi-session-events/${eventId}`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading multi-session event',
        action: 'Please try refreshing the page',
      });
    }
  },

  /**
   * Generate QR code for event
   */
  async generateQRCode(clubId: number, eventId: number, options: QRCodeOptions): Promise<QRCodeData> {
    try {
      const response = await apiClient.post<QRCodeData>(`/clubs/${clubId}/events/${eventId}/qr-code`, options);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'generating QR code',
        action: 'Please try again',
      });
    }
  },

  /**
   * Generate bulk QR codes
   */
  async generateBulkQRCodes(clubId: number, options: BulkQRCodeRequest): Promise<QRCodeData[]> {
    try {
      const response = await apiClient.post<QRCodeData[]>(`/clubs/${clubId}/events/qr-codes/bulk`, options);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'generating bulk QR codes',
        action: 'Please try again',
      });
    }
  },

  /**
   * Get QR code analytics
   */
  async getQRCodeAnalytics(clubId: number, eventId: number): Promise<QRCodeAnalytics> {
    try {
      const response = await apiClient.get<QRCodeAnalytics>(`/clubs/${clubId}/events/${eventId}/qr-code/analytics`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading QR code analytics',
        action: 'Please try refreshing the page',
      });
    }
  },

  /**
   * Get QR code history
   */
  async getQRCodeHistory(clubId: number, eventId: number): Promise<QRCodeHistoryEntry[]> {
    try {
      const response = await apiClient.get<QRCodeHistoryEntry[]>(`/clubs/${clubId}/events/${eventId}/qr-code/history`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading QR code history',
        action: 'Please try refreshing the page',
      });
    }
  },

  // Analytics Methods

  /**
   * Get event metrics for analytics
   */
  async getEventMetrics(clubId: number, options?: { timeRange?: string; eventId?: number }): Promise<EventMetricsAnalytics> {
    try {
      const params = new URLSearchParams();
      if (options?.timeRange) params.append('timeRange', options.timeRange);
      if (options?.eventId) params.append('eventId', options.eventId.toString());

      const response = await apiClient.get<EventMetricsAnalytics>(`/clubs/${clubId}/analytics/metrics?${params}`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading event metrics',
        action: 'Please try refreshing the page',
      });
    }
  },

  /**
   * Get event analytics data
   */
  async getEventAnalytics(clubId: number, options?: { timeRange?: string; eventId?: number }): Promise<EventAnalyticsData[]> {
    try {
      const params = new URLSearchParams();
      if (options?.timeRange) params.append('timeRange', options.timeRange);
      if (options?.eventId) params.append('eventId', options.eventId.toString());

      const response = await apiClient.get<EventAnalyticsData[]>(`/clubs/${clubId}/analytics/events?${params}`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading event analytics',
        action: 'Please try refreshing the page',
      });
    }
  },

  /**
   * Get comparative analysis
   */
  async getComparativeAnalysis(clubId: number, options?: { timeRange?: string }): Promise<ComparativeAnalysis> {
    try {
      const params = new URLSearchParams();
      if (options?.timeRange) params.append('timeRange', options.timeRange);

      const response = await apiClient.get<ComparativeAnalysis>(`/clubs/${clubId}/analytics/comparison?${params}`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading comparative analysis',
        action: 'Please try refreshing the page',
      });
    }
  },

  /**
   * Get predictive insights
   */
  async getPredictiveInsights(clubId: number, options?: { eventId?: number }): Promise<PredictiveInsights> {
    try {
      const params = new URLSearchParams();
      if (options?.eventId) params.append('eventId', options.eventId.toString());

      const response = await apiClient.get<PredictiveInsights>(`/clubs/${clubId}/analytics/insights?${params}`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading predictive insights',
        action: 'Please try refreshing the page',
      });
    }
  },

  /**
   * Get performance benchmarks
   */
  async getPerformanceBenchmarks(clubId: number, options?: { timeRange?: string }): Promise<PerformanceBenchmarkData[]> {
    try {
      const params = new URLSearchParams();
      if (options?.timeRange) params.append('timeRange', options.timeRange);

      const response = await apiClient.get<PerformanceBenchmarkData[]>(`/clubs/${clubId}/analytics/benchmarks?${params}`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading performance benchmarks',
        action: 'Please try refreshing the page',
      });
    }
  },

  /**
   * Export analytics report
   */
  async exportAnalyticsReport(clubId: number, options: AnalyticsExportRequest): Promise<Blob> {
    try {
      const response = await apiClient.post(`/clubs/${clubId}/analytics/export`, options, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'exporting analytics report',
        action: 'Please try again',
      });
    }
  },

  // Feedback Methods

  /**
   * Get feedback surveys for an event
   */
  async getFeedbackSurveys(clubId: number, eventId: number): Promise<FeedbackSurvey[]> {
    try {
      const response = await apiClient.get<FeedbackSurvey[]>(`/clubs/${clubId}/events/${eventId}/feedback/surveys`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading feedback surveys',
        action: 'Please try refreshing the page',
      });
    }
  },

  /**
   * Create feedback survey
   */
  async createFeedbackSurvey(clubId: number, eventId: number, surveyData: Omit<FeedbackSurvey, 'id' | 'eventId' | 'clubId' | 'createdAt' | 'updatedAt'>): Promise<FeedbackSurvey> {
    try {
      const response = await apiClient.post<FeedbackSurvey>(`/clubs/${clubId}/events/${eventId}/feedback/surveys`, surveyData);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'creating feedback survey',
        action: 'Please check the survey details and try again',
      });
    }
  },

  /**
   * Update feedback survey
   */
  async updateFeedbackSurvey(clubId: number, eventId: number, surveyId: string, surveyData: Partial<Omit<FeedbackSurvey, 'id' | 'eventId' | 'clubId' | 'createdAt' | 'updatedAt'>>): Promise<FeedbackSurvey> {
    try {
      const response = await apiClient.put<FeedbackSurvey>(`/clubs/${clubId}/events/${eventId}/feedback/surveys/${surveyId}`, surveyData);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'updating feedback survey',
        action: 'Please try again',
      });
    }
  },

  /**
   * Delete feedback survey
   */
  async deleteFeedbackSurvey(clubId: number, eventId: number, surveyId: string): Promise<void> {
    try {
      await apiClient.delete(`/clubs/${clubId}/events/${eventId}/feedback/surveys/${surveyId}`);
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'deleting feedback survey',
        action: 'Please try again',
      });
    }
  },

  /**
   * Get feedback responses
   */
  async getFeedbackResponses(clubId: number, eventId: number, surveyId: string): Promise<SurveyResponse[]> {
    try {
      const response = await apiClient.get<SurveyResponse[]>(`/clubs/${clubId}/events/${eventId}/feedback/surveys/${surveyId}/responses`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading feedback responses',
        action: 'Please try refreshing the page',
      });
    }
  },

  /**
   * Submit feedback response
   */
  async submitFeedbackResponse(clubId: number, eventId: number, surveyId: string, responseData: Omit<SurveyResponse, 'id' | 'surveyId' | 'eventId' | 'submittedAt'>): Promise<SurveyResponse> {
    try {
      const response = await apiClient.post<SurveyResponse>(`/clubs/${clubId}/events/${eventId}/feedback/surveys/${surveyId}/responses`, responseData);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'submitting feedback response',
        action: 'Please try again',
      });
    }
  },

  /**
   * Get feedback analytics
   */
  async getFeedbackAnalytics(clubId: number, eventId: number, surveyId: string): Promise<FeedbackAnalytics> {
    try {
      const response = await apiClient.get<FeedbackAnalytics>(`/clubs/${clubId}/events/${eventId}/feedback/surveys/${surveyId}/analytics`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading feedback analytics',
        action: 'Please try refreshing the page',
      });
    }
  },

  /**
   * Export feedback data
   */
  async exportFeedbackData(clubId: number, eventId: number, surveyId: string, format: string): Promise<Blob> {
    try {
      const response = await apiClient.get(`/clubs/${clubId}/events/${eventId}/feedback/surveys/${surveyId}/export?format=${format}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'exporting feedback data',
        action: 'Please try again',
      });
    }
  },

  /**
   * Send feedback survey invitations
   */
  async sendFeedbackInvitations(clubId: number, eventId: number, surveyId: string, invitationData: FeedbackInvitation): Promise<{ sent: number; failed: number }> {
    try {
      const response = await apiClient.post<{ sent: number; failed: number }>(`/clubs/${clubId}/events/${eventId}/feedback/surveys/${surveyId}/invitations`, invitationData);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'sending feedback invitations',
        action: 'Please try again',
      });
    }
  },

  /**
   * Get feedback survey templates
   */
  async getFeedbackTemplates(clubId: number): Promise<FeedbackTemplate[]> {
    try {
      const response = await apiClient.get<FeedbackTemplate[]>(`/clubs/${clubId}/feedback/templates`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading feedback templates',
        action: 'Please try refreshing the page',
      });
    }
  },

  // QR Code Methods (Legacy - now using newer endpoints above)

  /**
   * Get event QR codes
   */
  async getEventQRCodes(eventId: number): Promise<QRCodeData[]> {
    try {
      const response = await apiClient.get<QRCodeData[]>(`/events/${eventId}/qr-codes`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading QR codes',
        action: 'Please try refreshing the page',
      });
    }
  },

  /**
   * Generate event QR code
   */
  async generateEventQRCode(eventId: number, request: QRCodeOptions): Promise<QRCodeData> {
    try {
      const response = await apiClient.post<QRCodeData>(`/events/${eventId}/qr-codes`, request);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'generating QR code',
        action: 'Please try again',
      });
    }
  },

  /**
   * Download QR code
   */
  async downloadQRCode(qrCodeId: string, format: string): Promise<Blob> {
    try {
      const response = await apiClient.get(`/qr-codes/${qrCodeId}/download?format=${format}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'downloading QR code',
        action: 'Please try again',
      });
    }
  },

  /**
   * Get QR code share URL
   */
  async getQRCodeShareUrl(qrCodeId: string): Promise<string> {
    try {
      const response = await apiClient.get(`/qr-codes/${qrCodeId}/share-url`);
      return response.data.url;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'getting share URL',
        action: 'Please try again',
      });
    }
  },

  /**
   * Update QR code status
   */
  async updateQRCodeStatus(qrCodeId: string, isActive: boolean): Promise<QRCodeData> {
    try {
      const response = await apiClient.put<QRCodeData>(`/qr-codes/${qrCodeId}/status`, { isActive });
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'updating QR code status',
        action: 'Please try again',
      });
    }
  },

  /**
   * Delete QR code
   */
  async deleteQRCode(qrCodeId: string): Promise<void> {
    try {
      await apiClient.delete(`/qr-codes/${qrCodeId}`);
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'deleting QR code',
        action: 'Please try again',
      });
    }
  },

  /**
   * Bulk download QR codes
   */
  async bulkDownloadQRCodes(qrCodeIds: string[]): Promise<Blob> {
    try {
      const response = await apiClient.post('/qr-codes/bulk-download', { qrCodeIds }, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'bulk downloading QR codes',
        action: 'Please try again',
      });
    }
  },

  /**
   * Validate QR check-in
   */
  async validateQRCheckIn(eventId: number, qrData: string): Promise<{ valid: boolean; message: string; attendee?: { id: number; name: string } }> {
    try {
      const response = await apiClient.post<{ valid: boolean; message: string; attendee?: { id: number; name: string } }>(`/events/${eventId}/qr-validate`, { qrData });
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'validating QR code',
        action: 'Please try again',
      });
    }
  },

  /**
   * Process QR action
   */
  async processQRAction(eventId: number, action: string, data: Record<string, unknown>): Promise<{ success: boolean; message: string; result?: unknown }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string; result?: unknown }>(`/events/${eventId}/qr-action`, { action, data });
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'processing QR action',
        action: 'Please try again',
      });
    }
  },

  // Payment Link Methods

  /**
   * Generate payment link for a paid event
   */
  async generatePaymentLink(clubId: number, eventId: number): Promise<PaymentLinkResponse> {
    try {
      const response = await apiClient.post<PaymentLinkResponse>(`/clubs/${clubId}/events/${eventId}/payment-link`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'generating payment link',
        action: 'Please ensure the event has pricing configured and try again',
        customMessages: {
          400: 'Cannot generate payment link - event must have pricing configured',
          403: 'You do not have permission to generate payment links for this event',
          404: 'Event not found or has been cancelled',
        }
      });
    }
  },

  /**
   * Get public event details by payment token (no authentication required)
   */
  async getPublicEventByToken(token: string): Promise<PublicEventResponse> {
    try {
      const response = await apiClient.get<PublicEventResponse>(`/events/public/${token}`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading event details',
        action: 'Please check the link and try again',
        customMessages: {
          404: 'Event not found - the link may be invalid',
          410: 'This payment link has expired - please contact the event organizer',
        }
      });
    }
  },

  /**
   * Pay for an event (member self-service payment)
   * EC-03: Member Event Payment
   */
  async payForEvent(request: PayEventRequest): Promise<EventPaymentResponse> {
    try {
      const response = await apiClient.post<EventPaymentResponse>(
        `/users/me/events/pay`,
        request
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'processing event payment',
        action: 'Please verify your payment method and try again',
        customMessages: {
          400: 'This event does not require payment or has invalid pricing',
          401: 'You must be logged in to pay for events',
          402: 'Payment failed. Please check your card details and try again',
          403: 'You must be a member of this club to pay member pricing',
          404: 'Event not found or has been cancelled',
          409: 'You have already paid for this event',
        }
      });
    }
  },

  /**
   * Pay for event as a guest (non-member) with optional membership upgrade and account creation
   * No authentication required
   */
  async payForEventAsGuest(request: NonMemberEventPaymentRequest): Promise<NonMemberEventPaymentResponse> {
    try {
      const response = await apiClient.post<NonMemberEventPaymentResponse>('/public/events/pay', request);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'processing guest event payment',
        action: 'Please verify your information and payment method, then try again',
        customMessages: {
          400: 'Invalid payment information. Please check all required fields',
          402: 'Payment failed. Please check your card details and try again',
          404: 'Event not found or has been cancelled',
          409: 'You have already registered for this event',
        }
      });
    }
  },

  /**
   * Get available membership types for a club hosting an event
   * No authentication required
   */
  async getAvailableMembershipTypes(eventId: number): Promise<MembershipTypeOption[]> {
    try {
      const response = await apiClient.get<MembershipTypeOption[]>(`/public/events/${eventId}/membership-types`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading membership options',
        action: 'Please try again',
        customMessages: {
          404: 'Event not found or has been cancelled',
        }
      });
    }
  },
}; 