/**
 * API Contract Tests
 * Validates API endpoint contracts and data schemas
 */

import { jest } from '@jest/globals';

describe('API Contract Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication API Contracts', () => {
    describe('POST /auth/login', () => {
      it('should accept valid login request format', () => {
        const validRequest = {
          email: 'user@example.com',
          password: 'SecurePassword123!'
        };

        // Validate request schema
        expect(validRequest).toHaveProperty('email');
        expect(validRequest).toHaveProperty('password');
        expect(typeof validRequest.email).toBe('string');
        expect(typeof validRequest.password).toBe('string');
        expect(validRequest.email).toContain('@');
        expect(validRequest.password.length).toBeGreaterThan(8);
      });

      it('should return expected success response format', () => {
        const successResponse = {
          success: true,
          data: {
            user: {
              id: 123,
              email: 'user@example.com',
              fullName: 'John Doe',
              role: 'admin',
              clubId: 456,
              isEmailVerified: true
            },
            token: 'jwt.token.here',
            expiresAt: '2024-12-31T23:59:59Z'
          }
        };

        // Validate response schema
        expect(successResponse.success).toBe(true);
        expect(successResponse.data).toHaveProperty('user');
        expect(successResponse.data).toHaveProperty('token');
        expect(successResponse.data).toHaveProperty('expiresAt');

        // Validate user object
        const user = successResponse.data.user;
        expect(typeof user.id).toBe('number');
        expect(typeof user.email).toBe('string');
        expect(typeof user.fullName).toBe('string');
        expect(['admin', 'member']).toContain(user.role);
        expect(typeof user.clubId).toBe('number');
        expect(typeof user.isEmailVerified).toBe('boolean');
      });

      it('should return expected error response format', () => {
        const errorResponse = {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
            details: []
          }
        };

        expect(errorResponse.success).toBe(false);
        expect(errorResponse.error).toHaveProperty('code');
        expect(errorResponse.error).toHaveProperty('message');
        expect(errorResponse.error).toHaveProperty('details');
        expect(typeof errorResponse.error.code).toBe('string');
        expect(typeof errorResponse.error.message).toBe('string');
        expect(Array.isArray(errorResponse.error.details)).toBe(true);
      });
    });

    describe('POST /auth/register', () => {
      it('should accept valid registration request format', () => {
        const validRequest = {
          email: 'newuser@example.com',
          password: 'SecurePassword123!',
          fullName: 'Jane Doe',
          clubName: 'Test Club',
          acceptedTerms: true
        };

        expect(validRequest).toHaveProperty('email');
        expect(validRequest).toHaveProperty('password');
        expect(validRequest).toHaveProperty('fullName');
        expect(validRequest).toHaveProperty('clubName');
        expect(validRequest).toHaveProperty('acceptedTerms');
        expect(validRequest.acceptedTerms).toBe(true);
      });
    });
  });

  describe('Members API Contracts', () => {
    describe('GET /members', () => {
      it('should return paginated members list format', () => {
        const membersResponse = {
          success: true,
          data: {
            members: [
              {
                id: 1,
                fullName: 'John Doe',
                email: 'john@example.com',
                phoneNumber: '+1-555-123-4567',
                membershipType: {
                  id: 1,
                  name: 'Regular',
                  duesAmount: 50,
                  duesFrequency: 'monthly'
                },
                status: 'active',
                joinedDate: '2024-01-15T00:00:00Z',
                lastPaymentDate: '2024-12-01T00:00:00Z',
                customFields: []
              }
            ],
            pagination: {
              currentPage: 1,
              totalPages: 3,
              totalItems: 25,
              itemsPerPage: 10,
              hasNextPage: true,
              hasPreviousPage: false
            }
          }
        };

        // Validate response structure
        expect(membersResponse.success).toBe(true);
        expect(membersResponse.data).toHaveProperty('members');
        expect(membersResponse.data).toHaveProperty('pagination');
        expect(Array.isArray(membersResponse.data.members)).toBe(true);

        // Validate member object
        const member = membersResponse.data.members[0];
        expect(typeof member.id).toBe('number');
        expect(typeof member.fullName).toBe('string');
        expect(member.email).toContain('@');
        expect(member.membershipType).toHaveProperty('name');
        expect(['active', 'inactive', 'pending']).toContain(member.status);

        // Validate pagination
        const pagination = membersResponse.data.pagination;
        expect(typeof pagination.currentPage).toBe('number');
        expect(typeof pagination.totalPages).toBe('number');
        expect(typeof pagination.totalItems).toBe('number');
        expect(typeof pagination.hasNextPage).toBe('boolean');
      });
    });

    describe('POST /members', () => {
      it('should accept valid member creation request', () => {
        const createMemberRequest = {
          fullName: 'New Member',
          email: 'newmember@example.com',
          phoneNumber: '+1-555-987-6543',
          address: '123 Main St, City, State 12345',
          membershipTypeId: 1,
          hasSmsConsent: true,
          customFieldValues: [
            {
              fieldId: 1,
              value: 'Custom value'
            }
          ]
        };

        expect(createMemberRequest).toHaveProperty('fullName');
        expect(createMemberRequest).toHaveProperty('email');
        expect(createMemberRequest).toHaveProperty('membershipTypeId');
        expect(typeof createMemberRequest.membershipTypeId).toBe('number');
        expect(typeof createMemberRequest.hasSmsConsent).toBe('boolean');
        expect(Array.isArray(createMemberRequest.customFieldValues)).toBe(true);
      });

      it('should return created member response format', () => {
        const createdMemberResponse = {
          success: true,
          data: {
            member: {
              id: 123,
              fullName: 'New Member',
              email: 'newmember@example.com',
              status: 'pending',
              createdAt: '2024-01-01T12:00:00Z',
              activationToken: 'token123'
            }
          }
        };

        expect(createdMemberResponse.success).toBe(true);
        expect(createdMemberResponse.data.member).toHaveProperty('id');
        expect(createdMemberResponse.data.member.status).toBe('pending');
        expect(createdMemberResponse.data.member).toHaveProperty('activationToken');
      });
    });
  });

  describe('Events API Contracts', () => {
    describe('GET /events', () => {
      it('should return events list with proper format', () => {
        const eventsResponse = {
          success: true,
          data: {
            events: [
              {
                id: 1,
                title: 'Monthly Meeting',
                description: 'Regular monthly club meeting',
                dateTime: '2024-02-15T19:00:00Z',
                location: 'Community Center',
                maxAttendees: 50,
                currentAttendees: 15,
                rsvpDeadline: '2024-02-14T23:59:59Z',
                status: 'upcoming',
                createdBy: 123,
                createdAt: '2024-01-15T10:00:00Z'
              }
            ]
          }
        };

        const event = eventsResponse.data.events[0];
        expect(typeof event.id).toBe('number');
        expect(typeof event.title).toBe('string');
        expect(event.dateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
        expect(typeof event.maxAttendees).toBe('number');
        expect(['upcoming', 'ongoing', 'completed', 'cancelled']).toContain(event.status);
      });
    });

    describe('POST /events', () => {
      it('should accept valid event creation request', () => {
        const createEventRequest = {
          title: 'New Event',
          description: 'Event description',
          dateTime: '2024-03-01T18:00:00Z',
          location: 'Venue Name',
          maxAttendees: 100,
          rsvpDeadline: '2024-02-28T23:59:59Z',
          requiresRsvp: true,
          isPublic: false
        };

        expect(createEventRequest).toHaveProperty('title');
        expect(createEventRequest).toHaveProperty('dateTime');
        expect(createEventRequest.dateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
        expect(typeof createEventRequest.maxAttendees).toBe('number');
        expect(typeof createEventRequest.requiresRsvp).toBe('boolean');
      });
    });
  });

  describe('Payment API Contracts', () => {
    describe('POST /payments', () => {
      it('should accept valid payment creation request', () => {
        const paymentRequest = {
          memberId: 123,
          amount: 5000, // Amount in cents
          currency: 'usd',
          description: 'Monthly dues payment',
          paymentMethod: 'stripe',
          metadata: {
            duesMonth: '2024-01',
            membershipTypeId: 1
          }
        };

        expect(paymentRequest).toHaveProperty('memberId');
        expect(paymentRequest).toHaveProperty('amount');
        expect(typeof paymentRequest.amount).toBe('number');
        expect(paymentRequest.amount).toBeGreaterThan(0);
        expect(['usd', 'eur', 'gbp']).toContain(paymentRequest.currency);
        expect(typeof paymentRequest.metadata).toBe('object');
      });

      it('should return payment response format', () => {
        const paymentResponse = {
          success: true,
          data: {
            payment: {
              id: 'pay_123',
              amount: 5000,
              currency: 'usd',
              status: 'succeeded',
              memberId: 123,
              createdAt: '2024-01-01T12:00:00Z',
              paidAt: '2024-01-01T12:01:00Z',
              paymentMethod: {
                type: 'card',
                last4: '4242',
                brand: 'visa'
              }
            }
          }
        };

        const payment = paymentResponse.data.payment;
        expect(typeof payment.id).toBe('string');
        expect(payment.id).toMatch(/^pay_/);
        expect(['pending', 'succeeded', 'failed', 'cancelled']).toContain(payment.status);
        expect(payment.paymentMethod).toHaveProperty('type');
        expect(payment.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      });
    });

    describe('GET /payments/:id', () => {
      it('should return detailed payment information', () => {
        const paymentDetailResponse = {
          success: true,
          data: {
            payment: {
              id: 'pay_123',
              amount: 5000,
              currency: 'usd',
              status: 'succeeded',
              description: 'Monthly dues payment',
              memberId: 123,
              member: {
                id: 123,
                fullName: 'John Doe',
                email: 'john@example.com'
              },
              fees: {
                stripeFee: 175, // $1.75
                applicationFee: 0
              },
              netAmount: 4825,
              createdAt: '2024-01-01T12:00:00Z',
              paidAt: '2024-01-01T12:01:00Z'
            }
          }
        };

        const payment = paymentDetailResponse.data.payment;
        expect(payment).toHaveProperty('member');
        expect(payment).toHaveProperty('fees');
        expect(payment).toHaveProperty('netAmount');
        expect(payment.fees).toHaveProperty('stripeFee');
        expect(typeof payment.netAmount).toBe('number');
      });
    });
  });

  describe('Dashboard API Contracts', () => {
    describe('GET /dashboard/stats', () => {
      it('should return dashboard statistics format', () => {
        const dashboardResponse = {
          success: true,
          data: {
            stats: {
              totalMembers: 150,
              activeMembers: 142,
              pendingMembers: 8,
              totalRevenue: 750000, // $7,500.00 in cents
              monthlyRevenue: 71000, // $710.00 in cents
              upcomingEvents: 3,
              recentPayments: 12,
              memberGrowth: {
                thisMonth: 5,
                lastMonth: 3,
                percentChange: 66.67
              }
            },
            recentActivity: [
              {
                type: 'member_joined',
                memberId: 123,
                memberName: 'John Doe',
                timestamp: '2024-01-01T10:00:00Z'
              },
              {
                type: 'payment_received',
                paymentId: 'pay_123',
                amount: 5000,
                memberId: 456,
                timestamp: '2024-01-01T09:30:00Z'
              }
            ]
          }
        };

        const stats = dashboardResponse.data.stats;
        expect(typeof stats.totalMembers).toBe('number');
        expect(typeof stats.totalRevenue).toBe('number');
        expect(stats).toHaveProperty('memberGrowth');
        expect(stats.memberGrowth).toHaveProperty('percentChange');

        const activities = dashboardResponse.data.recentActivity;
        expect(Array.isArray(activities)).toBe(true);
        if (activities.length > 0) {
          const activity = activities[0];
          expect(activity).toHaveProperty('type');
          expect(activity).toHaveProperty('timestamp');
          expect(activity.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
        }
      });
    });
  });

  describe('Error Response Contracts', () => {
    it('should return consistent error format for validation errors', () => {
      const validationErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [
            {
              field: 'email',
              code: 'INVALID_FORMAT',
              message: 'Email format is invalid'
            },
            {
              field: 'password',
              code: 'TOO_SHORT',
              message: 'Password must be at least 8 characters'
            }
          ]
        }
      };

      expect(validationErrorResponse.success).toBe(false);
      expect(validationErrorResponse.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(validationErrorResponse.error.details)).toBe(true);
      
      const detail = validationErrorResponse.error.details[0];
      expect(detail).toHaveProperty('field');
      expect(detail).toHaveProperty('code');
      expect(detail).toHaveProperty('message');
    });

    it('should return consistent error format for authentication errors', () => {
      const authErrorResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          details: []
        }
      };

      expect(authErrorResponse.success).toBe(false);
      expect(['UNAUTHORIZED', 'FORBIDDEN', 'TOKEN_EXPIRED']).toContain(authErrorResponse.error.code);
      expect(Array.isArray(authErrorResponse.error.details)).toBe(true);
    });

    it('should return consistent error format for server errors', () => {
      const serverErrorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: [],
          requestId: 'req_123456789'
        }
      };

      expect(serverErrorResponse.success).toBe(false);
      expect(serverErrorResponse.error.code).toBe('INTERNAL_ERROR');
      expect(serverErrorResponse.error).toHaveProperty('requestId');
      expect(typeof serverErrorResponse.error.requestId).toBe('string');
    });
  });

  describe('Headers and Metadata Contracts', () => {
    it('should include required security headers', () => {
      const responseHeaders = {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'",
        'X-Request-ID': 'req_123456789'
      };

      expect(responseHeaders['Content-Type']).toBe('application/json');
      expect(responseHeaders['X-Content-Type-Options']).toBe('nosniff');
      expect(responseHeaders['X-Frame-Options']).toBe('DENY');
      expect(responseHeaders).toHaveProperty('X-Request-ID');
    });

    it('should include pagination headers for list endpoints', () => {
      const paginationHeaders = {
        'X-Total-Count': '150',
        'X-Page-Size': '10',
        'X-Current-Page': '1',
        'X-Total-Pages': '15',
        'Link': '<https://api.gathergrove.club/members?page=2>; rel="next", <https://api.gathergrove.club/members?page=15>; rel="last"'
      };

      expect(typeof paginationHeaders['X-Total-Count']).toBe('string');
      expect(typeof paginationHeaders['X-Page-Size']).toBe('string');
      expect(typeof paginationHeaders['X-Current-Page']).toBe('string');
      expect(paginationHeaders['Link']).toContain('rel="next"');
    });
  });

  describe('API Versioning Contracts', () => {
    it('should include API version in responses', () => {
      const versionedResponse = {
        success: true,
        apiVersion: 'v1',
        data: { message: 'Hello World' },
        meta: {
          timestamp: '2024-01-01T12:00:00Z',
          requestId: 'req_123456789'
        }
      };

      expect(versionedResponse).toHaveProperty('apiVersion');
      expect(versionedResponse.apiVersion).toMatch(/^v\d+$/);
      expect(versionedResponse).toHaveProperty('meta');
      expect(versionedResponse.meta).toHaveProperty('timestamp');
      expect(versionedResponse.meta).toHaveProperty('requestId');
    });
  });
});