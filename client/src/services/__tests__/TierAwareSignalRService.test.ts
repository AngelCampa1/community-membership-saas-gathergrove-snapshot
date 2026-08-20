/**
 * @jest-environment jsdom
 *
 * TierAwareSignalRService Tests
 *
 * Tests tier-based SignalR connection management following boundary mocking pattern:
 * - Mock ONLY the SignalRService boundary (external dependency)
 * - Test REAL service logic (tier gating, connection management, upgrades/downgrades)
 */

// Mock SignalRService at the boundary - basic mock first
jest.mock('../signalrService');
// Mock the dedicated analytics SignalR client at the boundary (F-010)
jest.mock('../analyticsSignalRService');

// Mock logger to prevent console noise
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

import { TierAwareSignalRService, createTierAwareSignalRService, tierAwareSignalRService } from '../TierAwareSignalRService';
import { SignalRService } from '../signalrService';
import { AnalyticsSignalRService } from '../analyticsSignalRService';

const MockSignalRService = SignalRService as jest.MockedClass<typeof SignalRService>;
const MockAnalyticsSignalRService = AnalyticsSignalRService as jest.MockedClass<typeof AnalyticsSignalRService>;

// Create mock instance factory (chat hub)
const createMockInstance = () => ({
  startConnection: jest.fn().mockResolvedValue(undefined),
  stopConnection: jest.fn().mockResolvedValue(undefined),
  joinClubChat: jest.fn().mockResolvedValue(undefined),
  leaveClubChat: jest.fn().mockResolvedValue(undefined),
  onNewMessage: jest.fn(),
  offNewMessage: jest.fn(),
  onConnectionStatus: jest.fn(),
  getConnectionState: jest.fn().mockReturnValue('Connected'),
  isConnected: jest.fn().mockReturnValue(true),
});

// Create mock instance factory (analytics hub)
const createMockAnalyticsInstance = () => ({
  startConnection: jest.fn().mockResolvedValue(undefined),
  stopConnection: jest.fn().mockResolvedValue(undefined),
  joinClubAnalytics: jest.fn().mockResolvedValue(undefined),
  leaveClubAnalytics: jest.fn().mockResolvedValue(undefined),
  refreshAllAnalytics: jest.fn().mockResolvedValue(undefined),
  onEngagementUpdate: jest.fn(),
  onCohortUpdate: jest.fn(),
  onROIUpdate: jest.fn(),
  onSegmentationUpdate: jest.fn(),
  onAnalyticsError: jest.fn(),
  offAllHandlers: jest.fn(),
  getConnectionState: jest.fn().mockReturnValue('Connected'),
  isConnected: jest.fn().mockReturnValue(true),
});

// Track created instances
let mockInstance: ReturnType<typeof createMockInstance>;
let mockAnalyticsInstance: ReturnType<typeof createMockAnalyticsInstance>;

