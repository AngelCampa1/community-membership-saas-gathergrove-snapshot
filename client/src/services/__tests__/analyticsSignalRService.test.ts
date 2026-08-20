/**
 * @jest-environment jsdom
 *
 * AnalyticsSignalRService Tests
 *
 * Verifies the dedicated analytics SignalR client (F-001 / F-010) talks to the
 * real AnalyticsHub at /hubs/analytics with the correct method/event contract.
 * SignalR is globally mocked at the @microsoft/signalr boundary; these tests
 * exercise the REAL service logic against that mock connection.
 */

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

import {
  AnalyticsSignalRService,
  analyticsSignalRService,
} from '../analyticsSignalRService';
import { HubConnectionBuilder } from '@microsoft/signalr';

const MockHubConnectionBuilder = HubConnectionBuilder as jest.MockedClass<typeof HubConnectionBuilder>;

describe('AnalyticsSignalRService', () => {
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
  let withUrlSpy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockConnection = {
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      off: jest.fn(),
      invoke: jest.fn().mockResolvedValue(undefined),
      state: 'Connected',
      onreconnecting: jest.fn(),
      onreconnected: jest.fn(),
      onclose: jest.fn(),
    };

    withUrlSpy = jest.fn().mockReturnThis();

    MockHubConnectionBuilder.mockImplementation(() => ({
      withUrl: withUrlSpy,
      withAutomaticReconnect: jest.fn().mockReturnThis(),
      configureLogging: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue(mockConnection),
    }) as unknown as InstanceType<typeof HubConnectionBuilder>);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('exports', () => {
    it('exports the class and a singleton instance', () => {
      expect(AnalyticsSignalRService).toBeDefined();
      expect(analyticsSignalRService).toBeInstanceOf(AnalyticsSignalRService);
    });
  });

  describe('startConnection', () => {
    it('connects to the /hubs/analytics endpoint with credentials', async () => {
      const service = new AnalyticsSignalRService();
      await service.startConnection();

      expect(withUrlSpy).toHaveBeenCalledWith(
        expect.stringContaining('/hubs/analytics'),
        expect.objectContaining({ withCredentials: true })
      );
      expect(mockConnection.start).toHaveBeenCalled();
      expect(service.isConnected()).toBe(true);
    });

    it('does NOT target the chat hub', async () => {
      const service = new AnalyticsSignalRService();
      await service.startConnection();

      const calledUrl = withUrlSpy.mock.calls[0][0] as string;
      expect(calledUrl).not.toContain('/chatHub');
    });

    it('is idempotent when already connected', async () => {
      const service = new AnalyticsSignalRService();
      await service.startConnection();
      await service.startConnection();

      expect(mockConnection.start).toHaveBeenCalledTimes(1);
    });

    it('schedules a retry when the initial connection fails', async () => {
      mockConnection.start.mockRejectedValueOnce(new Error('boom'));
      const service = new AnalyticsSignalRService();

      await service.startConnection();

      // A retry timeout should have been scheduled (exponential backoff)
      expect(jest.getTimerCount()).toBeGreaterThan(0);
    });
  });

  describe('joinClubAnalytics', () => {
    it('invokes JoinClubAnalytics with the club id', async () => {
      const service = new AnalyticsSignalRService();
      await service.startConnection();

      await service.joinClubAnalytics(42);

      expect(mockConnection.invoke).toHaveBeenCalledWith('JoinClubAnalytics', 42);
    });

    it('throws when no connection is established', async () => {
      const service = new AnalyticsSignalRService();

      await expect(service.joinClubAnalytics(1)).rejects.toThrow(
        'Analytics SignalR connection not established'
      );
    });
  });

  describe('leaveClubAnalytics', () => {
    it('invokes LeaveClubAnalytics with the club id', async () => {
      const service = new AnalyticsSignalRService();
      await service.startConnection();

      await service.leaveClubAnalytics(7);

      expect(mockConnection.invoke).toHaveBeenCalledWith('LeaveClubAnalytics', 7);
    });

    it('is a no-op (no throw) when not connected', async () => {
      const service = new AnalyticsSignalRService();
      await expect(service.leaveClubAnalytics(1)).resolves.toBeUndefined();
    });

    it('swallows invoke errors so leaving never rejects', async () => {
      const service = new AnalyticsSignalRService();
      await service.startConnection();
      mockConnection.invoke.mockRejectedValueOnce(new Error('leave failed'));

      await expect(service.leaveClubAnalytics(1)).resolves.toBeUndefined();
    });
  });

  describe('refreshAllAnalytics', () => {
    it('invokes RefreshAllAnalytics with the club id', async () => {
      const service = new AnalyticsSignalRService();
      await service.startConnection();

      await service.refreshAllAnalytics(3);

      expect(mockConnection.invoke).toHaveBeenCalledWith('RefreshAllAnalytics', 3);
    });

    it('throws when no connection is established', async () => {
      const service = new AnalyticsSignalRService();
      await expect(service.refreshAllAnalytics(1)).rejects.toThrow(
        'Analytics SignalR connection not established'
      );
    });
  });

  describe('event subscriptions', () => {
    it('registers each analytics push-event handler', async () => {
      const service = new AnalyticsSignalRService();
      await service.startConnection();

      const cb = jest.fn();
      service.onEngagementUpdate(cb);
      service.onCohortUpdate(cb);
      service.onROIUpdate(cb);
      service.onSegmentationUpdate(cb);
      service.onAnalyticsError(cb);

      expect(mockConnection.on).toHaveBeenCalledWith('EngagementUpdate', cb);
      expect(mockConnection.on).toHaveBeenCalledWith('CohortUpdate', cb);
      expect(mockConnection.on).toHaveBeenCalledWith('ROIUpdate', cb);
      expect(mockConnection.on).toHaveBeenCalledWith('SegmentationUpdate', cb);
      expect(mockConnection.on).toHaveBeenCalledWith('AnalyticsError', cb);
    });

    it('does not throw when subscribing before connecting', () => {
      const service = new AnalyticsSignalRService();
      expect(() => service.onEngagementUpdate(jest.fn())).not.toThrow();
    });

    it('removes all handlers via offAllHandlers', async () => {
      const service = new AnalyticsSignalRService();
      await service.startConnection();

      service.offAllHandlers();

      expect(mockConnection.off).toHaveBeenCalledWith('EngagementUpdate');
      expect(mockConnection.off).toHaveBeenCalledWith('CohortUpdate');
      expect(mockConnection.off).toHaveBeenCalledWith('ROIUpdate');
      expect(mockConnection.off).toHaveBeenCalledWith('SegmentationUpdate');
      expect(mockConnection.off).toHaveBeenCalledWith('AnalyticsError');
    });

    it('offAllHandlers is a no-op when not connected', () => {
      const service = new AnalyticsSignalRService();
      expect(() => service.offAllHandlers()).not.toThrow();
    });
  });

  describe('stopConnection', () => {
    it('stops the connection and reports disconnected', async () => {
      const service = new AnalyticsSignalRService();
      await service.startConnection();

      await service.stopConnection();

      expect(mockConnection.stop).toHaveBeenCalled();
      expect(service.isConnected()).toBe(false);
    });

    it('is a no-op when there is no connection', async () => {
      const service = new AnalyticsSignalRService();
      await expect(service.stopConnection()).resolves.toBeUndefined();
    });
  });

  describe('connection state helpers', () => {
    it('reports Disconnected before connecting', () => {
      const service = new AnalyticsSignalRService();
      expect(service.getConnectionState()).toBe('Disconnected');
      expect(service.isConnected()).toBe(false);
    });

    it('reflects the underlying connection state once connected', async () => {
      const service = new AnalyticsSignalRService();
      await service.startConnection();
      expect(service.getConnectionState()).toBe('Connected');
    });
  });
});
