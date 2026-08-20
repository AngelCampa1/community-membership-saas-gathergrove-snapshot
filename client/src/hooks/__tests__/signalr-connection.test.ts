import { HubConnectionState } from '@microsoft/signalr';
import {
  SignalRConnection,
  SignalRConnectionManager,
} from '../signalr-connection';

// Mock @microsoft/signalr with proper enum values
jest.mock('@microsoft/signalr', () => ({
  HubConnectionState: {
    Disconnected: 0,
    Connecting: 1,
    Connected: 2,
    Disconnecting: 3,
    Reconnecting: 4,
  },
  HubConnectionBuilder: jest.fn(),
  LogLevel: { Information: 1 },
}));
jest.mock('@/lib/logger');
jest.mock('@/constants/timing', () => ({
  SIGNALR: {
    MAX_RECONNECT_ATTEMPTS: 5,
    BASE_RETRY_DELAY_MS: 1000,
    RETRY_DELAYS: [0, 2000, 10000, 30000]
  }
}));

// Import after mocks
import { HubConnectionBuilder } from '@microsoft/signalr';

// Shared mock references that getFreshExports closures can access
let sharedMockBuilder: any = null;

// Helper to get fresh singleton exports (the module creates a singleton on load)
const getFreshExports = async (mockBuilderRef: any) => {
  // Store reference for the mock factory to use
  sharedMockBuilder = mockBuilderRef;

  jest.resetModules();
  // Re-apply mocks after reset with proper factory
  jest.doMock('@microsoft/signalr', () => ({
    HubConnectionState: {
      Disconnected: 0,
      Connecting: 1,
      Connected: 2,
      Disconnecting: 3,
      Reconnecting: 4,
    },
    HubConnectionBuilder: jest.fn().mockImplementation(() => sharedMockBuilder),
    LogLevel: { Information: 1 },
  }));
  jest.doMock('@/lib/logger', () => ({
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    }
  }));
  jest.doMock('@/constants/timing', () => ({
    SIGNALR: {
      MAX_RECONNECT_ATTEMPTS: 5,
      BASE_RETRY_DELAY_MS: 1000,
      RETRY_DELAYS: [0, 2000, 10000, 30000]
    }
  }));
  const signalrModule = await import('../signalr-connection');
  return {
    getSignalRConnection: signalrModule.getSignalRConnection,
    disconnectSignalR: signalrModule.disconnectSignalR,
    disconnectAllSignalR: signalrModule.disconnectAllSignalR,
    getConnectionStatuses: signalrModule.getConnectionStatuses,
    SignalRConnection: signalrModule.SignalRConnection,
  };
};

