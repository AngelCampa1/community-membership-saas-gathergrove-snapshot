/**
 * Mock D3.js library for testing
 * Provides basic functionality needed for analytics chart tests
 */

// Mock color scale functions
const mockColorScale = (domain?: any[]) => ({
  domain: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  interpolate: jest.fn().mockReturnThis(),
  clamp: jest.fn().mockReturnThis(),
  copy: jest.fn().mockReturnThis(),
  unknown: jest.fn().mockReturnThis(),
  // Return a color based on input
  __call: jest.fn((value: any) => {
    if (typeof value === 'number') {
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#DC2626', '#8B5CF6'];
      return colors[value % colors.length];
    }
    return '#3B82F6';
  }),
});

// Mock scale functions
const mockScale = () => ({
  domain: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  nice: jest.fn().mockReturnThis(),
  ticks: jest.fn(() => [0, 25, 50, 75, 100]),
  tickFormat: jest.fn(() => (d: any) => `${d}%`),
  copy: jest.fn().mockReturnThis(),
  invert: jest.fn(),
  bandwidth: jest.fn(() => 20),
  step: jest.fn(() => 25),
  padding: jest.fn().mockReturnThis(),
  paddingInner: jest.fn().mockReturnThis(),
  paddingOuter: jest.fn().mockReturnThis(),
  align: jest.fn().mockReturnThis(),
  round: jest.fn().mockReturnThis(),
  clamp: jest.fn().mockReturnThis(),
  unknown: jest.fn().mockReturnThis(),
  // Call function
  __call: jest.fn((value: any) => {
    if (typeof value === 'number') {
      return value * 10; // Simple mock transformation
    }
    return 0;
  }),
});

// Mock selection functions
const mockSelection = {
  selectAll: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  append: jest.fn().mockReturnThis(),
  attr: jest.fn().mockReturnThis(),
  style: jest.fn().mockReturnThis(),
  text: jest.fn().mockReturnThis(),
  html: jest.fn().mockReturnThis(),
  data: jest.fn().mockReturnThis(),
  enter: jest.fn().mockReturnThis(),
  exit: jest.fn().mockReturnThis(),
  remove: jest.fn().mockReturnThis(),
  merge: jest.fn().mockReturnThis(),
  transition: jest.fn().mockReturnThis(),
  duration: jest.fn().mockReturnThis(),
  delay: jest.fn().mockReturnThis(),
  ease: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
  call: jest.fn().mockReturnThis(),
  node: jest.fn(() => ({
    getBoundingClientRect: () => ({ width: 400, height: 300 }),
  })),
  nodes: jest.fn(() => []),
  datum: jest.fn().mockReturnThis(),
  property: jest.fn().mockReturnThis(),
  classed: jest.fn().mockReturnThis(),
  size: jest.fn(() => 1),
  empty: jest.fn(() => false),
  each: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  raise: jest.fn().mockReturnThis(),
  lower: jest.fn().mockReturnThis(),
};

// Mock format functions
const mockFormat = {
  format: jest.fn((specifier: string) => (value: any) => {
    if (specifier.includes('%')) {
      return `${(value * 100).toFixed(1)}%`;
    }
    if (specifier.includes('.2f')) {
      return value.toFixed(2);
    }
    return String(value);
  }),
  formatPrefix: jest.fn(() => (value: any) => String(value)),
  formatSpecifier: jest.fn(),
  precisionFixed: jest.fn(() => 2),
  precisionPrefix: jest.fn(() => 2),
  precisionRound: jest.fn(() => 2),
};

