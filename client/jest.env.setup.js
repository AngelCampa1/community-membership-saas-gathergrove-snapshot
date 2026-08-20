// Jest environment setup for better ES modules and environment variable handling

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:5284';
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:5284';

// Mock dynamic imports for problematic modules
jest.mock('dynamic', () => {
  return {
    __esModule: true,
    default: (fn) => {
      const Component = fn();
      return Component;
    },
  };
});

// Mock next/dynamic
jest.mock('next/dynamic', () => {
  return {
    __esModule: true,
    default: (dynamicFunction) => {
      const DynamicComponent = dynamicFunction();
      return DynamicComponent;
    },
  };
});

// Handle dynamic imports in tests
global.importDynamic = async (modulePath) => {
  try {
    return await import(modulePath);
  } catch (error) {
    console.warn(`Failed to dynamically import ${modulePath}:`, error.message);
    return { default: () => null };
  }
};

// Suppress experimental VM modules warning
const originalWarn = console.warn;
console.warn = (...args) => {
  const warningMessage = args.join(' ');
  if (warningMessage.includes('experimental-vm-modules')) {
    return;
  }
  originalWarn.apply(console, args);
};