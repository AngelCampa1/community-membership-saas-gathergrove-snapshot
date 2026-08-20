// Mock for sonner toast library
export const toast = {
  success: jest.fn((message: string) => {
    console.log('Mock success toast:', message);
    return { id: Math.random().toString() };
  }),
  error: jest.fn((message: string) => {
    console.log('Mock error toast:', message);
    return { id: Math.random().toString() };
  }),
  loading: jest.fn((message: string) => {
    console.log('Mock loading toast:', message);
    return { id: Math.random().toString() };
  }),
  info: jest.fn((message: string) => {
    console.log('Mock info toast:', message);
    return { id: Math.random().toString() };
  }),
  warning: jest.fn((message: string) => {
    console.log('Mock warning toast:', message);
    return { id: Math.random().toString() };
  }),
  promise: jest.fn(),
  dismiss: jest.fn(),
  custom: jest.fn(),
};

export const Toaster = () => null;

export default toast;