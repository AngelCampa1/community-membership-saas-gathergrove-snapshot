import '@testing-library/jest-dom'
import React from 'react'

// Mock ResizeObserver completely
class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe(element) {
    // Simulate calling the callback with some dummy data
    if (this.callback) {
      setTimeout(() => {
        this.callback([{
          target: element,
          contentRect: { width: 100, height: 100, top: 0, left: 0, bottom: 100, right: 100 },
          borderBoxSize: [{ blockSize: 100, inlineSize: 100 }],
          contentBoxSize: [{ blockSize: 100, inlineSize: 100 }],
          devicePixelContentBoxSize: [{ blockSize: 100, inlineSize: 100 }]
        }], this);
      }, 0);
    }
  }
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver;

// Add TextEncoder/TextDecoder for jsPDF and other libraries
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
});

// Mock scrollIntoView for DOM elements
Element.prototype.scrollIntoView = jest.fn();

// Mock fetch globally to prevent actual network requests in tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: false,
    status: 500,
    statusText: 'Internal Server Error',
    json: () => Promise.resolve({ message: 'Test fetch not mocked properly' }),
    text: () => Promise.resolve('Test fetch not mocked properly'),
  })
);

// Mock next/navigation globally
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/test-path',
}));



// Global test setup and cleanup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset fetch mock
  if (global.fetch && typeof global.fetch.mockClear === 'function') {
    global.fetch.mockClear();
  }
});

afterEach(() => {
  // Clean up after each test
  jest.restoreAllMocks();
});

// Suppress console.error for React act() warnings and test errors
const originalError = console.error;
const originalWarn = console.warn;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      ((args[0].includes('An update to') && args[0].includes('was not wrapped in act')) ||
       args[0].includes('Received NaN for') ||
       args[0].includes('Invalid prop') ||
       args[0].includes('Error saving directory settings') ||
       args[0].includes('Error loading chat settings') ||
       args[0].includes('Error saving chat settings') ||
       args[0].includes('Error fetching events') ||
       args[0].includes('Cross origin http://localhost forbidden') ||
       args[0].includes('Payment error') ||
       args[0].includes('Failed to load billing status') ||
       args[0].includes('In HTML, <div> cannot be a descendant of <p>') ||
       args[0].includes('This will cause a hydration error') ||
       args[0].includes('<p> cannot contain a nested <div>') ||
       args[0].includes('Unknown event handler property') ||
       args[0].includes('onValueChange') ||
       args[0].includes('Received `false` for a non-boolean attribute') ||
       args[0].includes('React does not recognize the `whileHover` prop') ||
       args[0].includes('React does not recognize the `whileInView` prop') ||
       args[0].includes('React does not recognize') ||
       args[0].includes('SignalR connection error') ||
       args[0].includes('Error loading chat') ||
       args[0].includes('Error sending message') ||
       args[0].includes('Failed to load event') ||
       args[0].includes('Failed to load dashboard data') ||
       args[0].includes('Error loading member directory') ||
       args[0].includes('Logout error') ||
       args[0].includes('Error fetching email stats') ||
       args[0].includes('Error loading analytics:') ||
       args[0].includes('Error refreshing engagement scores:') ||
       args[0].includes('Failed to track analytics page access:') ||
       args[0].includes('Not implemented: navigation') ||
       args[0].includes('cannot contain a nested <button>'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  // Suppress expected console.warn calls during testing
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' && (
       args[0].includes('D3 scale creation failed, using fallback:') ||
       args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Warning: findDOMNode is deprecated') ||
       args[0].includes('React Router Future Flag Warning:') ||
       args[0].includes('React Router will begin wrapping'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(async () => {
  console.error = originalError;
  console.warn = originalWarn;
  
  // Additional cleanup for async operations that might cause hanging
  await new Promise(resolve => setTimeout(resolve, 50));
});

// Mock window.matchMedia - return proper object
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => {
    const mockMediaQueryList = {
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
    return mockMediaQueryList;
  }),
});

// Mock framer-motion completely to prevent animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
    span: ({ children, ...props }) => React.createElement('span', props, children),
    button: ({ children, ...props }) => React.createElement('button', props, children),
    section: ({ children, ...props }) => React.createElement('section', props, children),
    article: ({ children, ...props }) => React.createElement('article', props, children),
    header: ({ children, ...props }) => React.createElement('header', props, children),
    main: ({ children, ...props }) => React.createElement('main', props, children),
    aside: ({ children, ...props }) => React.createElement('aside', props, children),
    footer: ({ children, ...props }) => React.createElement('footer', props, children),
    nav: ({ children, ...props }) => React.createElement('nav', props, children),
    ul: ({ children, ...props }) => React.createElement('ul', props, children),
    li: ({ children, ...props }) => React.createElement('li', props, children),
    h1: ({ children, ...props }) => React.createElement('h1', props, children),
    h2: ({ children, ...props }) => React.createElement('h2', props, children),
    h3: ({ children, ...props }) => React.createElement('h3', props, children),
    p: ({ children, ...props }) => React.createElement('p', props, children),
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
  useMotionValue: (initial) => ({
    get: jest.fn(() => initial || 0),
    set: jest.fn(),
  }),
  useTransform: (value, transform) => {
    // Mock useTransform to return a value that can be rendered in React
    if (typeof transform === 'function') {
      const inputValue = value && value.get ? value.get() : (value || 0);
      return transform(inputValue);
    }
    return value || 0;
  },
  animate: jest.fn().mockImplementation(() => {
    const controls = {
      stop: jest.fn(),
      then: jest.fn(),
      cancel: jest.fn(),
      complete: jest.fn()
    };
    return controls;
  }),
  useReducedMotion: () => false, // Mock reduced motion preference to false
}));

