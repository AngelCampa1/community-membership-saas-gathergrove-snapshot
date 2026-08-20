/**
 * Comprehensive Chart.js and react-chartjs-2 Mocks
 * Provides consistent test IDs and proper mock behavior for all chart types
 */

import React from 'react';

// Mock Chart.js auto module
export const mockChartJsAuto = {
  Chart: {
    register: jest.fn(),
    defaults: { 
      font: { family: 'Arial', size: 12 }, 
      color: '#666',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
    },
    elements: {
      bar: { backgroundColor: 'rgba(75, 192, 192, 0.6)' },
      line: { borderColor: 'rgba(75, 192, 192, 1)' },
      point: { backgroundColor: 'rgba(75, 192, 192, 1)' },
      arc: { backgroundColor: 'rgba(255, 99, 132, 0.6)' },
    },
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  LineElement: jest.fn(),
  PointElement: jest.fn(),
  ArcElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
  Filler: jest.fn(),
  RadialLinearScale: jest.fn(),
  DoughnutController: jest.fn(),
  PieController: jest.fn(),
  BarController: jest.fn(),
  LineController: jest.fn(),
};

// Enhanced Chart Component Mock Factory
const createChartMock = (chartType: string) => {
  return React.forwardRef<HTMLCanvasElement, any>(function ChartMock(
    { data, options, plugins, width, height, redraw, ...props },
    ref
  ) {
    // Render chart data as attributes for test inspection
    const chartDataString = data ? JSON.stringify(data) : '';
    const chartOptionsString = options ? JSON.stringify(options) : '';
    
    return React.createElement('canvas', {
      ref,
      'data-testid': `${chartType.toLowerCase()}-chart`,
      'data-chart-type': chartType.toLowerCase(),
      'data-chart-data': chartDataString,
      'data-chart-options': chartOptionsString,
      'data-plugins': plugins ? JSON.stringify(plugins) : undefined,
      width: width || 400,
      height: height || 300,
      className: props.className,
      style: {
        width: '100%',
        height: '100%',
        maxWidth: width || 400,
        maxHeight: height || 300,
        ...props.style,
      },
      ...props,
    }, `${chartType} Chart: ${data?.datasets?.length || 0} dataset(s)`);
  });
};

// Mock react-chartjs-2 components with proper test IDs
export const mockReactChartJs2 = {
  Bar: createChartMock('Bar'),
  Line: createChartMock('Line'),
  Pie: createChartMock('Pie'),
  Doughnut: createChartMock('Doughnut'),
  Radar: createChartMock('Radar'),
  PolarArea: createChartMock('PolarArea'),
  Bubble: createChartMock('Bubble'),
  Scatter: createChartMock('Scatter'),
  
  // Chart.js React wrapper
  Chart: React.forwardRef<HTMLCanvasElement, any>(function Chart(
    { type, data, options, plugins, ...props },
    ref
  ) {
    const chartType = type || 'generic';
    return React.createElement('canvas', {
      ref,
      'data-testid': `${chartType.toLowerCase()}-chart`,
      'data-chart-type': chartType.toLowerCase(),
      'data-chart-data': data ? JSON.stringify(data) : '',
      'data-chart-options': options ? JSON.stringify(options) : '',
      width: 400,
      height: 300,
      className: props.className,
      ...props,
    }, `${chartType} Chart`);
  }),

  // Utility functions
  getElementAtEvent: jest.fn().mockReturnValue([]),
  getElementsAtEvent: jest.fn().mockReturnValue([]),
  getDatasetAtEvent: jest.fn().mockReturnValue([]),
};

// Recharts compatibility mocks (for tests that use recharts-style syntax)
export const mockRechartsCompat = {
  ResponsiveContainer: ({ children, width, height, ...props }: any) => 
    React.createElement('div', {
      'data-testid': 'responsive-container',
      'data-width': width,
      'data-height': height,
      style: { width: width || '100%', height: height || 300 },
      ...props,
    }, children),

  BarChart: ({ children, data, width, height, margin, ...props }: any) =>
    React.createElement('div', {
      'data-testid': 'bar-chart',
      'data-chart-data': data ? JSON.stringify(data) : '',
      'data-width': width,
      'data-height': height,
      'data-margin': margin ? JSON.stringify(margin) : '',
      ...props,
    }, [
      children,
      data && data.map((item: any, index: number) => (
        React.createElement('div', {
          key: index,
          'data-testid': `bar-item-${index}`,
          'data-item': JSON.stringify(item),
        })
      ))
    ]),

  LineChart: ({ children, data, width, height, margin, ...props }: any) =>
    React.createElement('div', {
      'data-testid': 'line-chart',
      'data-chart-data': data ? JSON.stringify(data) : '',
      'data-width': width,
      'data-height': height,
      'data-margin': margin ? JSON.stringify(margin) : '',
      ...props,
    }, children),

  AreaChart: ({ children, data, width, height, margin, ...props }: any) =>
    React.createElement('div', {
      'data-testid': 'area-chart',
      'data-chart-data': data ? JSON.stringify(data) : '',
      'data-width': width,
      'data-height': height,
      'data-margin': margin ? JSON.stringify(margin) : '',
      ...props,
    }, children),

  PieChart: ({ children, data, width, height, ...props }: any) =>
    React.createElement('div', {
      'data-testid': 'pie-chart',
      'data-chart-data': data ? JSON.stringify(data) : '',
      'data-width': width,
      'data-height': height,
      ...props,
    }, children),

  ComposedChart: ({ children, data, width, height, margin, ...props }: any) =>
    React.createElement('div', {
      'data-testid': 'composed-chart',
      'data-chart-data': data ? JSON.stringify(data) : '',
      'data-width': width,
      'data-height': height,
      'data-margin': margin ? JSON.stringify(margin) : '',
      ...props,
    }, children),

  XAxis: ({ dataKey, tick, axisLine, tickLine, ...props }: any) =>
    React.createElement('div', {
      'data-testid': 'x-axis',
      'data-key': dataKey,
      'data-tick': tick ? JSON.stringify(tick) : '',
      'data-axis-line': axisLine,
      'data-tick-line': tickLine,
      ...props,
    }),

  YAxis: ({ dataKey, tick, axisLine, tickLine, orientation, ...props }: any) =>
    React.createElement('div', {
      'data-testid': 'y-axis',
      'data-key': dataKey,
      'data-tick': tick ? JSON.stringify(tick) : '',
      'data-axis-line': axisLine,
      'data-tick-line': tickLine,
      'data-orientation': orientation,
      ...props,
    }),

  CartesianGrid: ({ strokeDasharray, ...props }: any) =>
    React.createElement('div', {
      'data-testid': 'cartesian-grid',
      'data-stroke-dasharray': strokeDasharray,
      ...props,
    }),

  Tooltip: ({ labelFormatter, formatter, contentStyle, ...props }: any) =>
    React.createElement('div', {
      'data-testid': 'tooltip',
      'data-label-formatter': labelFormatter ? labelFormatter.toString() : '',
      'data-formatter': formatter ? formatter.toString() : '',
      'data-content-style': contentStyle ? JSON.stringify(contentStyle) : '',
      ...props,
    }),

  Legend: ({ iconType, layout, align, verticalAlign, ...props }: any) =>
    React.createElement('div', {
      'data-testid': 'legend',
      'data-icon-type': iconType,
      'data-layout': layout,
      'data-align': align,
      'data-vertical-align': verticalAlign,
      ...props,
    }),

  Bar: ({ dataKey, fill, stackId, name, ...props }: any) =>
    React.createElement('div', {
      'data-testid': `bar-${dataKey}`,
      'data-key': dataKey,
      'data-fill': fill,
      'data-stack-id': stackId,
      'data-name': name,
      ...props,
    }),

  Line: ({ dataKey, stroke, strokeWidth, dot, name, type, ...props }: any) =>
    React.createElement('div', {
      'data-testid': `line-${dataKey}`,
      'data-key': dataKey,
      'data-stroke': stroke,
      'data-stroke-width': strokeWidth,
      'data-dot': dot,
      'data-name': name,
      'data-type': type,
      ...props,
    }),

  Area: ({ dataKey, fill, stroke, stackId, name, type, ...props }: any) =>
    React.createElement('div', {
      'data-testid': `area-${dataKey}`,
      'data-key': dataKey,
      'data-fill': fill,
      'data-stroke': stroke,
      'data-stack-id': stackId,
      'data-name': name,
      'data-type': type,
      ...props,
    }),

  Cell: ({ fill, ...props }: any) =>
    React.createElement('div', {
      'data-testid': 'cell',
      'data-fill': fill,
      ...props,
    }),

  Pie: ({ data, dataKey, nameKey, cx, cy, outerRadius, fill, label, ...props }: any) =>
    React.createElement('div', {
      'data-testid': 'pie',
      'data-key': dataKey,
      'data-name-key': nameKey,
      'data-chart-data': data ? JSON.stringify(data) : '',
      'data-cx': cx,
      'data-cy': cy,
      'data-outer-radius': outerRadius,
      'data-fill': fill,
      'data-label': label?.toString?.() || label,
      ...props,
    }, data ? `${data.length} slices` : '0 slices'),

  ReferenceLine: ({ y, x, stroke, strokeDasharray, label, ...props }: any) =>
    React.createElement('div', {
      'data-testid': 'reference-line',
      'data-y': y,
      'data-x': x,
      'data-stroke': stroke,
      'data-stroke-dasharray': strokeDasharray,
      'data-label': label,
      ...props,
    }),

  ReferenceArea: ({ y1, y2, x1, x2, fill, stroke, ...props }: any) =>
    React.createElement('div', {
      'data-testid': 'reference-area',
      'data-y1': y1,
      'data-y2': y2,
      'data-x1': x1,
      'data-x2': x2,
      'data-fill': fill,
      'data-stroke': stroke,
      ...props,
    }),

  Brush: ({ dataKey, height, ...props }: any) =>
    React.createElement('div', {
      'data-testid': 'brush',
      'data-key': dataKey,
      'data-height': height,
      ...props,
    }),
};

// Mock Chart.js registration system
export const mockRegistration = {
  registerables: [
    'CategoryScale',
    'LinearScale', 
    'BarElement',
    'LineElement',
    'PointElement',
    'ArcElement',
    'Title',
    'Tooltip',
    'Legend',
    'Filler',
  ],
  Chart: {
    register: jest.fn(),
    unregister: jest.fn(),
    defaults: mockChartJsAuto.Chart.defaults,
  },
};

// Accessibility mocks for chart components
export const mockAccessibleCharts = {
  AccessibleBarChart: ({ children, data, ...props }: any) =>
    React.createElement('div', {
      'data-testid': 'accessible-bar-chart',
      'data-chart-data': data ? JSON.stringify(data) : '',
      role: 'img',
      'aria-label': 'Bar chart',
      tabIndex: 0,
      ...props,
    }, children),

  AccessibleLineChart: ({ children, data, ...props }: any) =>
    React.createElement('div', {
      'data-testid': 'accessible-line-chart',
      'data-chart-data': data ? JSON.stringify(data) : '',
      role: 'img',
      'aria-label': 'Line chart',
      tabIndex: 0,
      ...props,
    }, children),

  AccessibleDoughnutChart: ({ children, data, ...props }: any) =>
    React.createElement('div', {
      'data-testid': 'accessible-doughnut-chart',
      'data-chart-data': data ? JSON.stringify(data) : '',
      role: 'img',
      'aria-label': 'Doughnut chart',
      tabIndex: 0,
      ...props,
    }, children),
};

// Export utility functions for tests
export const chartTestUtils = {
  // Extract chart data for assertions
  getChartData: (element: HTMLElement): any => {
    const dataAttr = element.getAttribute('data-chart-data');
    return dataAttr ? JSON.parse(dataAttr) : null;
  },

  // Extract chart options for assertions
  getChartOptions: (element: HTMLElement): any => {
    const optionsAttr = element.getAttribute('data-chart-options');
    return optionsAttr ? JSON.parse(optionsAttr) : null;
  },

  // Get chart type
  getChartType: (element: HTMLElement): string => {
    return element.getAttribute('data-chart-type') || 'unknown';
  },

  // Verify chart has data
  hasData: (element: HTMLElement): boolean => {
    const data = chartTestUtils.getChartData(element);
    return data && (data.datasets?.length > 0 || data.length > 0);
  },

  // Get dataset count
  getDatasetCount: (element: HTMLElement): number => {
    const data = chartTestUtils.getChartData(element);
    if (data?.datasets) return data.datasets.length;
    if (Array.isArray(data)) return data.length;
    return 0;
  },
};

// Default export for easy importing
export default {
  chartjs: mockChartJsAuto,
  reactChartjs2: mockReactChartJs2,
  recharts: mockRechartsCompat,
  accessible: mockAccessibleCharts,
  registration: mockRegistration,
  utils: chartTestUtils,
};