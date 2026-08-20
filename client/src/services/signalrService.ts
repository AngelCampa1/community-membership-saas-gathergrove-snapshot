import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { ChatMessageResponse } from '@/types/chat';
import { logger } from '@/lib/logger';

export class SignalRService {
  private connection: HubConnection | null = null;
  private readonly hubUrl: string;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private readonly baseRetryDelay: number = 1000; // Start with 1 second
  private retryTimeoutId: ReturnType<typeof setTimeout> | null = null; // BUG FIX: Track retry timeout for cleanup

  constructor() {
    // Use environment variable or default to localhost
    // Note: SignalR hub is not under /api/v1 path, it's directly on the API server
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8050/api/v1'; // BUG FIX: Port standardization - Changed from 5284 to 8050
    const serverUrl = apiBaseUrl.replace('/api/v1', ''); // Remove API path for SignalR
    this.hubUrl = `${serverUrl}/chatHub`;
  }

  /**
   * Starts the SignalR connection with authentication and error recovery
   */
  async startConnection(): Promise<void> {
    if (this.connection) {
      return; // Already connected
    }

    try {
      this.connection = new HubConnectionBuilder()
        .withUrl(this.hubUrl, {
          withCredentials: true, // Include cookies for authentication
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000]) // Custom retry intervals
        .configureLogging(LogLevel.Information)
        .build();

      // Set up connection event handlers for better error recovery
      this.connection.onreconnecting(() => {
        logger.debug('SignalR attempting to reconnect...');
        this.reconnectAttempts++;
      });

      this.connection.onreconnected(() => {
        logger.debug('SignalR reconnected successfully');
        this.reconnectAttempts = 0; // Reset counter on successful reconnection
      });

      this.connection.onclose(async (error) => {
        logger.error('SignalR connection closed:', error);

        // Attempt manual reconnection if automatic reconnection fails
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          await this.retryConnection();
        } else {
          logger.error('Max reconnection attempts reached. Manual intervention required.');
        }
      });

      await this.connection.start();
      logger.debug('SignalR Connected');
      this.reconnectAttempts = 0; // Reset on successful connection
    } catch (error) {
      logger.error('SignalR Connection Error:', error);
      await this.retryConnection();
    }
  }

  /**
   * Retry connection with exponential backoff
   */
  private async retryConnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Maximum reconnection attempts reached');
      return;
    }

    const delay = this.baseRetryDelay * Math.pow(2, this.reconnectAttempts);
    logger.debug(`Retrying SignalR connection in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    // BUG FIX: Store timeout ID so it can be cleared on stopConnection
    this.retryTimeoutId = setTimeout(async () => {
      this.retryTimeoutId = null; // Clear reference after execution
      try {
        this.reconnectAttempts++;
        this.connection = null; // Reset connection
        await this.startConnection();
      } catch (error) {
        logger.error('Retry connection failed:', error);
      }
    }, delay);
  }

  /**
   * Stops the SignalR connection
   */
  async stopConnection(): Promise<void> {
    // BUG FIX: Clear any pending retry timeout to prevent memory leaks
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      logger.debug('SignalR Disconnected');
    }
  }

  /**
   * Joins a club's chat room with retry logic
   */
  async joinClubChat(clubId: number): Promise<void> {
    if (!this.connection) {
      throw new Error('SignalR connection not established');
    }

    try {
      await this.connection.invoke('JoinClubChat', clubId);
      logger.debug(`Joined club ${clubId} chat`);
    } catch (error) {
      logger.error(`Error joining club ${clubId} chat:`, error);

      // Retry joining if connection was lost
      if (this.connection.state === 'Disconnected' || this.connection.state === 'Reconnecting') {
        logger.debug('Attempting to rejoin chat after connection recovery...');
        setTimeout(async () => {
          try {
            if (this.isConnected()) {
              await this.connection!.invoke('JoinClubChat', clubId);
              logger.debug(`Successfully rejoined club ${clubId} chat`);
            }
          } catch (retryError) {
            logger.error(`Failed to rejoin club ${clubId} chat:`, retryError);
          }
        }, 2000);
      }

      throw error;
    }
  }

  /**
   * Leaves a club's chat room
   */
  async leaveClubChat(clubId: number): Promise<void> {
    if (!this.connection) {
      return; // No connection to leave from
    }

    try {
      await this.connection.invoke('LeaveClubChat', clubId);
      logger.debug(`Left club ${clubId} chat`);
    } catch (error) {
      logger.error(`Error leaving club ${clubId} chat:`, error);
    }
  }

  /**
   * Registers a callback for new messages
   */
  onNewMessage(callback: (message: ChatMessageResponse) => void): void {
    if (!this.connection) {
      throw new Error('SignalR connection not established');
    }

    this.connection.on('NewMessage', callback);
  }

  /**
   * Removes the new message callback
   */
  offNewMessage(): void {
    if (this.connection) {
      this.connection.off('NewMessage');
    }
  }

  /**
   * Registers a callback for connection status events
   */
  onConnectionStatus(
    onConnected?: () => void,
    onDisconnected?: () => void,
    onReconnecting?: () => void,
    onReconnected?: () => void
  ): void {
    if (!this.connection) {
      return;
    }

    if (onDisconnected) {
      this.connection.onclose(onDisconnected);
    }
    if (onReconnecting) {
      this.connection.onreconnecting(onReconnecting);
    }
    if (onReconnected) {
      this.connection.onreconnected(onReconnected);
    }
  }

  /**
   * Gets the current connection state
   */
  getConnectionState(): string {
    return this.connection?.state || 'Disconnected';
  }

  /**
   * Checks if the connection is connected
   */
  isConnected(): boolean {
    return this.connection?.state === 'Connected';
  }
}

// Export a singleton instance
export const signalRService = new SignalRService(); 