import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce string value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated', delay: 500 });

    // Value should still be initial before delay
    expect(result.current).toBe('initial');

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Value should now be updated
    expect(result.current).toBe('updated');
  });

  it('should debounce number value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 300 } }
    );

    expect(result.current).toBe(0);

    rerender({ value: 42, delay: 300 });
    expect(result.current).toBe(0);

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe(42);
  });

  it('should debounce object value changes', () => {
    const initialObj = { name: 'John', age: 30 };
    const updatedObj = { name: 'Jane', age: 25 };

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: initialObj, delay: 400 } }
    );

    expect(result.current).toBe(initialObj);

    rerender({ value: updatedObj, delay: 400 });
    expect(result.current).toBe(initialObj);

    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(result.current).toBe(updatedObj);
  });

  it('should cancel previous timeout when value changes multiple times', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 500 } }
    );

    // Change value rapidly
    rerender({ value: 'second', delay: 500 });
    act(() => {
      jest.advanceTimersByTime(250);
    });

    rerender({ value: 'third', delay: 500 });
    act(() => {
      jest.advanceTimersByTime(250);
    });

    // Should still be initial value (timers were cancelled)
    expect(result.current).toBe('first');

    // Complete the final timeout
    act(() => {
      jest.advanceTimersByTime(250);
    });

    // Should now be the final value
    expect(result.current).toBe('third');
  });

  it('should handle delay changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'test', delay: 500 } }
    );

    rerender({ value: 'updated', delay: 500 });

    // Change delay mid-debounce
    act(() => {
      jest.advanceTimersByTime(250);
    });

    rerender({ value: 'updated', delay: 1000 });

    // Original timer should be cancelled, new timer starts
    act(() => {
      jest.advanceTimersByTime(750);
    });

    expect(result.current).toBe('test'); // Not updated yet

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(result.current).toBe('updated'); // Now updated
  });

  it('should update immediately when delay is 0', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 0 } }
    );

    rerender({ value: 'updated', delay: 0 });

    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(result.current).toBe('updated');
  });

  it('should handle null and undefined values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: null as string | null, delay: 300 } }
    );

    expect(result.current).toBeNull();

    rerender({ value: undefined as string | undefined, delay: 300 });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBeUndefined();
  });

  it('should cleanup timeout on unmount', () => {
    const { result, rerender, unmount } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'updated', delay: 500 });

    // Unmount before timeout completes
    unmount();

    // Advance timers - value should not update since component unmounted
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Verify no errors and timer was cleaned up
    expect(result.current).toBe('initial');
  });

  it('should handle boolean values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: false, delay: 200 } }
    );

    expect(result.current).toBe(false);

    rerender({ value: true, delay: 200 });
    expect(result.current).toBe(false);

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current).toBe(true);
  });

  it('should handle array values', () => {
    const initialArray = [1, 2, 3];
    const updatedArray = [4, 5, 6];

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: initialArray, delay: 350 } }
    );

    expect(result.current).toBe(initialArray);

    rerender({ value: updatedArray, delay: 350 });

    act(() => {
      jest.advanceTimersByTime(350);
    });

    expect(result.current).toBe(updatedArray);
  });

  it('should handle rapid value changes with different delays', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 100 } }
    );

    rerender({ value: 'b', delay: 200 });
    rerender({ value: 'c', delay: 300 });
    rerender({ value: 'd', delay: 400 });

    // Should still show initial value
    expect(result.current).toBe('a');

    // Complete the final delay
    act(() => {
      jest.advanceTimersByTime(400);
    });

    // Should show the final value
    expect(result.current).toBe('d');
  });

  it('should debounce complex nested objects', () => {
    const initialData = {
      user: { name: 'John', address: { city: 'NYC', zip: '10001' } },
      settings: { theme: 'light', notifications: true }
    };

    const updatedData = {
      user: { name: 'Jane', address: { city: 'LA', zip: '90001' } },
      settings: { theme: 'light', notifications: false }
    };

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: initialData, delay: 250 } }
    );

    expect(result.current).toBe(initialData);

    rerender({ value: updatedData, delay: 250 });
    expect(result.current).toBe(initialData);

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(result.current).toBe(updatedData);
  });
});
