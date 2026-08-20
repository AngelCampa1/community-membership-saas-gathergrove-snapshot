import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { logger } from '@/lib/logger';

/**
 * Payload shape for the analytics push events broadcast by the backend
 * AnalyticsHub (EngagementUpdate / CohortUpdate / ROIUpdate / SegmentationUpdate).
 * The `data` field is intentionally `unknown` — each event carries a different
 * analytics DTO and consumers narrow it at the call site.
 */
export interface AnalyticsStreamEvent<T = unknown> {
  clubId: number;
  timestamp: string;
  data: T;
  type: string;
}

/**
 * Payload shape for the AnalyticsError event the hub sends to the caller when
 * an individual stream fails to load.
 */
export interface AnalyticsStreamError {
  clubId: number;
  error: string;
  timestamp: string;
}

/**
 * Dedicated SignalR client for the backend AnalyticsHub mapped at
 * `/hubs/analytics` (see F-001). This is deliberately SEPARATE from the chat
 * SignalRService: the analytics hub exposes a different method/event contract
 * (JoinClubAnalytics / LeaveClubAnalytics / RefreshAllAnalytics and the
 * Engagement/Cohort/ROI/Segmentation update events) and lives at a different
 * endpoint. Previously TierAwareSignalRService.joinAnalyticsStream mis-routed
 * "analytics" subscriptions onto the chat hub (F-010); this client fixes that
 * by talking to the real analytics hub.
 */
export class AnalyticsSignalRService {
  private connection: HubConnection | null = null;
  private readonly hubUrl: string;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private readonly baseRetryDelay: number = 1000;
  private retryTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // SignalR hubs are mounted directly on the API server, not under /api/v1.
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8050/api/v1';
    const serverUrl = apiBaseUrl.replace('/api/v1', '');
    this.hubUrl = `${serverUrl}/hubs/analytics`;
  }

  /**
   * Starts the analytics SignalR connection with cookie auth and recovery.
   */
  async startConnection(): Promise<void> {
    if (this.connection) {
      return; // Already connected
    }

    try {
      this.connection = new HubConnectionBuilder()
        .withUrl(this.hubUrl, {
          withCredentials: true, // HttpOnly jwt cookie carries auth
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .configureLogging(LogLevel.Information)
        .build();

      this.connection.onreconnecting(() => {
        logger.debug('Analytics SignalR attempting to reconnect...');
        this.reconnectAttempts++;
      });

      this.connection.onreconnected(() => {
        logger.debug('Analytics SignalR reconnected successfully');
        this.reconnectAttempts = 0;
      });

      this.connection.onclose(async (error) => {
        logger.error('Analytics SignalR connection closed:', error);
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          await this.retryConnection();
        } else {
          logger.error('Max analytics reconnection attempts reached.');
        }
      });

      await this.connection.start();
      logger.debug('Analytics SignalR Connected');
      this.reconnectAttempts = 0;
    } catch (error) {
      logger.error('Analytics SignalR Connection Error:', error);
      await this.retryConnection();
    }
  }

  /**
   * Retry connection with exponential backoff.
   */
  private async retryConnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Maximum analytics reconnection attempts reached');
      return;
    }

    const delay = this.baseRetryDelay * Math.pow(2, this.reconnectAttempts);
    logger.debug(`Retrying analytics SignalR connection in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    this.retryTimeoutId = setTimeout(async () => {
      this.retryTimeoutId = null;
      try {
        this.reconnectAttempts++;
        this.connection = null;
        await this.startConnection();
      } catch (error) {
        logger.error('Analytics retry connection failed:', error);
      }
    }, delay);
  }

  /**
   * Stops the analytics SignalR connection and clears any pending retry.
   */
  async stopConnection(): Promise<void> {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      logger.debug('Analytics SignalR Disconnected');
    }
  }

  /**
   * Joins a club's analytics group. The hub immediately streams the initial
   * engagement/cohort/ROI snapshots on join (see AnalyticsHub.JoinClubAnalytics).
   */
  async joinClubAnalytics(clubId: number): Promise<void> {
    if (!this.connection) {
      throw new Error('Analytics SignalR connection not established');
    }
    await this.connection.invoke('JoinClubAnalytics', clubId);
    logger.debug(`Joined club ${clubId} analytics stream`);
  }

  /**
   * Leaves a club's analytics group.
   */
  async leaveClubAnalytics(clubId: number): Promise<void> {
    if (!this.connection) {
      return;
    }
    try {
      await this.connection.invoke('LeaveClubAnalytics', clubId);
      logger.debug(`Left club ${clubId} analytics stream`);
    } catch (error) {
      logger.error(`Error leaving club ${clubId} analytics stream:`, error);
    }
  }

  /**
   * Requests a full refresh of all analytics streams for a club.
   */
  async refreshAllAnalytics(clubId: number): Promise<void> {
    if (!this.connection) {
      throw new Error('Analytics SignalR connection not established');
    }
    await this.connection.invoke('RefreshAllAnalytics', clubId);
    logger.debug(`Requested analytics refresh for club ${clubId}`);
  }

  onEngagementUpdate(callback: (event: AnalyticsStreamEvent) => void): void {
    this.connection?.on('EngagementUpdate', callback);
  }

  onCohortUpdate(callback: (event: AnalyticsStreamEvent) => void): void {
    this.connection?.on('CohortUpdate', callback);
  }

  onROIUpdate(callback: (event: AnalyticsStreamEvent) => void): void {
    this.connection?.on('ROIUpdate', callback);
  }

  onSegmentationUpdate(callback: (event: AnalyticsStreamEvent) => void): void {
    this.connection?.on('SegmentationUpdate', callback);
  }

  onAnalyticsError(callback: (event: AnalyticsStreamError) => void): void {
    this.connection?.on('AnalyticsError', callback);
  }

  /**
   * Removes all registered analytics event handlers.
   */
  offAllHandlers(): void {
    if (!this.connection) {
      return;
    }
    this.connection.off('EngagementUpdate');
    this.connection.off('CohortUpdate');
    this.connection.off('ROIUpdate');
    this.connection.off('SegmentationUpdate');
    this.connection.off('AnalyticsError');
  }

  getConnectionState(): string {
    return this.connection?.state || 'Disconnected';
  }

  isConnected(): boolean {
    return this.connection?.state === 'Connected';
  }
}

// Export a singleton instance for global use
export const analyticsSignalRService = new AnalyticsSignalRService();
