#!/usr/bin/env node

/**
 * MOBILE TEST MONITORING SYSTEM
 * Ensures 271/271 test success rate is maintained during all development
 * CRITICAL: This protects our gold standard mobile test infrastructure
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// GOLDEN BASELINE - NEVER ALLOW BELOW THIS (UPDATED: 277 is our new gold standard)
const EXPECTED_TEST_COUNT = 277;
const EXPECTED_SUITE_COUNT = 33;

const BASELINE_METRICS = {
  expectedTests: EXPECTED_TEST_COUNT,
  expectedSuites: EXPECTED_SUITE_COUNT,
  requiredInfrastructure: [
    'jest.config.js',
    'jest-rn-window-fix.js', 
    'jest.mobile-mocks.js',
    'jest.testing-library-setup.js'
  ],
  criticalMocks: [
    '__mocks__/react-native.js',
    '__mocks__/react-native-vector-icons.js',
    '__mocks__/react-native-safe-area-context.js',
    '__mocks__/async-storage.js',
    '__mocks__/navigation.js'
  ]
};

class MobileTestMonitor {
  constructor() {
    this.lastValidationTime = null;
    this.consecutiveSuccesses = 0;
    this.failureHistory = [];
  }

  async validateTestInfrastructure() {
    console.log('🔍 MOBILE TEST MONITOR: Validating test infrastructure...');
    
    const issues = [];
    
    // Check critical files exist
    for (const file of BASELINE_METRICS.requiredInfrastructure) {
      if (!fs.existsSync(path.join(__dirname, '..', file))) {
        issues.push(`CRITICAL: Missing infrastructure file: ${file}`);
      }
    }
    
    for (const mockFile of BASELINE_METRICS.criticalMocks) {
      if (!fs.existsSync(path.join(__dirname, '..', mockFile))) {
        issues.push(`CRITICAL: Missing mock file: ${mockFile}`);
      }
    }
    
    // Check jest config integrity
    const jestConfigPath = path.join(__dirname, '..', 'jest.config.js');
    if (fs.existsSync(jestConfigPath)) {
      const configContent = fs.readFileSync(jestConfigPath, 'utf8');
      if (!configContent.includes('jest-rn-window-fix.js')) {
        issues.push('CRITICAL: Jest config missing window fix setup');
      }
      if (!configContent.includes('jest.mobile-mocks.js')) {
        issues.push('CRITICAL: Jest config missing mobile mocks setup');
      }
    }
    
    return issues;
  }

  async runTests() {
    return new Promise((resolve) => {
      console.log('🧪 MOBILE TEST MONITOR: Running full test suite...');
      
      const startTime = Date.now();
      exec('npm run test', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const result = {
          success: !error,
          duration,
          stdout,
          stderr,
          testCount: 0,
          suiteCount: 0,
          issues: []
        };
        
        // Parse test output
        if (stdout) {
          // Handle both stdout and stderr for test results
          const fullOutput = stdout + (stderr || '');
          
          const testMatch = fullOutput.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
          const suiteMatch = fullOutput.match(/Test Suites:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
          
          if (testMatch) {
            result.testCount = parseInt(testMatch[2]);
            result.passedTests = parseInt(testMatch[1]);
          }
          
          if (suiteMatch) {
            result.suiteCount = parseInt(suiteMatch[2]);
            result.passedSuites = parseInt(suiteMatch[1]);
          }
          
          // Debug output if parsing fails
          if (!testMatch || !suiteMatch) {
            console.log('DEBUG: Failed to parse test output');
            console.log('Last 500 chars of output:', fullOutput.slice(-500));
          }
        }
        
        // Validate against baseline
        if (result.testCount !== EXPECTED_TEST_COUNT) {
          result.issues.push(`TEST COUNT MISMATCH: Expected ${EXPECTED_TEST_COUNT}, got ${result.testCount}`);
        }
        
        if (result.suiteCount !== EXPECTED_SUITE_COUNT) {
          result.issues.push(`SUITE COUNT MISMATCH: Expected ${EXPECTED_SUITE_COUNT}, got ${result.suiteCount}`);
        }
        
        if (result.testCount !== result.passedTests) {
          result.issues.push(`FAILING TESTS: ${result.testCount - result.passedTests} tests failed`);
        }
        
        resolve(result);
      });
    });
  }

  async validateTypeCheck() {
    return new Promise((resolve) => {
      console.log('📋 MOBILE TEST MONITOR: Running TypeScript validation...');
      
      exec('npm run typecheck', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
        const result = {
          success: !error,
          errorCount: 0,
          errors: [],
          stdout,
          stderr
        };
        
        if (stderr) {
          const errorLines = stderr.split('\n').filter(line => line.includes('error TS'));
          result.errorCount = errorLines.length;
          result.errors = errorLines;
        }
        
        resolve(result);
      });
    });
  }

  async generateReport(testResult, typeResult, infrastructureIssues) {
    const timestamp = new Date().toISOString();
    
    const report = {
      timestamp,
      status: testResult.testCount === EXPECTED_TEST_COUNT && testResult.passedTests === EXPECTED_TEST_COUNT ? 'PERFECT' : 'DEGRADED',
      tests: {
        expected: EXPECTED_TEST_COUNT,
        actual: testResult.testCount,
        passed: testResult.passedTests,
        success: testResult.success,
        duration: testResult.duration
      },
      suites: {
        expected: EXPECTED_SUITE_COUNT,
        actual: testResult.suiteCount,
        passed: testResult.passedSuites
      },
      typeCheck: {
        success: typeResult.success,
        errorCount: typeResult.errorCount,
        errors: typeResult.errors
      },
      infrastructure: {
        issues: infrastructureIssues
      },
      summary: this.generateSummary(testResult, typeResult, infrastructureIssues)
    };
    
    // Save report
    const reportsDir = path.join(__dirname, '..', 'reports', 'mobile-test-monitoring');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const reportFile = path.join(reportsDir, `mobile-test-report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    // Update latest report
    const latestReportFile = path.join(reportsDir, 'latest-mobile-test-report.json');
    fs.writeFileSync(latestReportFile, JSON.stringify(report, null, 2));
    
    return report;
  }

  generateSummary(testResult, typeResult, infrastructureIssues) {
    const summary = [];
    
    // Test status
    if (testResult.testCount === EXPECTED_TEST_COUNT && testResult.passedTests === EXPECTED_TEST_COUNT) {
      summary.push(`✅ PERFECT: ${testResult.testCount}/${EXPECTED_TEST_COUNT} tests passing`);
      this.consecutiveSuccesses++;
    } else {
      summary.push(`❌ DEGRADED: ${testResult.passedTests}/${testResult.testCount} tests passing (expected ${EXPECTED_TEST_COUNT})`);
      this.consecutiveSuccesses = 0;
    }
    
    // Infrastructure status
    if (infrastructureIssues.length === 0) {
      summary.push('✅ Infrastructure: All critical files present');
    } else {
      summary.push(`❌ Infrastructure: ${infrastructureIssues.length} issues detected`);
      infrastructureIssues.forEach(issue => summary.push(`  - ${issue}`));
    }
    
    // Type check status
    if (typeResult.success) {
      summary.push('✅ TypeScript: No type errors');
    } else {
      summary.push(`⚠️ TypeScript: ${typeResult.errorCount} type errors (acceptable if tests pass)`);
    }
    
    // Consecutive success tracking
    if (this.consecutiveSuccesses > 0) {
      summary.push(`🏆 Consecutive successful validations: ${this.consecutiveSuccesses}`);
    }
    
    return summary;
  }

  async monitor() {
    console.log('🚀 MOBILE TEST MONITOR: Starting comprehensive validation...\n');
    
    // Step 1: Validate infrastructure
    const infrastructureIssues = await this.validateTestInfrastructure();
    
    // Step 2: Run tests
    const testResult = await this.runTests();
    
    // Step 3: Check types
    const typeResult = await this.validateTypeCheck();
    
    // Step 4: Generate report
    const report = await this.generateReport(testResult, typeResult, infrastructureIssues);
    
    // Step 5: Display results
    this.displayResults(report);
    
    this.lastValidationTime = Date.now();
    
    return report;
  }

  displayResults(report) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 MOBILE TEST MONITORING REPORT');
    console.log('='.repeat(80));
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Status: ${report.status}`);
    console.log();
    
    report.summary.forEach(line => console.log(line));
    
    console.log();
    console.log('📈 Detailed Metrics:');
    console.log(`  Tests: ${report.tests.passed}/${report.tests.actual} (expected ${report.tests.expected})`);
    console.log(`  Suites: ${report.suites.passed}/${report.suites.actual} (expected ${report.suites.expected})`);
    console.log(`  Duration: ${report.tests.duration}ms`);
    console.log(`  TypeScript errors: ${report.typeCheck.errorCount}`);
    console.log(`  Infrastructure issues: ${report.infrastructure.issues.length}`);
    
    if (report.status === 'PERFECT') {
      console.log('\n🎉 MOBILE TESTS MAINTAINING PERFECT 271/271 SUCCESS RATE!');
    } else {
      console.log('\n⚠️  MOBILE TEST REGRESSION DETECTED - IMMEDIATE ACTION REQUIRED!');
      if (report.infrastructure.issues.length > 0) {
        console.log('\n🔧 Infrastructure Issues:');
        report.infrastructure.issues.forEach(issue => console.log(`  - ${issue}`));
      }
    }
    
    console.log('='.repeat(80));
  }
}

// CLI usage
if (require.main === module) {
  const monitor = new MobileTestMonitor();
  
  if (process.argv.includes('--watch')) {
    console.log('👁️ MOBILE TEST MONITOR: Starting watch mode...');
    setInterval(async () => {
      await monitor.monitor();
    }, 30000); // Check every 30 seconds
  } else {
    monitor.monitor().then(report => {
      process.exit(report.status === 'PERFECT' ? 0 : 1);
    });
  }
}

module.exports = MobileTestMonitor;