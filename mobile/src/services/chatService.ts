import { authService } from './authService';
import { ChatHistoryResponse, ChatAccessResponse, SendMessageRequest, ChatMessage } from '@/types';
import { API_CONFIG } from '@/constants';
import { ErrorHandler } from '@/utils/errorHandler';

/**
 * Service for chat operations - leverages existing Stories 32 & 33 APIs
 */
export class ChatService {
  /**
   * Check if user has access to club chat
   */
  static async checkChatAccess(clubId: number): Promise<ChatAccessResponse> {
    try {
      const token = await authService.getStoredToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // MEM-07 fix: Use finally block for guaranteed timeout cleanup
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/clubs/${clubId}/chat/access`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();
        return data;
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Request timed out. Please check your connection and try again.');
        }
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      
      if (error instanceof Error) {
        throw error;
      }
      
      // Use centralized error handler for consistent error messages
      const appError = ErrorHandler.handleChatError(error, 'Chat Access Check');
      throw new Error(appError.message);
    }
  }

  /**
   * Get chat message history with optional pagination
   */
  static async getChatHistory(
    clubId: number,
    options: {
      before?: string;
      limit?: number;
    } = {}
  ): Promise<ChatHistoryResponse> {
    try {
      const token = await authService.getStoredToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const params = new URLSearchParams();
      if (options.before) {
        params.append('before', options.before);
      }
      if (options.limit) {
        params.append('limit', options.limit.toString());
      }

      const url = `${API_CONFIG.BASE_URL}/api/v1/clubs/${clubId}/chat/messages${params.toString() ? `?${params.toString()}` : ''}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for chat history

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();
        return data;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Chat history request timed out. Please check your connection and try again.');
        }
        throw fetchError;
      }
    } catch (error) {
      
      if (error instanceof Error) {
        throw error;
      }
      
      // Use centralized error handler for consistent error messages
      const appError = ErrorHandler.handleChatError(error, 'Chat History Load');
      throw new Error(appError.message);
    }
  }

  /**
   * Send a new message to the club chat
   */
  static async sendMessage(clubId: number, request: SendMessageRequest): Promise<ChatMessage> {
    try {
      const token = await authService.getStoredToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout for sending messages

      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/clubs/${clubId}/chat/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();
        return data;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Message send timed out. Please check your connection and try again.');
        }
        throw fetchError;
      }
    } catch (error) {
      
      if (error instanceof Error) {
        throw error;
      }
      
      // Use centralized error handler for consistent error messages
      const appError = ErrorHandler.handleChatError(error, 'Send Message');
      throw new Error(appError.message);
    }
  }
} 