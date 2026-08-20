import { HubConnection, HubConnectionBuilder, LogLevel, HubConnectionState } from '@microsoft/signalr';
import { SIGNALR } from '@/constants/timing';
import { logger } from '@/lib/logger';

/**
 * Available SignalR hubs
 */
export type HubName = 'chat' | 'eventEngagement';

/**
 * Connection status type
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'reconnected';

/**
 * Connection options for SignalR
 */
export interface SignalRConnectionOptions {
  withCredentials?: boolean;
  configureLogging?: LogLevel;
  customRetryDelays?: number[];
}

/**
 * Status callback functions
 */
export type StatusCallback = () => void;

/**
 * Status callbacks collection
 */
export interface StatusCallbacks {
  connected: StatusCallback[];
  disconnected: StatusCallback[];
  reconnecting: StatusCallback[];
  reconnected: StatusCallback[];
}

/**
 * Event handler function type
 */
export type EventHandler<T = unknown> = (data: T) => void;

/**
 * SignalR connection manager for multiple hubs
 * Supports chat and event engagement hubs with connection pooling and management
 */
class SignalRConnectionManager {
  private connections = new Map<HubName, SignalRConnection>(); // hubName -> connection
  private connectionPromises = new Map<HubName, Promise<SignalRConnection>>(); // hubName -> promise
  private reconnectAttempts = new Map<HubName, number>(); // hubName -> attempt count
  private retryTimeouts = new Map<HubName, NodeJS.Timeout>(); // hubName -> retry timeout
  private readonly maxReconnectAttempts = SIGNALR.MAX_RECONNECT_ATTEMPTS;
  private readonly baseRetryDelay = SIGNALR.BASE_RETRY_DELAY_MS;

  /**
   * Get or create a SignalR connection for the specified hub
   * @param hubName - Name of the hub ('chat' or 'eventEngagement')
   * @param options - Connection options
   * @returns Connection wrapper
   */
  async getConnection(hubName: HubName, options: SignalRConnectionOptions = {}): Promise<SignalRConnection> {
    // BUG FIX #8: Validate existing connection state before returning
    // Check that connection is not only marked as connected but actually in connected state
    if (this.connections.has(hubName)) {
      const existingConnection = this.connections.get(hubName)!;
      
      // Check both the wrapper's isConnected flag and the actual hub connection state
      if (existingConnection.isConnected()) {
        logger.debug(`Reusing existing ${hubName} connection in Connected state`);
        return existingConnection;
      } else {
        // Connection exists but not properly connected - remove and recreate
        logger.debug(`${hubName} connection exists but not connected. Recreating...`);
        this.connections.delete(hubName);
      }
    }

    // Return existing connection promise if one is in progress
    if (this.connectionPromises.has(hubName)) {
      return await this.connectionPromises.get(hubName)!;
    }

    // Create new connection
    const connectionPromise = this.createConnection(hubName, options);
    this.connectionPromises.set(hubName, connectionPromise);

    try {
      const connection = await connectionPromise;
      this.connections.set(hubName, connection);
      return connection;
    } finally {
      this.connectionPromises.delete(hubName);
    }
  }

  /**
   * Create a new SignalR connection
   * @param hubName - Hub name
   * @param options - Connection options
   * @returns SignalR connection wrapper
   */
  private async createConnection(hubName: HubName, options: SignalRConnectionOptions): Promise<SignalRConnection> {
    const {
      withCredentials = true,
      configureLogging = LogLevel.Information,
      customRetryDelays = SIGNALR.RETRY_DELAYS
    } = options;

    // Determine hub URL
    const hubUrl = this.getHubUrl(hubName);
    logger.debug(`Creating SignalR connection to ${hubUrl}`);

    try {
      // Build the connection
      const hubConnection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          withCredentials,
        })
        .withAutomaticReconnect([...customRetryDelays])
        .configureLogging(configureLogging)
        .build();

      // Create wrapper
      const connectionWrapper = new SignalRConnection(hubConnection, hubName, this);

      // Setup connection event handlers
      this.setupConnectionEvents(hubConnection, hubName, connectionWrapper);

      // Start the connection
      await hubConnection.start();
      logger.info(`SignalR connected to ${hubName} hub`);

      // Reset reconnect attempts on successful connection
      this.reconnectAttempts.set(hubName, 0);

