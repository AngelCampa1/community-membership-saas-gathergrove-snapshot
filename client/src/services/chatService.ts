import { ErrorHandler } from '@/lib/errorHandler';
import { ChatHistoryResponse, ChatMessageResponse, SendMessageRequest, ChatAccessResponse } from '@/types/chat';
import apiClient from './apiClient';

class ChatService {

  /**
   * Check if user has access to club chat
   */
  async checkChatAccess(clubId: number): Promise<ChatAccessResponse> {
    try {
      const response = await apiClient.get<ChatAccessResponse>(`/clubs/${clubId}/chat/access`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'checking chat access',
        action: 'Please try refreshing the page or contact club administrators',
        customMessages: {
          403: 'You do not have permission to access chat in this club',
          404: 'Club not found or chat is not enabled',
          423: 'Chat has been temporarily disabled by administrators'
        }
      });
    }
  }

  /**
   * Get chat history for a club
   */
  async getChatHistory(clubId: number, before?: string, limit: number = 50): Promise<ChatHistoryResponse> {
    try {
      const params = new URLSearchParams();
      if (before) params.append('before', before);
      params.append('limit', limit.toString());

      const queryString = params.toString();
      const response = await apiClient.get<ChatHistoryResponse>(
        `/clubs/${clubId}/chat/messages${queryString ? `?${queryString}` : ''}`
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading chat history',
        action: 'Please try refreshing the chat or check your connection',
        customMessages: {
          403: 'You do not have permission to view chat messages',
          404: 'Chat not found or has been disabled',
          429: 'Too many requests. Please wait a moment before loading more messages'
        }
      });
    }
  }

  /**
   * Send a message to club chat
   */
  async sendMessage(clubId: number, request: SendMessageRequest): Promise<ChatMessageResponse> {
    try {
      const response = await apiClient.post<ChatMessageResponse>(`/clubs/${clubId}/chat/messages`, request);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'sending message',
        action: 'Please check your message and try again',
        customMessages: {
          400: 'Message is empty or contains invalid content',
          403: 'You do not have permission to send messages in this chat',
          413: 'Message is too long. Please shorten your message and try again',
          423: 'Chat has been temporarily disabled',
          429: 'You are sending messages too quickly. Please wait a moment'
        }
      });
    }
  }
}

export const chatService = new ChatService(); 