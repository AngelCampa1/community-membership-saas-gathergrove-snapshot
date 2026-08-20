/**
 * Mock for chartjs-adapter-date-fns to prevent date handling issues in tests
 */

export default {};

// Mock the adapter registration
export const _adapters = {
  _date: {
    override: jest.fn(),
    formats: jest.fn(),
    parse: jest.fn(),
    format: jest.fn(),
    add: jest.fn(),
    diff: jest.fn(),
    startOf: jest.fn(),
    endOf: jest.fn(),
  },
};

// Adapter mock
export const adapter = {
  formats: {
    datetime: 'MMM d, yyyy, h:mm:ss a',
    millisecond: 'h:mm:ss.SSS a',
    second: 'h:mm:ss a',
    minute: 'h:mm a',
    hour: 'ha',
    day: 'MMM d',
    week: 'PP',
    month: 'MMM yyyy',
    quarter: 'qqq - yyyy',
    year: 'yyyy',
  },
  parse: jest.fn((value: any) => new Date(value).getTime()),
  format: jest.fn((time: number, _format: string) => new Date(time).toLocaleDateString()),
  add: jest.fn((time: number, amount: number, _unit: string) => time + amount * 1000),
  diff: jest.fn((max: number, min: number, _unit: string) => max - min),
  startOf: jest.fn((time: number, _unit: string) => time),
  endOf: jest.fn((time: number, _unit: string) => time),
};