describe('TierAwareSignalRService', () => {
  let service: TierAwareSignalRService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create fresh mock instances and configure mocks
    mockInstance = createMockInstance();
    MockSignalRService.mockImplementation(() => mockInstance as unknown as SignalRService);

    mockAnalyticsInstance = createMockAnalyticsInstance();
    MockAnalyticsSignalRService.mockImplementation(() => mockAnalyticsInstance as unknown as AnalyticsSignalRService);

    service = new TierAwareSignalRService();
  });

  afterEach(async () => {
    try {
      await service.stopConnection();
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('constructor', () => {
    it('should create service without SignalR connection', () => {
      expect(service).toBeDefined();
      expect(service.isConnected()).toBe(false);
    });

    it('should start with tier-restricted state', () => {
      expect(service.getConnectionState()).toBe('Tier-Restricted');
    });
  });

  describe('initialize', () => {
    it('should create SignalR connection for unlimited tier', async () => {
      await service.initialize(1, 'Unlimited');

      expect(MockSignalRService).toHaveBeenCalled();
      expect(mockInstance.startConnection).toHaveBeenCalled();
    });

    it('should not create SignalR connection for basic tier', async () => {
      await service.initialize(1, 'Basic');

      expect(MockSignalRService).not.toHaveBeenCalled();
    });

    it('should not create SignalR connection for grow tier', async () => {
      await service.initialize(1, 'Grow');

      expect(MockSignalRService).not.toHaveBeenCalled();
    });

    it('should handle tier case-insensitively', async () => {
      await service.initialize(1, 'UNLIMITED');

      expect(MockSignalRService).toHaveBeenCalled();
    });

    it('should handle connection failure gracefully', async () => {
      mockInstance.startConnection.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(service.initialize(1, 'Unlimited')).resolves.toBeUndefined();
    });
  });

  describe('joinAnalyticsStream', () => {
    it('should throw for non-unlimited tier', async () => {
      await service.initialize(1, 'Basic');

      await expect(service.joinAnalyticsStream(1)).rejects.toThrow(
        'Real-time analytics streaming requires Expand tier subscription'
      );
    });

    it('should throw if service not initialized', async () => {
      // @ts-expect-error - Accessing private property for testing
      service.isUnlimitedTier = true;

      await expect(service.joinAnalyticsStream(1)).rejects.toThrow(
        'SignalR service not initialized for Expand tier club'
      );
    });

    it('should join the analytics hub (not the chat hub) for unlimited tier', async () => {
      await service.initialize(1, 'Unlimited');

      await service.joinAnalyticsStream(1);

      // F-010: analytics streaming must hit the dedicated analytics hub,
      // and must NOT mis-route onto the chat hub.
      expect(mockAnalyticsInstance.joinClubAnalytics).toHaveBeenCalledWith(1);
      expect(mockInstance.joinClubChat).not.toHaveBeenCalled();
    });

    it('should propagate errors from the analytics service', async () => {
      await service.initialize(1, 'Unlimited');
      mockAnalyticsInstance.joinClubAnalytics.mockRejectedValueOnce(new Error('Join failed'));

      await expect(service.joinAnalyticsStream(1)).rejects.toThrow('Join failed');
    });
  });

  describe('analytics stream lifecycle & subscriptions (F-010)', () => {
    it('leaveAnalyticsStream delegates to the analytics hub for unlimited tier', async () => {
      await service.initialize(1, 'Unlimited');

      await service.leaveAnalyticsStream(1);

      expect(mockAnalyticsInstance.leaveClubAnalytics).toHaveBeenCalledWith(1);
    });

    it('leaveAnalyticsStream is a no-op for basic tier', async () => {
      await service.initialize(1, 'Basic');

      await expect(service.leaveAnalyticsStream(1)).resolves.toBeUndefined();
      expect(MockAnalyticsSignalRService).not.toHaveBeenCalled();
    });

    it('refreshAnalytics delegates to the analytics hub for unlimited tier', async () => {
      await service.initialize(1, 'Unlimited');

      await service.refreshAnalytics(1);

      expect(mockAnalyticsInstance.refreshAllAnalytics).toHaveBeenCalledWith(1);
    });

    it('refreshAnalytics throws for basic tier', async () => {
      await service.initialize(1, 'Basic');

      await expect(service.refreshAnalytics(1)).rejects.toThrow(
        'Real-time analytics streaming requires Expand tier subscription'
      );
    });

    it('refreshAnalytics throws when analytics service is not initialized', async () => {
      // @ts-expect-error - Accessing private property for testing
      service.isUnlimitedTier = true;

      await expect(service.refreshAnalytics(1)).rejects.toThrow(
        'SignalR service not initialized for Expand tier club'
      );
    });

    it('registers each analytics event handler for unlimited tier', async () => {
      await service.initialize(1, 'Unlimited');
      const cb = jest.fn();

      service.onEngagementUpdate(cb);
      service.onCohortUpdate(cb);
      service.onROIUpdate(cb);
      service.onSegmentationUpdate(cb);
      service.onAnalyticsError(cb);

      expect(mockAnalyticsInstance.onEngagementUpdate).toHaveBeenCalledWith(cb);
      expect(mockAnalyticsInstance.onCohortUpdate).toHaveBeenCalledWith(cb);
      expect(mockAnalyticsInstance.onROIUpdate).toHaveBeenCalledWith(cb);
      expect(mockAnalyticsInstance.onSegmentationUpdate).toHaveBeenCalledWith(cb);
      expect(mockAnalyticsInstance.onAnalyticsError).toHaveBeenCalledWith(cb);
    });

    it('does not register analytics handlers for basic tier', async () => {
      await service.initialize(1, 'Basic');
      const cb = jest.fn();

      service.onEngagementUpdate(cb);
      service.onCohortUpdate(cb);
      service.onROIUpdate(cb);
      service.onSegmentationUpdate(cb);
      service.onAnalyticsError(cb);

      expect(MockAnalyticsSignalRService).not.toHaveBeenCalled();
    });

    it('stops the analytics connection on stopConnection', async () => {
      await service.initialize(1, 'Unlimited');

      await service.stopConnection();

      expect(mockAnalyticsInstance.stopConnection).toHaveBeenCalled();
    });

    it('tears down the analytics connection on downgrade', async () => {
      await service.initialize(1, 'Unlimited');

      await service.downgradeFromUnlimited();

      expect(mockAnalyticsInstance.stopConnection).toHaveBeenCalled();
    });
  });

  describe('joinClubChat', () => {
    it('should silently skip for basic tier', async () => {
      await service.initialize(1, 'Basic');

      await expect(service.joinClubChat(1)).resolves.toBeUndefined();
    });

    it('should join chat for unlimited tier', async () => {
      await service.initialize(1, 'Unlimited');

      await service.joinClubChat(1);

      expect(mockInstance.joinClubChat).toHaveBeenCalledWith(1);
    });

    it('should handle missing SignalR service gracefully', async () => {
      // @ts-expect-error - Accessing private property for testing
      service.isUnlimitedTier = true;

      await expect(service.joinClubChat(1)).resolves.toBeUndefined();
    });
  });

  describe('leaveClubChat', () => {
    it('should do nothing for basic tier', async () => {
      await service.initialize(1, 'Basic');

      await expect(service.leaveClubChat(1)).resolves.toBeUndefined();
    });

    it('should leave chat for unlimited tier', async () => {
      await service.initialize(1, 'Unlimited');

      await service.leaveClubChat(1);

      expect(mockInstance.leaveClubChat).toHaveBeenCalledWith(1);
    });
  });

  describe('onNewMessage', () => {
    it('should not register callback for basic tier', async () => {
      await service.initialize(1, 'Basic');
      const callback = jest.fn();

      service.onNewMessage(callback);

      // No SignalR service created for basic tier
      expect(MockSignalRService).not.toHaveBeenCalled();
    });

    it('should register callback for unlimited tier', async () => {
      await service.initialize(1, 'Unlimited');
      const callback = jest.fn();

      service.onNewMessage(callback);

      expect(mockInstance.onNewMessage).toHaveBeenCalledWith(callback);
    });

    it('should handle missing SignalR service gracefully', async () => {
      // @ts-expect-error - Accessing private property for testing
      service.isUnlimitedTier = true;

      expect(() => service.onNewMessage(jest.fn())).not.toThrow();
    });
  });

  describe('offNewMessage', () => {
    it('should do nothing without SignalR service', () => {
      expect(() => service.offNewMessage()).not.toThrow();
    });

    it('should unregister callback when SignalR service exists', async () => {
      await service.initialize(1, 'Unlimited');

      service.offNewMessage();

      expect(mockInstance.offNewMessage).toHaveBeenCalled();
    });
  });

  describe('onConnectionStatus', () => {
    it('should not register callbacks for basic tier', async () => {
      await service.initialize(1, 'Basic');
      const onConnected = jest.fn();
      const onDisconnected = jest.fn();

      service.onConnectionStatus(onConnected, onDisconnected);

      expect(MockSignalRService).not.toHaveBeenCalled();
    });

    it('should register callbacks for unlimited tier', async () => {
      await service.initialize(1, 'Unlimited');
      const onConnected = jest.fn();
      const onDisconnected = jest.fn();
      const onReconnecting = jest.fn();
      const onReconnected = jest.fn();

      service.onConnectionStatus(onConnected, onDisconnected, onReconnecting, onReconnected);

      expect(mockInstance.onConnectionStatus).toHaveBeenCalledWith(
        onConnected, onDisconnected, onReconnecting, onReconnected
      );
    });

    it('should handle missing SignalR service gracefully', async () => {
      // @ts-expect-error - Accessing private property for testing
      service.isUnlimitedTier = true;

      expect(() => service.onConnectionStatus(jest.fn())).not.toThrow();
    });
  });

  describe('getConnectionState', () => {
    it('should return Tier-Restricted for basic tier', async () => {
      await service.initialize(1, 'Basic');

      expect(service.getConnectionState()).toBe('Tier-Restricted');
    });

    it('should return actual state for unlimited tier', async () => {
      await service.initialize(1, 'Unlimited');

      expect(service.getConnectionState()).toBe('Connected');
    });

    it('should return Disconnected when SignalR service is null', async () => {
      // @ts-expect-error - Accessing private property for testing
      service.isUnlimitedTier = true;

      expect(service.getConnectionState()).toBe('Disconnected');
    });
  });

  describe('isConnected', () => {
    it('should return false for basic tier', async () => {
      await service.initialize(1, 'Basic');

      expect(service.isConnected()).toBe(false);
    });

    it('should return connection state for unlimited tier', async () => {
      await service.initialize(1, 'Unlimited');

      expect(service.isConnected()).toBe(true);
    });

    it('should return false when SignalR service is null', async () => {
      // @ts-expect-error - Accessing private property for testing
      service.isUnlimitedTier = true;

      expect(service.isConnected()).toBe(false);
    });
  });

  describe('areRealTimeFeaturesAvailable', () => {
    it('should return false for basic tier', async () => {
      await service.initialize(1, 'Basic');

      expect(service.areRealTimeFeaturesAvailable()).toBe(false);
    });

    it('should return true when unlimited tier and connected', async () => {
      await service.initialize(1, 'Unlimited');

      expect(service.areRealTimeFeaturesAvailable()).toBe(true);
    });

    it('should return false when unlimited but not connected', async () => {
      await service.initialize(1, 'Unlimited');
      mockInstance.isConnected.mockReturnValue(false);

      expect(service.areRealTimeFeaturesAvailable()).toBe(false);
    });
  });

  describe('getTierInfo', () => {
    it('should return basic tier info', async () => {
      await service.initialize(1, 'Basic');

      const info = service.getTierInfo();

      expect(info).toEqual({
        tier: 'Basic',
        hasRealTimeFeatures: false,
        connectionStatus: 'Tier-Restricted',
      });
    });

    it('should return Expand tier info', async () => {
      await service.initialize(1, 'Unlimited');

      const info = service.getTierInfo();

      expect(info).toEqual({
        tier: 'Expand',
        hasRealTimeFeatures: true,
        connectionStatus: 'Connected',
      });
    });
  });

  describe('stopConnection', () => {
    it('should do nothing without SignalR service', async () => {
      await expect(service.stopConnection()).resolves.toBeUndefined();
    });

    it('should stop SignalR connection and clear service', async () => {
      await service.initialize(1, 'Unlimited');

      await service.stopConnection();

      expect(mockInstance.stopConnection).toHaveBeenCalled();
      expect(service.isConnected()).toBe(false);
    });
  });

  describe('upgradeToUnlimited', () => {
    it('should do nothing if already unlimited', async () => {
      await service.initialize(1, 'Unlimited');
      const callCountBefore = MockSignalRService.mock.calls.length;

      await service.upgradeToUnlimited(1);

      // No new SignalR service created
      expect(MockSignalRService.mock.calls.length).toBe(callCountBefore);
    });

    it('should upgrade from basic to unlimited', async () => {
      await service.initialize(1, 'Basic');
      expect(MockSignalRService).not.toHaveBeenCalled();

      await service.upgradeToUnlimited(1);

      expect(MockSignalRService).toHaveBeenCalled();
      expect(service.getTierInfo().tier).toBe('Expand');
    });
  });

  describe('downgradeFromUnlimited', () => {
    it('should do nothing if already basic tier', async () => {
      await service.initialize(1, 'Basic');

      await service.downgradeFromUnlimited();

      expect(service.getTierInfo().tier).toBe('Basic');
    });

    it('should downgrade from unlimited to basic', async () => {
      await service.initialize(1, 'Unlimited');

      await service.downgradeFromUnlimited();

      expect(mockInstance.stopConnection).toHaveBeenCalled();
      expect(service.getTierInfo().tier).toBe('Basic');
      expect(service.isConnected()).toBe(false);
    });
  });
});

describe('createTierAwareSignalRService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInstance = createMockInstance();
    MockSignalRService.mockImplementation(() => mockInstance as unknown as SignalRService);
    mockAnalyticsInstance = createMockAnalyticsInstance();
    MockAnalyticsSignalRService.mockImplementation(() => mockAnalyticsInstance as unknown as AnalyticsSignalRService);
  });

  it('should create and initialize service', () => {
    const service = createTierAwareSignalRService(1, 'Unlimited');

    expect(service).toBeInstanceOf(TierAwareSignalRService);
  });

  it('should handle initialization errors gracefully', () => {
    mockInstance.startConnection.mockRejectedValue(new Error('Init failed'));

    expect(() => createTierAwareSignalRService(1, 'Unlimited')).not.toThrow();
  });
});

