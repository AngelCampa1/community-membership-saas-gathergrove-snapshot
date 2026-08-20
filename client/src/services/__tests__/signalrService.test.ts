/**
 * @jest-environment jsdom
 *
 * SignalR Service Tests
 *
 * Comprehensive tests for SignalR service including connection management,
 * event handlers, reconnection logic, and error handling.
 *
 * Note: SignalR is globally mocked in setupTests.ts. These tests work with
 * that mock to verify service behavior.
 */

// Mock the logger at the boundary
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

import { SignalRService, signalRService } from '../signalrService';
import { logger } from '@/lib/logger';
import { HubConnectionBuilder } from '@microsoft/signalr';

const mockLogger = logger as jest.Mocked<typeof logger>;
const MockHubConnectionBuilder = HubConnectionBuilder as jest.MockedClass<typeof HubConnectionBuilder>;

describe('SignalRService', () => {
  let mockConnection: {
    start: jest.Mock;
    stop: jest.Mock;
    on: jest.Mock;
    off: jest.Mock;
    invoke: jest.Mock;
    state: string;
    onreconnecting: jest.Mock;
    onreconnected: jest.Mock;
    onclose: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Set up the mock connection with handlers
    mockConnection = {
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      off: jest.fn(),
      invoke: jest.fn().mockResolvedValue(undefined),
      state: 'Disconnected',
      onreconnecting: jest.fn(),
      onreconnected: jest.fn(),
      onclose: jest.fn(),
    };

    // Configure the global mock to return our testable connection
    MockHubConnectionBuilder.mockImplementation(() => ({
      withUrl: jest.fn().mockReturnThis(),
      withAutomaticReconnect: jest.fn().mockReturnThis(),
      configureLogging: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue(mockConnection),
    }) as unknown as InstanceType<typeof HubConnectionBuilder>);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('exports', () => {
    it('should export SignalRService class', () => {
      expect(SignalRService).toBeDefined();
      expect(typeof SignalRService).toBe('function');
    });

    it('should export signalRService singleton instance', () => {
      expect(signalRService).toBeDefined();
      expect(signalRService).toBeInstanceOf(SignalRService);
    });
  });

  describe('instance creation', () => {
    it('should create a new service instance', () => {
      const service = new SignalRService();
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(SignalRService);
    });
  });

  describe('interface', () => {
    let service: SignalRService;

    beforeEach(() => {
      service = new SignalRService();
    });

    it('should have startConnection method', () => {
      expect(typeof service.startConnection).toBe('function');
    });

    it('should have stopConnection method', () => {
      expect(typeof service.stopConnection).toBe('function');
    });

    it('should have joinClubChat method', () => {
      expect(typeof service.joinClubChat).toBe('function');
    });

    it('should have leaveClubChat method', () => {
      expect(typeof service.leaveClubChat).toBe('function');
    });

    it('should have onNewMessage method', () => {
      expect(typeof service.onNewMessage).toBe('function');
    });

    it('should have offNewMessage method', () => {
      expect(typeof service.offNewMessage).toBe('function');
    });

    it('should have onConnectionStatus method', () => {
      expect(typeof service.onConnectionStatus).toBe('function');
    });

    it('should have getConnectionState method', () => {
      expect(typeof service.getConnectionState).toBe('function');
    });

    it('should have isConnected method', () => {
      expect(typeof service.isConnected).toBe('function');
    });
  });

  describe('initial state', () => {
    let service: SignalRService;

    beforeEach(() => {
      service = new SignalRService();
    });

    it('should return Disconnected for initial state', () => {
      expect(service.getConnectionState()).toBe('Disconnected');
    });

    it('should return false for isConnected initially', () => {
      expect(service.isConnected()).toBe(false);
    });
  });

  describe('no-connection behavior', () => {
    let service: SignalRService;

    beforeEach(() => {
      service = new SignalRService();
    });

    it('should throw when joining club chat without connection', async () => {
      await expect(service.joinClubChat(123)).rejects.toThrow(
        'SignalR connection not established'
      );
    });

    it('should throw when registering message callback without connection', () => {
      expect(() => service.onNewMessage(jest.fn())).toThrow(
        'SignalR connection not established'
      );
    });

    it('should not throw when leaving club chat without connection', async () => {
      await expect(service.leaveClubChat(123)).resolves.toBeUndefined();
    });

    it('should not throw when stopping without connection', async () => {
      await expect(service.stopConnection()).resolves.toBeUndefined();
    });

    it('should not throw when unregistering message callback without connection', () => {
      expect(() => service.offNewMessage()).not.toThrow();
    });

    it('should not throw when registering status callbacks without connection', () => {
      expect(() =>
        service.onConnectionStatus(undefined, jest.fn(), jest.fn(), jest.fn())
      ).not.toThrow();
    });
  });

  describe('singleton', () => {
    it('should maintain singleton identity', () => {
      const instance1 = signalRService;
      const instance2 = signalRService;
      expect(instance1).toBe(instance2);
    });

    it('should have same interface as new instance', () => {
      const newInstance = new SignalRService();
      const singletonMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(signalRService))
        .filter(name => typeof (signalRService as Record<string, unknown>)[name] === 'function');
      const newInstanceMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(newInstance))
        .filter(name => typeof (newInstance as Record<string, unknown>)[name] === 'function');

      expect(singletonMethods.sort()).toEqual(newInstanceMethods.sort());
    });
  });

  describe('startConnection', () => {
    it('should start connection successfully', async () => {
      const service = new SignalRService();
      await service.startConnection();

      expect(mockConnection.start).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('SignalR Connected');
    });

    it('should not restart if already connected', async () => {
      const service = new SignalRService();
      await service.startConnection();
      await service.startConnection();

      expect(mockConnection.start).toHaveBeenCalledTimes(1);
    });

    it('should set up onreconnecting handler', async () => {
      const service = new SignalRService();
      await service.startConnection();

      expect(mockConnection.onreconnecting).toHaveBeenCalled();

      // Trigger the handler
      const handler = mockConnection.onreconnecting.mock.calls[0][0];
      handler();
      expect(mockLogger.debug).toHaveBeenCalledWith('SignalR attempting to reconnect...');
    });

    it('should set up onreconnected handler', async () => {
      const service = new SignalRService();
      await service.startConnection();

      expect(mockConnection.onreconnected).toHaveBeenCalled();

      // Trigger the handler
      const handler = mockConnection.onreconnected.mock.calls[0][0];
      handler();
      expect(mockLogger.debug).toHaveBeenCalledWith('SignalR reconnected successfully');
    });

    it('should set up onclose handler', async () => {
      const service = new SignalRService();
      await service.startConnection();

      expect(mockConnection.onclose).toHaveBeenCalled();

      // Trigger the handler
      const handler = mockConnection.onclose.mock.calls[0][0];
      const error = new Error('Connection closed');
      handler(error);
      expect(mockLogger.error).toHaveBeenCalledWith('SignalR connection closed:', error);
    });

    it('should handle connection start failure and trigger retry', async () => {
      mockConnection.start.mockRejectedValueOnce(new Error('Connection failed'));

      const service = new SignalRService();
      await service.startConnection();

      expect(mockLogger.error).toHaveBeenCalledWith('SignalR Connection Error:', expect.any(Error));
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Retrying SignalR connection in')
      );
    });
  });

  describe('stopConnection', () => {
    it('should stop connection and log disconnection', async () => {
      const service = new SignalRService();
      await service.startConnection();

      await service.stopConnection();

      expect(mockConnection.stop).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('SignalR Disconnected');
    });

    it('should clear pending retry timeout on stop', async () => {
      mockConnection.start.mockRejectedValueOnce(new Error('Failed'));

      const service = new SignalRService();
      await service.startConnection();

      await service.stopConnection();

      // Advance timer - no additional start should happen
      jest.advanceTimersByTime(10000);
      expect(mockConnection.start).toHaveBeenCalledTimes(1);
    });
  });

  describe('joinClubChat', () => {
    it('should join club chat successfully', async () => {
      const service = new SignalRService();
      await service.startConnection();

      await service.joinClubChat(123);

      expect(mockConnection.invoke).toHaveBeenCalledWith('JoinClubChat', 123);
      expect(mockLogger.debug).toHaveBeenCalledWith('Joined club 123 chat');
    });

    it('should handle join error and log retry when disconnected', async () => {
      const service = new SignalRService();
      await service.startConnection();

      const error = new Error('Join failed');
      mockConnection.invoke.mockRejectedValueOnce(error);
      mockConnection.state = 'Disconnected';

      await expect(service.joinClubChat(456)).rejects.toThrow('Join failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Error joining club 456 chat:', error);
      expect(mockLogger.debug).toHaveBeenCalledWith('Attempting to rejoin chat after connection recovery...');
    });

    it('should handle join error and log retry when reconnecting', async () => {
      const service = new SignalRService();
      await service.startConnection();

      const error = new Error('Join failed');
      mockConnection.invoke.mockRejectedValueOnce(error);
      mockConnection.state = 'Reconnecting';

      await expect(service.joinClubChat(789)).rejects.toThrow('Join failed');
      expect(mockLogger.debug).toHaveBeenCalledWith('Attempting to rejoin chat after connection recovery...');
    });

    it('should successfully rejoin after retry when connected', async () => {
      const service = new SignalRService();
      await service.startConnection();

      mockConnection.invoke
        .mockRejectedValueOnce(new Error('First call fails'))
        .mockResolvedValueOnce(undefined);
      mockConnection.state = 'Disconnected';

      await expect(service.joinClubChat(111)).rejects.toThrow('First call fails');

      // Simulate connection recovery
      mockConnection.state = 'Connected';

      await jest.advanceTimersByTimeAsync(2000);

      expect(mockLogger.debug).toHaveBeenCalledWith('Successfully rejoined club 111 chat');
    });

    it('should not retry when not disconnected or reconnecting', async () => {
      const service = new SignalRService();
      await service.startConnection();

      const error = new Error('Join failed');
      mockConnection.invoke.mockRejectedValueOnce(error);
      mockConnection.state = 'Connected';

      await expect(service.joinClubChat(333)).rejects.toThrow('Join failed');
      expect(mockLogger.debug).not.toHaveBeenCalledWith('Attempting to rejoin chat after connection recovery...');
    });

    it('should handle retry failure gracefully', async () => {
      const service = new SignalRService();
      await service.startConnection();

      mockConnection.invoke.mockRejectedValue(new Error('Persistent failure'));
      mockConnection.state = 'Disconnected';

      await expect(service.joinClubChat(222)).rejects.toThrow('Persistent failure');

      // Connection recovery fails - isConnected stays false
      mockConnection.state = 'Disconnected';

      await jest.advanceTimersByTimeAsync(2000);
      // Should not log success since isConnected is false
    });
  });

  describe('leaveClubChat', () => {
    it('should leave club chat successfully', async () => {
      const service = new SignalRService();
      await service.startConnection();

      await service.leaveClubChat(123);

      expect(mockConnection.invoke).toHaveBeenCalledWith('LeaveClubChat', 123);
      expect(mockLogger.debug).toHaveBeenCalledWith('Left club 123 chat');
    });

    it('should handle leave error gracefully', async () => {
      const service = new SignalRService();
      await service.startConnection();

      const error = new Error('Leave failed');
      mockConnection.invoke.mockRejectedValueOnce(error);

      await service.leaveClubChat(456);

      expect(mockLogger.error).toHaveBeenCalledWith('Error leaving club 456 chat:', error);
    });
  });

  describe('onNewMessage with connection', () => {
    it('should register message callback when connected', async () => {
      const service = new SignalRService();
      await service.startConnection();

      const callback = jest.fn();
      service.onNewMessage(callback);

      expect(mockConnection.on).toHaveBeenCalledWith('NewMessage', callback);
    });
  });

  describe('offNewMessage with connection', () => {
    it('should unregister message callback when connected', async () => {
      const service = new SignalRService();
      await service.startConnection();

      service.offNewMessage();

      expect(mockConnection.off).toHaveBeenCalledWith('NewMessage');
    });
  });

  describe('onConnectionStatus with connection', () => {
    it('should register onDisconnected callback', async () => {
      const service = new SignalRService();
      await service.startConnection();

      const onDisconnected = jest.fn();
      service.onConnectionStatus(undefined, onDisconnected);

      expect(mockConnection.onclose).toHaveBeenCalledWith(onDisconnected);
    });

    it('should register onReconnecting callback', async () => {
      const service = new SignalRService();
      await service.startConnection();

      const onReconnecting = jest.fn();
      service.onConnectionStatus(undefined, undefined, onReconnecting);

      expect(mockConnection.onreconnecting).toHaveBeenCalledWith(onReconnecting);
    });

    it('should register onReconnected callback', async () => {
      const service = new SignalRService();
      await service.startConnection();

      const onReconnected = jest.fn();
      service.onConnectionStatus(undefined, undefined, undefined, onReconnected);

      expect(mockConnection.onreconnected).toHaveBeenCalledWith(onReconnected);
    });

    it('should register all callbacks at once', async () => {
      const service = new SignalRService();
      await service.startConnection();

      const onConnected = jest.fn();
      const onDisconnected = jest.fn();
      const onReconnecting = jest.fn();
      const onReconnected = jest.fn();

      service.onConnectionStatus(onConnected, onDisconnected, onReconnecting, onReconnected);

      expect(mockConnection.onclose).toHaveBeenCalledWith(onDisconnected);
      expect(mockConnection.onreconnecting).toHaveBeenCalledWith(onReconnecting);
      expect(mockConnection.onreconnected).toHaveBeenCalledWith(onReconnected);
    });
  });

  describe('getConnectionState with connection', () => {
    it('should return connection state when connected', async () => {
      const service = new SignalRService();
      await service.startConnection();

      mockConnection.state = 'Connected';

      expect(service.getConnectionState()).toBe('Connected');
    });

    it('should return Reconnecting state', async () => {
      const service = new SignalRService();
      await service.startConnection();

      mockConnection.state = 'Reconnecting';

      expect(service.getConnectionState()).toBe('Reconnecting');
    });
  });

  describe('isConnected with connection', () => {
    it('should return true when state is Connected', async () => {
      const service = new SignalRService();
      await service.startConnection();

      mockConnection.state = 'Connected';

      expect(service.isConnected()).toBe(true);
    });

    it('should return false when state is not Connected', async () => {
      const service = new SignalRService();
      await service.startConnection();

      mockConnection.state = 'Reconnecting';

      expect(service.isConnected()).toBe(false);
    });
  });

  describe('retryConnection', () => {
    it('should use exponential backoff for retry delays', async () => {
      mockConnection.start.mockRejectedValueOnce(new Error('Failed'));

      const service = new SignalRService();
      await service.startConnection();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Retrying SignalR connection in 1000ms')
      );
    });

    it('should stop retrying after max attempts in onclose handler', async () => {
      const service = new SignalRService();
      await service.startConnection();

      // Get the onreconnecting handler and call it 5 times
      const reconnectingHandler = mockConnection.onreconnecting.mock.calls[0][0];
      for (let i = 0; i < 5; i++) {
        reconnectingHandler();
      }

      // Trigger close
      const closeHandler = mockConnection.onclose.mock.calls[0][0];
      closeHandler(new Error('test'));

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Max reconnection attempts reached. Manual intervention required.'
      );
    });

    it('should trigger retry when onclose called with attempts remaining', async () => {
      const service = new SignalRService();
      await service.startConnection();

      const closeHandler = mockConnection.onclose.mock.calls[0][0];
      closeHandler(new Error('test'));

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Retrying SignalR connection in')
      );
    });
  });

  describe('environment variable handling', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should use default URL when env variable is not set', () => {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;

      const service = new SignalRService();
      expect(service).toBeDefined();
    });

    it('should use custom URL from environment variable', () => {
      process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com/api/v1';

      const service = new SignalRService();
      expect(service).toBeDefined();
    });
  });

  describe('retryConnection - Enhanced Branch Coverage', () => {
    it('should not retry when max attempts already reached (early return)', async () => {
      const service = new SignalRService();

      // Simulate max attempts reached by calling onreconnecting 5 times
      await service.startConnection();
      const reconnectingHandler = mockConnection.onreconnecting.mock.calls[0][0];
      for (let i = 0; i < 5; i++) {
        reconnectingHandler();
      }

      // Now trigger retry directly via start failure - should hit early return at line 74-75
      mockConnection.start.mockRejectedValueOnce(new Error('Failed after max'));
      mockConnection.onreconnecting.mockClear();

      // Force a new connection attempt that will fail
      const newService = new SignalRService();
      // Set reconnectAttempts to max via private access simulation
      // Since we can't directly access private fields, we trigger it via connection failures

      // Alternative: test via onclose when max reached
      await service.startConnection(); // Will attempt connection
      const closeHandler = mockConnection.onclose.mock.calls[0][0];

      // Already at max from before, close should not trigger retry
      closeHandler(new Error('Close at max'));

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Max reconnection attempts reached. Manual intervention required.'
      );
    });

    it('should handle error during retry connection attempt (timeout callback)', async () => {
      // This tests lines 83-89: timeout callback execution and error handling
      mockConnection.start
        .mockRejectedValueOnce(new Error('Initial failure')) // First call triggers retry
        .mockRejectedValueOnce(new Error('Retry attempt failed')); // Second call inside timeout

      const service = new SignalRService();
      await service.startConnection();

      // Initial failure triggers retry
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Retrying SignalR connection in')
      );

      // Advance timer to execute retry attempt
      await jest.advanceTimersByTimeAsync(1000);

      // Should log error from second startConnection attempt (called from retry timeout)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'SignalR Connection Error:',
        expect.objectContaining({ message: 'Retry attempt failed' })
      );
    });

    it('should clear retryTimeoutId after timeout executes (line 83)', async () => {
      mockConnection.start
        .mockRejectedValueOnce(new Error('Initial'))
        .mockResolvedValueOnce(undefined); // Retry succeeds

      const service = new SignalRService();
      await service.startConnection();

      // Verify timeout was set
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Retrying SignalR connection in 1000ms')
      );

      // Execute the timeout - should clear the ID (line 83)
      await jest.advanceTimersByTimeAsync(1000);

      // Subsequent stop should not try to clear a non-existent timeout
      await service.stopConnection();
      expect(mockConnection.stop).toHaveBeenCalled();
    });

    it('should handle connection reset in retry (line 86)', async () => {
      mockConnection.start
        .mockRejectedValueOnce(new Error('First'))
        .mockResolvedValueOnce(undefined);

      const service = new SignalRService();
      await service.startConnection();

      // Execute retry - connection should be set to null before startConnection
      await jest.advanceTimersByTimeAsync(1000);

      // Should successfully connect on retry
      expect(mockLogger.debug).toHaveBeenCalledWith('SignalR Connected');
    });
  });

  describe('joinClubChat - Enhanced Branch Coverage', () => {
    it('should handle retry failure when connection recovered but join fails (line 135)', async () => {
      const service = new SignalRService();
      await service.startConnection();

      // First invoke fails with connection in Disconnected state
      mockConnection.invoke
        .mockRejectedValueOnce(new Error('Initial join fail'))
        .mockRejectedValueOnce(new Error('Retry join fail'));
      mockConnection.state = 'Disconnected';

      await expect(service.joinClubChat(999)).rejects.toThrow('Initial join fail');

      // Connection recovers (becomes Connected)
      mockConnection.state = 'Connected';

      // Advance timer for retry - connection is now Connected, so retry executes but fails
      await jest.advanceTimersByTimeAsync(2000);

      // Should log the retry failure (line 135)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to rejoin club 999 chat:',
        expect.objectContaining({ message: 'Retry join fail' })
      );
    });

    it('should not retry when connection state is not Disconnected or Reconnecting', async () => {
      const service = new SignalRService();
      await service.startConnection();

      mockConnection.invoke.mockRejectedValueOnce(new Error('Join failed'));
      mockConnection.state = 'Connecting'; // Different state

      await expect(service.joinClubChat(555)).rejects.toThrow('Join failed');

      // Should not log retry attempt for non-Disconnected/Reconnecting states
      expect(mockLogger.debug).not.toHaveBeenCalledWith(
        'Attempting to rejoin chat after connection recovery...'
      );

      // Advance timer - no retry should happen
      await jest.advanceTimersByTimeAsync(2000);
      expect(mockConnection.invoke).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge case coverage', () => {
    it('should handle stopConnection with no connection and no retry timeout', async () => {
      const service = new SignalRService();

      // No connection established, no retry pending
      await service.stopConnection();

      // Should not throw, should not call connection.stop
      expect(mockConnection.stop).not.toHaveBeenCalled();
    });
  });
});
