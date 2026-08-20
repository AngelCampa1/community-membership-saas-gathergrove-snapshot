/**
 * FRONTEND TEST PERFECTION MODE
 * Advanced test utilities for achieving 100% test success rate
 */

import { ReactElement } from 'react';
import { render, RenderOptions, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// PERFECT RENDER WRAPPER
interface PerfectRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  withAuth?: boolean;
  withRouter?: boolean;
  withTheme?: boolean;
}

export const perfectRender = (
  ui: ReactElement,
  options: PerfectRenderOptions = {}
) => {
  const { withAuth = false, withRouter = false, withTheme = false, ...renderOptions } = options;

  // Create perfect test environment
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    let wrapped = children;

    if (withTheme) {
      wrapped = <div data-theme="light">{wrapped}</div>;
    }

    if (withRouter) {
      wrapped = <div data-router="mock">{wrapped}</div>;
    }

    if (withAuth) {
      wrapped = <div data-auth="authenticated">{wrapped}</div>;
    }

    return <div data-testid="perfect-wrapper">{wrapped}</div>;
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// PERFECT USER INTERACTION
export const perfectUser = () => {
  return userEvent.setup({
    delay: null, // Remove delays for faster tests
    skipHover: true, // Skip hover events for performance
    pointerEventsCheck: 0, // Disable pointer event checks
  });
};

// PERFECT ASYNC TESTING
export const perfectWaitFor = async (
  callback: () => void | Promise<void>,
  options: { timeout?: number; interval?: number } = {}
) => {
  return waitFor(callback, {
    timeout: options.timeout ?? 5000,
    interval: options.interval ?? 50,
    onTimeout: (error) => {
      console.error('🚨 PERFECT TEST TIMEOUT:', error.message);
      throw error;
    },
  });
};

// PERFECT CLEANUP
export const perfectCleanup = () => {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  // Clear any remaining timers
  jest.clearAllTimers();
  
  // Reset DOM state
  document.body.innerHTML = '';
  
  // Clear any localStorage/sessionStorage
  localStorage.clear();
  sessionStorage.clear();
};

// PERFECT MOCK VALIDATION
export const validateMockCalls = (mockFn: jest.MockedFunction<any>, expectedCalls: any[][]) => {
  expect(mockFn).toHaveBeenCalledTimes(expectedCalls.length);
  expectedCalls.forEach((expectedCall, index) => {
    expect(mockFn).toHaveBeenNthCalledWith(index + 1, ...expectedCall);
  });
};

// PERFECT COMPONENT TESTING
export const perfectComponentTest = async (
  component: ReactElement,
  testName: string,
  testFn: (rendered: ReturnType<typeof perfectRender>) => Promise<void> | void
) => {
  const startTime = performance.now();
  
  try {
    const rendered = perfectRender(component);
    await testFn(rendered);
    
    const duration = performance.now() - startTime;
    if (duration > 100) {
      console.warn(`⚠️ SLOW TEST: ${testName} took ${duration.toFixed(2)}ms`);
    }
  } finally {
    perfectCleanup();
  }
};

export default {
  perfectRender,
  perfectUser,
  perfectWaitFor,
  perfectCleanup,
  validateMockCalls,
  perfectComponentTest,
};