// Mock Chart.js and chartjs-adapter-date-fns
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
    _adapters: {
      _date: {
        override: jest.fn()
      }
    }
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  ArcElement: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
  Filler: jest.fn(),
  TimeScale: jest.fn(),
}));

// Mock chartjs-adapter-date-fns
jest.mock('chartjs-adapter-date-fns', () => ({}));

// Mock react-chartjs-2 components
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }) => (
    React.createElement('div', { 'data-testid': 'line-chart' }, [
      React.createElement('div', { 'data-testid': 'chart-data', key: 'data' }, JSON.stringify(data)),
      React.createElement('div', { 'data-testid': 'chart-options', key: 'options' }, JSON.stringify(options))
    ])
  ),
  Pie: ({ data, options }) => (
    React.createElement('div', { 'data-testid': 'pie-chart' }, [
      React.createElement('div', { 'data-testid': 'chart-data', key: 'data' }, JSON.stringify(data)),
      React.createElement('div', { 'data-testid': 'chart-options', key: 'options' }, JSON.stringify(options))
    ])
  ),
  Bar: ({ data, options }) => (
    React.createElement('div', { 'data-testid': 'bar-chart' }, [
      React.createElement('div', { 'data-testid': 'chart-data', key: 'data' }, JSON.stringify(data)),
      React.createElement('div', { 'data-testid': 'chart-options', key: 'options' }, JSON.stringify(options))
    ])
  ),
}));

