import { MockSignalRConnection } from '../../types/test-types';

/**
 * Enhanced SignalR Service Mock
 * Provides better type safety for testing SignalR functionality
 */
export const mockConnection: MockSignalRConnection = {
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  invoke: jest.fn().mockResolvedValue({}),
  on: jest.fn(),
  off: jest.fn(),
  onclose: jest.fn(),
  onreconnecting: jest.fn(),
  onreconnected: jest.fn(),
  state: 'Disconnected',
};

export const mockSignalRService = {
  connect: jest.fn().mockResolvedValue(mockConnection),
  disconnect: jest.fn().mockResolvedValue(undefined),
  isConnected: jest.fn().mockReturnValue(false),
  sendMessage: jest.fn().mockResolvedValue(undefined),
  joinGroup: jest.fn().mockResolvedValue(undefined),
  leaveGroup: jest.fn().mockResolvedValue(undefined),
  onMessageReceived: jest.fn(),
  onGroupJoined: jest.fn(),
  onUserStatusChanged: jest.fn(),
  getConnectionState: jest.fn().mockReturnValue('Disconnected'),
};

export default mockSignalRService;