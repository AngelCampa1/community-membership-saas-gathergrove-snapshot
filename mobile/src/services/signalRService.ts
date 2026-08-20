import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { authService } from './authService';
import { API_CONFIG } from '@/constants';
import { ChatMessage } from '@/types';

/**
 * SignalR service for real-time chat functionality
 */
export class SignalRService {
  private static connection: HubConnection | null = null;
  private static isConnecting = false;
  private static messageHandlers: Array<(message: ChatMessage) => void> = [];
  private static currentClubId: number | null = null;

  /**
   * Initialize SignalR connection
   */
  static async connect(): Promise<void> {
    if (this.connection?.state === 'Connected' || this.isConnecting) {
      return;
    }

    try {
      this.isConnecting = true;
      const initialToken = await authService.getStoredToken();

      if (!initialToken) {
        // In test environments, gracefully handle missing tokens
        if (process.env.NODE_ENV === 'test') {
          return;
        }
        throw new Error('Authentication token not found');
      }

      // CHAT-07 fix: Use async token factory to get fresh token on each request
      // This ensures reconnections use the latest token if it was refreshed
      this.connection = new HubConnectionBuilder()
        .withUrl(`${API_CONFIG.BASE_URL}/chathub`, {
          accessTokenFactory: async () => {
            const token = await authService.getStoredToken();
            if (!token) {
              throw new Error('No valid authentication token available for SignalR');
            }
            return token;
          },
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      // Handle new messages
      this.connection.on('NewMessage', (message: ChatMessage) => {
        this.messageHandlers.forEach(handler => handler(message));
      });

      // CHAT-06 fix: Add actual error logging for connection errors
      this.connection.on('AccessDenied', (reason: string) => {
        if (__DEV__) {
          console.warn('[SignalR] Access denied:', reason);
        }
        // In production, could send to logging service
      });

      this.connection.on('Error', (error: string) => {
        if (__DEV__) {
          console.error('[SignalR] Connection error:', error);
        }
        // In production, could send to logging service
      });

      // CHAT-02 fix: Add reconnection event handlers
      this.connection.onreconnecting((error) => {
        if (__DEV__) {
          // Log: ('[SignalR] Reconnecting...', error);
        }
        void error;
      });

      this.connection.onreconnected((connectionId) => {
        if (__DEV__) {
          // Log: ('[SignalR] Reconnected:', connectionId);
        }
        void connectionId;
        // Re-join club chat if needed
        if (this.currentClubId && this.connection) {
          this.connection.invoke('JoinClubChat', this.currentClubId).catch(() => {
            // Error rejoining chat - will be handled silently
          });
        }
      });

      this.connection.onclose((error) => {
        if (__DEV__) {
          // Log: ('[SignalR] Connection closed:', error);
        }
        void error;
        // Clear connection reference on close
        this.connection = null;
        this.currentClubId = null;
        // CHAT-08 fix: Clear handlers on unexpected close to prevent accumulation
        // This matches the behavior in disconnect() method
        this.messageHandlers = [];
      });

      await this.connection.start();
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect from SignalR
   * CHAT-01/MEM-02 fix: Clear handlers on disconnect to prevent accumulation
   * CHAT-04 fix: Stop connection first, then cleanup to prevent race condition
   */
  static async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        if (this.currentClubId) {
          await this.leaveClubChat(this.currentClubId);
        }
        await this.connection.stop();
      } finally {
        // Always cleanup even if stop() fails
        this.connection = null;
        this.currentClubId = null;
        // CHAT-01/MEM-02: Clear all handlers to prevent accumulation
        this.messageHandlers = [];
      }
    }
  }

  /**
   * Join a club's chat room
   */
  static async joinClubChat(clubId: number): Promise<void> {
    if (!this.connection) {
      await this.connect();
    }

    if (this.connection?.state !== 'Connected') {
      throw new Error('SignalR connection not established');
    }

    // Leave previous club chat if different
    if (this.currentClubId && this.currentClubId !== clubId) {
      await this.leaveClubChat(this.currentClubId);
    }

    await this.connection.invoke('JoinClubChat', clubId);
    this.currentClubId = clubId;
  }

  /**
   * Leave a club's chat room
   */
  static async leaveClubChat(clubId: number): Promise<void> {
    if (!this.connection || this.connection.state !== 'Connected') {
      return;
    }

    try {
      await this.connection.invoke('LeaveClubChat', clubId);
      if (this.currentClubId === clubId) {
        this.currentClubId = null;
      }
    } catch (error) {
      // Error: ('[SignalR] Leave club chat error:', error);
    }
  }

  /**
   * Add a message handler
   * CHAT-01 fix: Prevent duplicate handler registration
   */
  static addMessageHandler(handler: (message: ChatMessage) => void): void {
    // Prevent duplicate handlers
    if (!this.messageHandlers.includes(handler)) {
      this.messageHandlers.push(handler);
    }
  }

  /**
   * Remove a message handler
   */
  static removeMessageHandler(handler: (message: ChatMessage) => void): void {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  /**
   * Get connection state
   */
  static getConnectionState(): string {
    return this.connection?.state || 'Disconnected';
  }

  /**
   * Check if connected
   */
  static isConnected(): boolean {
    return this.connection?.state === 'Connected';
  }
}