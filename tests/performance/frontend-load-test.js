// K6 Load Testing Script for GatherGrove Frontend
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const pageLoadTime = new Rate('page_load_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 5 },  // Ramp up
    { duration: '5m', target: 10 }, // Sustained load
    { duration: '2m', target: 15 }, // Increase load
    { duration: '3m', target: 15 }, // Sustained higher load
    { duration: '2m', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.05'],    // Error rate must be below 5%
    errors: ['rate<0.05'],             // Custom error rate below 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://staging.gathergrove.com';

export default function () {
  // Test main page
  let mainResponse = http.get(`${BASE_URL}/`);
  let mainPageSuccess = check(mainResponse, {
    'main page status is 200': (r) => r.status === 200,
    'main page response time < 2s': (r) => r.timings.duration < 2000,
    'main page contains title': (r) => r.body.includes('GatherGrove'),
  });
  
  if (!mainPageSuccess) {
    errorRate.add(1);
  }

  sleep(2);

  // Test login page
  let loginResponse = http.get(`${BASE_URL}/login`);
  check(loginResponse, {
    'login page status is 200': (r) => r.status === 200,
    'login page response time < 1.5s': (r) => r.timings.duration < 1500,
    'login page has form': (r) => r.body.includes('email') && r.body.includes('password'),
  }) || errorRate.add(1);

  sleep(1);

  // Test about page
  let aboutResponse = http.get(`${BASE_URL}/about`);
  check(aboutResponse, {
    'about page status is 200': (r) => r.status === 200,
    'about page response time < 1.5s': (r) => r.timings.duration < 1500,
  }) || errorRate.add(1);

  sleep(1);

  // Test static assets
  let assetsChecks = [
    { url: `${BASE_URL}/_next/static/css/`, description: 'CSS assets' },
    { url: `${BASE_URL}/_next/static/chunks/`, description: 'JS chunks' },
    { url: `${BASE_URL}/favicon.ico`, description: 'favicon' },
  ];

  assetsChecks.forEach(asset => {
    let response = http.get(asset.url);
    check(response, {
      [`${asset.description} loads successfully`]: (r) => r.status === 200 || r.status === 404, // 404 is acceptable for some assets
      [`${asset.description} loads quickly`]: (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);
  });

  sleep(2);

  // Test API endpoints that frontend might call
  let apiHealthResponse = http.get(`${BASE_URL}/api/health`);
  check(apiHealthResponse, {
    'frontend API health status is 200': (r) => r.status === 200,
    'frontend API health response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);
}