      return connectionWrapper;
    } catch (error) {
      logger.error(`Failed to connect to ${hubName} hub`, error);
      await this.handleConnectionError(hubName, error);
      throw error;
    }
  }

  /**
   * Setup connection event handlers
   */
  private setupConnectionEvents(hubConnection: HubConnection, hubName: HubName, connectionWrapper: SignalRConnection): void {
    hubConnection.onreconnecting((error) => {
      logger.info(`${hubName} hub reconnecting`, { error });
      connectionWrapper.notifyStatus('reconnecting');

      const attempts = this.reconnectAttempts.get(hubName) || 0;
      this.reconnectAttempts.set(hubName, attempts + 1);
    });

    hubConnection.onreconnected((connectionId) => {
      logger.info(`${hubName} hub reconnected with ID: ${connectionId}`);
      connectionWrapper.notifyStatus('connected');
      this.reconnectAttempts.set(hubName, 0);
    });

    hubConnection.onclose(async (error) => {
      logger.error(`${hubName} hub connection closed`, error);
      connectionWrapper.notifyStatus('disconnected');

      // Remove from connections map
      this.connections.delete(hubName);

      // Attempt manual reconnection if automatic reconnection fails
      const attempts = this.reconnectAttempts.get(hubName) || 0;
      if (attempts < this.maxReconnectAttempts) {
        await this.retryConnection(hubName, attempts);
      } else {
        logger.error(`Max reconnection attempts reached for ${hubName} hub`);
      }
    });
  }

  /**
   * Get hub URL based on hub name
   */
  private getHubUrl(hubName: HubName): string {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8050/api/v1';
    const serverUrl = apiBaseUrl.replace('/api/v1', '');
    
    switch (hubName) {
      case 'chat':
        return `${serverUrl}/chatHub`;
      case 'eventEngagement':
        return `${serverUrl}/eventEngagementHub`;
      default:
        throw new Error(`Unknown hub name: ${hubName}`);
    }
  }

  /**
   * Handle connection errors with retry logic
   */
  private async handleConnectionError(hubName: HubName, _error: unknown): Promise<void> {
    const attempts = this.reconnectAttempts.get(hubName) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      await this.retryConnection(hubName, attempts);
    }
  }

  /**
   * Retry connection with exponential backoff
   */
  private async retryConnection(hubName: HubName, attempt: number): Promise<void> {
    const delay = this.baseRetryDelay * Math.pow(2, attempt);
    logger.debug(`Retrying ${hubName} connection in ${delay}ms (attempt ${attempt + 1}/${this.maxReconnectAttempts})`);

    // Clear any existing timeout for this hub
    if (this.retryTimeouts.has(hubName)) {
      clearTimeout(this.retryTimeouts.get(hubName)!);
    }

    const timeoutId = setTimeout(async () => {
      this.retryTimeouts.delete(hubName);
      try {
        this.reconnectAttempts.set(hubName, attempt + 1);
        await this.getConnection(hubName);
      } catch (error) {
        logger.error(`Failed to retry ${hubName} connection`, error);
      }
    }, delay);

    this.retryTimeouts.set(hubName, timeoutId);
  }

  /**
   * Disconnect and cleanup a specific hub connection
   */
  async disconnect(hubName: HubName): Promise<void> {
    // Clear any pending retry timeouts
    if (this.retryTimeouts.has(hubName)) {
      clearTimeout(this.retryTimeouts.get(hubName)!);
      this.retryTimeouts.delete(hubName);
    }

    if (this.connections.has(hubName)) {
      const connection = this.connections.get(hubName)!;
      await connection.stopConnection();
      this.connections.delete(hubName);
    }

    if (this.connectionPromises.has(hubName)) {
      this.connectionPromises.delete(hubName);
    }

    this.reconnectAttempts.delete(hubName);
  }

  /**
   * Disconnect and cleanup all connections
   */
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.keys()).map(hubName =>
      this.disconnect(hubName)
    );

    await Promise.allSettled(disconnectPromises);
    logger.info('All SignalR connections disconnected');
  }

  /**
   * Get connection status for all hubs
   */
  getConnectionStatuses(): Record<HubName, HubConnectionState> {
    const statuses: Partial<Record<HubName, HubConnectionState>> = {};
    
    for (const [hubName, connection] of this.connections) {
      statuses[hubName] = connection.getConnectionState();
    }
    
    return statuses as Record<HubName, HubConnectionState>;
  }
}