// Mock Radix UI components to prevent React.Children.only errors
jest.mock('@radix-ui/react-select', () => ({
  Root: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'select-root' }, children),
  Trigger: ({ children, ...props }) => React.createElement('button', { ...props, 'data-testid': 'select-trigger' }, children),
  Value: ({ children, ...props }) => React.createElement('span', { ...props, 'data-testid': 'select-value' }, children),
  Content: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'select-content' }, children),
  Item: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'select-item' }, children),
  ItemText: ({ children, ...props }) => React.createElement('span', { ...props, 'data-testid': 'select-item-text' }, children),
  ItemIndicator: ({ children, ...props }) => React.createElement('span', { ...props, 'data-testid': 'select-item-indicator' }, children),
  Viewport: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'select-viewport' }, children),
  Portal: ({ children }) => children,
  Icon: ({ children, ...props }) => React.createElement('span', { ...props, 'data-testid': 'select-icon' }, children),
  ScrollUpButton: ({ children, ...props }) => React.createElement('button', { ...props, 'data-testid': 'select-scroll-up' }, children),
  ScrollDownButton: ({ children, ...props }) => React.createElement('button', { ...props, 'data-testid': 'select-scroll-down' }, children),
  Group: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'select-group' }, children),
  Label: ({ children, ...props }) => React.createElement('label', { ...props, 'data-testid': 'select-label' }, children),
  Separator: ({ ...props }) => React.createElement('hr', { ...props, 'data-testid': 'select-separator' }),
}));

// Mock UI components that use Radix primitives
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'ui-select' }, children),
  SelectTrigger: ({ children, ...props }) => React.createElement('button', { ...props, 'data-testid': 'ui-select-trigger', role: 'combobox', 'aria-expanded': 'false' }, children),
  SelectValue: ({ children, ...props }) => React.createElement('span', { ...props, 'data-testid': 'ui-select-value' }, children || 'Select...'),
  SelectContent: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'ui-select-content', role: 'listbox' }, children),
  SelectItem: ({ children, value, onSelect, ...props }) => React.createElement('div', { 
    ...props, 
    'data-testid': 'ui-select-item', 
    role: 'option', 
    onClick: () => onSelect && onSelect(value),
    'data-value': value
  }, children),
  SelectGroup: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'ui-select-group' }, children),
  SelectLabel: ({ children, ...props }) => React.createElement('label', { ...props, 'data-testid': 'ui-select-label' }, children),
  SelectSeparator: ({ ...props }) => React.createElement('hr', { ...props, 'data-testid': 'ui-select-separator' }),
  SelectScrollUpButton: ({ children, ...props }) => React.createElement('button', { ...props, 'data-testid': 'ui-select-scroll-up' }, children),
  SelectScrollDownButton: ({ children, ...props }) => React.createElement('button', { ...props, 'data-testid': 'ui-select-scroll-down' }, children),
}));

jest.mock('@radix-ui/react-tabs', () => ({
  Root: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'tabs-root' }, children),
  List: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'tabs-list', role: 'tablist' }, children),
  Trigger: ({ children, ...props }) => React.createElement('button', { ...props, 'data-testid': 'tabs-trigger', role: 'tab' }, children),
  Content: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'tabs-content', role: 'tabpanel' }, children),
}));

jest.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open, ...props }) => open ? React.createElement('div', { ...props, 'data-testid': 'dialog-root' }, children) : null,
  Trigger: ({ children, ...props }) => React.createElement('button', { ...props, 'data-testid': 'dialog-trigger' }, children),
  Portal: ({ children }) => children,
  Overlay: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'dialog-overlay' }, children),
  Content: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'dialog-content' }, children),
  Title: ({ children, ...props }) => React.createElement('h2', { ...props, 'data-testid': 'dialog-title' }, children),
  Description: ({ children, ...props }) => React.createElement('p', { ...props, 'data-testid': 'dialog-description' }, children),
  Close: ({ children, ...props }) => React.createElement('button', { ...props, 'data-testid': 'dialog-close' }, children),
}));

jest.mock('@radix-ui/react-dropdown-menu', () => ({
  Root: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'dropdown-root' }, children),
  Trigger: ({ children, ...props }) => React.createElement('button', { ...props, 'data-testid': 'dropdown-trigger' }, children),
  Portal: ({ children }) => children,
  Content: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'dropdown-content' }, children),
  Item: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'dropdown-item' }, children),
  Separator: ({ ...props }) => React.createElement('hr', { ...props, 'data-testid': 'dropdown-separator' }),
}));

