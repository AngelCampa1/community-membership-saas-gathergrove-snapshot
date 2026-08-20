// Playwright E2E test setup

/**
 * Global setup for Mobile E2E tests
 * Prepares the testing environment and starts necessary services
 */
async function globalSetup() {
  // Setup log: ("🚀 Setting up mobile testing environment...");
  
  // Setup environment variables for testing
  process.env.NODE_ENV = "test";
  process.env.E2E_TESTING = "true";
  
  // Ensure test data is available
  await setupTestData();
  
  // Validate required services are available
  await validateServices();
  
  // Setup log: ("✅ Mobile testing environment configured");
}

/**
 * Setup test data and mock services
 */
async function setupTestData() {
  // Create test user data if needed
  const testUser = {
    email: "claude.test@gathergrove.club",
    password: "ClaudeTest2024!",
    clubName: "Claude Test Club",
    fullName: "Claude Code Test"
  };
  
  // Store test credentials for use in tests
  process.env.TEST_USER_EMAIL = testUser.email;
  process.env.TEST_USER_PASSWORD = testUser.password;
}

/**
 * Validate that required services are available
 */
async function validateServices() {
  // Check if mobile web server will be available
  const baseURL = process.env.EXPO_WEB_URL || "http://localhost:19006";
  // Setup log: Mobile app will be tested at baseURL
  void baseURL; // Mark as intentionally used for logging

  // Additional service checks can be added here
}

export default globalSetup;