/**
 * SignalR connection wrapper class
 */
export class SignalRConnection {
  private statusCallbacks: StatusCallbacks = {
    connected: [],
    disconnected: [],
    reconnecting: [],
    reconnected: []
  };

  constructor(
    private hubConnection: HubConnection,
    private hubName: HubName,
    private manager: SignalRConnectionManager
  ) {}

  /**
   * Invoke a hub method
   * @template T - The type of data returned from the method
   * @param methodName - Name of the hub method to invoke
   * @param args - Arguments to pass to the hub method
   * @returns Promise resolving to the method result
   */
  async invoke<T = void>(methodName: string, ...args: unknown[]): Promise<T> {
    if (!this.isConnected()) {
      throw new Error(`Cannot invoke ${methodName}: ${this.hubName} hub not connected`);
    }

    try {
      return await this.hubConnection.invoke<T>(methodName, ...args);
    } catch (error) {
      logger.error(`Error invoking ${methodName} on ${this.hubName} hub`, error);
      throw error;
    }
  }

  /**
   * Register event handler
   * @template T - The type of data received in the event
   * @param eventName - Name of the event to listen for
   * @param handler - Callback function to handle the event
   */
  on<T = unknown>(eventName: string, handler: EventHandler<T>): void {
    this.hubConnection.on(eventName, handler);
  }

  /**
   * Unregister event handler
   */
  off<T = unknown>(eventName: string, handler?: EventHandler<T>): void {
    if (handler) {
      this.hubConnection.off(eventName, handler);
    } else {
      this.hubConnection.off(eventName);
    }
  }

  /**
   * Register connection status callbacks
   */
  onConnectionStatus(
    onConnected?: StatusCallback,
    onDisconnected?: StatusCallback,
    onReconnecting?: StatusCallback,
    onReconnected?: StatusCallback
  ): void {
    if (onConnected) this.statusCallbacks.connected.push(onConnected);
    if (onDisconnected) this.statusCallbacks.disconnected.push(onDisconnected);
    if (onReconnecting) this.statusCallbacks.reconnecting.push(onReconnecting);
    if (onReconnected) this.statusCallbacks.reconnected.push(onReconnected);
  }

  /**
   * Notify status change to callbacks
   */
  notifyStatus(status: ConnectionStatus): void {
    const callbacks = this.statusCallbacks[status] || [];
    callbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        logger.error(`Error in ${status} callback`, error);
      }
    });
  }

  /**
   * Get connection state
   */
  getConnectionState(): HubConnectionState {
    return this.hubConnection.state;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.hubConnection.state === HubConnectionState.Connected;
  }

  /**
   * Stop the connection
   */
  async stopConnection(): Promise<void> {
    try {
      await this.hubConnection.stop();
      logger.info(`${this.hubName} hub connection stopped`);
    } catch (error) {
      logger.error(`Error stopping ${this.hubName} hub connection`, error);
    }
  }
}

// Singleton instance
const connectionManager = new SignalRConnectionManager();

/**
 * Get a SignalR connection for the specified hub
 * @param hubName - Hub name ('chat' or 'eventEngagement')
 * @param options - Connection options
 * @returns SignalR connection wrapper
 */
export const getSignalRConnection = (hubName: HubName, options: SignalRConnectionOptions = {}): Promise<SignalRConnection> => {
  return connectionManager.getConnection(hubName, options);
};

/**
 * Disconnect from a specific hub
 * @param hubName - Hub name to disconnect from
 */
export const disconnectSignalR = (hubName: HubName): Promise<void> => {
  return connectionManager.disconnect(hubName);
};

/**
 * Disconnect from all hubs
 */
export const disconnectAllSignalR = (): Promise<void> => {
  return connectionManager.disconnectAll();
};

/**
 * Get connection statuses for all hubs
 */
export const getConnectionStatuses = (): Record<HubName, HubConnectionState> => {
  return connectionManager.getConnectionStatuses();
};

// Cleanup on page unload (prevent listener accumulation)
// Use a named function so removeEventListener works correctly across HMR reloads
function handleBeforeUnload(): void {
  connectionManager.disconnectAll();
}

if (typeof window !== 'undefined') {
  // Remove any previously registered handler (safe even if none exists)
  window.removeEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('beforeunload', handleBeforeUnload);
}

export { SignalRConnectionManager };
export default getSignalRConnection;
