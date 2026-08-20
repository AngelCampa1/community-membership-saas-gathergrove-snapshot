/**
 * Tests for async-state-manager.ts - Async state management
 * Following boundary mocking pattern: test real hook logic, use real timers
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useAsyncOperation,
  useMutation,
  useQuery,
  LoadingStateManager,
  AsyncStatePatterns,
} from '../async-state-manager';

describe('asyncStateReducer (via useAsyncOperation)', () => {
  it('handles LOADING_START action', async () => {
    const mockFn = jest.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useAsyncOperation(mockFn));

    act(() => {
      result.current.execute(undefined);
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('handles LOADING_SUCCESS action', async () => {
    const mockFn = jest.fn().mockResolvedValue('success data');
    const { result } = renderHook(() => useAsyncOperation(mockFn));

    await act(async () => {
      await result.current.execute(undefined);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe('success data');
      expect(result.current.error).toBe(null);
    });
  });

  it('handles LOADING_ERROR action', async () => {
    const error = new Error('Test error');
    const mockFn = jest.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useAsyncOperation(mockFn, { retries: 0 }));

    await act(async () => {
      await result.current.execute(undefined);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(error);
    });
  });

  it('handles RESET action', async () => {
    const mockFn = jest.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useAsyncOperation(mockFn));

    await act(async () => {
      await result.current.execute(undefined);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });
});

describe('shouldRetry utility (via useAsyncOperation)', () => {
  it('retries on network errors (no status code)', async () => {
    let callCount = 0;
    const mockFn = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve('success');
    });

    const { result } = renderHook(() => useAsyncOperation(mockFn, { retries: 3, retryDelay: 10 }));

    await act(async () => {
      await result.current.execute(undefined);
    });

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(result.current.data).toBe('success');
    }, { timeout: 5000 });
  });

  it('does not retry on 4xx errors (except 408, 429)', async () => {
    const mockFn = jest.fn().mockRejectedValue({ status: 400 });
    const { result } = renderHook(() => useAsyncOperation(mockFn, { retries: 3, retryDelay: 10 }));

    await act(async () => {
      await result.current.execute(undefined);
    });

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result.current.error).toEqual({ status: 400 });
    });
  });

  it('retries on 408 errors', async () => {
    let callCount = 0;
    const mockFn = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount < 2) {
        return Promise.reject({ status: 408 });
      }
      return Promise.resolve('success');
    });

    const { result } = renderHook(() => useAsyncOperation(mockFn, { retries: 3, retryDelay: 10 }));

    await act(async () => {
      await result.current.execute(undefined);
    });

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(result.current.data).toBe('success');
    }, { timeout: 3000 });
  });

  it('retries on 429 errors', async () => {
    let callCount = 0;
    const mockFn = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount < 2) {
        return Promise.reject({ status: 429 });
      }
      return Promise.resolve('success');
    });

    const { result } = renderHook(() => useAsyncOperation(mockFn, { retries: 3, retryDelay: 10 }));

    await act(async () => {
      await result.current.execute(undefined);
    });

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(result.current.data).toBe('success');
    }, { timeout: 3000 });
  });

  it('retries on 5xx errors', async () => {
    let callCount = 0;
    const mockFn = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount < 2) {
        return Promise.reject({ status: 500 });
      }
      return Promise.resolve('success');
    });

    const { result } = renderHook(() => useAsyncOperation(mockFn, { retries: 3, retryDelay: 10 }));

    await act(async () => {
      await result.current.execute(undefined);
    });

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(result.current.data).toBe('success');
    }, { timeout: 3000 });
  });
});

describe('LoadingStateManager', () => {
  let manager: LoadingStateManager;

  beforeEach(() => {
    manager = new LoadingStateManager();
  });

  describe('setState / getState', () => {
    it('sets and gets loading state', () => {
      manager.setState('test', 'loading');
      expect(manager.getState('test')).toBe('loading');
    });

    it('returns idle for unknown keys', () => {
      expect(manager.getState('unknown')).toBe('idle');
    });

    it('updates existing state', () => {
      manager.setState('test', 'loading');
      manager.setState('test', 'success');
      expect(manager.getState('test')).toBe('success');
    });
  });

  describe('getAllStates', () => {
    it('returns empty object initially', () => {
      expect(manager.getAllStates()).toEqual({});
    });

    it('returns all states as object', () => {
      manager.setState('test1', 'loading');
      manager.setState('test2', 'success');
      manager.setState('test3', 'error');

      expect(manager.getAllStates()).toEqual({
        test1: 'loading',
        test2: 'success',
        test3: 'error',
      });
    });
  });

  describe('isAnyLoading', () => {
    it('returns false when no states are loading', () => {
      manager.setState('test1', 'success');
      manager.setState('test2', 'error');
      expect(manager.isAnyLoading()).toBe(false);
    });

    it('returns true when at least one state is loading', () => {
      manager.setState('test1', 'success');
      manager.setState('test2', 'loading');
      manager.setState('test3', 'error');
      expect(manager.isAnyLoading()).toBe(true);
    });

    it('returns false for empty state', () => {
      expect(manager.isAnyLoading()).toBe(false);
    });
  });

  describe('subscribe / unsubscribe', () => {
    it('notifies listeners when state changes', () => {
      const listener = jest.fn();
      manager.subscribe(listener);

      manager.setState('test', 'loading');

      expect(listener).toHaveBeenCalledWith({ test: 'loading' });
    });

    it('notifies multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      manager.subscribe(listener1);
      manager.subscribe(listener2);

      manager.setState('test', 'loading');

      expect(listener1).toHaveBeenCalledWith({ test: 'loading' });
      expect(listener2).toHaveBeenCalledWith({ test: 'loading' });
    });

    it('unsubscribes listener', () => {
      const listener = jest.fn();
      const unsubscribe = manager.subscribe(listener);

      manager.setState('test1', 'loading');
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      manager.setState('test2', 'success');
      expect(listener).toHaveBeenCalledTimes(1); // Not called again
    });
  });

  describe('clear', () => {
    it('clears all states', () => {
      manager.setState('test1', 'loading');
      manager.setState('test2', 'success');

      manager.clear();

      expect(manager.getAllStates()).toEqual({});
    });

    it('notifies listeners when cleared', () => {
      const listener = jest.fn();
      manager.subscribe(listener);

      manager.setState('test', 'loading');
      listener.mockClear();

      manager.clear();

      expect(listener).toHaveBeenCalledWith({});
    });
  });
});

describe('useAsyncOperation', () => {
  it('executes operation successfully', async () => {
    const mockFn = jest.fn().mockResolvedValue('test data');
    const { result } = renderHook(() => useAsyncOperation(mockFn));

    await act(async () => {
      await result.current.execute('param' as never);
    });

    await waitFor(() => {
      expect(result.current.data).toBe('test data');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  it('handles timeout', async () => {
    const mockFn = jest.fn(() => new Promise(() => {})); // Never resolves
    const { result } = renderHook(() => useAsyncOperation(mockFn, { timeout: 100, retries: 0 }));

    await act(async () => {
      result.current.execute(undefined);
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(new Error('Operation timed out'));
    }, { timeout: 1000 });
  });

  it('respects enabled option', async () => {
    const mockFn = jest.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useAsyncOperation(mockFn, { enabled: false }));

    await act(async () => {
      await result.current.execute(undefined);
    });

    expect(mockFn).not.toHaveBeenCalled();
  });

  it('debounces execution', async () => {
    const mockFn = jest.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useAsyncOperation(mockFn, { debounceMs: 50 }));

    await act(async () => {
      await result.current.execute(undefined);
    });

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledTimes(1);
    }, { timeout: 1000 });
  });

  it('uses exponential backoff for retries', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useAsyncOperation(mockFn, { retries: 3, retryDelay: 10 }));

    await act(async () => {
      await result.current.execute(undefined);
    });

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledTimes(4); // Initial + 3 retries
    }, { timeout: 3000 });
  });

  it('cleans up on unmount', () => {
    const mockFn = jest.fn(() => new Promise(() => {}));
    const { result, unmount } = renderHook(() => useAsyncOperation(mockFn));

    act(() => {
      result.current.execute(undefined);
    });

    unmount();

    // Should not throw
    expect(() => unmount()).not.toThrow();
  });
});

describe('useMutation', () => {
  it('executes mutation successfully', async () => {
    const mockFn = jest.fn().mockResolvedValue('mutation result');
    const { result } = renderHook(() => useMutation(mockFn));

    await act(async () => {
      await result.current.mutate('variable' as never);
    });

    await waitFor(() => {
      expect(result.current.data).toBe('mutation result');
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
    });
  });

  it('handles mutation errors', async () => {
    const error = new Error('Mutation failed');
    const mockFn = jest.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useMutation(mockFn, { retries: 0 }));

    await act(async () => {
      try {
        await result.current.mutate(undefined as never);
      } catch (e) {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(error);
      expect(result.current.isSuccess).toBe(false);
    });
  });

  it('provides mutateAsync alias', async () => {
    const mockFn = jest.fn().mockResolvedValue('result');
    const { result } = renderHook(() => useMutation(mockFn));

    await act(async () => {
      await result.current.mutateAsync('variable' as never);
    });

    await waitFor(() => {
      expect(result.current.data).toBe('result');
    });
  });

  it('resets mutation state', async () => {
    const mockFn = jest.fn().mockResolvedValue('result');
    const { result } = renderHook(() => useMutation(mockFn));

    await act(async () => {
      await result.current.mutate(undefined as never);
    });

    expect(result.current.isSuccess).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
  });
});

describe('useQuery', () => {
  beforeEach(() => {
    // Clear query cache before each test
    AsyncStatePatterns.queryCache.clear();
  });

  it('initializes with loading state', () => {
    const mockFn = jest.fn().mockResolvedValue('query data');
    const { result } = renderHook(() => useQuery(mockFn, { queryKey: ['test'] }));

    // Initially, should be in a loading or idle state
    expect(result.current.data).toBeUndefined();
  });

  it('provides refetch function', () => {
    const mockFn = jest.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useQuery(mockFn, { queryKey: ['test-refetch-fn'] }));

    expect(typeof result.current.refetch).toBe('function');
  });

  it('respects enabled option', async () => {
    const mockFn = jest.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useQuery(mockFn, { queryKey: ['test-disabled'], enabled: false }));

    // Wait to ensure it doesn't fetch
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(mockFn).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it('has correct initial state structure', () => {
    const mockFn = jest.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useQuery(mockFn, { queryKey: ['test-structure'] }));

    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('isError');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('isSuccess');
    expect(result.current).toHaveProperty('refetch');
    expect(result.current).toHaveProperty('isFetching');
    expect(result.current).toHaveProperty('isStale');
  });
});

describe('AsyncStatePatterns export', () => {
  it('exports all patterns', () => {
    expect(AsyncStatePatterns.useAsyncOperation).toBeDefined();
    expect(AsyncStatePatterns.useMutation).toBeDefined();
    expect(AsyncStatePatterns.useQuery).toBeDefined();
    expect(AsyncStatePatterns.LoadingStateManager).toBeDefined();
    expect(AsyncStatePatterns.queryCache).toBeDefined();
  });
});
