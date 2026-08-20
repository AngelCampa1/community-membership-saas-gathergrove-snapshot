/**
 * Comprehensive EventService Tests - Maximum Coverage
 *
 * Strategy: Mock apiClient directly to ensure all code paths execute.
 * Goal: Increase coverage from 40% to 85%+ by testing all methods.
 */

import { eventService } from '../eventService';
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

// Mock ErrorHandler
jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    handleApiError: (error: unknown) => error,
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('EventService - Comprehensive Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const clubId = 1;
  const eventId = 1;

  // ================== FEEDBACK METHODS ==================
  describe('Feedback Methods', () => {
    it('should get feedback surveys', async () => {
      const surveys = [{ id: '1', eventId: 1, questions: [] }];
      mockApiClient.get.mockResolvedValue({ data: surveys });

      const result = await eventService.getFeedbackSurveys(clubId, eventId);

      expect(mockApiClient.get).toHaveBeenCalledWith('/clubs/1/events/1/feedback/surveys');
      expect(result).toEqual(surveys);
    });

    it('should create feedback survey', async () => {
      const surveyData = { questions: [], title: 'Test Survey' };
      const createdSurvey = { id: '1', ...surveyData, eventId: 1 };
      mockApiClient.post.mockResolvedValue({ data: createdSurvey });

      const result = await eventService.createFeedbackSurvey(clubId, eventId, surveyData as any);

      expect(mockApiClient.post).toHaveBeenCalledWith('/clubs/1/events/1/feedback/surveys', surveyData);
      expect(result).toEqual(createdSurvey);
    });

    it('should update feedback survey', async () => {
      const surveyId = 'survey-1';
      const updates = { title: 'Updated Survey' };
      const updatedSurvey = { id: surveyId, ...updates };
      mockApiClient.put.mockResolvedValue({ data: updatedSurvey });

      const result = await eventService.updateFeedbackSurvey(clubId, eventId, surveyId, updates);

      expect(mockApiClient.put).toHaveBeenCalledWith('/clubs/1/events/1/feedback/surveys/survey-1', updates);
      expect(result).toEqual(updatedSurvey);
    });

    it('should delete feedback survey', async () => {
      const surveyId = 'survey-1';
      mockApiClient.delete.mockResolvedValue({ data: undefined });

      await eventService.deleteFeedbackSurvey(clubId, eventId, surveyId);

      expect(mockApiClient.delete).toHaveBeenCalledWith('/clubs/1/events/1/feedback/surveys/survey-1');
    });

    it('should get feedback responses', async () => {
      const surveyId = 'survey-1';
      const responses = [{ id: '1', surveyId, answers: [] }];
      mockApiClient.get.mockResolvedValue({ data: responses });

      const result = await eventService.getFeedbackResponses(clubId, eventId, surveyId);

      expect(mockApiClient.get).toHaveBeenCalledWith('/clubs/1/events/1/feedback/surveys/survey-1/responses');
      expect(result).toEqual(responses);
    });

    it('should submit feedback response', async () => {
      const surveyId = 'survey-1';
      const responseData = { answers: [], memberId: 1 };
      const submittedResponse = { id: '1', ...responseData, surveyId };
      mockApiClient.post.mockResolvedValue({ data: submittedResponse });

      const result = await eventService.submitFeedbackResponse(clubId, eventId, surveyId, responseData as any);

      expect(mockApiClient.post).toHaveBeenCalledWith('/clubs/1/events/1/feedback/surveys/survey-1/responses', responseData);
      expect(result).toEqual(submittedResponse);
    });

    it('should get feedback analytics', async () => {
      const surveyId = 'survey-1';
      const analytics = { totalResponses: 10, averageRating: 4.5 };
      mockApiClient.get.mockResolvedValue({ data: analytics });

      const result = await eventService.getFeedbackAnalytics(clubId, eventId, surveyId);

      expect(mockApiClient.get).toHaveBeenCalledWith('/clubs/1/events/1/feedback/surveys/survey-1/analytics');
      expect(result).toEqual(analytics);
    });

    it('should export feedback data', async () => {
      const surveyId = 'survey-1';
      const format = 'csv';
      const blob = new Blob(['feedback data']);
      mockApiClient.get.mockResolvedValue({ data: blob });

      const result = await eventService.exportFeedbackData(clubId, eventId, surveyId, format);

      expect(mockApiClient.get).toHaveBeenCalledWith('/clubs/1/events/1/feedback/surveys/survey-1/export?format=csv', {
        responseType: 'blob',
      });
      expect(result).toEqual(blob);
    });

    it('should send feedback invitations', async () => {
      const surveyId = 'survey-1';
      const invitationData = { memberIds: [1, 2, 3], message: 'Please provide feedback' };
      const invitationResult = { sent: 3, failed: 0 };
      mockApiClient.post.mockResolvedValue({ data: invitationResult });

      const result = await eventService.sendFeedbackInvitations(clubId, eventId, surveyId, invitationData as any);

      expect(mockApiClient.post).toHaveBeenCalledWith('/clubs/1/events/1/feedback/surveys/survey-1/invitations', invitationData);
      expect(result).toEqual(invitationResult);
    });

    it('should get feedback templates', async () => {
      const templates = [{ id: '1', name: 'Event Feedback', questions: [] }];
      mockApiClient.get.mockResolvedValue({ data: templates });

      const result = await eventService.getFeedbackTemplates(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith('/clubs/1/feedback/templates');
      expect(result).toEqual(templates);
    });
  });

  // ================== LEGACY QR CODE METHODS ==================
  describe('Legacy QR Code Methods', () => {
    it('should get event QR codes', async () => {
      const qrCodes = [{ id: 'qr-1', eventId: 1, url: 'https://example.com/qr' }];
      mockApiClient.get.mockResolvedValue({ data: qrCodes });

      const result = await eventService.getEventQRCodes(eventId);

      expect(mockApiClient.get).toHaveBeenCalledWith('/events/1/qr-codes');
      expect(result).toEqual(qrCodes);
    });

    it('should generate event QR code', async () => {
      const request = { type: 'check-in', style: 'default' };
      const qrCode = { id: 'qr-1', eventId: 1, url: 'https://example.com/qr' };
      mockApiClient.post.mockResolvedValue({ data: qrCode });

      const result = await eventService.generateEventQRCode(eventId, request as any);

      expect(mockApiClient.post).toHaveBeenCalledWith('/events/1/qr-codes', request);
      expect(result).toEqual(qrCode);
    });

    it('should download QR code', async () => {
      const qrCodeId = 'qr-1';
      const format = 'png';
      const blob = new Blob(['qr code image']);
      mockApiClient.get.mockResolvedValue({ data: blob });

      const result = await eventService.downloadQRCode(qrCodeId, format);

      expect(mockApiClient.get).toHaveBeenCalledWith('/qr-codes/qr-1/download?format=png', {
        responseType: 'blob',
      });
      expect(result).toEqual(blob);
    });

    it('should get QR code share URL', async () => {
      const qrCodeId = 'qr-1';
      const shareUrl = 'https://example.com/share/qr-1';
      mockApiClient.get.mockResolvedValue({ data: { url: shareUrl } });

      const result = await eventService.getQRCodeShareUrl(qrCodeId);

      expect(mockApiClient.get).toHaveBeenCalledWith('/qr-codes/qr-1/share-url');
      expect(result).toBe(shareUrl);
    });

    it('should update QR code status', async () => {
      const qrCodeId = 'qr-1';
      const isActive = false;
      const updatedQR = { id: qrCodeId, isActive };
      mockApiClient.put.mockResolvedValue({ data: updatedQR });

      const result = await eventService.updateQRCodeStatus(qrCodeId, isActive);

      expect(mockApiClient.put).toHaveBeenCalledWith('/qr-codes/qr-1/status', { isActive });
      expect(result).toEqual(updatedQR);
    });

    it('should delete QR code', async () => {
      const qrCodeId = 'qr-1';
      mockApiClient.delete.mockResolvedValue({ data: undefined });

      await eventService.deleteQRCode(qrCodeId);

      expect(mockApiClient.delete).toHaveBeenCalledWith('/qr-codes/qr-1');
    });

    it('should bulk download QR codes', async () => {
      const qrCodeIds = ['qr-1', 'qr-2', 'qr-3'];
      const blob = new Blob(['bulk qr codes']);
      mockApiClient.post.mockResolvedValue({ data: blob });

      const result = await eventService.bulkDownloadQRCodes(qrCodeIds);

      expect(mockApiClient.post).toHaveBeenCalledWith('/qr-codes/bulk-download', { qrCodeIds }, {
        responseType: 'blob',
      });
      expect(result).toEqual(blob);
    });

    it('should validate QR check-in', async () => {
      const qrData = 'encrypted-qr-data';
      const validationResult = { valid: true, message: 'Check-in successful', attendee: { id: 1, name: 'John' } };
      mockApiClient.post.mockResolvedValue({ data: validationResult });

      const result = await eventService.validateQRCheckIn(eventId, qrData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/events/1/qr-validate', { qrData });
      expect(result).toEqual(validationResult);
    });

    it('should process QR action', async () => {
      const action = 'redeem-voucher';
      const data = { voucherId: 'v-123' };
      const actionResult = { success: true, message: 'Voucher redeemed', result: { points: 10 } };
      mockApiClient.post.mockResolvedValue({ data: actionResult });

      const result = await eventService.processQRAction(eventId, action, data);

      expect(mockApiClient.post).toHaveBeenCalledWith('/events/1/qr-action', { action, data });
      expect(result).toEqual(actionResult);
    });
  });

  // ================== PAYMENT METHODS ==================
  describe('Payment Methods', () => {
    it('should generate payment link', async () => {
      const paymentLink = { url: 'https://pay.example.com/event-1', token: 'pay-token' };
      mockApiClient.post.mockResolvedValue({ data: paymentLink });

      const result = await eventService.generatePaymentLink(clubId, eventId);

      expect(mockApiClient.post).toHaveBeenCalledWith('/clubs/1/events/1/payment-link');
      expect(result).toEqual(paymentLink);
    });

    it('should get public event by token', async () => {
      const token = 'public-token';
      const publicEvent = { id: 1, name: 'Public Event', price: 25 };
      mockApiClient.get.mockResolvedValue({ data: publicEvent });

      const result = await eventService.getPublicEventByToken(token);

      expect(mockApiClient.get).toHaveBeenCalledWith('/events/public/public-token');
      expect(result).toEqual(publicEvent);
    });

    it('should pay for event (member)', async () => {
      const request = { eventId: 1, paymentMethodId: 'pm_123' };
      const paymentResponse = { success: true, paymentId: 'payment-123' };
      mockApiClient.post.mockResolvedValue({ data: paymentResponse });

      const result = await eventService.payForEvent(request as any);

      expect(mockApiClient.post).toHaveBeenCalledWith('/users/me/events/pay', request);
      expect(result).toEqual(paymentResponse);
    });

    it('should pay for event as guest', async () => {
      const request = {
        eventId: 1,
        email: 'guest@example.com',
        name: 'Guest User',
        paymentMethodId: 'pm_123',
      };
      const paymentResponse = { success: true, accountCreated: false };
      mockApiClient.post.mockResolvedValue({ data: paymentResponse });

      const result = await eventService.payForEventAsGuest(request as any);

      expect(mockApiClient.post).toHaveBeenCalledWith('/public/events/pay', request);
      expect(result).toEqual(paymentResponse);
    });

    it('should get available membership types', async () => {
      const membershipTypes = [
        { id: 1, name: 'Standard', price: 50 },
        { id: 2, name: 'Premium', price: 100 },
      ];
      mockApiClient.get.mockResolvedValue({ data: membershipTypes });

      const result = await eventService.getAvailableMembershipTypes(eventId);

      expect(mockApiClient.get).toHaveBeenCalledWith('/public/events/1/membership-types');
      expect(result).toEqual(membershipTypes);
    });
  });

  // ================== ANALYTICS METHODS (FIXED) ==================
  describe('Analytics Methods', () => {
    it('should export analytics report', async () => {
      const options = { format: 'pdf', metrics: ['attendance', 'revenue'] };
      const blob = new Blob(['analytics report']);
      mockApiClient.post.mockResolvedValue({ data: blob });

      const result = await eventService.exportAnalyticsReport(clubId, options as any);

      expect(mockApiClient.post).toHaveBeenCalledWith('/clubs/1/analytics/export', options, {
        responseType: 'blob',
      });
      expect(result).toEqual(blob);
    });

    it('should get event metrics without options', async () => {
      const metrics = { totalEvents: 10, totalAttendees: 100 };
      mockApiClient.get.mockResolvedValue({ data: metrics });

      const result = await eventService.getEventMetrics(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/clubs/1/analytics/metrics?'));
      expect(result).toEqual(metrics);
    });

    it('should get event metrics with options', async () => {
      const metrics = { totalEvents: 5, totalAttendees: 50 };
      mockApiClient.get.mockResolvedValue({ data: metrics });

      await eventService.getEventMetrics(clubId, { timeRange: '30d', eventId: 5 });

      expect(mockApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/clubs/1/analytics/metrics?'));
      expect(mockApiClient.get).toHaveBeenCalledWith(expect.stringContaining('timeRange=30d'));
      expect(mockApiClient.get).toHaveBeenCalledWith(expect.stringContaining('eventId=5'));
    });

    it('should get event analytics', async () => {
      const analytics = { engagement: 85, satisfaction: 4.5 };
      mockApiClient.get.mockResolvedValue({ data: analytics });

      const result = await eventService.getEventAnalytics(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/clubs/1/analytics/events?'));
      expect(result).toEqual(analytics);
    });

    it('should get comparative analysis', async () => {
      const comparison = { thisMonth: 100, lastMonth: 80 };
      mockApiClient.get.mockResolvedValue({ data: comparison });

      const result = await eventService.getComparativeAnalysis(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/clubs/1/analytics/comparison?'));
      expect(result).toEqual(comparison);
    });

    it('should get predictive insights', async () => {
      const insights = { predictedAttendance: 120, confidence: 0.85 };
      mockApiClient.get.mockResolvedValue({ data: insights });

      const result = await eventService.getPredictiveInsights(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/clubs/1/analytics/insights?'));
      expect(result).toEqual(insights);
    });

    it('should get performance benchmarks', async () => {
      const benchmarks = { industry: 75, peers: 80, yours: 85 };
      mockApiClient.get.mockResolvedValue({ data: benchmarks });

      const result = await eventService.getPerformanceBenchmarks(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/clubs/1/analytics/benchmarks?'));
      expect(result).toEqual(benchmarks);
    });
  });

  // ================== WAITLIST METHODS (FIXED) ==================
  describe('Waitlist Methods', () => {
    it('should reorder waitlist', async () => {
      const reorderData = [{ entryId: 1, newPosition: 2 }];
      mockApiClient.put.mockResolvedValue({ data: undefined });

      await eventService.reorderWaitlist(clubId, eventId, reorderData as any);

      expect(mockApiClient.put).toHaveBeenCalledWith('/clubs/1/events/1/waitlist/reorder', { entries: reorderData });
    });
  });
});
