/**
 * @jest-environment jsdom
 *
 * Communication Service Tests
 *
 * Tests multi-channel communication functionality following boundary mocking pattern:
 * - Mock ONLY the apiClient boundary (HTTP layer)
 * - Test REAL service logic (URL construction, parameter handling, error handling)
 */

import communicationService, {
  SendBulkEmailRequest,
  SendPushNotificationRequest,
  GetCommunicationHistoryParams,
} from '../communicationService';
import apiClient from '../apiClient';

// Mock apiClient at the HTTP boundary
jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('CommunicationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const clubId = 1;

  // Mock response data
  const mockEmailResponse = {
    success: true,
    message: 'Emails sent successfully',
    recipientCount: 50,
    failedRecipients: [],
  };

  const mockEmailUsageStats = {
    emailsSentThisMonth: 100,
    monthlyEmailLimit: 1000,
    isUnlimited: false,
    subscriptionTier: 'Grow',
  };

  const mockPushNotificationResponse = {
    success: true,
    message: 'Push notifications sent',
    deviceCount: 100,
    userCount: 75,
    totalActiveMembers: 100,
    communicationLogId: 123,
  };

  const mockPushUsageStats = {
    clubTier: 'Grow',
    membersWithDeviceTokens: 80,
    totalActiveMembers: 100,
    totalDeviceTokens: 120,
    isGrowTier: true,
    isAzureConfigured: true,
    currentMonth: 'January 2025',
  };

  const mockMembershipTypes = [
    {
      id: 1,
      clubId: 1,
      name: 'Standard',
      description: 'Standard membership',
      duesAmount: 50,
      duesFrequency: 'Monthly',
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      memberCount: 50,
    },
    {
      id: 2,
      clubId: 1,
      name: 'Premium',
      description: 'Premium membership',
      duesAmount: 100,
      duesFrequency: 'Monthly',
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      memberCount: 25,
    },
  ];

  const mockCommunicationHistory = {
    communications: [
      {
        id: 1,
        communicationType: 'Email',
        subject: 'Monthly Newsletter',
        body: 'Hello members...',
        recipientCount: 100,
        status: 'Completed',
        sentByUserName: 'Admin User',
        sentAt: '2025-01-15T10:00:00Z',
        createdAt: '2025-01-15T10:00:00Z',
      },
    ],
    totalCount: 1,
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  describe('sendBulkEmail', () => {
    const emailRequest: SendBulkEmailRequest = {
      subject: 'Monthly Newsletter',
      body: '<p>Hello members!</p>',
      isHtml: true,
    };

    it('should send bulk email successfully', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockEmailResponse });

      const result = await communicationService.sendBulkEmail(clubId, emailRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/communications/email`,
        emailRequest
      );
      expect(result).toEqual(mockEmailResponse);
    });

    it('should include member type IDs when targeting specific groups', async () => {
      const targetedRequest = { ...emailRequest, memberTypeIds: [1, 2] };
      mockApiClient.post.mockResolvedValue({ data: mockEmailResponse });

      await communicationService.sendBulkEmail(clubId, targetedRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/communications/email`,
        targetedRequest
      );
    });

    it('should return success response with recipient count', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockEmailResponse });

      const result = await communicationService.sendBulkEmail(clubId, emailRequest);

      expect(result.success).toBe(true);
      expect(result.recipientCount).toBe(50);
      expect(result.failedRecipients).toEqual([]);
    });

    it('should throw error on API failure', async () => {
      const error = { response: { status: 500, data: { message: 'Server Error' } } };
      mockApiClient.post.mockRejectedValue(error);

      await expect(communicationService.sendBulkEmail(clubId, emailRequest)).rejects.toBeDefined();
    });
  });

  describe('getEmailUsageStats', () => {
    it('should fetch email usage stats successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockEmailUsageStats });

      const result = await communicationService.getEmailUsageStats(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/communications/email/usage`
      );
      expect(result).toEqual(mockEmailUsageStats);
    });

    it('should return usage stats with all properties', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockEmailUsageStats });

      const result = await communicationService.getEmailUsageStats(clubId);

      expect(result.emailsSentThisMonth).toBe(100);
      expect(result.monthlyEmailLimit).toBe(1000);
      expect(result.isUnlimited).toBe(false);
      expect(result.subscriptionTier).toBe('Grow');
    });

    it('should throw error on API failure', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network Error'));

      await expect(communicationService.getEmailUsageStats(clubId)).rejects.toBeDefined();
    });
  });

  describe('sendPushNotification', () => {
    const pushRequest: SendPushNotificationRequest = {
      title: 'Event Reminder',
      body: 'Don\'t forget about tomorrow\'s event!',
    };

    it('should send push notification successfully', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockPushNotificationResponse });

      const result = await communicationService.sendPushNotification(clubId, pushRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/communications/push`,
        pushRequest
      );
      expect(result).toEqual(mockPushNotificationResponse);
    });

    it('should include member type IDs when targeting', async () => {
      const targetedRequest = { ...pushRequest, memberTypeIds: [1] };
      mockApiClient.post.mockResolvedValue({ data: mockPushNotificationResponse });

      await communicationService.sendPushNotification(clubId, targetedRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/communications/push`,
        targetedRequest
      );
    });

    it('should return device and user counts', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockPushNotificationResponse });

      const result = await communicationService.sendPushNotification(clubId, pushRequest);

      expect(result.deviceCount).toBe(100);
      expect(result.userCount).toBe(75);
      expect(result.communicationLogId).toBe(123);
    });

    it('should throw error on API failure', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network Error'));

      await expect(communicationService.sendPushNotification(clubId, pushRequest)).rejects.toBeDefined();
    });
  });

  describe('getPushNotificationUsageStats', () => {
    it('should fetch push notification usage stats successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockPushUsageStats });

      const result = await communicationService.getPushNotificationUsageStats(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/communications/push/usage`
      );
      expect(result).toEqual(mockPushUsageStats);
    });

    it('should return device token statistics', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockPushUsageStats });

      const result = await communicationService.getPushNotificationUsageStats(clubId);

      expect(result.membersWithDeviceTokens).toBe(80);
      expect(result.totalDeviceTokens).toBe(120);
      expect(result.isAzureConfigured).toBe(true);
    });

    it('should throw error on API failure', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network Error'));

      await expect(communicationService.getPushNotificationUsageStats(clubId)).rejects.toBeDefined();
    });
  });

  describe('getMembershipTypes', () => {
    it('should fetch membership types successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockMembershipTypes });

      const result = await communicationService.getMembershipTypes(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/clubs/${clubId}/membership-types`);
      expect(result).toEqual(mockMembershipTypes);
    });

    it('should return membership types with member counts', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockMembershipTypes });

      const result = await communicationService.getMembershipTypes(clubId);

      expect(result).toHaveLength(2);
      expect(result[0].memberCount).toBe(50);
      expect(result[1].memberCount).toBe(25);
    });

    it('should throw error on API failure', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network Error'));

      await expect(communicationService.getMembershipTypes(clubId)).rejects.toBeDefined();
    });
  });

  describe('getCommunicationHistory', () => {
    it('should fetch communication history with default params', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockCommunicationHistory });

      const result = await communicationService.getCommunicationHistory(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/communications/history?`
      );
      expect(result).toEqual(mockCommunicationHistory);
    });

    it('should include page parameter', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockCommunicationHistory });
      const params: GetCommunicationHistoryParams = { page: 2 };

      await communicationService.getCommunicationHistory(clubId, params);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
    });

    it('should include pageSize parameter', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockCommunicationHistory });
      const params: GetCommunicationHistoryParams = { pageSize: 25 };

      await communicationService.getCommunicationHistory(clubId, params);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('pageSize=25')
      );
    });

    it('should include communicationType filter', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockCommunicationHistory });
      const params: GetCommunicationHistoryParams = { communicationType: 'Email' };

      await communicationService.getCommunicationHistory(clubId, params);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('communicationType=Email')
      );
    });

    it('should include date range filters', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockCommunicationHistory });
      const params: GetCommunicationHistoryParams = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };

      await communicationService.getCommunicationHistory(clubId, params);

      const url = mockApiClient.get.mock.calls[0][0];
      expect(url).toContain('startDate=2025-01-01');
      expect(url).toContain('endDate=2025-01-31');
    });

    it('should combine multiple parameters', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockCommunicationHistory });
      const params: GetCommunicationHistoryParams = {
        page: 1,
        pageSize: 10,
        communicationType: 'Push',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };

      await communicationService.getCommunicationHistory(clubId, params);

      const url = mockApiClient.get.mock.calls[0][0];
      expect(url).toContain('page=1');
      expect(url).toContain('pageSize=10');
      expect(url).toContain('communicationType=Push');
      expect(url).toContain('startDate=2025-01-01');
      expect(url).toContain('endDate=2025-01-31');
    });

    it('should return paginated history', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockCommunicationHistory });

      const result = await communicationService.getCommunicationHistory(clubId);

      expect(result.communications).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.currentPage).toBe(1);
    });

    it('should throw error on API failure', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network Error'));

      await expect(communicationService.getCommunicationHistory(clubId)).rejects.toBeDefined();
    });
  });

  describe('Error context labeling (E-004)', () => {
    // Regression: every method previously passed the hardcoded context
    // 'sendBulkEmail' to ErrorHandler, so push/usage/history
    // failures were all mislabeled. ErrorHandler prefixes the thrown message
    // with `Error <context>: ...`, so we assert the correct per-method context.
    beforeEach(() => {
      mockApiClient.get.mockRejectedValue(new Error('Network Error'));
      mockApiClient.post.mockRejectedValue(new Error('Network Error'));
    });

    const expectContext = async (promise: Promise<unknown>, context: string) => {
      await expect(promise).rejects.toMatchObject({
        message: expect.stringContaining(`Error ${context}:`),
      });
    };

    it('labels sendBulkEmail errors', async () => {
      await expectContext(
        communicationService.sendBulkEmail(clubId, { subject: 's', body: 'b', recipientType: 'all' } as SendBulkEmailRequest),
        'sendBulkEmail'
      );
    });

    it('labels getEmailUsageStats errors', async () => {
      await expectContext(communicationService.getEmailUsageStats(clubId), 'getEmailUsageStats');
    });

    it('labels sendPushNotification errors', async () => {
      await expectContext(
        communicationService.sendPushNotification(clubId, { title: 't', body: 'b', recipientType: 'all' } as SendPushNotificationRequest),
        'sendPushNotification'
      );
    });

    it('labels getPushNotificationUsageStats errors', async () => {
      await expectContext(communicationService.getPushNotificationUsageStats(clubId), 'getPushNotificationUsageStats');
    });

    it('labels getCommunicationHistory errors', async () => {
      await expectContext(communicationService.getCommunicationHistory(clubId), 'getCommunicationHistory');
    });
  });

  describe('service export', () => {
    it('should export communicationService instance', () => {
      expect(communicationService).toBeDefined();
    });

    it('should have all required methods and omit removed channels', () => {
      expect(typeof communicationService.sendBulkEmail).toBe('function');
      expect(typeof communicationService.getEmailUsageStats).toBe('function');
      expect(typeof communicationService.sendPushNotification).toBe('function');
      expect(typeof communicationService.getPushNotificationUsageStats).toBe('function');
      expect(typeof communicationService.getMembershipTypes).toBe('function');
      expect(typeof communicationService.getCommunicationHistory).toBe('function');
      expect('sendBulkSms' in communicationService).toBe(false);
      expect('getSmsUsageStats' in communicationService).toBe(false);
      expect('sendBulkWhatsApp' in communicationService).toBe(false);
      expect('getWhatsAppTemplates' in communicationService).toBe(false);
    });
  });
});
