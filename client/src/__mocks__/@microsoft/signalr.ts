// Mock SignalR for testing
export const mockConnection = {
  start: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
  invoke: jest.fn(() => Promise.resolve()),
  on: jest.fn(),
  off: jest.fn(),
  onclose: jest.fn(),
  onreconnecting: jest.fn(),
  onreconnected: jest.fn(),
  state: 'Connected',
};

export const HubConnectionBuilder = jest.fn(() => ({
  withUrl: jest.fn(() => ({
    withAutomaticReconnect: jest.fn(() => ({
      configureLogging: jest.fn(() => ({
        build: jest.fn(() => mockConnection),
      })),
    })),
  })),
}));

export const LogLevel = {
  Error: 0,
  Warning: 1,
  Information: 2,
  Debug: 3,
  Trace: 4,
} as const;

export const HubConnectionState = {
  Disconnected: 'Disconnected',
  Connecting: 'Connecting', 
  Connected: 'Connected',
  Disconnecting: 'Disconnecting',
  Reconnecting: 'Reconnecting',
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];
export type HubConnectionState = typeof HubConnectionState[keyof typeof HubConnectionState];