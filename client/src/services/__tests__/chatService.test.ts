/**
 * @jest-environment jsdom
 *
 * Chat Service Tests
 *
 * Tests chat functionality following boundary mocking pattern:
 * - Mock ONLY the apiClient boundary (HTTP layer)
 * - Test REAL service logic (URL construction, parameter handling, error handling)
 */

import { chatService } from '../chatService';
import apiClient from '../apiClient';

// Mock apiClient at the HTTP boundary
jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('ChatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const clubId = 1;

  // Mock response data
  const mockChatAccess = {
    hasAccess: true,
    canSendMessages: true,
    isAdministrator: false,
    chatEnabled: true,
  };

  const mockChatMessage = {
    id: 'msg-1',
    content: 'Hello everyone!',
    senderName: 'John Doe',
    senderId: 123,
    sentAt: '2025-01-15T10:30:00Z',
    isCurrentUser: true,
  };

  const mockChatHistory = {
    messages: [mockChatMessage],
    hasMore: false,
    oldestMessageId: 'msg-1',
  };

  describe('checkChatAccess', () => {
    it('should check chat access successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockChatAccess });

      const result = await chatService.checkChatAccess(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/clubs/${clubId}/chat/access`);
      expect(result).toEqual(mockChatAccess);
    });

    it('should return access details with all properties', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockChatAccess });

      const result = await chatService.checkChatAccess(clubId);

      expect(result.hasAccess).toBe(true);
      expect(result.canSendMessages).toBe(true);
      expect(result.chatEnabled).toBe(true);
    });

    it('should throw error when access forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(chatService.checkChatAccess(clubId)).rejects.toBeDefined();
    });

    it('should throw error when club not found (404)', async () => {
      const error = { response: { status: 404, data: { message: 'Not Found' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(chatService.checkChatAccess(clubId)).rejects.toBeDefined();
    });

    it('should throw error when chat disabled (423)', async () => {
      const error = { response: { status: 423, data: { message: 'Locked' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(chatService.checkChatAccess(clubId)).rejects.toBeDefined();
    });

    it('should throw error on network failure', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network Error'));

      await expect(chatService.checkChatAccess(clubId)).rejects.toBeDefined();
    });
  });

  describe('getChatHistory', () => {
    it('should get chat history successfully with default limit', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockChatHistory });

      const result = await chatService.getChatHistory(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/chat/messages?limit=50`
      );
      expect(result).toEqual(mockChatHistory);
    });

    it('should include before parameter when provided', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockChatHistory });

      await chatService.getChatHistory(clubId, 'msg-previous');

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/chat/messages?before=msg-previous&limit=50`
      );
    });

    it('should use custom limit when provided', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockChatHistory });

      await chatService.getChatHistory(clubId, undefined, 100);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/chat/messages?limit=100`
      );
    });

    it('should include both before and custom limit', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockChatHistory });

      await chatService.getChatHistory(clubId, 'msg-123', 25);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/chat/messages?before=msg-123&limit=25`
      );
    });

    it('should return messages array', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockChatHistory });

      const result = await chatService.getChatHistory(clubId);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content).toBe('Hello everyone!');
    });

    it('should throw error when access forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(chatService.getChatHistory(clubId)).rejects.toBeDefined();
    });

    it('should throw error when chat not found (404)', async () => {
      const error = { response: { status: 404, data: { message: 'Not Found' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(chatService.getChatHistory(clubId)).rejects.toBeDefined();
    });

    it('should throw error on rate limit (429)', async () => {
      const error = { response: { status: 429, data: { message: 'Too Many Requests' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(chatService.getChatHistory(clubId)).rejects.toBeDefined();
    });
  });

  describe('sendMessage', () => {
    const sendRequest = {
      content: 'Hello world!',
    };

    const mockSentMessage = {
      id: 'msg-new',
      content: 'Hello world!',
      senderName: 'John Doe',
      senderId: 123,
      sentAt: '2025-01-15T10:35:00Z',
      isCurrentUser: true,
    };

    it('should send message successfully', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockSentMessage });

      const result = await chatService.sendMessage(clubId, sendRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/chat/messages`,
        sendRequest
      );
      expect(result).toEqual(mockSentMessage);
    });

    it('should return sent message with id', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockSentMessage });

      const result = await chatService.sendMessage(clubId, sendRequest);

      expect(result.id).toBe('msg-new');
      expect(result.content).toBe('Hello world!');
      expect(result.isCurrentUser).toBe(true);
    });

    it('should throw error on invalid message (400)', async () => {
      const error = { response: { status: 400, data: { message: 'Bad Request' } } };
      mockApiClient.post.mockRejectedValue(error);

      await expect(chatService.sendMessage(clubId, sendRequest)).rejects.toBeDefined();
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockApiClient.post.mockRejectedValue(error);

      await expect(chatService.sendMessage(clubId, sendRequest)).rejects.toBeDefined();
    });

    it('should throw error when message too long (413)', async () => {
      const error = { response: { status: 413, data: { message: 'Payload Too Large' } } };
      mockApiClient.post.mockRejectedValue(error);

      await expect(chatService.sendMessage(clubId, sendRequest)).rejects.toBeDefined();
    });

    it('should throw error when chat disabled (423)', async () => {
      const error = { response: { status: 423, data: { message: 'Locked' } } };
      mockApiClient.post.mockRejectedValue(error);

      await expect(chatService.sendMessage(clubId, sendRequest)).rejects.toBeDefined();
    });

    it('should throw error on rate limit (429)', async () => {
      const error = { response: { status: 429, data: { message: 'Too Many Requests' } } };
      mockApiClient.post.mockRejectedValue(error);

      await expect(chatService.sendMessage(clubId, sendRequest)).rejects.toBeDefined();
    });

    it('should throw error on network failure', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network Error'));

      await expect(chatService.sendMessage(clubId, sendRequest)).rejects.toBeDefined();
    });
  });

  describe('service export', () => {
    it('should export chatService instance', () => {
      expect(chatService).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof chatService.checkChatAccess).toBe('function');
      expect(typeof chatService.getChatHistory).toBe('function');
      expect(typeof chatService.sendMessage).toBe('function');
    });
  });
});
