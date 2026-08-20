import { renderHook, act, waitFor } from '@testing-library/react';
import { useDeviceDetection } from '../useDeviceDetection';

describe('useDeviceDetection', () => {
  const mockInnerWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
  };

  const mockInnerHeight = (height: number) => {
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
  };

  const mockTouchDevice = (isTouch: boolean) => {
    if (isTouch) {
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        configurable: true,
        value: jest.fn(),
      });
    } else {
      delete (window as { ontouchstart?: unknown }).ontouchstart;
    }
  };

  beforeEach(() => {
    mockInnerWidth(1024);
    mockInnerHeight(768);
    mockTouchDevice(false);
  });

  it('should detect desktop device by default', () => {
    mockInnerWidth(1200);
    const { result } = renderHook(() => useDeviceDetection());

    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.deviceType).toBe('desktop');
  });

  it('should detect mobile device (width < 768)', () => {
    mockInnerWidth(500);
    mockInnerHeight(800);

    const { result } = renderHook(() => useDeviceDetection());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.deviceType).toBe('mobile');
    expect(result.current.screenWidth).toBe(500);
    expect(result.current.screenHeight).toBe(800);
  });

  it('should detect tablet device (768 <= width < 1024)', () => {
    mockInnerWidth(800);
    mockInnerHeight(1024);

    const { result } = renderHook(() => useDeviceDetection());

    expect(result.current.isTablet).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.deviceType).toBe('tablet');
    expect(result.current.screenWidth).toBe(800);
  });

  it('should detect touch device', () => {
    mockTouchDevice(true);

    const { result } = renderHook(() => useDeviceDetection());

    expect(result.current.isTouchDevice).toBe(true);
  });

  it('should update on window resize', async () => {
    mockInnerWidth(1200);

    const { result } = renderHook(() => useDeviceDetection());

    expect(result.current.deviceType).toBe('desktop');

    act(() => {
      mockInnerWidth(600);
      window.dispatchEvent(new Event('resize'));
    });

    await waitFor(() => {
      expect(result.current.deviceType).toBe('mobile');
      expect(result.current.isMobile).toBe(true);
      expect(result.current.screenWidth).toBe(600);
    });
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = renderHook(() => useDeviceDetection());
    
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));
  });
});
