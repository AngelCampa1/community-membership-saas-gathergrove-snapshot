import apiClient from './apiClient';
import { logger } from '@/lib/logger';

export interface LeadCaptureData {
  email: string;
  name?: string;
  source: 'exit-intent' | 'newsletter' | 'lead-magnet' | 'consultation' | 'template-download' | 'tool-dues-calculator' | 'tool-stack-calculator' | 'tool-event-budget';
  variant?: string;
  metadata?: Record<string, unknown>;
  companyWebsite?: string;
  turnstileToken?: string;
}

export interface LeadCaptureResponse {
  success: boolean;
  message: string;
  leadId?: string;
}

export const marketingService = {
  // Capture lead from exit-intent modal
  captureExitIntentLead: async (data: LeadCaptureData): Promise<LeadCaptureResponse> => {
    try {
      const response = await apiClient.post<LeadCaptureResponse>('/marketing/leads', {
        ...data,
        capturedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        currentUrl: window.location.href
      });

      return response.data;
    } catch (error: unknown) {
      logger.error('Lead capture failed', error);
      
      // Return proper error response instead of silently failing
      return {
        success: false,
        message: 'We\'re experiencing technical difficulties. Please try again later or contact us directly.'
      };
    }
  },

  // Capture lead from a free tool (dues calculator, stack calculator, event budget)
  captureToolLead: async (data: LeadCaptureData): Promise<LeadCaptureResponse> => {
    try {
      const response = await apiClient.post<LeadCaptureResponse>('/marketing/leads', {
        ...data,
        capturedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        currentUrl: window.location.href
      });

      return response.data;
    } catch (error: unknown) {
      logger.error('Tool lead capture failed', error);

      return {
        success: false,
        message: 'We\'re experiencing technical difficulties. Please try again later or contact us directly.'
      };
    }
  },

  // Capture lead from the footer newsletter signup
  captureNewsletterLead: async (data: LeadCaptureData): Promise<LeadCaptureResponse> => {
    try {
      const response = await apiClient.post<LeadCaptureResponse>('/marketing/leads', {
        ...data,
        capturedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        currentUrl: window.location.href
      });

      return response.data;
    } catch (error: unknown) {
      logger.error('Newsletter lead capture failed', error);

      return {
        success: false,
        message: 'We\'re experiencing technical difficulties. Please try again later or contact us directly.'
      };
    }
  },

  // Track analytics events
  trackEvent: async (eventName: string, data: Record<string, unknown> = {}): Promise<void> => {
    try {
      await apiClient.post('/marketing/analytics', {
        eventName, // Fixed: backend expects 'eventName' not 'event'
        data: JSON.stringify(data), // Fixed: backend expects JSON string not object
        timestamp: new Date().toISOString(),
        sessionId: getSessionId(),
        userAgent: navigator.userAgent,
        url: window.location.href // Fixed: backend expects 'url' not 'currentUrl'
      });
    } catch (error) {
      // Analytics failures shouldn't break user experience
      // Log with more context for debugging CORS and network issues
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isCorsError = errorMessage.includes('CORS') ||
                          errorMessage.includes('Network Error') ||
                          errorMessage.includes('ERR_FAILED');

      if (isCorsError) {
        logger.error('Analytics CORS/Network error - check API CORS configuration', {
          eventName,
          origin: window.location.origin,
          error: errorMessage
        });
      } else {
        logger.error('Analytics tracking failed', { eventName, error: errorMessage });
      }
    }
  },

  // Open a template PDF download in a new tab
  downloadTemplate: (slug: string): void => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
    window.open(`${apiBase}/api/v1/marketing/templates/${slug}/download`, '_blank', 'noopener,noreferrer');
  },

  // Get lead magnet content (for future use)
  getLeadMagnet: async (type: string): Promise<{ downloadUrl: string; fileName: string }> => {
    try {
      const response = await apiClient.get(`/marketing/lead-magnets/${type}`);
      return response.data;
    } catch (error) {
      logger.error('Lead magnet fetch failed', error);
      throw new Error('Unable to generate download link');
    }
  }
};

// Helper function to get or create session ID
function getSessionId(): string {
  const sessionKey = 'gathergrove-session-id';
  let sessionId = sessionStorage.getItem(sessionKey);
  
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem(sessionKey, sessionId);
  }
  
  return sessionId;
}
