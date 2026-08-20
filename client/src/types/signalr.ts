/**
 * SignalR type definitions
 * Provides type safety for real-time communication
 */

import { HubConnection } from '@microsoft/signalr';

/**
 * Available SignalR hubs
 */
export type HubName = 'chat' | 'eventEngagement';

/**
 * Connection status type
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'reconnected';

/**
 * Generic SignalR event handler
 * @template TData - The type of data received in events
 */
export type SignalREventHandler<TData = unknown> = (data: TData) => void;

/**
 * SignalR method invocation with type safety
 * @template TResult - The type of result returned from the server method
 * @template TArgs - The types of arguments passed to the server method
 */
export type SignalRInvokeMethod<TResult = void, TArgs extends unknown[] = []> =
  (...args: TArgs) => Promise<TResult>;

/**
 * SignalR hub method names for chat hub
 */
export type ChatHubMethod =
  | 'SendMessage'
  | 'JoinRoom'
  | 'LeaveRoom'
  | 'TypingStarted'
  | 'TypingStopped'
  | 'DeleteMessage'
  | 'EditMessage';

/**
 * SignalR hub method names for engagement hub
 */
export type EngagementHubMethod =
  | 'UpdateMemberEngagement'
  | 'RecordActivity'
  | 'GetEngagementStats'
  | 'SubscribeToUpdates'
  | 'UnsubscribeFromUpdates';

/**
 * SignalR hub method names for event engagement hub
 */
export type EventEngagementHubMethod =
  | 'UpdateEventEngagement'
  | 'RecordCheckIn'
  | 'GetEventStats'
  | 'SubscribeToEvent'
  | 'UnsubscribeFromEvent';

/**
 * Union of all hub method names
 */
export type HubMethodName = ChatHubMethod | EngagementHubMethod | EventEngagementHubMethod;

/**
 * SignalR event names for chat hub
 */
export type ChatHubEvent =
  | 'ReceiveMessage'
  | 'MessageDeleted'
  | 'MessageEdited'
  | 'UserJoined'
  | 'UserLeft'
  | 'UserTyping'
  | 'UserStoppedTyping';

/**
 * SignalR event names for engagement hub
 */
export type EngagementHubEvent =
  | 'EngagementUpdated'
  | 'ActivityRecorded'
  | 'StatsUpdated';

/**
 * SignalR event names for event engagement hub
 */
export type EventEngagementHubEvent =
  | 'EventEngagementUpdated'
  | 'CheckInRecorded'
  | 'EventStatsUpdated';

/**
 * Union of all hub event names
 */
export type HubEventName = ChatHubEvent | EngagementHubEvent | EventEngagementHubEvent;

/**
 * Chat message structure
 */
export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: string;
  isEdited: boolean;
  isDeleted: boolean;
}

/**
 * User typing notification
 */
export interface UserTypingNotification {
  userId: number;
  userName: string;
  roomId: string;
  isTyping: boolean;
}

/**
 * Engagement update event data
 */
export interface EngagementUpdateEvent {
  memberId: number;
  engagementScore: number;
  lastActivityDate: string;
  activityType: string;
  metadata?: Record<string, unknown>;
}

/**
 * Event engagement update data
 */
export interface EventEngagementUpdateEvent {
  eventId: number;
  attendeeCount: number;
  checkInCount: number;
  engagementMetrics: {
    averageEngagement: number;
    peakEngagement: number;
    activeParticipants: number;
  };
}

/**
 * SignalR connection configuration
 */
export interface SignalRConnectionConfig {
  hubUrl: string;
  accessToken?: string;
  withCredentials?: boolean;
  automaticReconnect?: boolean;
  reconnectDelays?: number[];
  transport?: 'WebSockets' | 'ServerSentEvents' | 'LongPolling';
}

/**
 * SignalR connection state
 */
export interface SignalRConnectionState {
  connection: HubConnection | null;
  status: ConnectionStatus;
  isConnected: boolean;
  isReconnecting: boolean;
  error: Error | null;
  reconnectAttempts: number;
}

/**
 * SignalR event subscription
 * @template TData - The type of data for this event
 */
export interface SignalRSubscription<TData = unknown> {
  eventName: HubEventName;
  handler: SignalREventHandler<TData>;
  unsubscribe: () => void;
}

/**
 * SignalR method call options
 */
export interface InvokeOptions {
  timeout?: number;
  retryOnFailure?: boolean;
  maxRetries?: number;
}

/**
 * Type-safe SignalR hub connection wrapper
 * @template TEvents - Map of event names to their data types
 * @template TMethods - Map of method names to their return types
 */
export interface TypedHubConnection<
  TEvents extends Record<string, unknown> = Record<string, unknown>,
  TMethods extends Record<string, unknown> = Record<string, unknown>
> {
  /** Current connection status */
  status: ConnectionStatus;

  /** Check if connected */
  isConnected: boolean;

  /** Start the connection */
  start(): Promise<void>;

  /** Stop the connection */
  stop(): Promise<void>;

  /** Subscribe to an event */
  on<K extends keyof TEvents>(
    eventName: K,
    handler: SignalREventHandler<TEvents[K]>
  ): SignalRSubscription<TEvents[K]>;

  /** Unsubscribe from an event */
  off<K extends keyof TEvents>(
    eventName: K,
    handler?: SignalREventHandler<TEvents[K]>
  ): void;

  /** Invoke a server method */
  invoke<K extends keyof TMethods>(
    methodName: K,
    ...args: unknown[]
  ): Promise<TMethods[K]>;

  /** Subscribe to connection status changes */
  onStatusChange(callback: (status: ConnectionStatus) => void): () => void;
}