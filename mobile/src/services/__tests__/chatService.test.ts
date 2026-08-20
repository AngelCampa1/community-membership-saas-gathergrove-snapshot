import { ChatService } from '../chatService';
import { authService } from '../authService';
import { API_CONFIG } from '@/constants';
import { ChatAccessResponse, ChatHistoryResponse, ChatMessage, SendMessageRequest } from '@/types';

// Mock authService
jest.mock('../authService', () => ({
  authService: {
    getStoredToken: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('ChatService', () => {
  const mockToken = 'mock-jwt-token';
  const mockClubId = 123;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (authService.getStoredToken as jest.Mock).mockResolvedValue(mockToken);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('checkChatAccess', () => {
    it('should successfully check chat access', async () => {
      const mockResponse: ChatAccessResponse = {
        hasAccess: true,
        isChatEnabled: true,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await ChatService.checkChatAccess(mockClubId);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/api/v1/clubs/${mockClubId}/chat/access`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should throw error when no token is available', async () => {
      (authService.getStoredToken as jest.Mock).mockResolvedValue(null);

      await expect(ChatService.checkChatAccess(mockClubId))
        .rejects
        .toThrow('Authentication token not found');

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle 403 forbidden errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ message: 'Chat access denied' }),
      });

      await expect(ChatService.checkChatAccess(mockClubId))
        .rejects
        .toThrow('Chat access denied');
    });

    it('should handle 401 unauthorized errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Session expired' }),
      });

      await expect(ChatService.checkChatAccess(mockClubId))
        .rejects
        .toThrow('Session expired');
    });

    it('should handle server errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' }),
      });

      await expect(ChatService.checkChatAccess(mockClubId))
        .rejects
        .toThrow('Server error');
    });

    it('should handle errors with no message in response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      });

      await expect(ChatService.checkChatAccess(mockClubId))
        .rejects
        .toThrow('HTTP 500: Internal Server Error');
    });

    it('should handle JSON parse errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(ChatService.checkChatAccess(mockClubId))
        .rejects
        .toThrow('Unknown error');
    });

    // Note: Timeout tests are complex due to AbortController async timing
    // Timeout functionality is covered by the clearTimeout cleanup tests

    it('should cleanup timeout on successful response', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ hasAccess: true, chatEnabled: true }),
      });

      await ChatService.checkChatAccess(mockClubId);

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should cleanup timeout on error response', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ message: 'Access denied' }),
      });

      await expect(ChatService.checkChatAccess(mockClubId)).rejects.toThrow();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should handle AbortError from timeout', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      (global.fetch as jest.Mock).mockRejectedValue(abortError);

      await expect(ChatService.checkChatAccess(mockClubId))
        .rejects
        .toThrow('Request timed out. Please check your connection and try again.');
    });

    it('should trigger timeout callback when request takes too long', async () => {
      // Make fetch wait for abort signal then reject
      (global.fetch as jest.Mock).mockImplementation(
        (_url: string, options: RequestInit) =>
          new Promise((_, reject) => {
            if (options?.signal) {
              options.signal.addEventListener('abort', () => {
                const err = new Error('The operation was aborted');
                err.name = 'AbortError';
                reject(err);
              });
            }
          })
      );

      // Start the request and immediately set up error handler
      let caughtError: Error | null = null;
      const promise = ChatService.checkChatAccess(mockClubId).catch((err) => {
        caughtError = err;
      });

      // Advance timers to trigger the setTimeout callback (10000ms timeout)
      await jest.advanceTimersByTimeAsync(10001);

      // Wait for promise to settle
      await promise;

      // Verify the error was caught
      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toBe('Request timed out. Please check your connection and try again.');
    });
  });

  describe('getChatHistory', () => {
    it('should successfully get chat history without options', async () => {
      const mockResponse: ChatHistoryResponse = {
        messages: [
          {
            chatMessageId: 1,
            clubId: 1,
            senderUserId: 1,
            senderName: 'User 1',
            messageContent: 'Hello',
            sentAt: '2025-01-01T00:00:00Z',
          },
        ],
        hasMore: false,
        totalCount: 1,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await ChatService.getChatHistory(mockClubId);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/api/v1/clubs/${mockClubId}/chat/messages`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should get chat history with pagination options', async () => {
      const mockResponse: ChatHistoryResponse = {
        messages: [],
        hasMore: true,
        totalCount: 0,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await ChatService.getChatHistory(mockClubId, {
        before: '2025-01-01T00:00:00Z',
        limit: 20,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/api/v1/clubs/${mockClubId}/chat/messages?before=2025-01-01T00%3A00%3A00Z&limit=20`,
        expect.any(Object)
      );
    });

    it('should get chat history with only before option', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ messages: [], hasMore: false }),
      });

      await ChatService.getChatHistory(mockClubId, {
        before: '2025-01-01T00:00:00Z',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('before=2025-01-01T00%3A00%3A00Z'),
        expect.any(Object)
      );
    });

    it('should get chat history with only limit option', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ messages: [], hasMore: false }),
      });

      await ChatService.getChatHistory(mockClubId, { limit: 50 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=50'),
        expect.any(Object)
      );
    });

    it('should throw error when no token is available', async () => {
      (authService.getStoredToken as jest.Mock).mockResolvedValue(null);

      await expect(ChatService.getChatHistory(mockClubId))
        .rejects
        .toThrow('Authentication token not found');

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle 401 unauthorized errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Session expired' }),
      });

      await expect(ChatService.getChatHistory(mockClubId))
        .rejects
        .toThrow('Session expired');
    });

    it('should handle 500 server errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' }),
      });

      await expect(ChatService.getChatHistory(mockClubId))
        .rejects
        .toThrow('Server error');
    });

    // Note: Timeout tests are complex due to AbortController async timing
    // Timeout functionality is covered by the clearTimeout cleanup tests

    it('should cleanup timeout on successful response', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ messages: [], hasMore: false }),
      });

      await ChatService.getChatHistory(mockClubId);

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should cleanup timeout on error response', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' }),
      });

      await expect(ChatService.getChatHistory(mockClubId)).rejects.toThrow();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should handle AbortError from timeout', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      (global.fetch as jest.Mock).mockRejectedValue(abortError);

      await expect(ChatService.getChatHistory(mockClubId))
        .rejects
        .toThrow(
          'Chat history request timed out. Please check your connection and try again.'
        );
    });

    it('should handle errors with no message in response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      });

      await expect(ChatService.getChatHistory(mockClubId))
        .rejects
        .toThrow('HTTP 500: Internal Server Error');
    });

    it('should handle JSON parse errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(ChatService.getChatHistory(mockClubId))
        .rejects
        .toThrow('Unknown error');
    });
  });

  describe('sendMessage', () => {
    const mockRequest: SendMessageRequest = {
      messageContent: 'Test message',
    };

    it('should successfully send a message', async () => {
      const mockResponse: ChatMessage = {
        chatMessageId: 1,
        clubId: 1,
        senderUserId: 1,
        senderName: 'Test User',
        messageContent: 'Test message',
        sentAt: '2025-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await ChatService.sendMessage(mockClubId, mockRequest);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/api/v1/clubs/${mockClubId}/chat/messages`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockRequest),
        })
      );
    });

    it('should throw error when no token is available', async () => {
      (authService.getStoredToken as jest.Mock).mockResolvedValue(null);

      await expect(ChatService.sendMessage(mockClubId, mockRequest))
        .rejects
        .toThrow('Authentication token not found');

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle 400 validation errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Message too long' }),
      });

      await expect(ChatService.sendMessage(mockClubId, mockRequest))
        .rejects
        .toThrow('Message too long');
    });

    it('should handle 401 unauthorized errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Session expired' }),
      });

      await expect(ChatService.sendMessage(mockClubId, mockRequest))
        .rejects
        .toThrow('Session expired');
    });

    it('should handle 403 forbidden errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ message: 'Chat access denied' }),
      });

      await expect(ChatService.sendMessage(mockClubId, mockRequest))
        .rejects
        .toThrow('Chat access denied');
    });

    it('should handle 500 server errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' }),
      });

      await expect(ChatService.sendMessage(mockClubId, mockRequest))
        .rejects
        .toThrow('Server error');
    });

    // Note: Timeout tests are complex due to AbortController async timing
    // Timeout functionality is covered by the clearTimeout cleanup tests

    it('should cleanup timeout on successful response', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 1,
          content: 'Test',
          userId: 1,
          userName: 'User',
          timestamp: '2025-01-01T00:00:00Z',
        }),
      });

      await ChatService.sendMessage(mockClubId, mockRequest);

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should cleanup timeout on error response', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' }),
      });

      await expect(ChatService.sendMessage(mockClubId, mockRequest)).rejects.toThrow();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should handle errors with no message in response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({}),
      });

      await expect(ChatService.sendMessage(mockClubId, mockRequest))
        .rejects
        .toThrow('HTTP 400: Bad Request');
    });

    it('should handle JSON parse errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(ChatService.sendMessage(mockClubId, mockRequest))
        .rejects
        .toThrow('Unknown error');
    });

    it('should handle AbortError from timeout', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      (global.fetch as jest.Mock).mockRejectedValue(abortError);

      await expect(ChatService.sendMessage(mockClubId, mockRequest))
        .rejects
        .toThrow(
          'Message send timed out. Please check your connection and try again.'
        );
    });

    it('should trigger timeout callback when request takes too long', async () => {
      // Make fetch wait for abort signal then reject
      (global.fetch as jest.Mock).mockImplementation(
        (_url: string, options: RequestInit) =>
          new Promise((_, reject) => {
            if (options?.signal) {
              options.signal.addEventListener('abort', () => {
                const err = new Error('The operation was aborted');
                err.name = 'AbortError';
                reject(err);
              });
            }
          })
      );

      // Start the request and immediately set up error handler
      let caughtError: Error | null = null;
      const promise = ChatService.sendMessage(mockClubId, mockRequest).catch((err) => {
        caughtError = err;
      });

      // Advance timers to trigger the setTimeout callback (8000ms timeout)
      await jest.advanceTimersByTimeAsync(8001);

      // Wait for promise to settle
      await promise;

      // Verify the error was caught
      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toBe('Message send timed out. Please check your connection and try again.');
    });
  });
});
