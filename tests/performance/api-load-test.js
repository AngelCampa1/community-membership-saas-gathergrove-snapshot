// K6 Load Testing Script for GatherGrove API
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 10 }, // Sustained load
    { duration: '2m', target: 20 }, // Increase load
    { duration: '5m', target: 20 }, // Sustained higher load
    { duration: '2m', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    errors: ['rate<0.1'],             // Custom error rate below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://api-staging.gathergrove.com';

// Test data
const testUser = {
  email: 'loadtest@example.com',
  password: 'LoadTest123!'
};

export default function () {
  // Health Check
  let healthResponse = http.get(`${BASE_URL}/health`);
  check(healthResponse, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);

  sleep(1);

  // API Health Check
  let apiHealthResponse = http.get(`${BASE_URL}/api/health`);
  check(apiHealthResponse, {
    'API health check status is 200': (r) => r.status === 200,
    'API health check response time < 300ms': (r) => r.timings.duration < 300,
  }) || errorRate.add(1);

  sleep(1);

  // Authentication Test
  let authPayload = JSON.stringify({
    email: testUser.email,
    password: testUser.password
  });

  let authResponse = http.post(`${BASE_URL}/api/auth/login`, authPayload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  let authSuccess = check(authResponse, {
    'auth status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'auth response time < 500ms': (r) => r.timings.duration < 500,
  });

  if (!authSuccess) {
    errorRate.add(1);
  }

  // If authentication successful, test protected endpoints
  if (authResponse.status === 200) {
    let authData = JSON.parse(authResponse.body);
    let token = authData.token;

    if (token) {
      let headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Test user profile endpoint
      let profileResponse = http.get(`${BASE_URL}/api/user/profile`, { headers });
      check(profileResponse, {
        'profile status is 200': (r) => r.status === 200,
        'profile response time < 400ms': (r) => r.timings.duration < 400,
      }) || errorRate.add(1);

      sleep(1);

      // Test clubs endpoint
      let clubsResponse = http.get(`${BASE_URL}/api/clubs`, { headers });
      check(clubsResponse, {
        'clubs status is 200': (r) => r.status === 200,
        'clubs response time < 600ms': (r) => r.timings.duration < 600,
      }) || errorRate.add(1);

      sleep(1);

      // Test events endpoint
      let eventsResponse = http.get(`${BASE_URL}/api/events`, { headers });
      check(eventsResponse, {
        'events status is 200': (r) => r.status === 200,
        'events response time < 600ms': (r) => r.timings.duration < 600,
      }) || errorRate.add(1);
    }
  }

  sleep(2);
}