// Mock array functions
const mockArray = {
  extent: jest.fn((array: any[]) => {
    if (!array || array.length === 0) return [0, 1];
    const values = array.filter(d => typeof d === 'number' && !isNaN(d));
    if (values.length === 0) return [0, 1];
    return [Math.min(...values), Math.max(...values)];
  }),
  max: jest.fn((array: any[], accessor?: (d: any) => number) => {
    if (!array || array.length === 0) return undefined;
    const values = accessor ? array.map(accessor) : array;
    return Math.max(...values.filter(d => typeof d === 'number' && !isNaN(d)));
  }),
  min: jest.fn((array: any[], accessor?: (d: any) => number) => {
    if (!array || array.length === 0) return undefined;
    const values = accessor ? array.map(accessor) : array;
    return Math.min(...values.filter(d => typeof d === 'number' && !isNaN(d)));
  }),
  sum: jest.fn((array: any[], accessor?: (d: any) => number) => {
    if (!array || array.length === 0) return 0;
    const values = accessor ? array.map(accessor) : array;
    return values.reduce((sum, d) => sum + (typeof d === 'number' ? d : 0), 0);
  }),
  mean: jest.fn((array: any[], accessor?: (d: any) => number) => {
    if (!array || array.length === 0) return undefined;
    const values = accessor ? array.map(accessor) : array;
    const numbers = values.filter(d => typeof d === 'number' && !isNaN(d));
    return numbers.length > 0 ? numbers.reduce((sum, d) => sum + d, 0) / numbers.length : undefined;
  }),
  median: jest.fn((array: any[], accessor?: (d: any) => number) => {
    if (!array || array.length === 0) return undefined;
    const values = accessor ? array.map(accessor) : array;
    const numbers = values.filter(d => typeof d === 'number' && !isNaN(d)).sort((a, b) => a - b);
    if (numbers.length === 0) return undefined;
    const mid = Math.floor(numbers.length / 2);
    return numbers.length % 2 ? numbers[mid] : (numbers[mid - 1] + numbers[mid]) / 2;
  }),
  range: jest.fn((start: number, stop?: number, step: number = 1) => {
    if (stop === undefined) {
      stop = start;
      start = 0;
    }
    const result = [];
    for (let i = start; i < stop; i += step) {
      result.push(i);
    }
    return result;
  }),
  ascending: jest.fn((a: any, b: any) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }),
  descending: jest.fn((a: any, b: any) => {
    if (a > b) return -1;
    if (a < b) return 1;
    return 0;
  }),
  quantile: jest.fn(() => 0.5),
  variance: jest.fn(() => 1),
  deviation: jest.fn(() => 1),
  bisect: jest.fn(() => 0),
  bisectLeft: jest.fn(() => 0),
  bisectRight: jest.fn(() => 0),
  shuffle: jest.fn((array: any[]) => [...array]),
  transpose: jest.fn((matrix: any[][]) => matrix[0]?.map((_, i) => matrix.map(row => row[i])) || []),
  zip: jest.fn((...arrays: any[][]) => arrays[0]?.map((_, i) => arrays.map(arr => arr[i])) || []),
  merge: jest.fn((arrays: any[][]) => arrays.flat()),
  pairs: jest.fn((array: any[]) => array.slice(1).map((b, i) => [array[i], b])),
  cross: jest.fn((a: any[], b: any[]) => a.flatMap(x => b.map(y => [x, y]))),
  permute: jest.fn((array: any[], indices: number[]) => indices.map(i => array[i])),
  ticks: jest.fn((start: number, stop: number, count: number = 10) => {
    const step = (stop - start) / (count - 1);
    return Array.from({ length: count }, (_, i) => start + i * step);
  }),
  tickIncrement: jest.fn(() => 10),
  tickStep: jest.fn(() => 10),
  thresholdFreedmanDiaconis: jest.fn(() => 1),
  thresholdScott: jest.fn(() => 1),
  thresholdSturges: jest.fn(() => 1),
  histogram: jest.fn(() => []),
  bin: jest.fn(() => []),
  nest: jest.fn(() => ({
    key: jest.fn().mockReturnThis(),
    entries: jest.fn(() => []),
    object: jest.fn(() => ({})),
    map: jest.fn(() => new Map()),
    rollup: jest.fn().mockReturnThis(),
  })),
  group: jest.fn(() => new Map()),
  rollup: jest.fn(() => new Map()),
  groups: jest.fn(() => []),
  rollups: jest.fn(() => []),
  index: jest.fn(() => new Map()),
  indexes: jest.fn(() => new Map()),
  flatGroup: jest.fn(() => []),
  flatRollup: jest.fn(() => []),
  count: jest.fn(() => 0),
  cross2: jest.fn(() => []),
};