jest.mock('@radix-ui/react-checkbox', () => ({
  Root: ({ children, ...props }) => React.createElement('button', { ...props, 'data-testid': 'checkbox-root', role: 'checkbox' }, children),
  Indicator: ({ children, ...props }) => React.createElement('span', { ...props, 'data-testid': 'checkbox-indicator' }, children),
}));

jest.mock('@radix-ui/react-switch', () => ({
  Root: ({ children, checked, onCheckedChange, ...props }) => React.createElement('button', { 
    ...props, 
    'data-testid': props['data-testid'] || 'switch-root',
    role: 'switch',
    'aria-checked': checked,
    onClick: () => onCheckedChange && onCheckedChange(!checked)
  }, children),
  Thumb: ({ children, ...props }) => React.createElement('span', { ...props, 'data-testid': 'switch-thumb' }, children),
}));

jest.mock('@radix-ui/react-radio-group', () => ({
  Root: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'radio-group-root', role: 'radiogroup' }, children),
  Item: ({ children, ...props }) => React.createElement('button', { ...props, 'data-testid': 'radio-group-item', role: 'radio' }, children),
  Indicator: ({ children, ...props }) => React.createElement('span', { ...props, 'data-testid': 'radio-group-indicator' }, children),
}));

jest.mock('@radix-ui/react-alert-dialog', () => ({
  Root: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'alert-dialog-root' }, children),
  Trigger: ({ children, ...props }) => React.createElement('button', { ...props, 'data-testid': 'alert-dialog-trigger' }, children),
  Portal: ({ children }) => children,
  Overlay: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'alert-dialog-overlay' }, children),
  Content: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'alert-dialog-content' }, children),
  Title: ({ children, ...props }) => React.createElement('h2', { ...props, 'data-testid': 'alert-dialog-title' }, children),
  Description: ({ children, ...props }) => React.createElement('p', { ...props, 'data-testid': 'alert-dialog-description' }, children),
  Action: ({ children, ...props }) => React.createElement('button', { ...props, 'data-testid': 'alert-dialog-action' }, children),
  Cancel: ({ children, ...props }) => React.createElement('button', { ...props, 'data-testid': 'alert-dialog-cancel' }, children),
}));

jest.mock('@radix-ui/react-avatar', () => ({
  Root: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'avatar-root' }, children),
  Image: ({ children, ...props }) => React.createElement('img', { ...props, 'data-testid': 'avatar-image' }, children),
  Fallback: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'avatar-fallback' }, children),
}));

jest.mock('@radix-ui/react-collapsible', () => ({
  Root: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'collapsible-root' }, children),
  Trigger: ({ children, ...props }) => React.createElement('button', { ...props, 'data-testid': 'collapsible-trigger' }, children),
  Content: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'collapsible-content' }, children),
}));

jest.mock('@radix-ui/react-label', () => ({
  Root: ({ children, ...props }) => React.createElement('label', { ...props, 'data-testid': 'label-root' }, children),
}));

jest.mock('@radix-ui/react-progress', () => ({
  Root: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'progress-root' }, children),
  Indicator: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'progress-indicator' }, children),
}));

jest.mock('@radix-ui/react-scroll-area', () => ({
  Root: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'scroll-area-root' }, children),
  Viewport: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'scroll-area-viewport' }, children),
  Scrollbar: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'scroll-area-scrollbar' }, children),
  Thumb: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'scroll-area-thumb' }, children),
  Corner: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'scroll-area-corner' }, children),
}));

jest.mock('@radix-ui/react-separator', () => ({
  Root: ({ children, ...props }) => React.createElement('hr', { ...props, 'data-testid': 'separator-root' }, children),
}));

jest.mock('@radix-ui/react-slider', () => ({
  Root: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'slider-root' }, children),
  Track: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'slider-track' }, children),
  Range: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'slider-range' }, children),
  Thumb: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'slider-thumb' }, children),
}));

jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'slot' }, children),
  Slottable: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'slottable' }, children),
}));

jest.mock('@radix-ui/react-popover', () => ({
  Root: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'popover-root' }, children),
  Trigger: ({ children, ...props }) => React.createElement('button', { ...props, 'data-testid': 'popover-trigger' }, children),
  Portal: ({ children }) => children,
  Content: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'popover-content' }, children),
  Arrow: ({ ...props }) => React.createElement('div', { ...props, 'data-testid': 'popover-arrow' }),
  Close: ({ children, ...props }) => React.createElement('button', { ...props, 'data-testid': 'popover-close' }, children),
}));

// Mock hasPointerCapture function for DOM elements
if (typeof Element !== 'undefined') {
  Element.prototype.hasPointerCapture = jest.fn(() => false);
  Element.prototype.setPointerCapture = jest.fn();
  Element.prototype.releasePointerCapture = jest.fn();
}

// Mock environment variables - must match MSW handlers (port 8050)
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8050';
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8050/api/v1';

// Mock auth service globally
jest.mock('./src/services/authService', () => ({
  authService: {
    getAuthToken: jest.fn(() => 'mock-auth-token'),
    getUser: jest.fn(() => ({ clubId: 1, id: 1, role: 'Owner' })),
    login: jest.fn().mockResolvedValue({}),
    logout: jest.fn().mockResolvedValue({}),
    refreshToken: jest.fn().mockResolvedValue({}),
    isAuthenticated: jest.fn(() => true)
  }
}));

// Mock auth context globally - use jest.fn() to allow test-level overrides
const mockUseAuth = jest.fn();
jest.mock('./src/hooks/useAuth', () => ({
  useAuth: mockUseAuth,
  AuthProvider: ({ children }) => children
}));

// Set default auth mock but allow test overrides
mockUseAuth.mockReturnValue({
  user: { clubId: 1, id: 1, role: 'Owner', email: 'test@example.com' },
  club: { id: 1, name: 'Test Club', tier: 'Unlimited' },
  isAuthenticated: true,
  loading: false,
  login: jest.fn(),
  logout: jest.fn()
});

// Mock analytics service globally with proper function exports
jest.mock('./src/services/analyticsService', () => {
  const mockAnalyticsData = {
    clubId: 1,
    clubName: 'Test Club',
    analyticsDateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31')
    },
    overallEngagementScore: 78.5,
    eventMetrics: [
      {
        eventId: 1,
        eventName: 'Test Event',
        eventDate: new Date('2024-01-15'),
        totalRsvps: 25,
        totalAttended: 20,
        rsvpRate: 83.3,
        attendanceRate: 80.0,
        engagementScore: 82.1
      }
    ],
    memberEngagementBreakdown: [
      {
        memberId: 1,
        memberName: 'Alice Johnson',
        engagementLevel: 'Green',
        eventAttendanceRate: 90.0,
        overallScore: 88.5
      }
    ],
    keyInsights: ['Event attendance improved by 15%'],
    recommendations: ['Schedule more weekend events']
  };

  const mockTrendsData = {
    clubId: 1,
    periodDays: 30,
    dailyTrends: [],
    trendDirection: 'Increasing',
    growthRate: 5.2,
    averageEngagementScore: 76.8
  };

  const mockBenchmarksData = {
    clubId: 1,
    averageAttendanceRate: 75.5,
    averageRsvpRate: 82.3,
    averageEngagementScore: 79.1,
    industryComparisons: {},
    performanceIndicators: {},
    benchmarkPeriod: '90 days',
    lastUpdated: new Date('2024-01-15')
  };

  // Mock implementations that resolve immediately
  const mockGetEventEngagementAnalytics = jest.fn().mockResolvedValue(mockAnalyticsData);
  const mockGetEngagementTrends = jest.fn().mockResolvedValue(mockTrendsData);
  const mockGetEngagementBenchmarks = jest.fn().mockResolvedValue(mockBenchmarksData);

  return {
    // Service class instance (for direct service usage)
    analyticsService: {
      getEventEngagementAnalytics: mockGetEventEngagementAnalytics,
      getEngagementTrends: mockGetEngagementTrends,
      getEngagementBenchmarks: mockGetEngagementBenchmarks,
      getMemberEngagementInsights: jest.fn().mockResolvedValue({}),
      getEventRecommendations: jest.fn().mockResolvedValue([]),
      analyzeEventPerformance: jest.fn().mockResolvedValue({}),
      predictEventSuccess: jest.fn().mockResolvedValue({}),
      generateEngagementReport: jest.fn().mockResolvedValue({}),
      getROIMetrics: jest.fn().mockResolvedValue({})
    },
    // Individual function exports (for component imports)
    getEventEngagementAnalytics: mockGetEventEngagementAnalytics,
    getEngagementTrends: mockGetEngagementTrends,
    getEngagementBenchmarks: mockGetEngagementBenchmarks,
    getMemberEngagementInsights: jest.fn().mockResolvedValue({}),
    getEventRecommendations: jest.fn().mockResolvedValue([]),
    analyzeEventPerformance: jest.fn().mockResolvedValue({}),
    predictEventSuccess: jest.fn().mockResolvedValue({}),
    generateEngagementReport: jest.fn().mockResolvedValue({}),
    getROIMetrics: jest.fn().mockResolvedValue({})
  };
});

