// QUAL-01 fix: Properly typed event service (removed eslint-disable for any)

import axios, { AxiosInstance } from 'axios';
import { API_CONFIG, ERROR_MESSAGES } from '@/constants';
import { EventResponse, EventRsvpResponse, UpdateRsvpRequest } from '@/types';
import { authService } from './authService';
import { ErrorHandler } from '@/utils/errorHandler';

// QUAL-01 fix: Define proper types for event service responses

export interface EventAttendee {
  id: number;
  memberId: number;
  memberName: string;
  email: string;
  checkedIn: boolean;
  checkInTime?: string;
  registrationDate?: string;
  guestCount?: number;
}

export interface CheckInStats {
  totalRegistered: number;
  checkedIn: number;
  checkInRate: number;
  pendingCheckIns: number;
  lastCheckInTime?: string;
}

export interface CheckInResult {
  success: boolean;
  checkInTime: string;
  message?: string;
  attendeeId?: number;
}

export interface QRCodeData {
  code: string;
  memberId?: number;
  eventId?: number;
  timestamp?: number;
}

export interface QRCheckInResult {
  success: boolean;
  valid: boolean;
  memberId?: number;
  memberName?: string;
  checkInTime?: string;
  message?: string;
  error?: string;
}

export interface BulkCheckInResult {
  success: boolean;
  checkedInCount: number;
  failedCount: number;
  results: Array<{
    memberId: number;
    success: boolean;
    error?: string;
  }>;
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  includeContactInfo?: boolean;
  includeCheckInTimes?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

export interface FeedbackFormField {
  id: string;
  type: 'text' | 'rating' | 'select' | 'checkbox' | 'textarea';
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface FeedbackForm {
  id?: number;
  eventId: number;
  title: string;
  description?: string;
  fields: FeedbackFormField[];
  questions?: any[]; // For compatibility with EventFeedback.tsx
  isActive: boolean;
  deadline?: string;
}

export interface FeedbackSubmission {
  responses: Record<string, string | number | boolean | string[]>;
  rating?: number;
  comment?: string;
  anonymous?: boolean;
  memberId?: number;
}

export interface FeedbackResult {
  success: boolean;
  feedbackId?: number;
  message?: string;
}

export interface WaitlistStatus {
  isOnWaitlist: boolean;
  position?: number;
  totalWaitlisted: number;
  estimatedWaitTime?: string;
  joinedAt?: string;
  canJoinWaitlist?: boolean;
  eventCapacity?: number;
  currentAttendees?: number;
}

export interface WaitlistResult {
  success: boolean;
  position?: number;
  message?: string;
}

export interface EventSeriesEvent {
  id: number;
  title: string;
  name?: string; // For compatibility with EventSeriesScreen
  startDate: string;
  endDate: string;
  eventDateTime?: string; // For compatibility with EventSeriesScreen
  registrationStatus?: 'open' | 'closed' | 'full' | 'registered' | 'waitlisted' | 'not_registered';
  attendeeCount?: number;
  maxAttendees?: number;
  isUpcoming?: boolean;
  location?: string;
}

export interface EventSeries {
  id: number | string;
  name: string;
  description?: string;
  recurrencePattern: string;
  startDate: string;
  endDate?: string;
  location?: string;
  maxAttendees?: number;
  events: EventSeriesEvent[];
  totalEvents: number;
  upcomingEvents: number;
}

export interface BulkRegistrationResult {
  success: boolean;
  registeredCount: number;
  failedCount: number;
  results: Array<{
    eventId: number;
    success: boolean;
    error?: string;
  }>;
}

class EventServiceClass {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'X-Mobile-Client': 'true',
        'User-Agent': 'GatherGrove-Mobile/1.0.0',
      },
    });

    this.setupRequestInterceptor();
  }

  /**
   * Get event attendees - required for EventCheckIn screen
   */
  async getEventAttendees(clubId: number, eventId: number): Promise<EventAttendee[]> {
    try {
      const response = await this.axiosInstance.get(
        `${API_CONFIG.ENDPOINTS.EVENTS(clubId)}/${eventId}/attendees`
      );
      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' && 
          (('response' in error) || ('request' in error) || error.constructor?.name === 'AxiosError')) {
        throw this.handleEventError(error);
      }
      throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  /**
   * Get check-in statistics for an event
   */
  async getCheckInStats(clubId: number, eventId: number): Promise<CheckInStats> {
    try {
      const response = await this.axiosInstance.get(
        `${API_CONFIG.ENDPOINTS.EVENTS(clubId)}/${eventId}/checkin/statistics`
      );
      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' && 
          (('response' in error) || ('request' in error) || error.constructor?.name === 'AxiosError')) {
        throw this.handleEventError(error);
      }
      throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  /**
   * Check in an attendee
   */
  async checkInAttendee(clubId: number, eventId: number, memberId: number): Promise<CheckInResult> {
    try {
      const response = await this.axiosInstance.post(
        `${API_CONFIG.ENDPOINTS.EVENTS(clubId)}/${eventId}/checkin/attendee`,
        { memberId }
      );
      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' && 
          (('response' in error) || ('request' in error) || error.constructor?.name === 'AxiosError')) {
        throw this.handleEventError(error);
      }
      throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  /**
   * Validate QR code for check-in
   * Note: Uses existing QR check-in endpoint - backend doesn't have separate validation endpoint
   */
  async validateQRCheckIn(clubId: number, eventId: number, qrData: QRCodeData): Promise<QRCheckInResult> {
    try {
      const response = await this.axiosInstance.post(
        `${API_CONFIG.ENDPOINTS.EVENTS(clubId)}/${eventId}/checkin/qr`,
        qrData
      );
      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' && 
          (('response' in error) || ('request' in error) || error.constructor?.name === 'AxiosError')) {
        throw this.handleEventError(error);
      }
      throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  /**
   * Bulk check-in multiple attendees
   * WARNING: This endpoint is not yet implemented in the backend
   * TODO: Remove or implement backend endpoint
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async bulkCheckIn(_clubId: number, _eventId: number, _memberIds: number[]): Promise<BulkCheckInResult> {
    // Backend endpoint not implemented yet
    throw new Error('Bulk check-in feature is not yet available. Please check in attendees individually.');

    /* Disabled until backend implements this endpoint
    try {
      const response = await this.axiosInstance.post(
        `${API_CONFIG.ENDPOINTS.EVENTS(clubId)}/${eventId}/checkin/bulk`,
        { memberIds }
      );
      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' &&
          (('response' in error) || ('request' in error) || error.constructor?.name === 'AxiosError')) {
        throw this.handleEventError(error);
      }
      throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    }
    */
  }

  /**
   * Export attendance data
   * WARNING: This endpoint is not yet implemented in the backend
   * TODO: Remove or implement backend endpoint
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async exportAttendanceData(_clubId: number, _eventId: number, _options: ExportOptions): Promise<ExportResult> {
    // Backend endpoint not implemented yet
    throw new Error('Attendance export feature is not yet available. Please use the web dashboard.');

    /* Disabled until backend implements this endpoint
    try {
      const response = await this.axiosInstance.post(
        `${API_CONFIG.ENDPOINTS.EVENTS(clubId)}/${eventId}/attendance/export`,
        options
      );
      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' &&
          (('response' in error) || ('request' in error) || error.constructor?.name === 'AxiosError')) {
        throw this.handleEventError(error);
      }
      throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    }
    */
  }

  /**
   * Set up axios request interceptor to include JWT token
   */
  private setupRequestInterceptor(): void {
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await authService.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get upcoming events for the user's club
   * Implements M04 story requirements for viewing upcoming club events
   */
  async getUpcomingEvents(clubId: number): Promise<EventResponse[]> {
    try {
      const response = await this.axiosInstance.get<EventResponse[]>(
        `${API_CONFIG.ENDPOINTS.EVENTS(clubId)}?filter=upcoming`
      );

      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' && 
          (('response' in error) || ('request' in error) || error.constructor?.name === 'AxiosError')) {
        throw this.handleEventError(error);
      }
      throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  /**
   * Get a specific event by ID - used for M09 event details screen
   */
  async getEventById(clubId: number, eventId: number): Promise<EventResponse> {
    try {
      const response = await this.axiosInstance.get<EventResponse>(
        `${API_CONFIG.ENDPOINTS.EVENTS(clubId)}/${eventId}`
      );

      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' && 
          (('response' in error) || ('request' in error) || error.constructor?.name === 'AxiosError')) {
        throw this.handleEventError(error);
      }
      throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  /**
   * Get the current user's RSVP for a specific event
   */
  async getMemberRsvp(clubId: number, eventId: number, memberId: number): Promise<EventRsvpResponse | null> {
    try {
      const response = await this.axiosInstance.get<EventRsvpResponse>(
        `${API_CONFIG.ENDPOINTS.EVENTS(clubId)}/${eventId}/rsvps/${memberId}`
      );

      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number } };
        if (axiosError.response?.status === 404) {
          // No RSVP found - this is expected for events the user hasn't RSVP'd to
          return null;
        }
      }
      
      if (error && typeof error === 'object' && 
          (('response' in error) || ('request' in error) || error.constructor?.name === 'AxiosError')) {
        throw this.handleEventError(error);
      }
      throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  /**
   * Update or create the current user's RSVP for a specific event
   */
  async updateMemberRsvp(clubId: number, eventId: number, memberId: number, request: UpdateRsvpRequest): Promise<EventRsvpResponse> {
    try {
      const response = await this.axiosInstance.put<EventRsvpResponse>(
        `${API_CONFIG.ENDPOINTS.EVENTS(clubId)}/${eventId}/rsvps/${memberId}`,
        request
      );

      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' && 
          (('response' in error) || ('request' in error) || error.constructor?.name === 'AxiosError')) {
        throw this.handleEventError(error);
      }
      throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  /**
   * Get feedback form for a specific event
   */
  async getFeedbackForm(clubId: number, eventId: number): Promise<FeedbackForm> {
    try {
      const response = await this.axiosInstance.get(
        `${API_CONFIG.ENDPOINTS.EVENTS(clubId)}/${eventId}/feedback-form`
      );

      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' && 
          (('response' in error) || ('request' in error) || error.constructor?.name === 'AxiosError')) {
        throw this.handleEventError(error);
      }
      throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  /**
   * Submit feedback for a specific event
   */
  async submitFeedback(clubId: number, eventId: number, feedbackData: FeedbackSubmission): Promise<FeedbackResult> {
    try {
      const response = await this.axiosInstance.post(
        `${API_CONFIG.ENDPOINTS.EVENTS(clubId)}/${eventId}/feedback`,
        feedbackData
      );

      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' && 
          (('response' in error) || ('request' in error) || error.constructor?.name === 'AxiosError')) {
        throw this.handleEventError(error);
      }
      throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  /**
   * Submit event feedback (legacy method name for compatibility)
   */
  async submitEventFeedback(clubId: number, eventId: number, feedbackData: FeedbackSubmission): Promise<FeedbackResult> {
    return this.submitFeedback(clubId, eventId, feedbackData);
  }

  /**
   * Get waitlist status for an event
   */
  async getWaitlistStatus(clubId: number, eventId: number): Promise<WaitlistStatus> {
    try {
      const response = await this.axiosInstance.get(
        `${API_CONFIG.ENDPOINTS.EVENTS(clubId)}/${eventId}/waitlist/status`
      );

      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' && 
          (('response' in error) || ('request' in error) || error.constructor?.name === 'AxiosError')) {
        throw this.handleEventError(error);
      }
      throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  /**
   * Join event waitlist
   */
  async joinWaitlist(clubId: number, eventId: number): Promise<WaitlistResult> {
    try {
      const response = await this.axiosInstance.post(
        `${API_CONFIG.ENDPOINTS.EVENTS(clubId)}/${eventId}/waitlist/join`
      );

      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' && 
          (('response' in error) || ('request' in error) || error.constructor?.name === 'AxiosError')) {
        throw this.handleEventError(error);
      }
      throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  /**
   * Leave event waitlist
   */
  async leaveWaitlist(clubId: number, eventId: number): Promise<WaitlistResult> {
    try {
      const response = await this.axiosInstance.post(
        `${API_CONFIG.ENDPOINTS.EVENTS(clubId)}/${eventId}/waitlist/leave`
      );

      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' && 
          (('response' in error) || ('request' in error) || error.constructor?.name === 'AxiosError')) {
        throw this.handleEventError(error);
      }
      throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  /**
   * Check in to an event using QR code
   * For manual check-in, use checkInAttendee() instead
   */
  async checkIntoEvent(clubId: number, eventId: number, checkInData: QRCodeData): Promise<CheckInResult> {
    try {
      const response = await this.axiosInstance.post(
        `${API_CONFIG.ENDPOINTS.EVENTS(clubId)}/${eventId}/checkin/qr`,
        checkInData
      );

      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' &&
          (('response' in error) || ('request' in error) || error.constructor?.name === 'AxiosError')) {
        throw this.handleEventError(error);
      }
      throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  /**
   * Get event series by ID
   * Used in EventSeriesScreen to display series information and upcoming events
   */
  async getEventSeries(clubId: number, seriesId: string | number): Promise<EventSeries> {
    try {
      const response = await this.axiosInstance.get(
        `/api/v1/clubs/${clubId}/event-series/${seriesId}`
      );

      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' &&
          (('response' in error) || ('request' in error) || error.constructor?.name === 'AxiosError')) {
        throw this.handleEventError(error);
      }
      throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  /**
   * Bulk register for all upcoming events in a series
   * Allows users to register for multiple events at once
   */
  async bulkRegisterForSeries(clubId: number, seriesId: string | number, memberId?: number): Promise<BulkRegistrationResult> {
    try {
      const response = await this.axiosInstance.post(
        `/api/v1/clubs/${clubId}/event-series/${seriesId}/register`,
        { memberId }
      );

      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' &&
          (('response' in error) || ('request' in error) || error.constructor?.name === 'AxiosError')) {
        throw this.handleEventError(error);
      }
      throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  /**
   * Handle event-related API errors
   */
  private handleEventError(error: unknown): Error {
    const appError = ErrorHandler.handleEventError(error, 'Event Management');
    return new Error(appError.message);
  }
}

// Export singleton instance
export const EventService = new EventServiceClass(); 