// Mock time functions
const mockTime = {
  timeFormat: jest.fn((specifier: string) => (date: Date) => {
    if (specifier === '%Y') return date.getFullYear().toString();
    if (specifier === '%m') return (date.getMonth() + 1).toString().padStart(2, '0');
    if (specifier === '%d') return date.getDate().toString().padStart(2, '0');
    if (specifier === '%B') return date.toLocaleDateString('en', { month: 'long' });
    return date.toLocaleDateString();
  }),
  timeParse: jest.fn(() => (dateString: string) => new Date(dateString)),
  timeScale: mockScale,
  scaleTime: mockScale,
  timeDay: {
    range: jest.fn(() => []),
    floor: jest.fn((date: Date) => date),
    ceil: jest.fn((date: Date) => date),
    round: jest.fn((date: Date) => date),
    offset: jest.fn((date: Date) => date),
    count: jest.fn(() => 1),
    every: jest.fn(() => ({})),
  },
  timeWeek: {
    range: jest.fn(() => []),
    floor: jest.fn((date: Date) => date),
    ceil: jest.fn((date: Date) => date),
    round: jest.fn((date: Date) => date),
    offset: jest.fn((date: Date) => date),
    count: jest.fn(() => 1),
    every: jest.fn(() => ({})),
  },
  timeMonth: {
    range: jest.fn(() => []),
    floor: jest.fn((date: Date) => date),
    ceil: jest.fn((date: Date) => date),
    round: jest.fn((date: Date) => date),
    offset: jest.fn((date: Date) => date),
    count: jest.fn(() => 1),
    every: jest.fn(() => ({})),
  },
  timeYear: {
    range: jest.fn(() => []),
    floor: jest.fn((date: Date) => date),
    ceil: jest.fn((date: Date) => date),
    round: jest.fn((date: Date) => date),
    offset: jest.fn((date: Date) => date),
    count: jest.fn(() => 1),
    every: jest.fn(() => ({})),
  },
};

// Mock interpolation functions
const mockInterpolate = {
  interpolate: jest.fn(() => (t: number) => `rgb(${Math.floor(255 * t)}, 100, 150)`),
  interpolateRgb: jest.fn(() => (t: number) => `rgb(${Math.floor(255 * t)}, 100, 150)`),
  interpolateHsl: jest.fn(() => (t: number) => `hsl(${Math.floor(360 * t)}, 50%, 50%)`),
  interpolateNumber: jest.fn(() => (t: number) => t),
  interpolateString: jest.fn(() => (t: number) => `${t}`),
  interpolateArray: jest.fn(() => (t: number) => [t]),
  interpolateObject: jest.fn(() => (t: number) => ({ value: t })),
  interpolateRound: jest.fn(() => (t: number) => Math.round(t)),
  quantize: jest.fn(() => []),
  piecewise: jest.fn(() => (t: number) => t),
};

// Mock ease functions
const mockEase = {
  easeLinear: jest.fn((t: number) => t),
  easeQuad: jest.fn((t: number) => t * t),
  easeCubic: jest.fn((t: number) => t * t * t),
  easeCircle: jest.fn((t: number) => 1 - Math.sqrt(1 - t * t)),
  easeBack: jest.fn((t: number) => t),
  easeBounce: jest.fn((t: number) => t),
  easeElastic: jest.fn((t: number) => t),
  easeSin: jest.fn((t: number) => 1 - Math.cos(t * Math.PI / 2)),
  easeExp: jest.fn((t: number) => t),
  easePoly: jest.fn(() => (t: number) => t),
};

// Export all mocked D3 functionality
export const select = jest.fn(() => mockSelection);
export const selectAll = jest.fn(() => mockSelection);
export const selection = mockSelection;