// Mock SignalR service globally  
jest.mock('./src/services/signalrService', () => ({
  signalrService: {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    off: jest.fn(),
    onConnectionStatus: jest.fn(),
    subscribeToMemberUpdates: jest.fn(),
    unsubscribeFromMemberUpdates: jest.fn(),
    connectionStatus: 'Connected',
    isConnected: true
  }
}));

// Mock SignalR connection factory globally
jest.mock('./src/hooks/signalr-connection', () => {
  const mockConnection = {
    invoke: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    off: jest.fn(),
    onConnectionStatus: jest.fn((onConnected, onDisconnected, onReconnecting, onReconnected) => {
      // Simulate connection success by calling onConnected immediately
      if (onConnected) {
        setTimeout(onConnected, 0);
      }
    }),
    notifyStatus: jest.fn(),
    getConnectionState: jest.fn(() => 'Connected'),
    isConnected: jest.fn(() => true),
    stopConnection: jest.fn().mockResolvedValue(undefined)
  };

  return {
    getSignalRConnection: jest.fn().mockResolvedValue(mockConnection),
    disconnectSignalR: jest.fn().mockResolvedValue(undefined),
    disconnectAllSignalR: jest.fn().mockResolvedValue(undefined),
    getConnectionStatuses: jest.fn(() => ({ engagement: 'Connected' })),
    SignalRConnection: jest.fn(() => mockConnection)
  };
});

