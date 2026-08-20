// Mock for useToast hook to prevent toast-related test issues
// This matches the actual hook interface which returns { success, error, warning, info }
const mockToastInstance = {
  success: jest.fn((message: string, options?: any) => {
    console.log('Mock success toast:', message, options);
    return { id: Math.random().toString(), dismiss: jest.fn() };
  }),
  error: jest.fn((message: string, options?: any) => {
    console.log('Mock error toast:', message, options);
    return { id: Math.random().toString(), dismiss: jest.fn() };
  }),
  warning: jest.fn((message: string, options?: any) => {
    console.log('Mock warning toast:', message, options);
    return { id: Math.random().toString(), dismiss: jest.fn() };
  }),
  info: jest.fn((message: string, options?: any) => {
    console.log('Mock info toast:', message, options);
    return { id: Math.random().toString(), dismiss: jest.fn() };
  }),
};

export const useToast = jest.fn(() => mockToastInstance);

// Export the mock instance for testing
export { mockToastInstance };

export default useToast;