// Scale functions
export const scaleLinear = jest.fn(() => mockScale());
export const scaleBand = jest.fn(() => mockScale());
export const scaleOrdinal = jest.fn(() => mockColorScale());
export const scaleTime = jest.fn(() => mockScale());
export const scaleLog = jest.fn(() => mockScale());
export const scalePow = jest.fn(() => mockScale());
export const scaleSqrt = jest.fn(() => mockScale());
export const scaleQuantile = jest.fn(() => mockScale());
export const scaleQuantize = jest.fn(() => mockScale());
export const scaleThreshold = jest.fn(() => mockScale());
export const scaleIdentity = jest.fn(() => mockScale());
export const scaleSequential = jest.fn(() => mockColorScale());
export const scaleDiverging = jest.fn(() => mockColorScale());

// Color schemes and interpolators
export const schemeCategory10 = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'];
export const schemeSet1 = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00'];
export const schemeSet2 = ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854'];
export const schemeSet3 = ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3'];
export const interpolateViridis = jest.fn((t: number) => `rgb(${Math.floor(255 * t)}, 100, 150)`);
export const interpolatePlasma = jest.fn((t: number) => `rgb(${Math.floor(255 * t)}, 100, 150)`);
export const interpolateInferno = jest.fn((t: number) => `rgb(${Math.floor(255 * t)}, 100, 150)`);
export const interpolateMagma = jest.fn((t: number) => `rgb(${Math.floor(255 * t)}, 100, 150)`);
export const interpolateBlues = jest.fn((t: number) => `rgb(100, 150, ${Math.floor(255 * t)})`);
export const interpolateGreens = jest.fn((t: number) => `rgb(100, ${Math.floor(255 * t)}, 150)`);
export const interpolateReds = jest.fn((t: number) => `rgb(${Math.floor(255 * t)}, 100, 100)`);

// Array functions
export const extent = mockArray.extent;
export const max = mockArray.max;
export const min = mockArray.min;
export const sum = mockArray.sum;
export const mean = mockArray.mean;
export const median = mockArray.median;
export const range = mockArray.range;
export const ascending = mockArray.ascending;
export const descending = mockArray.descending;
export const quantile = mockArray.quantile;
export const variance = mockArray.variance;
export const deviation = mockArray.deviation;
export const bisect = mockArray.bisect;
export const bisectLeft = mockArray.bisectLeft;
export const bisectRight = mockArray.bisectRight;
export const shuffle = mockArray.shuffle;
export const transpose = mockArray.transpose;
export const zip = mockArray.zip;
export const merge = mockArray.merge;
export const pairs = mockArray.pairs;
export const cross = mockArray.cross;
export const permute = mockArray.permute;
export const ticks = mockArray.ticks;
export const tickIncrement = mockArray.tickIncrement;
export const tickStep = mockArray.tickStep;
export const thresholdFreedmanDiaconis = mockArray.thresholdFreedmanDiaconis;
export const thresholdScott = mockArray.thresholdScott;
export const thresholdSturges = mockArray.thresholdSturges;
export const histogram = mockArray.histogram;
export const bin = mockArray.bin;
export const nest = mockArray.nest;
export const group = mockArray.group;
export const rollup = mockArray.rollup;
export const groups = mockArray.groups;
export const rollups = mockArray.rollups;
export const index = mockArray.index;
export const indexes = mockArray.indexes;
export const flatGroup = mockArray.flatGroup;
export const flatRollup = mockArray.flatRollup;
export const count = mockArray.count;

// Format functions
export const format = mockFormat.format;
export const formatPrefix = mockFormat.formatPrefix;
export const formatSpecifier = mockFormat.formatSpecifier;
export const precisionFixed = mockFormat.precisionFixed;
export const precisionPrefix = mockFormat.precisionPrefix;
export const precisionRound = mockFormat.precisionRound;

// Time functions
export const timeFormat = mockTime.timeFormat;
export const timeParse = mockTime.timeParse;
export const timeScale = mockTime.timeScale;
export const timeDay = mockTime.timeDay;
export const timeWeek = mockTime.timeWeek;
export const timeMonth = mockTime.timeMonth;
export const timeYear = mockTime.timeYear;