// Mock eventEngagementApiService globally
jest.mock('./src/services/eventEngagementApiService', () => {
  const mockEventAnalyticsResponse = {
    metrics: {
      totalEvents: 5,
      totalAttendance: 150,
      averageAttendanceRate: 85.5,
      memberEngagementScore: 78.2,
      eventSatisfactionScore: 4.3,
      repeatAttendanceRate: 67.8,
      noShowRate: 14.5,
      lastUpdated: new Date().toISOString()
    },
    attendanceData: [
      {
        eventId: 1,
        eventName: 'Monthly Business Meeting',
        eventDate: new Date().toISOString(),
        expectedAttendance: 30,
        actualAttendance: 25,
        attendanceRate: 83.3,
        category: 'Business',
        eventType: 'meeting',
        duration: 120,
        location: 'Conference Room A'
      }
    ],
    feedbackData: [],
    recommendations: [],
    memberEngagement: [],
    impactMetrics: [],
    trendData: [
      {
        month: 'Jan',
        eventsHeld: 2,
        totalAttendance: 50,
        averageRating: 4.2,
        memberEngagement: 75.0,
        revenueGenerated: 2500
      }
    ],
    topPerformingEvents: [
      {
        eventId: 1,
        eventName: 'Top Event',
        eventDate: new Date().toISOString(),
        expectedAttendance: 30,
        actualAttendance: 28,
        attendanceRate: 93.3,
        category: 'Business',
        eventType: 'meeting',
        duration: 120,
        location: 'Main Hall'
      }
    ],
    upcomingEvents: [
      {
        eventId: 2,
        eventName: 'Upcoming Event',
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        expectedAttendance: 25,
        actualAttendance: 0,
        attendanceRate: 0,
        category: 'Social',
        eventType: 'social',
        duration: 180,
        location: 'Community Center'
      }
    ]
  };

  return {
    eventEngagementApiService: {
      getEventAnalytics: jest.fn().mockResolvedValue(mockEventAnalyticsResponse),
      getEventEngagement: jest.fn().mockResolvedValue({}),
      getClubEventsEngagement: jest.fn().mockResolvedValue({}),
      getEventAnalyticsDashboard: jest.fn().mockResolvedValue({}),
      getMemberEventEngagement: jest.fn().mockResolvedValue({}),
      recordEventAttendance: jest.fn().mockResolvedValue({}),
      submitEventFeedback: jest.fn().mockResolvedValue({}),
      getEventRecommendations: jest.fn().mockResolvedValue([]),
      trackFeature: jest.fn()
    }
  };
});

// Global timeout tracking for test cleanup
let testTimeouts = new Set();
let testIntervals = new Set();

// Override global setTimeout/setInterval to track them
const originalSetTimeout = global.setTimeout;
const originalSetInterval = global.setInterval;
const originalClearTimeout = global.clearTimeout;
const originalClearInterval = global.clearInterval;

global.setTimeout = (callback, delay, ...args) => {
  const id = originalSetTimeout(callback, delay, ...args);
  testTimeouts.add(id);
  return id;
};

global.setInterval = (callback, delay, ...args) => {
  const id = originalSetInterval(callback, delay, ...args);
  testIntervals.add(id);
  return id;
};

global.clearTimeout = (id) => {
  testTimeouts.delete(id);
  return originalClearTimeout(id);
};

global.clearInterval = (id) => {
  testIntervals.delete(id);
  return originalClearInterval(id);
};

// Ensure proper cleanup of timers and async operations
beforeAll(() => {
  // Use fake timers if needed by specific tests
  jest.useFakeTimers({ advanceTimers: true });
});

beforeEach(() => {
  // Clear timer tracking sets before each test
  testTimeouts.clear();
  testIntervals.clear();
});

afterEach(async () => {
  // Clean up any remaining timers after each test
  testTimeouts.forEach(id => {
    try {
      clearTimeout(id);
    } catch (e) {
      // Ignore errors clearing already cleared timers
    }
  });
  
  testIntervals.forEach(id => {
    try {
      clearInterval(id);
    } catch (e) {
      // Ignore errors clearing already cleared intervals
    }
  });
  
  testTimeouts.clear();
  testIntervals.clear();
  
  // Force cleanup of any pending promises with proper async handling
  await new Promise(resolve => {
    setTimeout(resolve, 0);
  });
});

afterAll(async () => {
  // Clean up fake timers
  jest.useRealTimers();
  
  // Final cleanup of all remaining timers
  testTimeouts.forEach(id => {
    try {
      originalClearTimeout(id);
    } catch (e) {
      // Ignore cleanup errors
    }
  });
  
  testIntervals.forEach(id => {
    try {
      originalClearInterval(id);
    } catch (e) {
      // Ignore cleanup errors
    }
  });
  
  // Clear tracking sets
  testTimeouts.clear();
  testIntervals.clear();
  
  // Wait for any pending async operations to complete
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Final cleanup to prevent worker hanging
  if (typeof gc !== 'undefined') {
    gc();
  }
}); 