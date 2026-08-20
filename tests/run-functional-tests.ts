/**
 * FUNCTIONAL TESTING EXECUTION SCRIPT
 * Executes comprehensive functional testing and generates detailed report
 */

import ComprehensiveFunctionalTestSuite from './functional-testing-framework';

async function runFunctionalTesting(): Promise<void> {
  console.log('🧠 HIVE MIND FUNCTIONAL TESTING AGENT ACTIVATED');
  console.log('🔬 Beginning comprehensive functional workflow analysis...\n');

  const testSuite = new ComprehensiveFunctionalTestSuite('http://localhost:5284');

  try {
    // Execute all functional tests
    const results = await testSuite.runAllFunctionalTests();
    
    // Generate comprehensive report
    const report = testSuite.generateFunctionalTestReport();
    
    console.log(report);
    
    // Store results in hive memory for coordination
    console.log('\n📊 FUNCTIONAL TESTING COMPLETE - RESULTS STORED IN HIVE MEMORY');
    
  } catch (error) {
    console.error('❌ FUNCTIONAL TESTING FAILED:', error);
    
    // Generate failure report
    console.log('\n🚨 CRITICAL FUNCTIONAL TESTING FAILURES DETECTED');
    console.log('=' .repeat(80));
    console.log('The application has critical functional issues that prevent');
    console.log('comprehensive testing. Manual investigation required.');
    console.log('');
    console.log('ERROR DETAILS:');
    console.log(error instanceof Error ? error.message : String(error));
    console.log('=' .repeat(80));
  }
}

// Execute functional testing
runFunctionalTesting().catch(console.error);