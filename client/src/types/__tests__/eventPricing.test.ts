import { Event, CreateEventRequest, UpdateEventRequest, EventResponse } from '../event';

describe('Event Pricing Types', () => {
  describe('Event Interface', () => {
    it('should allow member price to be set', () => {
      const event: Event = {
        id: 1,
        clubId: 1,
        name: 'Test Event',
        eventDateTime: '2024-12-01T10:00:00.000Z',
        location: 'Test Location',
        description: 'Test Description',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        memberPrice: 15.99,
        nonMemberPrice: 25.99,
        isFree: false
      };

      expect(event.memberPrice).toBe(15.99);
    });

    it('should allow non-member price to be set', () => {
      const event: Event = {
        id: 1,
        clubId: 1,
        name: 'Test Event',
        eventDateTime: '2024-12-01T10:00:00.000Z',
        location: 'Test Location',
        description: 'Test Description',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        memberPrice: 15.99,
        nonMemberPrice: 25.99,
        isFree: false
      };

      expect(event.nonMemberPrice).toBe(25.99);
    });

    it('should allow isFree to be set', () => {
      const event: Event = {
        id: 1,
        clubId: 1,
        name: 'Test Event',
        eventDateTime: '2024-12-01T10:00:00.000Z',
        location: 'Test Location',
        description: 'Test Description',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        memberPrice: null,
        nonMemberPrice: null,
        isFree: true
      };

      expect(event.isFree).toBe(true);
    });

    it('should allow pricing fields to be undefined/null', () => {
      const event: Event = {
        id: 1,
        clubId: 1,
        name: 'Test Event',
        eventDateTime: '2024-12-01T10:00:00.000Z',
        location: 'Test Location',
        description: 'Test Description',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        memberPrice: undefined,
        nonMemberPrice: undefined,
        isFree: false
      };

      expect(event.memberPrice).toBeUndefined();
      expect(event.nonMemberPrice).toBeUndefined();
      expect(event.isFree).toBe(false);
    });
  });

  describe('CreateEventRequest Interface', () => {
    it('should allow pricing fields in create request', () => {
      const request: CreateEventRequest = {
        name: 'Test Event',
        eventDateTime: '2024-12-01T10:00:00.000Z',
        location: 'Test Location',
        description: 'Test Description',
        memberPrice: 15.99,
        nonMemberPrice: 25.99,
        isFree: false
      };

      expect(request.memberPrice).toBe(15.99);
      expect(request.nonMemberPrice).toBe(25.99);
      expect(request.isFree).toBe(false);
    });

    it('should allow optional pricing fields in create request', () => {
      const request: CreateEventRequest = {
        name: 'Test Event',
        eventDateTime: '2024-12-01T10:00:00.000Z',
        location: 'Test Location',
        description: 'Test Description'
      };

      expect(request.memberPrice).toBeUndefined();
      expect(request.nonMemberPrice).toBeUndefined();
      expect(request.isFree).toBeUndefined();
    });

    it('should allow null pricing fields in create request', () => {
      const request: CreateEventRequest = {
        name: 'Test Event',
        eventDateTime: '2024-12-01T10:00:00.000Z',
        location: 'Test Location',
        description: 'Test Description',
        memberPrice: null,
        nonMemberPrice: null,
        isFree: true
      };

      expect(request.memberPrice).toBeNull();
      expect(request.nonMemberPrice).toBeNull();
      expect(request.isFree).toBe(true);
    });
  });

  describe('UpdateEventRequest Interface', () => {
    it('should allow pricing fields in update request', () => {
      const request: UpdateEventRequest = {
        name: 'Updated Event',
        eventDateTime: '2024-12-01T10:00:00.000Z',
        location: 'Updated Location',
        description: 'Updated Description',
        memberPrice: 20.00,
        nonMemberPrice: 30.00,
        isFree: false
      };

      expect(request.memberPrice).toBe(20.00);
      expect(request.nonMemberPrice).toBe(30.00);
      expect(request.isFree).toBe(false);
    });

    it('should allow pricing fields to be changed to null', () => {
      const request: UpdateEventRequest = {
        name: 'Updated Event',
        eventDateTime: '2024-12-01T10:00:00.000Z',
        location: 'Updated Location',
        description: 'Updated Description',
        memberPrice: null,
        nonMemberPrice: null,
        isFree: true
      };

      expect(request.memberPrice).toBeNull();
      expect(request.nonMemberPrice).toBeNull();
      expect(request.isFree).toBe(true);
    });
  });

  describe('EventResponse Interface', () => {
    it('should include pricing fields in response', () => {
      const response: EventResponse = {
        id: 1,
        clubId: 1,
        name: 'Test Event',
        eventDateTime: '2024-12-01T10:00:00.000Z',
        location: 'Test Location',
        description: 'Test Description',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        memberPrice: 15.99,
        nonMemberPrice: 25.99,
        isFree: false,
        attendeeCount: 0,
        totalRsvpCount: 0
      };

      expect(response.memberPrice).toBe(15.99);
      expect(response.nonMemberPrice).toBe(25.99);
      expect(response.isFree).toBe(false);
    });

    it('should allow null pricing fields in response', () => {
      const response: EventResponse = {
        id: 1,
        clubId: 1,
        name: 'Test Event',
        eventDateTime: '2024-12-01T10:00:00.000Z',
        location: 'Test Location',
        description: 'Test Description',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        memberPrice: null,
        nonMemberPrice: null,
        isFree: true,
        attendeeCount: 0,
        totalRsvpCount: 0
      };

      expect(response.memberPrice).toBeNull();
      expect(response.nonMemberPrice).toBeNull();
      expect(response.isFree).toBe(true);
    });
  });

  describe('Type Compatibility', () => {
    it('should allow number values for pricing fields', () => {
      const memberPrice: number = 15.99;
      const nonMemberPrice: number = 25.99;

      const event: Event = {
        id: 1,
        clubId: 1,
        name: 'Test Event',
        eventDateTime: '2024-12-01T10:00:00.000Z',
        location: 'Test Location',
        description: 'Test Description',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        memberPrice,
        nonMemberPrice,
        isFree: false
      };

      expect(typeof event.memberPrice).toBe('number');
      expect(typeof event.nonMemberPrice).toBe('number');
    });

    it('should allow null values for pricing fields', () => {
      const memberPrice: null = null;
      const nonMemberPrice: null = null;

      const event: Event = {
        id: 1,
        clubId: 1,
        name: 'Test Event',
        eventDateTime: '2024-12-01T10:00:00.000Z',
        location: 'Test Location',
        description: 'Test Description',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        memberPrice,
        nonMemberPrice,
        isFree: true
      };

      expect(event.memberPrice).toBeNull();
      expect(event.nonMemberPrice).toBeNull();
    });

    it('should allow boolean values for isFree field', () => {
      const isFree: boolean = true;

      const event: Event = {
        id: 1,
        clubId: 1,
        name: 'Test Event',
        eventDateTime: '2024-12-01T10:00:00.000Z',
        location: 'Test Location',
        description: 'Test Description',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        memberPrice: null,
        nonMemberPrice: null,
        isFree
      };

      expect(typeof event.isFree).toBe('boolean');
      expect(event.isFree).toBe(true);
    });
  });
});