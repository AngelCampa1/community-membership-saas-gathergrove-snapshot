/**
 * Universal Chart.js Mock for React Testing
 * Provides comprehensive mocking for all Chart.js components and configurations
 */

// Mock Chart.js core
export const Chart = {
  register: jest.fn(),
  unregister: jest.fn(),
  version: '4.0.0',
};

// Mock Chart.js elements and scales
export const CategoryScale = jest.fn();
export const LinearScale = jest.fn();
export const PointElement = jest.fn();
export const LineElement = jest.fn();
export const ArcElement = jest.fn();
export const BarElement = jest.fn();
export const Title = jest.fn();
export const Tooltip = jest.fn();
export const Legend = jest.fn();
export const Filler = jest.fn();
export const TimeScale = jest.fn();

// Mock chart configurations
export const mockChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
    },
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false,
  },
};

// Default export matches Chart.js structure
const ChartJSMock = {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
};

export default ChartJSMock;