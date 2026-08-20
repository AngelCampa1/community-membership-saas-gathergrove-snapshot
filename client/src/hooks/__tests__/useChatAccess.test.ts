/**
 * useChatAccess Tests - Full Coverage
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatAccess } from '../useChatAccess';
import { useAuth } from '../useAuth';
import { chatService } from '@/services/chatService';

// Mock dependencies
jest.mock('../useAuth');
jest.mock('@/services/chatService');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockChatService = chatService as jest.Mocked<typeof chatService>;

describe('useChatAccess', () => {
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Spy on window event listeners
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    // Default mock - user with clubId
    mockUseAuth.mockReturnValue({
      user: { id: 1, clubId: 1, email: 'test@example.com', name: 'Test User' },
      isAuthenticated: true,
    } as any);

    // Default mock - chat access enabled
    mockChatService.checkChatAccess.mockResolvedValue({
      hasAccess: true,
      isChatEnabled: true,
    });
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  describe('Initialization', () => {
    it('should initialize with loading state', () => {
      // Arrange & Act
      const { result } = renderHook(() => useChatAccess());

      // Assert
      expect(result.current.loading).toBe(true);
      expect(result.current.hasAccess).toBe(false);
      expect(result.current.isChatEnabled).toBe(false);
      expect(result.current.canAccessChat).toBe(false);
    });

    it('should check chat access on mount', async () => {
      // Arrange & Act
      renderHook(() => useChatAccess());

      // Assert
      await waitFor(() => {
        expect(mockChatService.checkChatAccess).toHaveBeenCalledWith(1);
      });
    });

    it('should register chatSettingsUpdated event listener', () => {
      // Arrange & Act
      renderHook(() => useChatAccess());

      // Assert
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'chatSettingsUpdated',
        expect.any(Function)
      );
    });
  });

  describe('Access Check Success', () => {
    it('should set access when user has full access', async () => {
      // Arrange
      mockChatService.checkChatAccess.mockResolvedValue({
        hasAccess: true,
        isChatEnabled: true,
      });

      // Act
      const { result } = renderHook(() => useChatAccess());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAccess).toBe(true);
      expect(result.current.isChatEnabled).toBe(true);
      expect(result.current.canAccessChat).toBe(true);
    });

    it('should handle when user has access but chat is disabled', async () => {
      // Arrange
      mockChatService.checkChatAccess.mockResolvedValue({
        hasAccess: true,
        isChatEnabled: false,
      });

      // Act
      const { result } = renderHook(() => useChatAccess());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAccess).toBe(true);
      expect(result.current.isChatEnabled).toBe(false);
      expect(result.current.canAccessChat).toBe(false); // Both must be true
    });

    it('should handle when user lacks access but chat is enabled', async () => {
      // Arrange
      mockChatService.checkChatAccess.mockResolvedValue({
        hasAccess: false,
        isChatEnabled: true,
      });

      // Act
      const { result } = renderHook(() => useChatAccess());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAccess).toBe(false);
      expect(result.current.isChatEnabled).toBe(true);
      expect(result.current.canAccessChat).toBe(false); // Both must be true
    });

    it('should handle when user has no access and chat is disabled', async () => {
      // Arrange
      mockChatService.checkChatAccess.mockResolvedValue({
        hasAccess: false,
        isChatEnabled: false,
      });

      // Act
      const { result } = renderHook(() => useChatAccess());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAccess).toBe(false);
      expect(result.current.isChatEnabled).toBe(false);
      expect(result.current.canAccessChat).toBe(false);
    });
  });

  describe('No User Scenarios', () => {
    it('should not check access when user is null', async () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
      } as any);

      // Act
      const { result } = renderHook(() => useChatAccess());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockChatService.checkChatAccess).not.toHaveBeenCalled();
      expect(result.current.hasAccess).toBe(false);
      expect(result.current.isChatEnabled).toBe(false);
      expect(result.current.canAccessChat).toBe(false);
    });

    it('should not check access when user has no clubId', async () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        user: { id: 1, email: 'test@example.com', name: 'Test' } as any,
        isAuthenticated: true,
      } as any);

      // Act
      const { result } = renderHook(() => useChatAccess());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockChatService.checkChatAccess).not.toHaveBeenCalled();
      expect(result.current.hasAccess).toBe(false);
      expect(result.current.isChatEnabled).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Arrange
      mockChatService.checkChatAccess.mockRejectedValue(
        new Error('API Error')
      );

      // Act
      const { result } = renderHook(() => useChatAccess());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAccess).toBe(false);
      expect(result.current.isChatEnabled).toBe(false);
      expect(result.current.canAccessChat).toBe(false);
    });

    it('should handle network errors silently', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockChatService.checkChatAccess.mockRejectedValue(
        new Error('Network error')
      );

      // Act
      const { result } = renderHook(() => useChatAccess());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAccess).toBe(false);
      // Should not log errors (silent failure)
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle undefined response gracefully', async () => {
      // Arrange
      mockChatService.checkChatAccess.mockResolvedValue(undefined as any);

      // Act
      const { result } = renderHook(() => useChatAccess());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAccess).toBe(false);
      expect(result.current.isChatEnabled).toBe(false);
    });
  });

  describe('Event Listener', () => {
    it('should re-check access when chatSettingsUpdated event fires', async () => {
      // Arrange
      const { result } = renderHook(() => useChatAccess());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockChatService.checkChatAccess).toHaveBeenCalledTimes(1);

      // Update mock response
      mockChatService.checkChatAccess.mockResolvedValue({
        hasAccess: false,
        isChatEnabled: false,
      });

      // Act - fire event
      act(() => {
        window.dispatchEvent(new Event('chatSettingsUpdated'));
      });

      // Assert
      await waitFor(() => {
        expect(mockChatService.checkChatAccess).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(result.current.hasAccess).toBe(false);
      });
    });

    it('should handle multiple chatSettingsUpdated events', async () => {
      // Arrange
      const { result } = renderHook(() => useChatAccess());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Act - fire multiple events
      act(() => {
        window.dispatchEvent(new Event('chatSettingsUpdated'));
        window.dispatchEvent(new Event('chatSettingsUpdated'));
        window.dispatchEvent(new Event('chatSettingsUpdated'));
      });

      // Assert - should call checkAccess for each event
      await waitFor(() => {
        expect(mockChatService.checkChatAccess).toHaveBeenCalledTimes(4); // 1 initial + 3 events
      });
    });

    it('should remove event listener on unmount', () => {
      // Arrange & Act
      const { unmount } = renderHook(() => useChatAccess());

      unmount();

      // Assert
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'chatSettingsUpdated',
        expect.any(Function)
      );
    });
  });

  describe('Refresh Function', () => {
    it('should re-check access when refresh is called', async () => {
      // Arrange
      const { result } = renderHook(() => useChatAccess());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockChatService.checkChatAccess).toHaveBeenCalledTimes(1);

      // Update mock response
      mockChatService.checkChatAccess.mockResolvedValue({
        hasAccess: false,
        isChatEnabled: true,
      });

      // Act
      await act(async () => {
        await result.current.refresh();
      });

      // Assert
      expect(mockChatService.checkChatAccess).toHaveBeenCalledTimes(2);
      expect(result.current.hasAccess).toBe(false);
      expect(result.current.isChatEnabled).toBe(true);
    });

    it('should be a stable function reference', () => {
      // Arrange
      const { result, rerender } = renderHook(() => useChatAccess());
      const firstRefresh = result.current.refresh;

      // Act
      rerender();

      // Assert - same function reference
      expect(result.current.refresh).toBe(firstRefresh);
    });

    it('should handle errors during refresh', async () => {
      // Arrange
      const { result } = renderHook(() => useChatAccess());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockChatService.checkChatAccess.mockRejectedValue(
        new Error('Refresh error')
      );

      // Act
      await act(async () => {
        await result.current.refresh();
      });

      // Assert - should reset to no access
      expect(result.current.hasAccess).toBe(false);
      expect(result.current.isChatEnabled).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid user changes', async () => {
      // Arrange
      const { rerender, result } = renderHook(() => useChatAccess());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Act - change user clubId
      mockUseAuth.mockReturnValue({
        user: { id: 1, clubId: 2, email: 'test@example.com', name: 'Test' },
        isAuthenticated: true,
      } as any);

      rerender();

      // Assert - should check new clubId
      await waitFor(() => {
        expect(mockChatService.checkChatAccess).toHaveBeenCalledWith(2);
      });
    });

    it('should handle user logout scenario', async () => {
      // Arrange
      const { rerender, result } = renderHook(() => useChatAccess());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCallCount = mockChatService.checkChatAccess.mock.calls.length;

      // Act - user logs out
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
      } as any);

      rerender();

      // Assert - should not make additional API calls
      await waitFor(() => {
        expect(mockChatService.checkChatAccess).toHaveBeenCalledTimes(
          initialCallCount
        );
      });
    });

    it('should handle concurrent refresh calls', async () => {
      // Arrange
      const { result } = renderHook(() => useChatAccess());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Act - call refresh multiple times concurrently
      await act(async () => {
        await Promise.all([
          result.current.refresh(),
          result.current.refresh(),
          result.current.refresh(),
        ]);
      });

      // Assert - all calls should complete
      expect(mockChatService.checkChatAccess).toHaveBeenCalledTimes(4); // 1 initial + 3 concurrent
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle full lifecycle: mount → access granted → settings change → refresh', async () => {
      // Arrange & Act - mount
      const { result } = renderHook(() => useChatAccess());

      // Assert - initial state
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.canAccessChat).toBe(true);

      // Act - settings change via event
      mockChatService.checkChatAccess.mockResolvedValue({
        hasAccess: true,
        isChatEnabled: false,
      });

      act(() => {
        window.dispatchEvent(new Event('chatSettingsUpdated'));
      });

      // Assert - chat disabled
      await waitFor(() => {
        expect(result.current.canAccessChat).toBe(false);
      });

      // Act - refresh to re-enable
      mockChatService.checkChatAccess.mockResolvedValue({
        hasAccess: true,
        isChatEnabled: true,
      });

      await act(async () => {
        await result.current.refresh();
      });

      // Assert - chat re-enabled
      expect(result.current.canAccessChat).toBe(true);
    });

    it('should work correctly after unmount and remount', async () => {
      // Arrange
      const { unmount } = renderHook(() => useChatAccess());

      await waitFor(() => {
        expect(mockChatService.checkChatAccess).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Act - remount
      mockChatService.checkChatAccess.mockResolvedValue({
        hasAccess: false,
        isChatEnabled: true,
      });

      const { result: newResult } = renderHook(() => useChatAccess());

      // Assert
      await waitFor(() => {
        expect(newResult.current.loading).toBe(false);
      });

      expect(newResult.current.hasAccess).toBe(false);
      expect(newResult.current.isChatEnabled).toBe(true);
      expect(mockChatService.checkChatAccess).toHaveBeenCalledTimes(2);
    });
  });
});
