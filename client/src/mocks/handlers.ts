/**
 * MSW HTTP Handlers for API Mocking
 * These handlers mock at the HTTP boundary - the ONLY place mocking should occur.
 * All internal code (services, hooks, components) should use real implementations.
 */
import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:8050/api/v1';

// Default mock data
const mockMember = {
  id: 1,
  fullName: 'Test Member',
  email: 'test@example.com',
  status: 'Active',
  role: 'Member',
  createdAt: new Date().toISOString(),
};

const mockEvent = {
  id: 1,
  title: 'Test Event',
  description: 'Test event description',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 3600000).toISOString(),
  status: 'Active',
  location: 'Test Location',
  capacity: 100,
  registeredCount: 0,
};

const mockClub = {
  id: 1,
  name: 'Test Club',
  description: 'A test club',
  tier: 'premium',
  memberCount: 50,
};

/**
 * Default API handlers - use these in most tests.
 * Override specific handlers in individual tests when needed.
 */
export const handlers = [
  // Health check
  http.get(`${API_BASE}/health`, () => {
    return HttpResponse.json({
      Status: 'Healthy',
      Timestamp: new Date().toISOString(),
    });
  }),

  // Authentication
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    if (body.email === 'test@example.com' && body.password === 'password') {
      return HttpResponse.json({
        user: { id: 1, email: body.email, fullName: 'Test User' },
        token: 'mock-jwt-token',
      });
    }
    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    const body = await request.json() as { email: string; fullName: string };
    return HttpResponse.json({
      id: 1,
      email: body.email,
      fullName: body.fullName,
    }, { status: 201 });
  }),

  http.post(`${API_BASE}/auth/logout`, () => {
    return HttpResponse.json({ success: true });
  }),

  http.get(`${API_BASE}/auth/me`, () => {
    return HttpResponse.json({
      userId: 1,
      fullName: 'Test User',
      email: 'test@example.com',
      clubId: 1,
      clubName: 'Test Club',
      clubTier: 'Grow',
      role: 'Admin',
      isOnboardingCompleted: true,
      memberId: 1,
    });
  }),

  http.post(`${API_BASE}/auth/forgot-password`, () => {
    return HttpResponse.json({ success: true });
  }),

  http.post(`${API_BASE}/auth/reset-password`, () => {
    return HttpResponse.json({ message: 'Password reset successfully' });
  }),

  http.post(`${API_BASE}/auth/activate-member-account`, () => {
    return HttpResponse.json({ success: true, message: 'Account activated successfully' });
  }),

  http.post(`${API_BASE}/auth/resend-activation`, () => {
    return HttpResponse.json({ success: true, message: 'Activation email resent' });
  }),

  http.post(`${API_BASE}/auth/complete-onboarding`, () => {
    return HttpResponse.json({ success: true });
  }),

  http.get(`${API_BASE}/auth/validate-invite`, () => {
    return HttpResponse.json({
      isValid: true,
      email: 'test@example.com',
      clubName: 'Test Club',
      inviterName: 'Admin User',
    });
  }),

  http.post(`${API_BASE}/auth/accept-admin-invite`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Invitation accepted',
    });
  }),

  http.post(`${API_BASE}/auth/google`, () => {
    return HttpResponse.json({
      success: true,
      userId: 1,
      fullName: 'Google User',
      email: 'google@example.com',
      clubId: 1,
      role: 'Member',
      clubTier: 'Grow',
      isOnboardingCompleted: true,
      isNewUser: false,
      wasLinked: false,
    });
  }),

  http.post(`${API_BASE}/auth/apple`, () => {
    return HttpResponse.json({
      success: true,
      userId: 1,
      fullName: 'Apple User',
      email: 'apple@example.com',
      clubId: 1,
      role: 'Member',
      clubTier: 'Grow',
      isOnboardingCompleted: true,
      isNewUser: false,
      wasLinked: false,
    });
  }),

  http.get(`${API_BASE}/auth/linked-providers`, () => {
    return HttpResponse.json({
      hasPassword: true,
      googleLinked: false,
      appleLinked: false,
    });
  }),

  http.post(`${API_BASE}/auth/link-provider`, () => {
    return HttpResponse.json({ success: true });
  }),

  http.delete(`${API_BASE}/auth/unlink-provider/:provider`, () => {
    return HttpResponse.json({ success: true });
  }),

  http.post(`${API_BASE}/auth/set-password`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Members
  http.get(`${API_BASE}/members`, () => {
    return HttpResponse.json([mockMember]);
  }),

  http.get(`${API_BASE}/members/:id`, ({ params }) => {
    return HttpResponse.json({ ...mockMember, id: Number(params.id) });
  }),

  http.post(`${API_BASE}/members`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: Math.floor(Math.random() * 1000),
      ...body,
      createdAt: new Date().toISOString(),
    }, { status: 201 });
  }),

  http.put(`${API_BASE}/members/:id`, async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: Number(params.id),
      ...body,
      updatedAt: new Date().toISOString(),
    });
  }),

  http.delete(`${API_BASE}/members/:id`, () => {
    return HttpResponse.json({ message: 'Deleted successfully' });
  }),

  // Events
  http.get(`${API_BASE}/events`, () => {
    return HttpResponse.json([mockEvent]);
  }),

  http.get(`${API_BASE}/events/:id`, ({ params }) => {
    return HttpResponse.json({ ...mockEvent, id: Number(params.id) });
  }),

  http.post(`${API_BASE}/events`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: Math.floor(Math.random() * 1000),
      ...body,
      createdAt: new Date().toISOString(),
    }, { status: 201 });
  }),

  http.put(`${API_BASE}/events/:id`, async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: Number(params.id),
      ...body,
      updatedAt: new Date().toISOString(),
    });
  }),

  http.delete(`${API_BASE}/events/:id`, () => {
    return HttpResponse.json({ message: 'Deleted successfully' });
  }),

  // Event RSVPs
  http.post(`${API_BASE}/events/:id/rsvp`, () => {
    return HttpResponse.json({ success: true, status: 'confirmed' });
  }),

  http.delete(`${API_BASE}/events/:id/rsvp`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Clubs
  http.get(`${API_BASE}/clubs`, () => {
    return HttpResponse.json([mockClub]);
  }),

  http.get(`${API_BASE}/clubs/:id`, ({ params }) => {
    return HttpResponse.json({ ...mockClub, id: Number(params.id) });
  }),

  // Analytics
  http.get(`${API_BASE}/analytics/dashboard`, () => {
    return HttpResponse.json({
      totalMembers: 100,
      activeMembers: 85,
      totalEvents: 25,
      upcomingEvents: 5,
      engagementRate: 0.75,
    });
  }),

  http.get(`${API_BASE}/analytics/engagement`, () => {
    return HttpResponse.json({
      metrics: {
        eventAttendance: 0.8,
        emailOpenRate: 0.45,
        memberRetention: 0.92,
      },
    });
  }),

  // Payments
  http.post(`${API_BASE}/payments/create-intent`, () => {
    return HttpResponse.json({
      clientSecret: 'pi_test_secret',
      paymentIntentId: 'pi_test_123',
    });
  }),

  http.get(`${API_BASE}/payments/history`, () => {
    return HttpResponse.json([]);
  }),

  // Communications
  http.get(`${API_BASE}/communications/templates`, () => {
    return HttpResponse.json([
      { id: 1, name: 'Welcome Email', subject: 'Welcome!', type: 'email' },
    ]);
  }),

  http.post(`${API_BASE}/communications/send`, () => {
    return HttpResponse.json({ success: true, messageId: 'msg_123' });
  }),

  // Custom fields
  http.get(`${API_BASE}/custom-fields`, () => {
    return HttpResponse.json([]);
  }),

  http.post(`${API_BASE}/custom-fields`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: Math.floor(Math.random() * 1000),
      ...body,
    }, { status: 201 });
  }),

  // Dashboard
  http.get(`${API_BASE}/clubs/:clubId/dashboard/summary`, () => {
    return HttpResponse.json({
      currentTier: 'Grow',
      memberCount: 25,
      memberLimit: 200,
      duesCollectedYTD: 1250.00,
      upcomingEventCount: 3,
    });
  }),

  // Billing
  http.get(`${API_BASE}/billing/status`, () => {
    return HttpResponse.json({
      currentTier: 'Grow',
      hasActiveSubscription: false,
      memberCount: 25,
      memberLimit: 200,
      canUpgrade: true
    });
  }),

  // User Events (member-facing)
  http.get(`${API_BASE}/users/me/events`, () => {
    return HttpResponse.json([mockEvent]);
  }),

  http.post(`${API_BASE}/users/me/events/pay`, async ({ request }) => {
    const body = await request.json() as { eventId: number; paymentMethodId: string };
    return HttpResponse.json({
      success: true,
      paymentId: 'pi_test_456',
      rsvpId: 10,
      confirmationNumber: 'CONF-ABC123',
      amountPaid: 25.00,
      eventName: 'Test Event',
      eventDateTime: new Date().toISOString(),
      eventLocation: 'Test Location',
      clubName: 'Test Club',
    });
  }),

  http.get(`${API_BASE}/users/me/events/:eventId/payment-status`, ({ params }) => {
    return HttpResponse.json({
      eventId: Number(params.eventId),
      isPaid: true,
      paymentId: 'pi_test_456',
      amountPaid: 25.00,
      paidAt: new Date().toISOString(),
    });
  }),

  // Event Payment Links
  http.get(`${API_BASE}/events/:eventId/payment-link`, ({ params }) => {
    return HttpResponse.json({
      eventId: Number(params.eventId),
      paymentLinkUrl: 'https://pay.stripe.com/test_link',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
  }),

  http.post(`${API_BASE}/events/:eventId/payment-link`, () => {
    return HttpResponse.json({
      paymentLinkUrl: 'https://pay.stripe.com/test_link',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
  }),

  // Event Payments Admin
  http.get(`${API_BASE}/clubs/:clubId/events/:eventId/payments`, () => {
    return HttpResponse.json({
      payments: [],
      totalCollected: 0,
      totalExpected: 0,
    });
  }),

  http.post(`${API_BASE}/clubs/:clubId/events/:eventId/payments/:paymentId/refund`, () => {
    return HttpResponse.json({
      success: true,
      refundId: 'rf_test_123',
      amount: 25.00,
    });
  }),

  // Member Segments
  http.get(`${API_BASE}/clubs/:clubId/segments`, () => {
    return HttpResponse.json([
      { id: 1, name: 'Active Members', memberCount: 50, criteria: {} },
      { id: 2, name: 'Lapsed Members', memberCount: 10, criteria: {} },
    ]);
  }),

  http.post(`${API_BASE}/clubs/:clubId/segments`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: Math.floor(Math.random() * 1000),
      ...body,
      memberCount: 0,
    }, { status: 201 });
  }),

  http.get(`${API_BASE}/clubs/:clubId/segments/:segmentId`, ({ params }) => {
    return HttpResponse.json({
      id: Number(params.segmentId),
      name: 'Test Segment',
      memberCount: 25,
      criteria: {},
    });
  }),

  http.put(`${API_BASE}/clubs/:clubId/segments/:segmentId`, async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: Number(params.segmentId),
      ...body,
    });
  }),

  http.delete(`${API_BASE}/clubs/:clubId/segments/:segmentId`, () => {
    return HttpResponse.json({ success: true });
  }),

  http.get(`${API_BASE}/clubs/:clubId/segments/:segmentId/members`, () => {
    return HttpResponse.json({
      members: [mockMember],
      totalCount: 1,
    });
  }),

  http.post(`${API_BASE}/clubs/:clubId/segments/preview`, async ({ request }) => {
    return HttpResponse.json({
      memberCount: 15,
      sampleMembers: [mockMember],
    });
  }),

  // Bulk Operations
  http.post(`${API_BASE}/clubs/:clubId/members/bulk/update`, async ({ request }) => {
    const body = await request.json() as { memberIds: number[] };
    return HttpResponse.json({
      operationId: 'op_' + Math.random().toString(36).substr(2, 9),
      status: 'processing',
      totalCount: body.memberIds.length,
      processedCount: 0,
    });
  }),

  http.post(`${API_BASE}/clubs/:clubId/members/bulk/delete`, async ({ request }) => {
    const body = await request.json() as { memberIds: number[] };
    return HttpResponse.json({
      operationId: 'op_' + Math.random().toString(36).substr(2, 9),
      status: 'completed',
      deletedCount: body.memberIds.length,
    });
  }),

  http.post(`${API_BASE}/clubs/:clubId/members/bulk/tag`, async ({ request }) => {
    return HttpResponse.json({
      operationId: 'op_' + Math.random().toString(36).substr(2, 9),
      status: 'completed',
      taggedCount: 10,
    });
  }),

  http.post(`${API_BASE}/clubs/:clubId/members/bulk/export`, async ({ request }) => {
    return HttpResponse.json({
      operationId: 'op_' + Math.random().toString(36).substr(2, 9),
      status: 'processing',
      downloadUrl: null,
    });
  }),

  http.get(`${API_BASE}/clubs/:clubId/bulk-operations/:operationId`, ({ params }) => {
    return HttpResponse.json({
      operationId: params.operationId,
      status: 'completed',
      totalCount: 10,
      processedCount: 10,
      successCount: 10,
      errorCount: 0,
    });
  }),

  // Bulk Operations Validation and Generic Execution
  // Note: Service uses apiClient.post('/api/bulk-operations/validate'), which appends to baseURL
  http.post(`${API_BASE}/api/bulk-operations/validate`, async ({ request }) => {
    const body = await request.json() as { operationType: string; memberIds: string[]; config?: Record<string, unknown> };
    if (body.operationType === 'invalid') {
      return HttpResponse.json({
        isValid: false,
        warnings: [],
        errors: ['Invalid operation type'],
      });
    }
    return HttpResponse.json({
      isValid: true,
      warnings: body.memberIds.length > 100 ? ['Large batch may take longer'] : [],
    });
  }),

  http.post(`${API_BASE}/api/bulk-operations/execute`, async ({ request }) => {
    const body = await request.json() as { operationType: string; memberIds: string[]; config?: Record<string, unknown> };
    if (body.operationType === 'invalid') {
      return HttpResponse.json(
        { message: 'Invalid operation type' },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      operationId: `op_generic_${Date.now()}`,
      status: 'in_progress',
      progress: 0,
    });
  }),

  // Custom Fields (Club-specific)
  http.get(`${API_BASE}/clubs/:clubId/custom-fields`, () => {
    return HttpResponse.json([
      { id: 1, name: 'Company', type: 'text', required: false },
      { id: 2, name: 'Birthday', type: 'date', required: false },
    ]);
  }),

  http.post(`${API_BASE}/clubs/:clubId/custom-fields`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: Math.floor(Math.random() * 1000),
      ...body,
    }, { status: 201 });
  }),

  http.put(`${API_BASE}/clubs/:clubId/custom-fields/:fieldId`, async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: Number(params.fieldId),
      ...body,
    });
  }),

  http.delete(`${API_BASE}/clubs/:clubId/custom-fields/:fieldId`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Member Custom Field Values
  http.get(`${API_BASE}/clubs/:clubId/members/:memberId/custom-fields`, () => {
    return HttpResponse.json([
      { fieldId: 1, value: 'Acme Corp' },
      { fieldId: 2, value: '1990-01-15' },
    ]);
  }),

  http.put(`${API_BASE}/clubs/:clubId/members/:memberId/custom-fields`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body);
  }),

  // Reports & Analytics
  http.get(`${API_BASE}/clubs/:clubId/analytics/members`, () => {
    return HttpResponse.json({
      totalMembers: 100,
      activeMembers: 85,
      newMembersThisMonth: 5,
      churnRate: 0.02,
    });
  }),

  http.get(`${API_BASE}/clubs/:clubId/analytics/events`, () => {
    return HttpResponse.json({
      totalEvents: 25,
      averageAttendance: 35,
      totalRevenue: 2500.00,
    });
  }),

  http.get(`${API_BASE}/clubs/:clubId/analytics/engagement`, () => {
    return HttpResponse.json({
      emailOpenRate: 0.45,
      eventAttendanceRate: 0.65,
      memberRetentionRate: 0.92,
    });
  }),

  // Scheduled Reports
  http.get(`${API_BASE}/clubs/:clubId/reports/scheduled`, () => {
    return HttpResponse.json([]);
  }),

  http.post(`${API_BASE}/clubs/:clubId/reports/scheduled`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: Math.floor(Math.random() * 1000),
      ...body,
    }, { status: 201 });
  }),

  // Export
  http.post(`${API_BASE}/clubs/:clubId/export/members`, async ({ request }) => {
    return HttpResponse.json({
      exportId: 'exp_' + Math.random().toString(36).substr(2, 9),
      status: 'processing',
    });
  }),

  http.get(`${API_BASE}/clubs/:clubId/export/:exportId`, ({ params }) => {
    return HttpResponse.json({
      exportId: params.exportId,
      status: 'completed',
      downloadUrl: 'https://example.com/download/test.csv',
    });
  }),

  // Membership Types
  http.get(`${API_BASE}/clubs/:clubId/membership-types`, () => {
    return HttpResponse.json([
      { id: 1, name: 'Individual', price: 50.00, period: 'yearly' },
      { id: 2, name: 'Family', price: 100.00, period: 'yearly' },
    ]);
  }),

  http.post(`${API_BASE}/clubs/:clubId/membership-types`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: Math.floor(Math.random() * 1000),
      ...body,
    }, { status: 201 });
  }),

];

/**
 * Helper function to create error handlers for testing error scenarios
 */
export const createErrorHandler = (
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  path: string,
  status: number,
  message: string
) => {
  const httpMethod = http[method];
  return httpMethod(`${API_BASE}${path}`, () => {
    return HttpResponse.json({ message }, { status });
  });
};

/**
 * Helper function to create delay handlers for testing loading states
 */
export const createDelayedHandler = (
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  path: string,
  response: unknown,
  delayMs: number
) => {
  const httpMethod = http[method];
  return httpMethod(`${API_BASE}${path}`, async () => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return HttpResponse.json(response);
  });
};