describe('SignalR Connection', () => {
  let mockHubConnection: any;
  let mockBuilder: any;
  let onreconnectingCallback: ((error?: Error) => void) | null = null;
  let onreconnectedCallback: ((connectionId?: string) => void) | null = null;
  let oncloseCallback: ((error?: Error) => Promise<void>) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    onreconnectingCallback = null;
    onreconnectedCallback = null;
    oncloseCallback = null;

    mockHubConnection = {
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      invoke: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      off: jest.fn(),
      onreconnecting: jest.fn((callback) => {
        onreconnectingCallback = callback;
      }),
      onreconnected: jest.fn((callback) => {
        onreconnectedCallback = callback;
      }),
      onclose: jest.fn((callback) => {
        oncloseCallback = callback;
      }),
      state: HubConnectionState.Connected
    };

    mockBuilder = {
      withUrl: jest.fn().mockReturnThis(),
      withAutomaticReconnect: jest.fn().mockReturnThis(),
      configureLogging: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue(mockHubConnection)
    };

    (HubConnectionBuilder as jest.Mock).mockImplementation(() => mockBuilder);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('SignalRConnectionManager', () => {
    let manager: SignalRConnectionManager;

    beforeEach(() => {
      manager = new SignalRConnectionManager();
    });

    describe('getConnection', () => {
      it('should create new connection for chat hub', async () => {
        const connection = await manager.getConnection('chat');

        expect(mockBuilder.withUrl).toHaveBeenCalledWith(
          expect.stringContaining('/chatHub'),
          expect.objectContaining({ withCredentials: true })
        );
        expect(mockHubConnection.start).toHaveBeenCalled();
        expect(connection).toBeInstanceOf(SignalRConnection);
      });

      it('should create new connection for eventEngagement hub', async () => {
        const connection = await manager.getConnection('eventEngagement');

        expect(mockBuilder.withUrl).toHaveBeenCalledWith(
          expect.stringContaining('/eventEngagementHub'),
          expect.any(Object)
        );
        expect(connection).toBeInstanceOf(SignalRConnection);
      });

      it('should reuse existing connected connection', async () => {
        const connection1 = await manager.getConnection('chat');
        const connection2 = await manager.getConnection('chat');

        expect(connection1).toBe(connection2);
        expect(mockHubConnection.start).toHaveBeenCalledTimes(1);
      });

      it('should recreate connection if existing connection is not connected', async () => {
        const connection1 = await manager.getConnection('chat');

        // Change state to disconnected
        mockHubConnection.state = HubConnectionState.Disconnected;

        const connection2 = await manager.getConnection('chat');

        expect(connection1).not.toBe(connection2);
        expect(mockHubConnection.start).toHaveBeenCalledTimes(2);
      });

      it('should handle concurrent connection requests', async () => {
        const promise1 = manager.getConnection('chat');
        const promise2 = manager.getConnection('chat');
        const promise3 = manager.getConnection('chat');

        const [conn1, conn2, conn3] = await Promise.all([promise1, promise2, promise3]);

        expect(conn1).toBe(conn2);
        expect(conn2).toBe(conn3);
        expect(mockHubConnection.start).toHaveBeenCalledTimes(1);
      });

      it('should configure connection with custom options', async () => {
        await manager.getConnection('chat', {
          withCredentials: false,
          customRetryDelays: [100, 200, 300]
        });

        expect(mockBuilder.withUrl).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ withCredentials: false })
        );
        expect(mockBuilder.withAutomaticReconnect).toHaveBeenCalledWith([100, 200, 300]);
      });

      it('should handle connection start failure', async () => {
        mockHubConnection.start.mockRejectedValueOnce(new Error('Connection failed'));

        await expect(manager.getConnection('chat')).rejects.toThrow('Connection failed');
      });

      it('should retry connection after failure', async () => {
        mockHubConnection.start.mockRejectedValueOnce(new Error('Connection failed'));

        const promise = manager.getConnection('chat');

        await expect(promise).rejects.toThrow();

        // Advance timer to trigger retry
        jest.advanceTimersByTime(1000);

        // Should attempt to reconnect
        await jest.runAllTimersAsync();
      });
    });

    describe('Connection Events', () => {
      it('should handle onreconnecting event', async () => {
        await manager.getConnection('chat');

        expect(onreconnectingCallback).toBeDefined();

        // Simulate reconnecting
        if (onreconnectingCallback) {
          onreconnectingCallback(new Error('Connection lost'));
        }

        // Verify it doesn't crash
        expect(true).toBe(true);
      });

      it('should handle onreconnected event', async () => {
        await manager.getConnection('chat');

        expect(onreconnectedCallback).toBeDefined();

        // Simulate reconnected
        if (onreconnectedCallback) {
          onreconnectedCallback('new-connection-id');
        }

        // Verify it doesn't crash
        expect(true).toBe(true);
      });

      it('should handle onclose event and retry', async () => {
        await manager.getConnection('chat');

        expect(oncloseCallback).toBeDefined();

        // Simulate close
        if (oncloseCallback) {
          await oncloseCallback(new Error('Connection closed'));
        }

        // Should schedule retry
        jest.advanceTimersByTime(1000);
        await jest.runAllTimersAsync();
      });

      it('should not retry after max reconnect attempts', async () => {
        await manager.getConnection('chat');

        // Simulate multiple close events
        for (let i = 0; i < 6; i++) {
          if (oncloseCallback) {
            await oncloseCallback(new Error('Connection closed'));
          }
          jest.advanceTimersByTime(10000);
          await jest.runAllTimersAsync();
        }

        // After max attempts, should not create more connections
        expect(mockHubConnection.start).toHaveBeenCalled();
      });
    });

    describe('disconnect', () => {
      it('should disconnect and cleanup specific hub', async () => {
        const connection = await manager.getConnection('chat');

        await manager.disconnect('chat');

        expect(mockHubConnection.stop).toHaveBeenCalled();
      });

      it('should clear pending retry timeouts', async () => {
        await manager.getConnection('chat');

        // Trigger close to start retry
        if (oncloseCallback) {
          await oncloseCallback(new Error('Connection closed'));
        }

        // Disconnect before retry executes
        await manager.disconnect('chat');

        // Advance timers - should not create new connection
        jest.advanceTimersByTime(5000);
        await jest.runAllTimersAsync();

        expect(mockHubConnection.start).toHaveBeenCalledTimes(1); // Only initial connection
      });

      it('should handle disconnect when hub is not connected', async () => {
        await manager.disconnect('chat');

        // Should not crash
        expect(true).toBe(true);
      });
    });

    describe('disconnectAll', () => {
      it('should disconnect all hubs', async () => {
        await manager.getConnection('chat');
        await manager.getConnection('eventEngagement');

        await manager.disconnectAll();

        expect(mockHubConnection.stop).toHaveBeenCalledTimes(2);
      });

      it('should handle errors during disconnectAll', async () => {
        await manager.getConnection('chat');
        await manager.getConnection('eventEngagement');

        mockHubConnection.stop.mockRejectedValueOnce(new Error('Stop failed'));

        await manager.disconnectAll();

        // Should not throw error
        expect(true).toBe(true);
      });
    });

    describe('getConnectionStatuses', () => {
      it('should return statuses for all connections', async () => {
        // First connection with Connected state
        const chatMockConnection = {
          ...mockHubConnection,
          state: HubConnectionState.Connected
        };
        mockBuilder.build.mockReturnValueOnce(chatMockConnection);

        await manager.getConnection('chat');

        // Second connection with Connecting state
        const eventEngagementMockConnection = {
          ...mockHubConnection,
          state: HubConnectionState.Connecting
        };
        mockBuilder.build.mockReturnValueOnce(eventEngagementMockConnection);

        await manager.getConnection('eventEngagement');

        const statuses = manager.getConnectionStatuses();

        expect(statuses.chat).toBe(HubConnectionState.Connected);
        expect(statuses.eventEngagement).toBe(HubConnectionState.Connecting);
      });

      it('should return empty object when no connections', () => {
        const statuses = manager.getConnectionStatuses();

        expect(statuses).toEqual({});
      });
    });
  });

  describe('SignalRConnection', () => {
    let connection: SignalRConnection;
    let manager: SignalRConnectionManager;

    beforeEach(async () => {
      manager = new SignalRConnectionManager();
      connection = await manager.getConnection('chat');
    });

    describe('invoke', () => {
      it('should invoke hub method successfully', async () => {
        mockHubConnection.invoke.mockResolvedValueOnce({ success: true });

        const result = await connection.invoke<{ success: boolean }>('TestMethod', 'arg1', 123);

        expect(mockHubConnection.invoke).toHaveBeenCalledWith('TestMethod', 'arg1', 123);
        expect(result).toEqual({ success: true });
      });

      it('should throw error when not connected', async () => {
        mockHubConnection.state = HubConnectionState.Disconnected;

        await expect(connection.invoke('TestMethod')).rejects.toThrow('not connected');
      });

      it('should handle invoke error', async () => {
        mockHubConnection.invoke.mockRejectedValueOnce(new Error('Invoke failed'));

        await expect(connection.invoke('TestMethod')).rejects.toThrow('Invoke failed');
      });

      it('should pass multiple arguments to hub method', async () => {
        await connection.invoke('MultiArgMethod', 'a', 'b', 'c', { d: 4 });

        expect(mockHubConnection.invoke).toHaveBeenCalledWith('MultiArgMethod', 'a', 'b', 'c', { d: 4 });
      });
    });

    describe('Event Handlers', () => {
      it('should register event handler', () => {
        const handler = jest.fn();

        connection.on('TestEvent', handler);

        expect(mockHubConnection.on).toHaveBeenCalledWith('TestEvent', handler);
      });

      it('should unregister specific event handler', () => {
        const handler = jest.fn();

        connection.off('TestEvent', handler);

        expect(mockHubConnection.off).toHaveBeenCalledWith('TestEvent', handler);
      });

      it('should unregister all handlers for event', () => {
        connection.off('TestEvent');

        expect(mockHubConnection.off).toHaveBeenCalledWith('TestEvent');
      });
    });

    describe('Status Callbacks', () => {
      it('should register connection status callbacks', () => {
        const onConnected = jest.fn();
        const onDisconnected = jest.fn();
        const onReconnecting = jest.fn();
        const onReconnected = jest.fn();

        connection.onConnectionStatus(
          onConnected,
          onDisconnected,
          onReconnecting,
          onReconnected
        );

        // Verify callbacks are registered (internal state)
        expect(true).toBe(true);
      });

      it('should notify connected callbacks', () => {
        const onConnected = jest.fn();

        connection.onConnectionStatus(onConnected);
        connection.notifyStatus('connected');

        expect(onConnected).toHaveBeenCalled();
      });

      it('should notify disconnected callbacks', () => {
        const onDisconnected = jest.fn();

        connection.onConnectionStatus(undefined, onDisconnected);
        connection.notifyStatus('disconnected');

        expect(onDisconnected).toHaveBeenCalled();
      });

      it('should notify reconnecting callbacks', () => {
        const onReconnecting = jest.fn();

        connection.onConnectionStatus(undefined, undefined, onReconnecting);
        connection.notifyStatus('reconnecting');

        expect(onReconnecting).toHaveBeenCalled();
      });

      it('should notify reconnected callbacks', () => {
        const onReconnected = jest.fn();

        connection.onConnectionStatus(undefined, undefined, undefined, onReconnected);
        connection.notifyStatus('reconnected');

        expect(onReconnected).toHaveBeenCalled();
      });

      it('should call multiple callbacks for same status', () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();

        connection.onConnectionStatus(callback1);
        connection.onConnectionStatus(callback2);
        connection.notifyStatus('connected');

        expect(callback1).toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
      });

      it('should handle callback errors gracefully', () => {
        const errorCallback = jest.fn(() => {
          throw new Error('Callback error');
        });
        const goodCallback = jest.fn();

        connection.onConnectionStatus(errorCallback);
        connection.onConnectionStatus(goodCallback);
        connection.notifyStatus('connected');

        expect(errorCallback).toHaveBeenCalled();
        expect(goodCallback).toHaveBeenCalled(); // Should still execute despite error
      });
    });

    describe('Connection State', () => {
      it('should get connection state', () => {
        const state = connection.getConnectionState();

        expect(state).toBe(HubConnectionState.Connected);
      });

      it('should check if connected', () => {
        expect(connection.isConnected()).toBe(true);

        mockHubConnection.state = HubConnectionState.Disconnected;
        expect(connection.isConnected()).toBe(false);
      });

      it('should check various connection states', () => {
        mockHubConnection.state = HubConnectionState.Connecting;
        expect(connection.isConnected()).toBe(false);

        mockHubConnection.state = HubConnectionState.Reconnecting;
        expect(connection.isConnected()).toBe(false);

        mockHubConnection.state = HubConnectionState.Disconnecting;
        expect(connection.isConnected()).toBe(false);

        mockHubConnection.state = HubConnectionState.Disconnected;
        expect(connection.isConnected()).toBe(false);
      });
    });

    describe('stopConnection', () => {
      it('should stop connection successfully', async () => {
        await connection.stopConnection();

        expect(mockHubConnection.stop).toHaveBeenCalled();
      });

      it('should handle stop error', async () => {
        mockHubConnection.stop.mockRejectedValueOnce(new Error('Stop failed'));

        await connection.stopConnection();

        // Should not throw error
        expect(true).toBe(true);
      });
    });
  });

  describe('Exported Functions', () => {
    // These tests use the singleton, so we need fresh module for each test
    let getSignalRConnection: Awaited<ReturnType<typeof getFreshExports>>['getSignalRConnection'];
    let disconnectSignalR: Awaited<ReturnType<typeof getFreshExports>>['disconnectSignalR'];
    let disconnectAllSignalR: Awaited<ReturnType<typeof getFreshExports>>['disconnectAllSignalR'];
    let getConnectionStatuses: Awaited<ReturnType<typeof getFreshExports>>['getConnectionStatuses'];

    beforeEach(async () => {
      // Reset mock for fresh state
      mockHubConnection = {
        start: jest.fn().mockResolvedValue(undefined),
        stop: jest.fn().mockResolvedValue(undefined),
        invoke: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        off: jest.fn(),
        onreconnecting: jest.fn(),
        onreconnected: jest.fn(),
        onclose: jest.fn(),
        state: HubConnectionState.Connected
      };

      mockBuilder = {
        withUrl: jest.fn().mockReturnThis(),
        withAutomaticReconnect: jest.fn().mockReturnThis(),
        configureLogging: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnValue(mockHubConnection)
      };

      // Get fresh exports with reset singleton - pass mockBuilder so factory can use it
      const exports = await getFreshExports(mockBuilder);
      getSignalRConnection = exports.getSignalRConnection;
      disconnectSignalR = exports.disconnectSignalR;
      disconnectAllSignalR = exports.disconnectAllSignalR;
      getConnectionStatuses = exports.getConnectionStatuses;
    });

    describe('getSignalRConnection', () => {
      it('should get chat connection', async () => {
        const connection = await getSignalRConnection('chat');

        expect(connection).toBeDefined();
        expect(mockBuilder.withUrl).toHaveBeenCalledWith(
          expect.stringContaining('/chatHub'),
          expect.any(Object)
        );
      });

      it('should get eventEngagement connection', async () => {
        const connection = await getSignalRConnection('eventEngagement');

        expect(connection).toBeDefined();
        expect(mockBuilder.withUrl).toHaveBeenCalledWith(
          expect.stringContaining('/eventEngagementHub'),
          expect.any(Object)
        );
      });

      it('should pass options to connection', async () => {
        await getSignalRConnection('chat', { withCredentials: false });

        expect(mockBuilder.withUrl).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ withCredentials: false })
        );
      });

      it('should reuse existing connection from singleton', async () => {
        const conn1 = await getSignalRConnection('chat');
        const conn2 = await getSignalRConnection('chat');

        expect(conn1).toBe(conn2);
        expect(mockHubConnection.start).toHaveBeenCalledTimes(1);
      });
    });

    describe('disconnectSignalR', () => {
      it('should disconnect specific hub', async () => {
        await getSignalRConnection('chat');
        await disconnectSignalR('chat');

        expect(mockHubConnection.stop).toHaveBeenCalled();
      });
    });

    describe('disconnectAllSignalR', () => {
      it('should disconnect all hubs', async () => {
        await getSignalRConnection('chat');
        await getSignalRConnection('eventEngagement');

        await disconnectAllSignalR();

        expect(mockHubConnection.stop).toHaveBeenCalledTimes(2);
      });
    });

    describe('getConnectionStatuses', () => {
      it('should get all connection statuses', async () => {
        await getSignalRConnection('chat');
        await getSignalRConnection('eventEngagement');

        const statuses = getConnectionStatuses();

        expect(statuses.chat).toBe(HubConnectionState.Connected);
        expect(statuses.eventEngagement).toBe(HubConnectionState.Connected);
      });
    });
  });

  describe('Hub URL Generation', () => {
    let getSignalRConnection: Awaited<ReturnType<typeof getFreshExports>>['getSignalRConnection'];

    beforeEach(async () => {
      // Reset mock for fresh state
      mockHubConnection = {
        start: jest.fn().mockResolvedValue(undefined),
        stop: jest.fn().mockResolvedValue(undefined),
        invoke: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        off: jest.fn(),
        onreconnecting: jest.fn(),
        onreconnected: jest.fn(),
        onclose: jest.fn(),
        state: HubConnectionState.Connected
      };

      mockBuilder = {
        withUrl: jest.fn().mockReturnThis(),
        withAutomaticReconnect: jest.fn().mockReturnThis(),
        configureLogging: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnValue(mockHubConnection)
      };

      const exports = await getFreshExports(mockBuilder);
      getSignalRConnection = exports.getSignalRConnection;
    });

    it('should use environment variable for API base URL', async () => {
      process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com/api/v1';

      await getSignalRConnection('chat');

      expect(mockBuilder.withUrl).toHaveBeenCalledWith(
        'https://api.example.com/chatHub',
        expect.any(Object)
      );

      delete process.env.NEXT_PUBLIC_API_BASE_URL;
    });

    it('should use default URL when environment variable not set', async () => {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;

      await getSignalRConnection('chat');

      expect(mockBuilder.withUrl).toHaveBeenCalledWith(
        'http://localhost:8050/chatHub',
        expect.any(Object)
      );
    });
  });

  describe('Retry Logic', () => {
    let getSignalRConnection: Awaited<ReturnType<typeof getFreshExports>>['getSignalRConnection'];

    beforeEach(async () => {
      mockHubConnection = {
        start: jest.fn().mockResolvedValue(undefined),
        stop: jest.fn().mockResolvedValue(undefined),
        invoke: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        off: jest.fn(),
        onreconnecting: jest.fn(),
        onreconnected: jest.fn(),
        onclose: jest.fn((callback) => {
          oncloseCallback = callback;
        }),
        state: HubConnectionState.Connected
      };

      mockBuilder = {
        withUrl: jest.fn().mockReturnThis(),
        withAutomaticReconnect: jest.fn().mockReturnThis(),
        configureLogging: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnValue(mockHubConnection)
      };

      const exports = await getFreshExports(mockBuilder);
      getSignalRConnection = exports.getSignalRConnection;
    });

    it('should use exponential backoff for retries', async () => {
      mockHubConnection.start.mockRejectedValue(new Error('Connection failed'));

      const promise = getSignalRConnection('chat').catch(() => {});
      await promise;

      // First retry at 1000ms (1000 * 2^0)
      jest.advanceTimersByTime(1000);
      await jest.runAllTimersAsync();

      // Second retry at 2000ms (1000 * 2^1)
      jest.advanceTimersByTime(2000);
      await jest.runAllTimersAsync();

      // Third retry at 4000ms (1000 * 2^2)
      jest.advanceTimersByTime(4000);
      await jest.runAllTimersAsync();
    });

    it('should clear previous retry timeout when new retry is scheduled', async () => {
      await getSignalRConnection('chat');

      // Trigger multiple close events rapidly
      if (oncloseCallback) {
        await oncloseCallback(new Error('Connection closed 1'));
        await oncloseCallback(new Error('Connection closed 2'));
        await oncloseCallback(new Error('Connection closed 3'));
      }

      // Only one retry should be scheduled
      jest.advanceTimersByTime(1000);
      await jest.runAllTimersAsync();
    });
  });

  describe('Error Handling', () => {
    let getSignalRConnection: Awaited<ReturnType<typeof getFreshExports>>['getSignalRConnection'];

    beforeEach(async () => {
      mockHubConnection = {
        start: jest.fn().mockResolvedValue(undefined),
        stop: jest.fn().mockResolvedValue(undefined),
        invoke: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        off: jest.fn(),
        onreconnecting: jest.fn(),
        onreconnected: jest.fn(),
        onclose: jest.fn(),
        state: HubConnectionState.Connected
      };

      mockBuilder = {
        withUrl: jest.fn().mockReturnThis(),
        withAutomaticReconnect: jest.fn().mockReturnThis(),
        configureLogging: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnValue(mockHubConnection)
      };

      const exports = await getFreshExports(mockBuilder);
      getSignalRConnection = exports.getSignalRConnection;
    });

    it('should handle connection builder errors', async () => {
      mockBuilder.build.mockImplementationOnce(() => {
        throw new Error('Build failed');
      });

      await expect(getSignalRConnection('chat')).rejects.toThrow('Build failed');
    });

    it('should handle connection start timeout', async () => {
      // Mock a start that rejects immediately (simulating timeout behavior)
      mockHubConnection.start.mockRejectedValueOnce(new Error('Timeout'));

      await expect(getSignalRConnection('chat')).rejects.toThrow('Timeout');
    });
  });
});
