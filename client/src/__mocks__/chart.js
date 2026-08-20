/**
 * Comprehensive Chart.js Mocking Infrastructure
 * Addresses test design issues with chart rendering and configuration
 * Provides consistent, reliable mocking for all Chart.js components
 */

// Mock Chart.js core with full constructor functionality
const MockChart = function(ctx, config) {
  const instance = {
    ctx,
    config,
    data: config?.data || { datasets: [], labels: [] },
    options: config?.options || {},
    id: Math.random().toString(36).substr(2, 9),
    destroy: jest.fn(),
    update: jest.fn((mode) => {
      if (mode === 'resize') {
        // Simulate resize update
      }
    }),
    render: jest.fn(),
    resize: jest.fn(),
    reset: jest.fn(),
    stop: jest.fn(),
    clear: jest.fn(),
    toBase64Image: jest.fn(() => 'data:image/png;base64,mock-image'),
    generateLegend: jest.fn(() => '<ul class="mock-legend"></ul>'),
    getElementsAtEventForMode: jest.fn(() => []),
    getElementAtEvent: jest.fn(() => null),
    getDatasetAtEvent: jest.fn(() => []),
    isPointInArea: jest.fn(() => false),
    canvas: ctx && ctx.canvas ? ctx.canvas : { 
      width: 400, 
      height: 300,
      getContext: jest.fn(() => ({
        fillRect: jest.fn(),
        clearRect: jest.fn(),
        stroke: jest.fn(),
        fill: jest.fn(),
        beginPath: jest.fn(),
        closePath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        arc: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        translate: jest.fn(),
        rotate: jest.fn(),
        scale: jest.fn(),
        measureText: jest.fn(() => ({ width: 50 })),
        fillText: jest.fn(),
        strokeText: jest.fn()
      }))
    }
  };
  
  MockChart.instances.set(instance.id, instance);
  return instance;
};

// Static properties and methods
MockChart.register = jest.fn();
MockChart.defaults = {
  responsive: true,
  maintainAspectRatio: false,
  global: {
    responsive: true,
    maintainAspectRatio: false
  }
};
MockChart.instances = new Map();
MockChart.getChart = jest.fn((id) => MockChart.instances.get(id));
MockChart.helpers = {
  color: jest.fn((value) => ({ rgbString: () => value })),
  getValueOrDefault: jest.fn((value, defaultValue) => value !== undefined ? value : defaultValue)
};

// Chart.js registry mock
MockChart.registry = {
  add: jest.fn(),
  addControllers: jest.fn(),
  addElements: jest.fn(),
  addPlugins: jest.fn(),
  addScales: jest.fn(),
  getController: jest.fn(),
  getElement: jest.fn(),
  getPlugin: jest.fn(),
  getScale: jest.fn(),
  remove: jest.fn()
};

// Chart.js layouts mock
MockChart.layouts = {
  addBox: jest.fn(),
  removeBox: jest.fn(),
  configure: jest.fn(),
  update: jest.fn()
};

// Export Chart as both named and default export for compatibility
const Chart = MockChart;
const ChartJS = MockChart;

export { Chart, ChartJS, Chart as default };
export default Chart;

// Mock Chart.js scales with proper constructors
export const CategoryScale = jest.fn().mockImplementation(() => ({
  id: 'category',
  type: 'category',
  position: 'bottom'
}));

export const LinearScale = jest.fn().mockImplementation(() => ({
  id: 'linear',
  type: 'linear',
  position: 'left'
}));

export const LogarithmicScale = jest.fn().mockImplementation(() => ({
  id: 'logarithmic',
  type: 'logarithmic',
  position: 'left'
}));

export const RadialLinearScale = jest.fn().mockImplementation(() => ({
  id: 'radialLinear',
  type: 'radialLinear'
}));

export const TimeScale = jest.fn().mockImplementation(() => ({
  id: 'time',
  type: 'time',
  position: 'bottom'
}));

export const TimeSeriesScale = jest.fn().mockImplementation(() => ({
  id: 'timeseries',
  type: 'timeseries',
  position: 'bottom'
}));

// Mock Chart.js elements with proper constructors
export const BarElement = jest.fn().mockImplementation(() => ({
  type: 'bar',
  draw: jest.fn(),
  inRange: jest.fn(() => false),
  inXRange: jest.fn(() => false),
  inYRange: jest.fn(() => false),
  getCenterPoint: jest.fn(() => ({ x: 0, y: 0 })),
  getRange: jest.fn(() => ({ left: 0, right: 0, top: 0, bottom: 0 }))
}));

export const LineElement = jest.fn().mockImplementation(() => ({
  type: 'line',
  draw: jest.fn(),
  inRange: jest.fn(() => false),
  path: jest.fn()
}));

export const PointElement = jest.fn().mockImplementation(() => ({
  type: 'point',
  draw: jest.fn(),
  inRange: jest.fn(() => false),
  inXRange: jest.fn(() => false),
  inYRange: jest.fn(() => false),
  getCenterPoint: jest.fn(() => ({ x: 0, y: 0 }))
}));

export const ArcElement = jest.fn().mockImplementation(() => ({
  type: 'arc',
  draw: jest.fn(),
  inRange: jest.fn(() => false),
  getCenterPoint: jest.fn(() => ({ x: 0, y: 0 })),
  getAngleRange: jest.fn(() => ({ start: 0, end: Math.PI * 2 }))
}));

export const RectangleElement = jest.fn().mockImplementation(() => ({
  type: 'rectangle',
  draw: jest.fn(),
  inRange: jest.fn(() => false),
  inXRange: jest.fn(() => false),
  inYRange: jest.fn(() => false),
  getCenterPoint: jest.fn(() => ({ x: 0, y: 0 }))
}));

// Mock Chart.js plugins with proper constructors
export const Title = jest.fn().mockImplementation(() => ({
  id: 'title',
  beforeDraw: jest.fn(),
  afterDraw: jest.fn()
}));

export const Tooltip = jest.fn().mockImplementation(() => ({
  id: 'tooltip',
  beforeEvent: jest.fn(),
  afterEvent: jest.fn()
}));

export const Legend = jest.fn().mockImplementation(() => ({
  id: 'legend',
  beforeDraw: jest.fn(),
  afterDraw: jest.fn(),
  handleEvent: jest.fn()
}));

export const SubTitle = jest.fn().mockImplementation(() => ({
  id: 'subtitle',
  beforeDraw: jest.fn(),
  afterDraw: jest.fn()
}));

export const Filler = jest.fn().mockImplementation(() => ({
  id: 'filler',
  beforeDatasetsDraw: jest.fn(),
  afterDatasetsDraw: jest.fn()
}));

// Mock Chart.js controllers
export const BarController = jest.fn();
export const LineController = jest.fn();
export const PieController = jest.fn();
export const DoughnutController = jest.fn();
export const ScatterController = jest.fn();
export const BubbleController = jest.fn();
export const PolarAreaController = jest.fn();
export const RadarController = jest.fn();

// Mock Chart.js interactions
export const Interaction = {
  modes: {
    point: jest.fn(),
    nearest: jest.fn(),
    index: jest.fn(),
    dataset: jest.fn(),
    x: jest.fn(),
    y: jest.fn()
  }
};

// Mock Chart.js animations
export const Animation = {
  easing: {
    linear: jest.fn(),
    easeInQuad: jest.fn(),
    easeOutQuad: jest.fn(),
    easeInOutQuad: jest.fn()
  }
};

// Additional exports for comprehensive compatibility
export const registerables = [];

// Chart.js core mock only - React components are in react-chartjs-2.tsx mock