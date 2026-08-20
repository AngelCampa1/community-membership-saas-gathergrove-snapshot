/**
 * Custom Jest Test Sequencer for Deployment Tests
 * Ensures tests run in optimal order for deployment verification
 */

const Sequencer = require('@jest/test-sequencer').default;

class DeploymentTestSequencer extends Sequencer {
  sort(tests) {
    // Define test priority order for deployment verification
    const testPriority = {
      // 1. Basic functionality first
      'deployment-verification.test.ts': 1,
      
      // 2. Service dependencies
      'service-dependency-tests.test.ts': 2,
      
      // 3. Real functionality validation
      'real-functionality-validation.test.ts': 3,
      
      // 4. User journey validation
      'critical-user-journey-validation.test.ts': 4,
      
      // 5. Production readiness last (most comprehensive)
      'production-readiness.test.ts': 5,
      
      // Other tests
      'database-timeout.test.ts': 6,
      'auth-security.test.ts': 7,
      'critical-user-journeys.test.ts': 8,
      'toast-notification.test.tsx': 9
    };

    return tests.sort((a, b) => {
      // Get the test file names
      const aFileName = a.path.split('/').pop();
      const bFileName = b.path.split('/').pop();
      
      // Get priorities (default to 99 for unknown tests)
      const aPriority = testPriority[aFileName] || 99;
      const bPriority = testPriority[bFileName] || 99;
      
      // Sort by priority first
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // If same priority, sort alphabetically
      return aFileName.localeCompare(bFileName);
    });
  }
}

module.exports = DeploymentTestSequencer;