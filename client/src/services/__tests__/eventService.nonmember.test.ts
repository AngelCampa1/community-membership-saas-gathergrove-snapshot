import { eventService } from '../eventService';
import apiClient from '../apiClient';
import { NonMemberEventPaymentRequest, NonMemberEventPaymentResponse, MembershipTypeOption } from '@/types/event';

jest.mock('../apiClient');

describe('EventService - Non-Member Payment', () => {
  const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('payForEventAsGuest', () => {
    it('should successfully process guest payment without membership', async () => {
      // Arrange
      const request: NonMemberEventPaymentRequest = {
        eventId: 1,
        paymentMethodId: 'pm_test123',
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        guestPhone: '555-1234',
        createAccount: false,
      };

      const expectedResponse: NonMemberEventPaymentResponse = {
        success: true,
        paymentId: 'pi_test123',
        rsvpId: 1,
        confirmationNumber: 'CONF123',
        eventAmount: 50,
        totalAmount: 50,
        membershipCreated: false,
        accountCreated: false,
        eventName: 'Test Event',
        eventDateTime: '2025-01-15T19:00:00Z',
        eventLocation: 'Test Location',
        clubName: 'Test Club',
      };

      mockedApiClient.post.mockResolvedValue({ data: expectedResponse });

      // Act
      const result = await eventService.payForEventAsGuest(request);

      // Assert
      expect(mockedApiClient.post).toHaveBeenCalledWith('/public/events/pay', request);
      expect(result).toEqual(expectedResponse);
      expect(result.success).toBe(true);
      expect(result.membershipCreated).toBe(false);
      expect(result.accountCreated).toBe(false);
    });

    it('should successfully process guest payment with membership upgrade', async () => {
      // Arrange
      const request: NonMemberEventPaymentRequest = {
        eventId: 1,
        paymentMethodId: 'pm_test123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        membershipTypeId: 1,
        createAccount: false,
      };

      const expectedResponse: NonMemberEventPaymentResponse = {
        success: true,
        paymentId: 'pi_test456',
        rsvpId: 2,
        confirmationNumber: 'CONF456',
        eventAmount: 50,
        membershipAmount: 100,
        totalAmount: 150,
        membershipCreated: true,
        accountCreated: false,
        memberId: 1,
        eventName: 'Test Event',
        eventDateTime: '2025-01-15T19:00:00Z',
        eventLocation: 'Test Location',
        clubName: 'Test Club',
      };

      mockedApiClient.post.mockResolvedValue({ data: expectedResponse });

      // Act
      const result = await eventService.payForEventAsGuest(request);

      // Assert
      expect(result.membershipCreated).toBe(true);
      expect(result.membershipAmount).toBe(100);
      expect(result.totalAmount).toBe(150);
      expect(result.memberId).toBe(1);
    });

    it('should successfully process guest payment with account creation', async () => {
      // Arrange
      const request: NonMemberEventPaymentRequest = {
        eventId: 1,
        paymentMethodId: 'pm_test123',
        guestName: 'Bob Johnson',
        guestEmail: 'bob@example.com',
        createAccount: true,
        password: 'SecurePass123!',
      };

      const expectedResponse: NonMemberEventPaymentResponse = {
        success: true,
        paymentId: 'pi_test789',
        rsvpId: 3,
        confirmationNumber: 'CONF789',
        eventAmount: 50,
        totalAmount: 50,
        membershipCreated: false,
        accountCreated: true,
        memberId: 2,
        eventName: 'Test Event',
        eventDateTime: '2025-01-15T19:00:00Z',
        eventLocation: 'Test Location',
        clubName: 'Test Club',
      };

      mockedApiClient.post.mockResolvedValue({ data: expectedResponse });

      // Act
      const result = await eventService.payForEventAsGuest(request);

      // Assert
      expect(result.accountCreated).toBe(true);
      expect(result.memberId).toBe(2);
    });

    it('should process payment with all options (membership + account)', async () => {
      // Arrange
      const request: NonMemberEventPaymentRequest = {
        eventId: 1,
        paymentMethodId: 'pm_test123',
        guestName: 'Alice Williams',
        guestEmail: 'alice@example.com',
        membershipTypeId: 1,
        createAccount: true,
        password: 'SecurePass123!',
      };

      const expectedResponse: NonMemberEventPaymentResponse = {
        success: true,
        paymentId: 'pi_test999',
        rsvpId: 4,
        confirmationNumber: 'CONF999',
        eventAmount: 50,
        membershipAmount: 100,
        totalAmount: 150,
        membershipCreated: true,
        accountCreated: true,
        memberId: 3,
        eventName: 'Test Event',
        eventDateTime: '2025-01-15T19:00:00Z',
        eventLocation: 'Test Location',
        clubName: 'Test Club',
      };

      mockedApiClient.post.mockResolvedValue({ data: expectedResponse });

      // Act
      const result = await eventService.payForEventAsGuest(request);

      // Assert
      expect(result.membershipCreated).toBe(true);
      expect(result.accountCreated).toBe(true);
      expect(result.totalAmount).toBe(150);
    });

    it('should handle 400 Bad Request error', async () => {
      // Arrange
      const request: NonMemberEventPaymentRequest = {
        eventId: 1,
        paymentMethodId: 'pm_test123',
        guestName: '',
        guestEmail: 'john@example.com',
        createAccount: false,
      };

      const error = {
        response: {
          status: 400,
          data: { message: 'Guest name is required' },
        },
      };

      mockedApiClient.post.mockRejectedValue(error);

      // Act & Assert
      await expect(eventService.payForEventAsGuest(request)).rejects.toThrow();
    });

    it('should handle 402 Payment Required error', async () => {
      // Arrange
      const request: NonMemberEventPaymentRequest = {
        eventId: 1,
        paymentMethodId: 'pm_test123',
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        createAccount: false,
      };

      const error = {
        response: {
          status: 402,
          data: { message: 'Payment failed: Your card was declined' },
        },
      };

      mockedApiClient.post.mockRejectedValue(error);

      // Act & Assert
      await expect(eventService.payForEventAsGuest(request)).rejects.toThrow();
    });

    it('should handle 404 Not Found error', async () => {
      // Arrange
      const request: NonMemberEventPaymentRequest = {
        eventId: 999,
        paymentMethodId: 'pm_test123',
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        createAccount: false,
      };

      const error = {
        response: {
          status: 404,
          data: { message: 'Event not found' },
        },
      };

      mockedApiClient.post.mockRejectedValue(error);

      // Act & Assert
      await expect(eventService.payForEventAsGuest(request)).rejects.toThrow();
    });

    it('should handle 409 Conflict error (duplicate registration)', async () => {
      // Arrange
      const request: NonMemberEventPaymentRequest = {
        eventId: 1,
        paymentMethodId: 'pm_test123',
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        createAccount: false,
      };

      const error = {
        response: {
          status: 409,
          data: { message: 'You have already registered for this event' },
        },
      };

      mockedApiClient.post.mockRejectedValue(error);

      // Act & Assert
      await expect(eventService.payForEventAsGuest(request)).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      // Arrange
      const request: NonMemberEventPaymentRequest = {
        eventId: 1,
        paymentMethodId: 'pm_test123',
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        createAccount: false,
      };

      const error = {
        message: 'Network Error',
      };

      mockedApiClient.post.mockRejectedValue(error);

      // Act & Assert
      await expect(eventService.payForEventAsGuest(request)).rejects.toThrow();
    });

    it('should include all request fields when calling API', async () => {
      // Arrange
      const request: NonMemberEventPaymentRequest = {
        eventId: 1,
        paymentMethodId: 'pm_test123',
        guestName: 'Complete Test',
        guestEmail: 'complete@example.com',
        guestPhone: '555-9999',
        membershipTypeId: 2,
        createAccount: true,
        password: 'CompletePass123!',
      };

      const response: NonMemberEventPaymentResponse = {
        success: true,
        paymentId: 'pi_complete',
        rsvpId: 5,
        confirmationNumber: 'CONF_COMPLETE',
        eventAmount: 75,
        membershipAmount: 150,
        totalAmount: 225,
        membershipCreated: true,
        accountCreated: true,
        memberId: 4,
        eventName: 'Complete Event',
        eventDateTime: '2025-02-01T19:00:00Z',
        eventLocation: 'Complete Location',
        clubName: 'Complete Club',
      };

      mockedApiClient.post.mockResolvedValue({ data: response });

      // Act
      await eventService.payForEventAsGuest(request);

      // Assert
      expect(mockedApiClient.post).toHaveBeenCalledWith('/public/events/pay', {
        eventId: 1,
        paymentMethodId: 'pm_test123',
        guestName: 'Complete Test',
        guestEmail: 'complete@example.com',
        guestPhone: '555-9999',
        membershipTypeId: 2,
        createAccount: true,
        password: 'CompletePass123!',
      });
    });
  });

  describe('getAvailableMembershipTypes', () => {
    it('should successfully fetch membership types', async () => {
      // Arrange
      const eventId = 1;
      const expectedTypes: MembershipTypeOption[] = [
        {
          id: 1,
          name: 'Individual',
          description: 'Individual membership',
          duesAmount: 100,
          duesFrequency: 'Annual',
          clubId: 1,
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          memberCount: 10,
        },
        {
          id: 2,
          name: 'Family',
          description: 'Family membership',
          duesAmount: 150,
          duesFrequency: 'Annual',
          clubId: 1,
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          memberCount: 5,
        },
      ];

      mockedApiClient.get.mockResolvedValue({ data: expectedTypes });

      // Act
      const result = await eventService.getAvailableMembershipTypes(eventId);

      // Assert
      expect(mockedApiClient.get).toHaveBeenCalledWith(`/public/events/${eventId}/membership-types`);
      expect(result).toEqual(expectedTypes);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Individual');
      expect(result[1].name).toBe('Family');
    });

    it('should return empty array when no membership types available', async () => {
      // Arrange
      const eventId = 1;
      mockedApiClient.get.mockResolvedValue({ data: [] });

      // Act
      const result = await eventService.getAvailableMembershipTypes(eventId);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle 404 Not Found error', async () => {
      // Arrange
      const eventId = 999;
      const error = {
        response: {
          status: 404,
          data: { message: 'Event not found' },
        },
      };

      mockedApiClient.get.mockRejectedValue(error);

      // Act & Assert
      await expect(eventService.getAvailableMembershipTypes(eventId)).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      // Arrange
      const eventId = 1;
      const error = {
        message: 'Network Error',
      };

      mockedApiClient.get.mockRejectedValue(error);

      // Act & Assert
      await expect(eventService.getAvailableMembershipTypes(eventId)).rejects.toThrow();
    });

    it('should include all membership type fields', async () => {
      // Arrange
      const eventId = 1;
      const expectedTypes: MembershipTypeOption[] = [
        {
          id: 1,
          name: 'Premium',
          description: 'Premium membership with all benefits',
          duesAmount: 200,
          duesFrequency: 'Monthly',
          clubId: 1,
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-10T00:00:00Z',
          memberCount: 25,
        },
      ];

      mockedApiClient.get.mockResolvedValue({ data: expectedTypes });

      // Act
      const result = await eventService.getAvailableMembershipTypes(eventId);

      // Assert
      const type = result[0];
      expect(type.id).toBe(1);
      expect(type.name).toBe('Premium');
      expect(type.description).toBe('Premium membership with all benefits');
      expect(type.duesAmount).toBe(200);
      expect(type.duesFrequency).toBe('Monthly');
      expect(type.clubId).toBe(1);
      expect(type.isActive).toBe(true);
      expect(type.createdAt).toBe('2025-01-01T00:00:00Z');
      expect(type.updatedAt).toBe('2025-01-10T00:00:00Z');
      expect(type.memberCount).toBe(25);
    });
  });
});


