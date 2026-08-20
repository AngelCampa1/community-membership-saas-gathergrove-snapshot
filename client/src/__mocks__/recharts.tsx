/**
 * Comprehensive Recharts Mock for Testing
 * Fixes ResizeObserver API issues and provides proper test components
 */

import React from 'react';

// Mock ResponsiveContainer with proper ResizeObserver handling
const ResponsiveContainer = React.forwardRef<HTMLDivElement, any>(
  ({ children, width = '100%', height = 400, ...props }, ref) => {
    // Ensure ResizeObserver is properly mocked
    React.useEffect(() => {
      const element = ref as React.RefObject<HTMLElement>;
      if (element?.current && global.ResizeObserver) {
        const observer = new ResizeObserver(() => {});
        observer.observe(element.current);
        return () => observer.disconnect();
      }
    }, [ref]);

    return (
      <div
        ref={ref}
        data-testid="responsive-container"
        style={{ width, height }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ResponsiveContainer.displayName = 'ResponsiveContainer';

// Mock BarChart component
const BarChart = ({ children, data, margin, ...props }: any) => (
  <div data-testid="bar-chart" {...props}>
    <svg data-testid="bar-chart-svg" width="100%" height="100%">
      {data?.map((item: any, index: number) => (
        <g key={index} data-testid={`bar-group-${index}`}>
          {Object.keys(item).filter(key => key !== 'name' && key !== 'featureName').map(dataKey => (
            <rect
              key={dataKey}
              data-testid={`bar-${dataKey}`}
              x={index * 50}
              y={100}
              width={40}
              height={item[dataKey] || 10}
              fill={dataKey === 'totalUsageEvents' ? '#3b82f6' : '#10b981'}
            />
          ))}
        </g>
      ))}
    </svg>
    {children}
  </div>
);

// Mock PieChart component
const PieChart = ({ children, ...props }: any) => (
  <div data-testid="pie-chart" {...props}>
    <svg data-testid="pie-chart-svg" width="100%" height="100%">
      <circle cx="50%" cy="50%" r="80" fill="#8884d8" data-testid="pie-circle" />
    </svg>
    {children}
  </div>
);

// Mock Pie component
const Pie = ({ data, dataKey, cx, cy, label, labelLine, outerRadius, fill, children, ...props }: any) => (
  <g data-testid="pie" {...props}>
    {data?.map((entry: any, index: number) => (
      <g key={index} data-testid={`pie-slice-${index}`}>
        <path
          d={`M ${cx || '50%'} ${cy || '50%'} L ${(cx || 200) + (outerRadius || 80)} ${cy || '50%'} A ${outerRadius || 80} ${outerRadius || 80} 0 0 1 ${cx || '50%'} ${(cy || 200) + (outerRadius || 80)} Z`}
          fill={entry.color || fill || '#8884d8'}
        />
        {label && (
          <text x={cx || '50%'} y={cy || '50%'} data-testid={`pie-label-${index}`}>
            {typeof label === 'function' ? label(entry) : entry[dataKey]}
          </text>
        )}
      </g>
    ))}
    {children}
  </g>
);

// Mock Cell component
const Cell = ({ fill, ...props }: any) => (
  <g data-testid="pie-cell" style={{ fill }} {...props} />
);

// Mock XAxis component
const XAxis = ({ dataKey, angle, textAnchor, height, interval, ...props }: any) => (
  <g data-testid="x-axis" {...props}>
    <line x1="0" y1="0" x2="100%" y2="0" stroke="#ccc" />
    <text data-testid="x-axis-label">{dataKey}</text>
  </g>
);

// Mock YAxis component
const YAxis = (props: any) => (
  <g data-testid="y-axis" {...props}>
    <line x1="0" y1="0" x2="0" y2="100%" stroke="#ccc" />
  </g>
);

// Mock CartesianGrid component
const CartesianGrid = ({ strokeDasharray, ...props }: any) => (
  <g data-testid="cartesian-grid" {...props}>
    <defs>
      <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#ccc" strokeWidth="1" strokeDasharray={strokeDasharray} />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
  </g>
);

// Mock Tooltip component
const Tooltip = ({ active, payload, label, ...props }: any) => {
  if (active && payload && payload.length) {
    return (
      <div data-testid="tooltip" className="recharts-tooltip" {...props}>
        <div className="recharts-tooltip-label">{label}</div>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="recharts-tooltip-item" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Mock Legend component
const Legend = ({ payload, ...props }: any) => (
  <div data-testid="legend" {...props}>
    {payload?.map((entry: any, index: number) => (
      <span key={index} className="recharts-legend-item" style={{ color: entry.color }}>
        {entry.value}
      </span>
    ))}
  </div>
);

// Mock Bar component
const Bar = ({ dataKey, fill, name, ...props }: any) => (
  <g data-testid={`bar-${dataKey}`} {...props}>
    <rect fill={fill} data-name={name} />
  </g>
);

// Mock LineChart component
const LineChart = ({ children, data, margin, ...props }: any) => (
  <div data-testid="line-chart" {...props}>
    <svg data-testid="line-chart-svg" width="100%" height="100%">
      {data?.map((item: any, index: number) => (
        <circle key={index} cx={index * 50 + 25} cy="50%" r="3" fill="#3b82f6" />
      ))}
    </svg>
    {children}
  </div>
);

// Mock Line component
const Line = ({ dataKey, stroke, strokeWidth, ...props }: any) => (
  <path
    data-testid={`line-${dataKey}`}
    stroke={stroke}
    strokeWidth={strokeWidth}
    fill="none"
    {...props}
  />
);

// Mock AreaChart component
const AreaChart = ({ children, data, margin, ...props }: any) => (
  <div data-testid="area-chart" {...props}>
    <svg data-testid="area-chart-svg" width="100%" height="100%">
      <path d="M 0 100 L 100 50 L 200 75 L 300 25 L 300 100 Z" fill="#3b82f6" opacity="0.3" />
    </svg>
    {children}
  </div>
);

// Mock Area component
const Area = ({ dataKey, fill, fillOpacity, ...props }: any) => (
  <path
    data-testid={`area-${dataKey}`}
    fill={fill}
    fillOpacity={fillOpacity}
    {...props}
  />
);

// Mock ReferenceLine component
const ReferenceLine = ({ x, y, stroke, strokeDasharray, ...props }: any) => (
  <line
    data-testid="reference-line"
    x1={x || 0}
    y1={y || 0}
    x2={x || '100%'}
    y2={y || '100%'}
    stroke={stroke}
    strokeDasharray={strokeDasharray}
    {...props}
  />
);

// Mock ReferenceArea component
const ReferenceArea = ({ x1, x2, y1, y2, fill, fillOpacity, ...props }: any) => (
  <rect
    data-testid="reference-area"
    x={x1}
    y={y1}
    width={x2 - x1}
    height={y2 - y1}
    fill={fill}
    fillOpacity={fillOpacity}
    {...props}
  />
);

// Mock Brush component
const Brush = ({ dataKey, height, ...props }: any) => (
  <div data-testid="brush" style={{ height }} {...props}>
    <div className="recharts-brush">
      <svg width="100%" height={height}>
        <rect width="100%" height="100%" fill="#f0f0f0" />
      </svg>
    </div>
  </div>
);

// Export all mocked components
export {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
  Brush,
};

// Default export for module compatibility
export default {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
  Brush,
};