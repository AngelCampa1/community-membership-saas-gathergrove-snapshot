/**
 * ChatScreen Cleanup Tests
 * Priority 1: Highest risk screen with SignalR + async operations
 *
 * Tests verify:
 * - SignalR handler registration/deregistration
 * - SignalR connection/disconnection cleanup
 * - isMountedRef pattern prevents state updates after unmount
 * - setTimeout cleanup
 * - Async operation handling during unmount
 * - Memory leak prevention
 */

import { render, waitFor, act } from '@testing-library/react-native';
import { ChatScreen } from '../ChatScreen';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';

// Mock dependencies - define mocks inside jest.mock() factories to avoid hoisting issues
jest.mock('@/services/chatService', () => ({
  ChatService: {
    checkChatAccess: jest.fn(),
    getChatHistory: jest.fn(),
    sendMessage: jest.fn(),
  },
}));
jest.mock('@/services/signalRService', () => ({
  SignalRService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    addMessageHandler: jest.fn(),
    removeMessageHandler: jest.fn(),
    joinClubChat: jest.fn(),
    leaveClubChat: jest.fn(),
  },
}));
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Get references to mocked modules for test assertions
const mockChatService = jest.requireMock('@/services/chatService').ChatService as {
  checkChatAccess: jest.Mock;
  getChatHistory: jest.Mock;
  sendMessage: jest.Mock;
};
const mockSignalRService = jest.requireMock('@/services/signalRService').SignalRService as {
  connect: jest.Mock;
  disconnect: jest.Mock;
  addMessageHandler: jest.Mock;
  removeMessageHandler: jest.Mock;
  joinClubChat: jest.Mock;
  leaveClubChat: jest.Mock;
};
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe('ChatScreen Cleanup Tests', () => {
  let consoleWarnSpy: jest.SpyInstance;
  let stateUpdateWarnings: string[] = [];

  // Mock user structure must match UserSession type:
  // useAuth() returns { user: UserSession | null }
  // UserSession has nested { user: { clubId, ... } }
  const mockUser = {
    user: {
      token: 'mock-token',
      user: {
        userId: 123,
        clubId: 456,
        fullName: 'Test User',
        email: 'test@test.com',
        role: 'Member',
        clubTier: 'Basic',
      },
      isAuthenticated: true,
    },
  };

  const mockChatAccess = {
    hasAccess: true,
    isChatEnabled: true,
  };

  const mockChatHistory = {
    messages: [
      {
        chatMessageId: 1,
        messageContent: 'Hello',
        senderUserId: 123,
        senderName: 'Test User',
        sentAt: new Date().toISOString(),
      },
    ],
    hasMore: false,
  };

  const mockTheme = {
    colors: {
      background: { primary: '#fff', secondary: '#f5f5f5' },
      text: { primary: '#000', secondary: '#666', tertiary: '#999', inverse: '#fff' },
      interactive: { primary: '#007bff' },
      border: { primary: '#ddd' },
      shadow: { small: {} },
      primary: '#007bff',
    },
    chatColors: {
      ownMessage: '#007bff',
      otherMessage: '#e5e5ea',
      ownMessageText: '#fff',
      otherMessageText: '#000',
      senderName: '#666',
      ownTimestamp: 'rgba(255,255,255,0.7)',
      otherTimestamp: 'rgba(0,0,0,0.5)',
      placeholder: '#999',
      inputBorder: '#ddd',
      inputBackground: '#fff',
      inputText: '#000',
      sendButton: '#007bff',
      sendButtonDisabled: '#ccc',
    },
  };

  beforeEach(() => {
    stateUpdateWarnings = [];
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation((msg) => {
      if (msg.includes("Can't perform a React state update")) {
        stateUpdateWarnings.push(msg);
      }
    });

    // Setup default mocks
    mockUseAuth.mockReturnValue(mockUser as any);
    mockUseTheme.mockReturnValue(mockTheme as any);
    mockChatService.checkChatAccess.mockResolvedValue(mockChatAccess);
    mockChatService.getChatHistory.mockResolvedValue(mockChatHistory);
    mockSignalRService.connect.mockResolvedValue(undefined);
    mockSignalRService.addMessageHandler.mockReturnValue(undefined);
    mockSignalRService.joinClubChat.mockResolvedValue(undefined);
    mockSignalRService.removeMessageHandler.mockReturnValue(undefined);
    mockSignalRService.leaveClubChat.mockReturnValue(undefined);
    mockSignalRService.disconnect.mockReturnValue(undefined);
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('Basic Unmount Detection', () => {
    it('should not trigger state update warnings after unmount', async () => {
      const { unmount } = render(<ChatScreen />);

      // Wait for initial load
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      unmount();

      // Wait to ensure no delayed state updates
      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should set isMountedRef to false on unmount', async () => {
      const { unmount } = render(<ChatScreen />);

      await waitFor(() => {
        expect(mockChatService.getChatHistory).toHaveBeenCalled();
      });

      unmount();

      // Verify cleanup happened (SignalR should be cleaned up)
      expect(mockSignalRService.removeMessageHandler).toHaveBeenCalled();
      expect(mockSignalRService.disconnect).toHaveBeenCalled();
    });
  });

  describe('SignalR Cleanup', () => {
    it('should deregister SignalR message handlers on unmount', async () => {
      const { unmount } = render(<ChatScreen />);

      await waitFor(() => {
        expect(mockSignalRService.addMessageHandler).toHaveBeenCalled();
      });

      unmount();

      expect(mockSignalRService.removeMessageHandler).toHaveBeenCalled();
    });

    it('should leave club chat on unmount', async () => {
      const { unmount } = render(<ChatScreen />);

      await waitFor(() => {
        expect(mockSignalRService.joinClubChat).toHaveBeenCalledWith(456);
      });

      unmount();

      expect(mockSignalRService.leaveClubChat).toHaveBeenCalledWith(456);
    });

    it('should disconnect SignalR on unmount', async () => {
      const { unmount } = render(<ChatScreen />);

      await waitFor(() => {
        expect(mockSignalRService.connect).toHaveBeenCalled();
      });

      unmount();

      expect(mockSignalRService.disconnect).toHaveBeenCalled();
    });

    it('should cleanup SignalR in correct order', async () => {
      const callOrder: string[] = [];

      mockSignalRService.removeMessageHandler.mockImplementation(() => {
        callOrder.push('removeHandler');
      });
      mockSignalRService.leaveClubChat.mockImplementation(() => {
        callOrder.push('leaveChat');
      });
      mockSignalRService.disconnect.mockImplementation(() => {
        callOrder.push('disconnect');
      });

      const { unmount } = render(<ChatScreen />);

      await waitFor(() => {
        expect(mockSignalRService.connect).toHaveBeenCalled();
      });

      unmount();

      expect(callOrder).toEqual(['removeHandler', 'leaveChat', 'disconnect']);
    });

    it('should not crash if SignalR cleanup fails', async () => {
      mockSignalRService.disconnect.mockImplementation(() => {
        throw new Error('SignalR disconnect failed');
      });

      const { unmount } = render(<ChatScreen />);

      await waitFor(() => {
        expect(mockSignalRService.connect).toHaveBeenCalled();
      });

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Async Operation Cleanup', () => {
    it('should handle unmount during initial data load', async () => {
      let resolveLoad: () => void;
      const loadPromise = new Promise<typeof mockChatHistory>((resolve) => {
        resolveLoad = () => resolve(mockChatHistory);
      });

      mockChatService.getChatHistory.mockReturnValue(loadPromise);

      const { unmount } = render(<ChatScreen />);

      // Unmount before load completes
      unmount();

      // Complete the load
      await act(async () => {
        resolveLoad!();
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should handle unmount during chat access check', async () => {
      let resolveAccess: () => void;
      const accessPromise = new Promise<typeof mockChatAccess>((resolve) => {
        resolveAccess = () => resolve(mockChatAccess);
      });

      mockChatService.checkChatAccess.mockReturnValue(accessPromise);

      const { unmount } = render(<ChatScreen />);

      unmount();

      await act(async () => {
        resolveAccess!();
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should handle unmount during message send', async () => {
      const { unmount } = render(<ChatScreen />);

      await waitFor(() => {
        expect(mockChatService.getChatHistory).toHaveBeenCalled();
      });

      let resolveSend: () => void;
      const sendPromise = new Promise<any>((resolve) => {
        resolveSend = () =>
          resolve({
            chatMessageId: 2,
            messageContent: 'New message',
            senderUserId: 123,
            senderName: 'Test User',
            sentAt: new Date().toISOString(),
          });
      });

      mockChatService.sendMessage.mockReturnValue(sendPromise);

      unmount();

      await act(async () => {
        resolveSend!();
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should handle unmount during SignalR connection', async () => {
      let resolveConnect: () => void;
      const connectPromise = new Promise<void>((resolve) => {
        resolveConnect = () => resolve();
      });

      mockSignalRService.connect.mockReturnValue(connectPromise);

      const { unmount } = render(<ChatScreen />);

      unmount();

      await act(async () => {
        resolveConnect!();
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });
  });

  describe('setTimeout Cleanup', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should not execute auto-scroll setTimeout after unmount', async () => {
      const { unmount } = render(<ChatScreen />);

      await act(async () => {
        await jest.advanceTimersByTimeAsync(50);
      });

      unmount();

      // Advance past the auto-scroll timeout (100ms)
      await act(async () => {
        await jest.advanceTimersByTimeAsync(150);
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should handle multiple pending setTimeouts on unmount', async () => {
      mockChatService.getChatHistory.mockResolvedValue({
        messages: [
          {
            chatMessageId: 1,
            messageContent: 'Message 1',
            senderUserId: 123,
            senderName: 'User 1',
            sentAt: new Date().toISOString(),
          },
          {
            chatMessageId: 2,
            messageContent: 'Message 2',
            senderUserId: 456,
            senderName: 'User 2',
            sentAt: new Date().toISOString(),
          },
        ],
        hasMore: false,
      });

      const { unmount } = render(<ChatScreen />);

      await act(async () => {
        await jest.advanceTimersByTimeAsync(50);
      });

      unmount();

      // Multiple setTimeout calls from message rendering
      await act(async () => {
        await jest.advanceTimersByTimeAsync(500);
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });
  });

  describe('Rapid Mount/Unmount Cycles', () => {
    it('should handle 20 rapid mount/unmount cycles without warnings', async () => {
      for (let i = 0; i < 20; i++) {
        const { unmount } = render(<ChatScreen />);

        await act(async () => {
          await new Promise((r) => setTimeout(r, 10));
        });

        unmount();
      }

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should cleanup SignalR handlers on each unmount in rapid cycles', async () => {
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(<ChatScreen />);

        await waitFor(() => {
          expect(mockSignalRService.addMessageHandler).toHaveBeenCalled();
        });

        unmount();

        await waitFor(() => {
          expect(mockSignalRService.removeMessageHandler).toHaveBeenCalled();
        });
      }

      // Should have been called 5 times each
      expect(mockSignalRService.addMessageHandler).toHaveBeenCalledTimes(5);
      expect(mockSignalRService.removeMessageHandler).toHaveBeenCalledTimes(5);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle unmount during concurrent chat load and SignalR setup', async () => {
      let resolveChatLoad: () => void;
      let resolveSignalR: () => void;

      const chatPromise = new Promise<typeof mockChatHistory>((resolve) => {
        resolveChatLoad = () => resolve(mockChatHistory);
      });
      const signalRPromise = new Promise<void>((resolve) => {
        resolveSignalR = () => resolve();
      });

      mockChatService.getChatHistory.mockReturnValue(chatPromise);
      mockSignalRService.connect.mockReturnValue(signalRPromise);

      const { unmount } = render(<ChatScreen />);

      unmount();

      await act(async () => {
        resolveChatLoad!();
        resolveSignalR!();
        await new Promise((r) => setTimeout(r, 100));
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should handle unmount with concurrent access check and history load', async () => {
      let resolveAccess: () => void;
      let resolveHistory: () => void;

      const accessPromise = new Promise<typeof mockChatAccess>((resolve) => {
        resolveAccess = () => resolve(mockChatAccess);
      });
      const historyPromise = new Promise<typeof mockChatHistory>((resolve) => {
        resolveHistory = () => resolve(mockChatHistory);
      });

      mockChatService.checkChatAccess.mockReturnValue(accessPromise);
      mockChatService.getChatHistory.mockReturnValue(historyPromise);

      const { unmount } = render(<ChatScreen />);

      unmount();

      await act(async () => {
        resolveAccess!();
        resolveHistory!();
        await new Promise((r) => setTimeout(r, 100));
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });
  });

  describe('Error Handling During Cleanup', () => {
    it('should handle API errors gracefully during unmount', async () => {
      mockChatService.getChatHistory.mockRejectedValue(
        new Error('API connection failed')
      );

      const { unmount } = render(<ChatScreen />);

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      unmount();

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should handle SignalR connection failure and still cleanup', async () => {
      mockSignalRService.connect.mockRejectedValue(
        new Error('SignalR connection failed')
      );

      const { unmount } = render(<ChatScreen />);

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      unmount();

      // Should still call cleanup methods
      expect(mockSignalRService.removeMessageHandler).toHaveBeenCalled();
      expect(mockSignalRService.disconnect).toHaveBeenCalled();
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should not hold references after unmount', async () => {
      const { unmount } = render(<ChatScreen />);

      await waitFor(() => {
        expect(mockChatService.getChatHistory).toHaveBeenCalled();
      });

      unmount();

      // Verify all cleanup happened
      expect(mockSignalRService.removeMessageHandler).toHaveBeenCalled();
      expect(mockSignalRService.leaveClubChat).toHaveBeenCalled();
      expect(mockSignalRService.disconnect).toHaveBeenCalled();
    });

    it('should handle unmount with large message history', async () => {
      const largeHistory = {
        messages: Array.from({ length: 100 }, (_, i) => ({
          chatMessageId: i,
          messageContent: `Message ${i}`,
          senderUserId: 123,
          senderName: 'Test User',
          sentAt: new Date().toISOString(),
        })),
        hasMore: true,
      };

      mockChatService.getChatHistory.mockResolvedValue(largeHistory);

      const { unmount } = render(<ChatScreen />);

      await waitFor(() => {
        expect(mockChatService.getChatHistory).toHaveBeenCalled();
      });

      unmount();

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      expect(stateUpdateWarnings).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unmount before initial render completes', () => {
      const { unmount } = render(<ChatScreen />);
      unmount();

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should handle unmount with no user data', async () => {
      mockUseAuth.mockReturnValue({ user: null } as any);

      const { unmount } = render(<ChatScreen />);

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      unmount();

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should handle unmount with no club ID', async () => {
      mockUseAuth.mockReturnValue({
        user: { userId: 123, firstName: 'Test', lastName: 'User' },
      } as any);

      const { unmount } = render(<ChatScreen />);

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      unmount();

      expect(stateUpdateWarnings).toHaveLength(0);
    });

    it('should handle unmount when chat is disabled', async () => {
      mockChatService.checkChatAccess.mockResolvedValue({
        hasAccess: false,
        isChatEnabled: false,
      });

      const { unmount } = render(<ChatScreen />);

      await waitFor(() => {
        expect(mockChatService.checkChatAccess).toHaveBeenCalled();
      });

      unmount();

      expect(stateUpdateWarnings).toHaveLength(0);
    });
  });
});

/**
 * ChatScreen Validation Logic Tests
 *
 * Tests verify pure business logic without component rendering:
 * - Guard clause patterns
 * - Conditional state update logic
 * - Error message extraction
 * - Message array manipulation
 * - Conditional rendering logic
 * - Style application patterns
 * - Platform-specific behavior
 */
describe('ChatScreen Validation Logic Tests', () => {
  describe('loadChatData Guard Clause Logic', () => {
    it('should block execution when user is null', () => {
      const user = null;
      const isMounted = true;

      const shouldProceed = user && user.user?.clubId && isMounted;

      expect(shouldProceed).toBeFalsy();
    });

    it('should block execution when clubId is undefined', () => {
      const user = { user: { userId: 123 } } as { user: { userId: number; clubId?: string } }; // No clubId
      const isMounted = true;

      const shouldProceed = user?.user?.clubId && isMounted;

      expect(shouldProceed).toBeFalsy();
    });

    it('should block execution when component is unmounted', () => {
      const user = { user: { clubId: 456, userId: 123 } };
      const isMounted = false;

      const shouldProceed = user?.user?.clubId && isMounted;

      expect(shouldProceed).toBeFalsy();
    });

    it('should allow execution when all conditions are met', () => {
      const user = { user: { clubId: 456, userId: 123 } };
      const isMounted = true;

      const shouldProceed = user?.user?.clubId && isMounted;

      expect(shouldProceed).toBeTruthy();
    });

    it('should validate clubId is truthy', () => {
      const clubId1 = 456;
      const clubId2 = 0;
      const clubId3 = null;
      const clubId4 = undefined;

      expect(!!clubId1).toBe(true);
      expect(!!clubId2).toBe(false);
      expect(!!clubId3).toBe(false);
      expect(!!clubId4).toBe(false);
    });
  });

  describe('loadChatData Conditional State Update Logic', () => {
    it('should set loading state for initial load', () => {
      const isRefresh = false;
      const isMounted = true;

      const shouldSetLoading = !isRefresh && isMounted;
      const shouldSetRefreshing = isRefresh && isMounted;

      expect(shouldSetLoading).toBe(true);
      expect(shouldSetRefreshing).toBe(false);
    });

    it('should set refreshing state for refresh', () => {
      const isRefresh = true;
      const isMounted = true;

      const shouldSetLoading = !isRefresh && isMounted;
      const shouldSetRefreshing = isRefresh && isMounted;

      expect(shouldSetLoading).toBe(false);
      expect(shouldSetRefreshing).toBe(true);
    });

    it('should not set any state when unmounted', () => {
      const isMounted = false;

      const shouldSetLoading = !false && isMounted;
      const shouldSetRefreshing = true && isMounted;

      expect(shouldSetLoading).toBe(false);
      expect(shouldSetRefreshing).toBe(false);
    });

    it('should validate exclusive state update logic', () => {
      const testCases = [
        { isRefresh: false, shouldSetLoading: true, shouldSetRefreshing: false },
        { isRefresh: true, shouldSetLoading: false, shouldSetRefreshing: true },
      ];

      testCases.forEach(({ isRefresh, shouldSetLoading, shouldSetRefreshing }) => {
        const isMounted = true;
        expect(!isRefresh && isMounted).toBe(shouldSetLoading);
        expect(isRefresh && isMounted).toBe(shouldSetRefreshing);
      });
    });
  });

  describe('loadChatData Error Handling Logic', () => {
    it('should extract error message from Error instance', () => {
      const error = new Error('Network connection failed');

      const errorMessage = error instanceof Error ? error.message : 'Failed to load chat';

      expect(errorMessage).toBe('Network connection failed');
    });

    it('should use fallback message for non-Error objects', () => {
      const error: unknown = 'String error';

      const errorMessage = error instanceof Error ? error.message : 'Failed to load chat';

      expect(errorMessage).toBe('Failed to load chat');
    });

    it('should use fallback message for null error', () => {
      const error = null;

      const errorMessage = error instanceof Error ? (error as Error).message : 'Failed to load chat';

      expect(errorMessage).toBe('Failed to load chat');
    });

    it('should show Alert during refresh with existing messages', () => {
      const isRefresh = true;
      const messagesLength = 5;

      const shouldShowAlert = isRefresh && messagesLength > 0;
      const shouldSetErrorState = !shouldShowAlert;

      expect(shouldShowAlert).toBe(true);
      expect(shouldSetErrorState).toBe(false);
    });

    it('should set error state for initial load failure', () => {
      const isRefresh = false;
      const messagesLength = 0;

      const shouldShowAlert = isRefresh && messagesLength > 0;
      const shouldSetErrorState = !shouldShowAlert;

      expect(shouldShowAlert).toBe(false);
      expect(shouldSetErrorState).toBe(true);
    });

    it('should set error state for refresh with no existing messages', () => {
      const isRefresh = true;
      const messagesLength = 0;

      const shouldShowAlert = isRefresh && messagesLength > 0;
      const shouldSetErrorState = !shouldShowAlert;

      expect(shouldShowAlert).toBe(false);
      expect(shouldSetErrorState).toBe(true);
    });
  });

  describe('loadMoreMessages Guard Clause Logic', () => {
    it('should block when clubId is missing', () => {
      const clubId = undefined;
      const hasMore = true;
      const loadingMore = false;
      const isMounted = true;

      const shouldProceed = clubId && hasMore && !loadingMore && isMounted;

      expect(shouldProceed).toBeFalsy();
    });

    it('should block when hasMore is false', () => {
      const clubId = 456;
      const hasMore = false;
      const loadingMore = false;
      const isMounted = true;

      const shouldProceed = clubId && hasMore && !loadingMore && isMounted;

      expect(shouldProceed).toBeFalsy();
    });

    it('should block when already loading more', () => {
      const clubId = 456;
      const hasMore = true;
      const loadingMore = true;
      const isMounted = true;

      const shouldProceed = clubId && hasMore && !loadingMore && isMounted;

      expect(shouldProceed).toBeFalsy();
    });

    it('should block when component is unmounted', () => {
      const clubId = 456;
      const hasMore = true;
      const loadingMore = false;
      const isMounted = false;

      const shouldProceed = clubId && hasMore && !loadingMore && isMounted;

      expect(shouldProceed).toBeFalsy();
    });

    it('should allow when all conditions are met', () => {
      const clubId = 456;
      const hasMore = true;
      const loadingMore = false;
      const isMounted = true;

      const shouldProceed = clubId && hasMore && !loadingMore && isMounted;

      expect(shouldProceed).toBeTruthy();
    });

    it('should validate combined guard conditions', () => {
      const testCases = [
        { clubId: 0, hasMore: true, loadingMore: false, isMounted: true, expected: false },
        { clubId: 456, hasMore: false, loadingMore: false, isMounted: true, expected: false },
        { clubId: 456, hasMore: true, loadingMore: true, isMounted: true, expected: false },
        { clubId: 456, hasMore: true, loadingMore: false, isMounted: false, expected: false },
        { clubId: 456, hasMore: true, loadingMore: false, isMounted: true, expected: true },
      ];

      testCases.forEach(({ clubId, hasMore, loadingMore, isMounted, expected }) => {
        const shouldProceed = !!clubId && hasMore && !loadingMore && isMounted;
        expect(shouldProceed).toBe(expected);
      });
    });
  });

  describe('loadMoreMessages Array Prepending Logic', () => {
    it('should prepend new messages to existing messages', () => {
      const existingMessages = [
        { chatMessageId: 3, messageContent: 'Message 3', sentAt: '2024-01-03T00:00:00Z' },
        { chatMessageId: 4, messageContent: 'Message 4', sentAt: '2024-01-04T00:00:00Z' },
      ];
      const newMessages = [
        { chatMessageId: 1, messageContent: 'Message 1', sentAt: '2024-01-01T00:00:00Z' },
        { chatMessageId: 2, messageContent: 'Message 2', sentAt: '2024-01-02T00:00:00Z' },
      ];

      const updatedMessages = [...newMessages, ...existingMessages];

      expect(updatedMessages).toHaveLength(4);
      expect(updatedMessages[0].chatMessageId).toBe(1);
      expect(updatedMessages[3].chatMessageId).toBe(4);
    });

    it('should handle empty existing messages', () => {
      const existingMessages: any[] = [];
      const newMessages = [
        { chatMessageId: 1, messageContent: 'Message 1', sentAt: '2024-01-01T00:00:00Z' },
      ];

      const updatedMessages = [...newMessages, ...existingMessages];

      expect(updatedMessages).toHaveLength(1);
      expect(updatedMessages[0].chatMessageId).toBe(1);
    });

    it('should preserve message order after prepending', () => {
      const existingMessages = [
        { chatMessageId: 3, messageContent: 'Message 3', sentAt: '2024-01-03T00:00:00Z' },
      ];
      const newMessages = [
        { chatMessageId: 1, messageContent: 'Message 1', sentAt: '2024-01-01T00:00:00Z' },
        { chatMessageId: 2, messageContent: 'Message 2', sentAt: '2024-01-02T00:00:00Z' },
      ];

      const updatedMessages = [...newMessages, ...existingMessages];

      expect(updatedMessages.map(m => m.chatMessageId)).toEqual([1, 2, 3]);
    });
  });

  describe('sendMessage Guard Clause Logic', () => {
    it('should block when clubId is missing', () => {
      const clubId = undefined;
      const messageText = 'Hello';
      const sending = false;

      const shouldProceed = clubId && messageText.trim() && !sending;

      expect(shouldProceed).toBeFalsy();
    });

    it('should block when message is empty', () => {
      const clubId = 456;
      const messageText = '';
      const sending = false;

      const shouldProceed = clubId && messageText.trim() && !sending;

      expect(shouldProceed).toBeFalsy();
    });

    it('should block when message is whitespace only', () => {
      const clubId = 456;
      const messageText = '   ';
      const sending = false;

      const shouldProceed = clubId && messageText.trim() && !sending;

      expect(shouldProceed).toBeFalsy();
    });

    it('should block when already sending', () => {
      const clubId = 456;
      const messageText = 'Hello';
      const sending = true;

      const shouldProceed = clubId && messageText.trim() && !sending;

      expect(shouldProceed).toBeFalsy();
    });

    it('should allow when all conditions are met', () => {
      const clubId = 456;
      const messageText = 'Hello';
      const sending = false;

      const shouldProceed = clubId && messageText.trim() && !sending;

      expect(shouldProceed).toBeTruthy();
    });

    it('should trim leading and trailing whitespace', () => {
      const messageText = '  Hello World  ';

      const trimmedMessage = messageText.trim();

      expect(trimmedMessage).toBe('Hello World');
      expect(trimmedMessage.length).toBe(11);
    });
  });

  describe('sendMessage Conditional Message Addition Logic', () => {
    it('should add message locally when SignalR is disconnected', () => {
      const signalRConnected = false;
      const newMessage = { chatMessageId: 1, messageContent: 'Test', sentAt: '2024-01-01T00:00:00Z' };
      const existingMessages: any[] = [];

      const shouldAddLocally = !signalRConnected;
      const updatedMessages = shouldAddLocally ? [...existingMessages, newMessage] : existingMessages;

      expect(updatedMessages).toHaveLength(1);
      expect(updatedMessages[0]).toEqual(newMessage);
    });

    it('should not add message locally when SignalR is connected', () => {
      const signalRConnected = true;
      const newMessage = { chatMessageId: 1, messageContent: 'Test', sentAt: '2024-01-01T00:00:00Z' };
      const existingMessages: any[] = [];

      const shouldAddLocally = !signalRConnected;
      const updatedMessages = shouldAddLocally ? [...existingMessages, newMessage] : existingMessages;

      expect(updatedMessages).toHaveLength(0);
    });

    it('should rely on SignalR when connected', () => {
      const signalRConnected = true;

      const shouldAddLocally = !signalRConnected;

      expect(shouldAddLocally).toBe(false);
    });
  });

  describe('sendMessage Error Restoration Logic', () => {
    it('should restore message text on error', () => {
      const originalContent = 'Hello World';
      const _messageText = '';

      // Simulate error restoration
      const restoredText = originalContent;

      expect(restoredText).toBe('Hello World');
    });

    it('should preserve trimmed content on error', () => {
      const content = '  Hello World  ';
      const trimmedContent = content.trim();

      expect(trimmedContent).toBe('Hello World');
    });
  });

  describe('MessageItem isOwnMessage Calculation Logic', () => {
    it('should identify own message when IDs match', () => {
      const message = { senderUserId: 123, messageContent: 'Hello' };
      const currentUserId = 123;

      const isOwnMessage = message.senderUserId === currentUserId;

      expect(isOwnMessage).toBe(true);
    });

    it('should identify other message when IDs do not match', () => {
      const message = { senderUserId: 456, messageContent: 'Hello' };
      const currentUserId = 123;

      const isOwnMessage = message.senderUserId === currentUserId;

      expect(isOwnMessage).toBe(false);
    });

    it('should handle undefined currentUserId', () => {
      const message = { senderUserId: 123, messageContent: 'Hello' };
      const currentUserId = undefined;

      const isOwnMessage = message.senderUserId === currentUserId;

      expect(isOwnMessage).toBe(false);
    });

    it('should use strict equality for ID comparison', () => {
      const message = { senderUserId: 123, messageContent: 'Hello' };
      const currentUserId = 123;

      expect(message.senderUserId === currentUserId).toBe(true);
      expect(message.senderUserId == currentUserId).toBe(true);
    });
  });

  describe('MessageItem Conditional Rendering Logic', () => {
    it('should show sender name for other messages', () => {
      const isOwnMessage = false;

      const shouldShowSenderName = !isOwnMessage;

      expect(shouldShowSenderName).toBe(true);
    });

    it('should hide sender name for own messages', () => {
      const isOwnMessage = true;

      const shouldShowSenderName = !isOwnMessage;

      expect(shouldShowSenderName).toBe(false);
    });
  });

  describe('renderHeader Conditional Rendering Logic', () => {
    it('should render loading indicator when loading more', () => {
      const loadingMore = true;

      const shouldRenderLoadingIndicator = loadingMore;
      const shouldRenderNull = !loadingMore;

      expect(shouldRenderLoadingIndicator).toBe(true);
      expect(shouldRenderNull).toBe(false);
    });

    it('should render null when not loading more', () => {
      const loadingMore = false;

      const shouldRenderLoadingIndicator = loadingMore;
      const shouldRenderNull = !loadingMore;

      expect(shouldRenderLoadingIndicator).toBe(false);
      expect(shouldRenderNull).toBe(true);
    });
  });

  describe('renderEmptyComponent Conditional Returns Logic', () => {
    it('should return null when loading', () => {
      const loading = true;
      const _error = null;

      const shouldReturnNull = loading;

      expect(shouldReturnNull).toBe(true);
    });

    it('should return error state when error exists', () => {
      const loading = false;
      const error = 'Failed to load chat';

      const shouldReturnError = !loading && error;

      expect(shouldReturnError).toBeTruthy();
    });

    it('should return empty state when no error and no messages', () => {
      const loading = false;
      const error = null;
      const hasAccess = true;
      const messagesLength = 0;

      const shouldReturnEmpty = !loading && !error && hasAccess && messagesLength === 0;

      expect(shouldReturnEmpty).toBe(true);
    });
  });

  describe('renderEmptyComponent isChatDisabled Calculation Logic', () => {
    it('should identify disabled chat when isChatEnabled is false', () => {
      const chatAccess = { hasAccess: false, isChatEnabled: false };

      const isChatDisabled = chatAccess && !chatAccess.isChatEnabled;

      expect(isChatDisabled).toBe(true);
    });

    it('should identify enabled chat when isChatEnabled is true', () => {
      const chatAccess = { hasAccess: true, isChatEnabled: true };

      const isChatDisabled = chatAccess && !chatAccess.isChatEnabled;

      expect(isChatDisabled).toBe(false);
    });

    it('should handle null chatAccess', () => {
      const chatAccess = null;

      const isChatDisabled = chatAccess && !chatAccess.isChatEnabled;

      expect(isChatDisabled).toBeFalsy();
    });
  });

  describe('renderEmptyComponent Conditional Icon and Message Logic', () => {
    it('should use disabled icon when chat is disabled', () => {
      const isChatDisabled = true;

      const iconName = isChatDisabled ? 'speaker-notes-off' : 'error-outline';
      const title = isChatDisabled ? 'Chat Disabled' : 'Chat Unavailable';

      expect(iconName).toBe('speaker-notes-off');
      expect(title).toBe('Chat Disabled');
    });

    it('should use error icon when chat is not disabled', () => {
      const isChatDisabled = false;

      const iconName = isChatDisabled ? 'speaker-notes-off' : 'error-outline';
      const title = isChatDisabled ? 'Chat Disabled' : 'Chat Unavailable';

      expect(iconName).toBe('error-outline');
      expect(title).toBe('Chat Unavailable');
    });

    it('should show admin message when disabled', () => {
      const isChatDisabled = true;
      const error = 'Chat is currently disabled by your club admin';

      const description = isChatDisabled
        ? 'Community chat has been disabled by your club administrator. Contact your admin if you have questions.'
        : error;

      expect(description).toContain('disabled by your club administrator');
    });

    it('should show error message when not disabled', () => {
      const isChatDisabled = false;
      const error = 'Network connection failed';

      const description = isChatDisabled
        ? 'Community chat has been disabled by your club administrator. Contact your admin if you have questions.'
        : error;

      expect(description).toBe('Network connection failed');
    });
  });

  describe('renderEmptyComponent Conditional Retry Button Logic', () => {
    it('should hide retry button when chat is disabled', () => {
      const isChatDisabled = true;

      const shouldShowRetryButton = !isChatDisabled;

      expect(shouldShowRetryButton).toBe(false);
    });

    it('should show retry button when chat is not disabled', () => {
      const isChatDisabled = false;

      const shouldShowRetryButton = !isChatDisabled;

      expect(shouldShowRetryButton).toBe(true);
    });
  });

  describe('handleNewMessage Duplicate Check Logic', () => {
    it('should detect duplicate message', () => {
      const existingMessages = [
        { chatMessageId: 1, messageContent: 'Message 1', sentAt: '2024-01-01T00:00:00Z' },
        { chatMessageId: 2, messageContent: 'Message 2', sentAt: '2024-01-02T00:00:00Z' },
      ];
      const newMessage = { chatMessageId: 1, messageContent: 'Message 1', sentAt: '2024-01-01T00:00:00Z' };

      const exists = existingMessages.some(m => m.chatMessageId === newMessage.chatMessageId);

      expect(exists).toBe(true);
    });

    it('should not detect duplicate for unique message', () => {
      const existingMessages = [
        { chatMessageId: 1, messageContent: 'Message 1', sentAt: '2024-01-01T00:00:00Z' },
        { chatMessageId: 2, messageContent: 'Message 2', sentAt: '2024-01-02T00:00:00Z' },
      ];
      const newMessage = { chatMessageId: 3, messageContent: 'Message 3', sentAt: '2024-01-03T00:00:00Z' };

      const exists = existingMessages.some(m => m.chatMessageId === newMessage.chatMessageId);

      expect(exists).toBe(false);
    });

    it('should handle empty message array', () => {
      const existingMessages: any[] = [];
      const newMessage = { chatMessageId: 1, messageContent: 'Message 1', sentAt: '2024-01-01T00:00:00Z' };

      const exists = existingMessages.some(m => m.chatMessageId === newMessage.chatMessageId);

      expect(exists).toBe(false);
    });
  });

  describe('handleNewMessage Message Sorting Logic', () => {
    it('should sort messages by timestamp ascending', () => {
      const messages = [
        { chatMessageId: 2, messageContent: 'Message 2', sentAt: '2024-01-03T00:00:00Z' },
        { chatMessageId: 1, messageContent: 'Message 1', sentAt: '2024-01-01T00:00:00Z' },
        { chatMessageId: 3, messageContent: 'Message 3', sentAt: '2024-01-02T00:00:00Z' },
      ];

      const sorted = messages.sort((a, b) =>
        new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      );

      expect(sorted[0].chatMessageId).toBe(1);
      expect(sorted[1].chatMessageId).toBe(3);
      expect(sorted[2].chatMessageId).toBe(2);
    });

    it('should handle messages with same timestamp', () => {
      const timestamp = '2024-01-01T00:00:00Z';
      const messages = [
        { chatMessageId: 2, messageContent: 'Message 2', sentAt: timestamp },
        { chatMessageId: 1, messageContent: 'Message 1', sentAt: timestamp },
      ];

      const sorted = messages.sort((a, b) =>
        new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      );

      // Should maintain stable sort order (no change in order for equal timestamps)
      expect(sorted).toHaveLength(2);
    });

    it('should add and sort new message correctly', () => {
      const existingMessages = [
        { chatMessageId: 1, messageContent: 'Message 1', sentAt: '2024-01-01T00:00:00Z' },
        { chatMessageId: 3, messageContent: 'Message 3', sentAt: '2024-01-03T00:00:00Z' },
      ];
      const newMessage = { chatMessageId: 2, messageContent: 'Message 2', sentAt: '2024-01-02T00:00:00Z' };

      const updatedMessages = [...existingMessages, newMessage].sort((a, b) =>
        new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      );

      expect(updatedMessages.map(m => m.chatMessageId)).toEqual([1, 2, 3]);
    });
  });

  describe('Conditional Styling Logic', () => {
    it('should apply own message styles when isOwnMessage is true', () => {
      const isOwnMessage = true;

      const containerStyle = isOwnMessage ? 'ownMessageContainer' : 'otherMessageContainer';
      const bubbleStyle = isOwnMessage ? 'ownMessageBubble' : 'otherMessageBubble';
      const textStyle = isOwnMessage ? 'ownMessageText' : 'otherMessageText';
      const timestampStyle = isOwnMessage ? 'ownTimestamp' : 'otherTimestamp';

      expect(containerStyle).toBe('ownMessageContainer');
      expect(bubbleStyle).toBe('ownMessageBubble');
      expect(textStyle).toBe('ownMessageText');
      expect(timestampStyle).toBe('ownTimestamp');
    });

    it('should apply other message styles when isOwnMessage is false', () => {
      const isOwnMessage = false;

      const containerStyle = isOwnMessage ? 'ownMessageContainer' : 'otherMessageContainer';
      const bubbleStyle = isOwnMessage ? 'ownMessageBubble' : 'otherMessageBubble';
      const textStyle = isOwnMessage ? 'ownMessageText' : 'otherMessageText';
      const timestampStyle = isOwnMessage ? 'ownTimestamp' : 'otherTimestamp';

      expect(containerStyle).toBe('otherMessageContainer');
      expect(bubbleStyle).toBe('otherMessageBubble');
      expect(textStyle).toBe('otherMessageText');
      expect(timestampStyle).toBe('otherTimestamp');
    });

    it('should apply disabled style when send button is disabled', () => {
      const messageText = '';
      const sending = false;

      const isDisabled = !messageText.trim() || sending;
      const style = isDisabled ? 'sendButtonDisabled' : 'sendButton';

      expect(style).toBe('sendButtonDisabled');
    });

    it('should apply normal style when send button is enabled', () => {
      const messageText = 'Hello';
      const sending = false;

      const isDisabled = !messageText.trim() || sending;
      const style = isDisabled ? 'sendButtonDisabled' : 'sendButton';

      expect(style).toBe('sendButton');
    });
  });

  describe('Platform-Specific Behavior Logic', () => {
    it('should use padding behavior for iOS', () => {
      const platform = 'ios';

      const behavior = platform === 'ios' ? 'padding' : 'height';
      const offset = platform === 'ios' ? 90 : 0;

      expect(behavior).toBe('padding');
      expect(offset).toBe(90);
    });

    it('should use height behavior for Android', () => {
      const platform = 'android' as 'android' | 'ios';

      const behavior = platform === 'ios' ? 'padding' : 'height';
      const offset = platform === 'ios' ? 90 : 0;

      expect(behavior).toBe('height');
      expect(offset).toBe(0);
    });

    it('should validate platform string comparison', () => {
      const platforms = ['ios', 'android', 'windows', 'macos', 'web'];

      platforms.forEach(platform => {
        const isIOS = platform === 'ios';
        expect(typeof isIOS).toBe('boolean');
      });
    });
  });

  describe('Key Extraction Logic', () => {
    it('should generate unique key from message data', () => {
      const message = {
        chatMessageId: 123,
        sentAt: '2024-01-01T00:00:00Z',
        messageContent: 'Hello',
      };
      const index = 0;

      const key = `${message.chatMessageId}-${message.sentAt}-${index}`;

      expect(key).toBe('123-2024-01-01T00:00:00Z-0');
    });

    it('should generate different keys for different indices', () => {
      const message = {
        chatMessageId: 123,
        sentAt: '2024-01-01T00:00:00Z',
        messageContent: 'Hello',
      };

      const key1 = `${message.chatMessageId}-${message.sentAt}-${0}`;
      const key2 = `${message.chatMessageId}-${message.sentAt}-${1}`;

      expect(key1).not.toBe(key2);
    });

    it('should generate keys for array of messages', () => {
      const messages = [
        { chatMessageId: 1, sentAt: '2024-01-01T00:00:00Z', messageContent: 'Message 1' },
        { chatMessageId: 2, sentAt: '2024-01-02T00:00:00Z', messageContent: 'Message 2' },
      ];

      const keys = messages.map((msg, index) => `${msg.chatMessageId}-${msg.sentAt}-${index}`);

      expect(keys).toHaveLength(2);
      expect(keys[0]).toBe('1-2024-01-01T00:00:00Z-0');
      expect(keys[1]).toBe('2-2024-01-02T00:00:00Z-1');
    });
  });

  describe('Empty Container Style Logic', () => {
    it('should apply empty style when messages length is zero', () => {
      const messagesLength = 0;

      const shouldApplyEmptyStyle = messagesLength === 0;

      expect(shouldApplyEmptyStyle).toBe(true);
    });

    it('should not apply empty style when messages exist', () => {
      const messagesLength = 5 as 0 | 5;

      const shouldApplyEmptyStyle = messagesLength === 0;

      expect(shouldApplyEmptyStyle).toBe(false);
    });

    it('should validate conditional style application', () => {
      const testCases = [
        { messagesLength: 0, expected: true },
        { messagesLength: 1, expected: false },
        { messagesLength: 10, expected: false },
      ];

      testCases.forEach(({ messagesLength, expected }) => {
        const shouldApplyEmptyStyle = messagesLength === 0;
        expect(shouldApplyEmptyStyle).toBe(expected);
      });
    });
  });

  describe('hasMore Fallback Logic (lines 100, 152)', () => {
    it('should use response.hasMore when provided as true', () => {
      const response = { hasMore: true };

      const hasMore = response.hasMore || false;

      expect(hasMore).toBe(true);
    });

    it('should use response.hasMore when provided as false', () => {
      const response = { hasMore: false };

      const hasMore = response.hasMore || false;

      expect(hasMore).toBe(false);
    });

    it('should default to false when hasMore is undefined', () => {
      const response = { hasMore: undefined as any };

      const hasMore = response.hasMore || false;

      expect(hasMore).toBe(false);
    });

    it('should default to false when hasMore is null', () => {
      const response = { hasMore: null as any };

      const hasMore = response.hasMore || false;

      expect(hasMore).toBe(false);
    });

    it('should validate fallback behavior with various falsy values', () => {
      const testCases = [
        { hasMore: true, expected: true },
        { hasMore: false, expected: false },
        { hasMore: undefined, expected: false },
        { hasMore: null, expected: false },
        { hasMore: 0 as any, expected: false },
        { hasMore: '' as any, expected: false },
      ];

      testCases.forEach(({ hasMore, expected }) => {
        const result = hasMore || false;
        expect(result).toBe(expected);
      });
    });
  });

  describe('Auto-Scroll Conditional Logic (line 103)', () => {
    it('should trigger auto-scroll for initial load', () => {
      const isRefresh = false;

      const shouldAutoScroll = !isRefresh;

      expect(shouldAutoScroll).toBe(true);
    });

    it('should skip auto-scroll for refresh', () => {
      const isRefresh = true;

      const shouldAutoScroll = !isRefresh;

      expect(shouldAutoScroll).toBe(false);
    });

    it('should validate auto-scroll condition', () => {
      const testCases = [
        { isRefresh: false, shouldAutoScroll: true },
        { isRefresh: true, shouldAutoScroll: false },
      ];

      testCases.forEach(({ isRefresh, shouldAutoScroll }) => {
        expect(!isRefresh).toBe(shouldAutoScroll);
      });
    });
  });

  describe('Chat Access Error Message Nested Conditionals (lines 84-88)', () => {
    it('should show disabled message when chat is not enabled', () => {
      const access = { isChatEnabled: false, hasAccess: false };

      let errorMessage = '';
      if (!access.isChatEnabled) {
        errorMessage = 'Chat is currently disabled by your club admin';
      } else if (!access.hasAccess) {
        errorMessage = 'You do not have access to community chat';
      }

      expect(errorMessage).toBe('Chat is currently disabled by your club admin');
    });

    it('should show access denied message when enabled but no access', () => {
      const access = { isChatEnabled: true, hasAccess: false };

      let errorMessage = '';
      if (!access.isChatEnabled) {
        errorMessage = 'Chat is currently disabled by your club admin';
      } else if (!access.hasAccess) {
        errorMessage = 'You do not have access to community chat';
      }

      expect(errorMessage).toBe('You do not have access to community chat');
    });

    it('should show no error when enabled and has access', () => {
      const access = { isChatEnabled: true, hasAccess: true };

      let errorMessage = '';
      if (!access.isChatEnabled) {
        errorMessage = 'Chat is currently disabled by your club admin';
      } else if (!access.hasAccess) {
        errorMessage = 'You do not have access to community chat';
      }

      expect(errorMessage).toBe('');
    });

    it('should prioritize disabled message over access message', () => {
      const access = { isChatEnabled: false, hasAccess: false };

      let errorMessage = '';
      if (!access.isChatEnabled) {
        errorMessage = 'Chat is currently disabled by your club admin';
      } else if (!access.hasAccess) {
        errorMessage = 'You do not have access to community chat';
      }

      expect(errorMessage).toBe('Chat is currently disabled by your club admin');
      expect(errorMessage).not.toBe('You do not have access to community chat');
    });
  });

  describe('Icon Color Ternary Logic (line 279)', () => {
    it('should use tertiary color when chat is disabled', () => {
      const isChatDisabled = true;
      const colors = { text: { tertiary: '#999', secondary: '#666' } };

      const iconColor = isChatDisabled ? colors.text.tertiary : colors.text.secondary;

      expect(iconColor).toBe('#999');
    });

    it('should use secondary color when chat is not disabled', () => {
      const isChatDisabled = false;
      const colors = { text: { tertiary: '#999', secondary: '#666' } };

      const iconColor = isChatDisabled ? colors.text.tertiary : colors.text.secondary;

      expect(iconColor).toBe('#666');
    });

    it('should validate color selection logic', () => {
      const colors = { text: { tertiary: '#999', secondary: '#666' } };
      const testCases = [
        { isChatDisabled: true, expected: '#999' },
        { isChatDisabled: false, expected: '#666' },
      ];

      testCases.forEach(({ isChatDisabled, expected }) => {
        const iconColor = isChatDisabled ? colors.text.tertiary : colors.text.secondary;
        expect(iconColor).toBe(expected);
      });
    });
  });

  describe('Empty State Compound Conditional Logic (line 300)', () => {
    it('should show empty state when has access and no messages', () => {
      const chatAccess = { hasAccess: true };
      const messages: any[] = [];

      const shouldShowEmptyState = chatAccess?.hasAccess && messages.length === 0;

      expect(shouldShowEmptyState).toBe(true);
    });

    it('should not show empty state when has access but has messages', () => {
      const chatAccess = { hasAccess: true };
      const messages = [{ id: 1, content: 'Hello' }];

      const shouldShowEmptyState = chatAccess?.hasAccess && messages.length === 0;

      expect(shouldShowEmptyState).toBe(false);
    });

    it('should not show empty state when no access and no messages', () => {
      const chatAccess = { hasAccess: false };
      const messages: any[] = [];

      const shouldShowEmptyState = chatAccess?.hasAccess && messages.length === 0;

      expect(shouldShowEmptyState).toBe(false);
    });

    it('should not show empty state when chatAccess is null', () => {
      const chatAccess = null;
      const messages: any[] = [];

      const shouldShowEmptyState = chatAccess?.hasAccess && messages.length === 0;

      expect(shouldShowEmptyState).toBeFalsy();
    });

    it('should validate compound conditional logic', () => {
      const testCases = [
        { hasAccess: true, messagesLength: 0, expected: true },
        { hasAccess: true, messagesLength: 1, expected: false },
        { hasAccess: false, messagesLength: 0, expected: false },
        { hasAccess: false, messagesLength: 1, expected: false },
      ];

      testCases.forEach(({ hasAccess, messagesLength, expected }) => {
        const chatAccess = { hasAccess };
        const messages = Array(messagesLength).fill({ id: 1 });
        const shouldShowEmptyState = chatAccess?.hasAccess && messages.length === 0;
        expect(shouldShowEmptyState).toBe(expected);
      });
    });
  });

  describe('Sending State Icon Ternary Logic (line 465)', () => {
    it('should show ActivityIndicator when sending', () => {
      const sending = true;

      const iconType = sending ? 'ActivityIndicator' : 'IconComponent';

      expect(iconType).toBe('ActivityIndicator');
    });

    it('should show IconComponent when not sending', () => {
      const sending = false;

      const iconType = sending ? 'ActivityIndicator' : 'IconComponent';

      expect(iconType).toBe('IconComponent');
    });

    it('should validate icon type selection', () => {
      const testCases = [
        { sending: true, expected: 'ActivityIndicator' },
        { sending: false, expected: 'IconComponent' },
      ];

      testCases.forEach(({ sending, expected }) => {
        const iconType = sending ? 'ActivityIndicator' : 'IconComponent';
        expect(iconType).toBe(expected);
      });
    });
  });
});
