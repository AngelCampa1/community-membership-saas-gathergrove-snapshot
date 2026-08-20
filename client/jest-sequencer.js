const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    // Sort tests to run simpler ones first, complex integration tests last
    return tests.sort((testA, testB) => {
      const aPath = testA.path;
      const bPath = testB.path;
      
      // Run service tests first (they're usually simpler)
      if (aPath.includes('/services/') && !bPath.includes('/services/')) return -1;
      if (!aPath.includes('/services/') && bPath.includes('/services/')) return 1;
      
      // Run hook tests after services
      if (aPath.includes('/hooks/') && !bPath.includes('/hooks/')) return -1;
      if (!aPath.includes('/hooks/') && bPath.includes('/hooks/')) return 1;
      
      // Run component tests last (they're usually more complex)
      if (aPath.includes('/components/') && !bPath.includes('/components/')) return 1;
      if (!aPath.includes('/components/') && bPath.includes('/components/')) return -1;
      
      // Default alphabetical sort
      return aPath.localeCompare(bPath);
    });
  }
}

module.exports = CustomSequencer;