// Interpolation functions
export const interpolate = mockInterpolate.interpolate;
export const interpolateRgb = mockInterpolate.interpolateRgb;
export const interpolateHsl = mockInterpolate.interpolateHsl;
export const interpolateNumber = mockInterpolate.interpolateNumber;
export const interpolateString = mockInterpolate.interpolateString;
export const interpolateArray = mockInterpolate.interpolateArray;
export const interpolateObject = mockInterpolate.interpolateObject;
export const interpolateRound = mockInterpolate.interpolateRound;
export const quantize = mockInterpolate.quantize;
export const piecewise = mockInterpolate.piecewise;

// Ease functions
export const easeLinear = mockEase.easeLinear;
export const easeQuad = mockEase.easeQuad;
export const easeCubic = mockEase.easeCubic;
export const easeCircle = mockEase.easeCircle;
export const easeBack = mockEase.easeBack;
export const easeBounce = mockEase.easeBounce;
export const easeElastic = mockEase.easeElastic;
export const easeSin = mockEase.easeSin;
export const easeExp = mockEase.easeExp;
export const easePoly = mockEase.easePoly;

// Transition functions
export const transition = jest.fn(() => ({
  duration: jest.fn().mockReturnThis(),
  delay: jest.fn().mockReturnThis(),
  ease: jest.fn().mockReturnThis(),
  attr: jest.fn().mockReturnThis(),
  style: jest.fn().mockReturnThis(),
  tween: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
  call: jest.fn().mockReturnThis(),
  each: jest.fn().mockReturnThis(),
  end: jest.fn(() => Promise.resolve()),
}));

// Timer functions
export const timer = jest.fn(() => ({
  stop: jest.fn(),
  restart: jest.fn(),
}));
export const timeout = jest.fn(() => ({
  stop: jest.fn(),
}));
export const interval = jest.fn(() => ({
  stop: jest.fn(),
}));

// Event functions
export const event = {};
export const mouse = jest.fn(() => [0, 0]);
export const touch = jest.fn(() => [0, 0]);
export const touches = jest.fn(() => []);

// Default export as namespace
const d3 = {
  // Selection
  select,
  selectAll,
  selection,
  
  // Scales
  scaleLinear,
  scaleBand,
  scaleOrdinal,
  scaleTime,
  scaleLog,
  scalePow,
  scaleSqrt,
  scaleQuantile,
  scaleQuantize,
  scaleThreshold,
  scaleIdentity,
  scaleSequential,
  scaleDiverging,
  
  // Color schemes
  schemeCategory10,
  schemeSet1,
  schemeSet2,
  schemeSet3,
  interpolateViridis,
  interpolatePlasma,
  interpolateInferno,
  interpolateMagma,
  interpolateBlues,
  interpolateGreens,
  interpolateReds,
  
  // Array functions
  extent,
  max,
  min,
  sum,
  mean,
  median,
  range,
  ascending,
  descending,
  quantile,
  variance,
  deviation,
  bisect,
  bisectLeft,
  bisectRight,
  shuffle,
  transpose,
  zip,
  merge,
  pairs,
  cross,
  permute,
  ticks,
  tickIncrement,
  tickStep,
  thresholdFreedmanDiaconis,
  thresholdScott,
  thresholdSturges,
  histogram,
  bin,
  nest,
  group,
  rollup,
  groups,
  rollups,
  index,
  indexes,
  flatGroup,
  flatRollup,
  count,
  
  // Format functions
  format,
  formatPrefix,
  formatSpecifier,
  precisionFixed,
  precisionPrefix,
  precisionRound,
  
  // Time functions
  timeFormat,
  timeParse,
  timeScale,
  timeDay,
  timeWeek,
  timeMonth,
  timeYear,
  
  // Interpolation
  interpolate,
  interpolateRgb,
  interpolateHsl,
  interpolateNumber,
  interpolateString,
  interpolateArray,
  interpolateObject,
  interpolateRound,
  quantize,
  piecewise,
  
  // Ease functions
  easeLinear,
  easeQuad,
  easeCubic,
  easeCircle,
  easeBack,
  easeBounce,
  easeElastic,
  easeSin,
  easeExp,
  easePoly,
  
  // Transition and timing
  transition,
  timer,
  timeout,
  interval,
  
  // Events
  event,
  mouse,
  touch,
  touches,
};

export default d3;