describe('tierAwareSignalRService singleton', () => {
  it('should export singleton instance', () => {
    expect(tierAwareSignalRService).toBeDefined();
    expect(tierAwareSignalRService).toBeInstanceOf(TierAwareSignalRService);
  });

  it('should have all required methods', () => {
    expect(typeof tierAwareSignalRService.initialize).toBe('function');
    expect(typeof tierAwareSignalRService.joinAnalyticsStream).toBe('function');
    expect(typeof tierAwareSignalRService.joinClubChat).toBe('function');
    expect(typeof tierAwareSignalRService.leaveClubChat).toBe('function');
    expect(typeof tierAwareSignalRService.onNewMessage).toBe('function');
    expect(typeof tierAwareSignalRService.offNewMessage).toBe('function');
    expect(typeof tierAwareSignalRService.onConnectionStatus).toBe('function');
    expect(typeof tierAwareSignalRService.getConnectionState).toBe('function');
    expect(typeof tierAwareSignalRService.isConnected).toBe('function');
    expect(typeof tierAwareSignalRService.areRealTimeFeaturesAvailable).toBe('function');
    expect(typeof tierAwareSignalRService.getTierInfo).toBe('function');
    expect(typeof tierAwareSignalRService.stopConnection).toBe('function');
    expect(typeof tierAwareSignalRService.upgradeToUnlimited).toBe('function');
    expect(typeof tierAwareSignalRService.downgradeFromUnlimited).toBe('function');
  });
});
