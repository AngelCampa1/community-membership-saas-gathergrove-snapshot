// Enhanced Mock react-chartjs-2 components for testing
import React from 'react';

interface ChartData {
  labels?: string[];
  datasets: Array<{
    label?: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    [key: string]: unknown;
  }>;
}

interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: Record<string, unknown>;
  scales?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: ChartData;
  options?: ChartOptions;
}

// Enhanced Line chart mock
export const Line = React.forwardRef<HTMLDivElement, ChartProps>(({ data, options: _options, ...props }, ref) => {
  const labels = data?.labels || [];
  const datasets = data?.datasets || [];
  
  return (
    <div 
      ref={ref}
      data-testid="line-chart" 
      data-chart-type="line" 
      data-chart-labels={JSON.stringify(labels)}
      data-chart-datasets-count={datasets.length}
      style={{
        width: '100%',
        height: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        backgroundColor: '#f8fafc',
      }}
      {...props}
    >
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <div>Line Chart Mock</div>
        <div style={{ fontSize: '12px' }}>{labels.length} labels, {datasets.length} datasets</div>
      </div>
    </div>
  );
});
Line.displayName = 'MockLineChart';

// Enhanced Bar chart mock
export const Bar = React.forwardRef<HTMLDivElement, ChartProps>(({ data, options: _options, ...props }, ref) => {
  const labels = data?.labels || [];
  const datasets = data?.datasets || [];
  
  return (
    <div 
      ref={ref}
      data-testid="bar-chart" 
      data-chart-type="bar" 
      data-chart-labels={JSON.stringify(labels)}
      data-chart-datasets-count={datasets.length}
      style={{
        width: '100%',
        height: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        backgroundColor: '#f8fafc',
      }}
      {...props}
    >
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <div>Bar Chart Mock</div>
        <div style={{ fontSize: '12px' }}>{labels.length} labels, {datasets.length} datasets</div>
      </div>
    </div>
  );
});
Bar.displayName = 'MockBarChart';

// Enhanced Pie chart mock
export const Pie = React.forwardRef<HTMLDivElement, ChartProps>(({ data, options: _options, ...props }, ref) => {
  const labels = data?.labels || [];
  const datasets = data?.datasets || [];
  
  return (
    <div 
      ref={ref}
      data-testid="pie-chart" 
      data-chart-type="pie" 
      data-chart-labels={JSON.stringify(labels)}
      data-chart-datasets-count={datasets.length}
      style={{
        width: '100%',
        height: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        backgroundColor: '#f8fafc',
      }}
      {...props}
    >
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <div>Pie Chart Mock</div>
        <div style={{ fontSize: '12px' }}>{labels.length} labels, {datasets.length} datasets</div>
      </div>
    </div>
  );
});
Pie.displayName = 'MockPieChart';

// Enhanced Doughnut chart mock
export const Doughnut = React.forwardRef<HTMLDivElement, ChartProps>(({ data: _data, options: _options, ...props }, ref) => (
  <div 
    ref={ref}
    data-testid="doughnut-chart" 
    data-chart-type="doughnut" 
    style={{
      width: '100%',
      height: '300px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      backgroundColor: '#f8fafc',
    }}
    {...props}
  >
    <div style={{ textAlign: 'center', color: '#64748b' }}>Mock Doughnut Chart</div>
  </div>
));
Doughnut.displayName = 'MockDoughnutChart';

// Enhanced Scatter chart mock
export const Scatter = React.forwardRef<HTMLDivElement, ChartProps>(({ data: _data, options: _options, ...props }, ref) => (
  <div 
    ref={ref}
    data-testid="scatter-chart" 
    data-chart-type="scatter" 
    style={{
      width: '100%',
      height: '300px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      backgroundColor: '#f8fafc',
    }}
    {...props}
  >
    <div style={{ textAlign: 'center', color: '#64748b' }}>Mock Scatter Chart</div>
  </div>
));
Scatter.displayName = 'MockScatterChart';

// Enhanced Radar chart mock
export const Radar = React.forwardRef<HTMLDivElement, ChartProps>(({ data: _data, options: _options, ...props }, ref) => (
  <div 
    ref={ref}
    data-testid="radar-chart" 
    data-chart-type="radar" 
    style={{
      width: '100%',
      height: '300px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      backgroundColor: '#f8fafc',
    }}
    {...props}
  >
    <div style={{ textAlign: 'center', color: '#64748b' }}>Mock Radar Chart</div>
  </div>
));
Radar.displayName = 'MockRadarChart';

// Mock additional chart types
export const PolarArea = React.forwardRef<HTMLDivElement, ChartProps>(({ data: _data, options: _options, ...props }, ref) => (
  <div 
    ref={ref}
    data-testid="polar-area-chart" 
    data-chart-type="polarArea" 
    style={{
      width: '100%',
      height: '300px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      backgroundColor: '#f8fafc',
    }}
    {...props}
  >
    <div style={{ textAlign: 'center', color: '#64748b' }}>Mock Polar Area Chart</div>
  </div>
));
PolarArea.displayName = 'MockPolarAreaChart';

export const Bubble = React.forwardRef<HTMLDivElement, ChartProps>(({ data: _data, options: _options, ...props }, ref) => (
  <div 
    ref={ref}
    data-testid="bubble-chart" 
    data-chart-type="bubble" 
    style={{
      width: '100%',
      height: '300px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      backgroundColor: '#f8fafc',
    }}
    {...props}
  >
    <div style={{ textAlign: 'center', color: '#64748b' }}>Mock Bubble Chart</div>
  </div>
));
Bubble.displayName = 'MockBubbleChart';

// Mock chart interaction functions
export const getElementAtEvent = jest.fn(() => []);
export const getElementsAtEvent = jest.fn(() => []);
export const getDatasetAtEvent = jest.fn(() => []);

// Default export object
const chartComponents = {
  Line,
  Bar,
  Pie,
  Doughnut,
  Scatter,
  Radar,
  PolarArea,
  Bubble,
  getElementAtEvent,
  getElementsAtEvent,
  getDatasetAtEvent,
};

export default chartComponents;