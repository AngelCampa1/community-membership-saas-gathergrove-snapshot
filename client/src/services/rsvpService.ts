import { ErrorHandler } from '@/lib/errorHandler';
import { RsvpViaLinkResponse } from '@/types/rsvp';
import apiClient from './apiClient';

/**
 * Service for RSVP operations via email links
 */
export class RsvpService {
  /**
   * Processes an RSVP via a unique token from an email link
   */
  static async processRsvpViaLink(token: string): Promise<RsvpViaLinkResponse> {
    try {
      const response = await apiClient.get<RsvpViaLinkResponse>(`/rsvps/via-link?token=${encodeURIComponent(token)}`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'processing RSVP',
        action: 'Please check the link and try again or contact the event organizer',
        customMessages: {
          400: 'Invalid RSVP link. Please check the URL',
          404: 'RSVP link not found or has expired',
          410: 'This RSVP link has expired. Please contact the event organizer',
          409: 'RSVP has already been submitted for this event',
          423: 'RSVP is no longer available for this event'
        }
      });
    }
  }
}

export default RsvpService; 