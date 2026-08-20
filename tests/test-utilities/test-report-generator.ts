/**
 * 📊 COMPREHENSIVE TEST REPORT GENERATOR
 * Advanced reporting and analytics for test quality assurance
 */

import * as fs from 'fs';
import * as path from 'path';

export interface TestMetrics {
  totalTests: number;
  passingTests: number;
  failingTests: number;
  skippedTests: number;
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  executionTime: number;
  memoryUsage?: number;
}

export interface TestSuiteResult {
  suiteName: string;
  status: 'passed' | 'failed' | 'skipped';
  tests: TestResult[];
  metrics: TestMetrics;
  duration: number;
  errors: string[];
}

export interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  tags?: string[];
  category?: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
}

export interface QualityAssessment {
  overallScore: number; // 0-100
  coverage: {
    score: number;
    recommendations: string[];
  };
  performance: {
    score: number;
    issues: string[];
  };
  security: {
    score: number;
    vulnerabilities: string[];
  };
  maintainability: {
    score: number;
    issues: string[];
  };
}

export class TestReportGenerator {
  private suiteResults: TestSuiteResult[] = [];
  private startTime: number = Date.now();
  
  /**
   * Add test suite result
   */
  addSuiteResult(suite: TestSuiteResult): void {
    this.suiteResults.push(suite);
  }

  /**
   * Generate comprehensive test report
   */
  generateComprehensiveReport(): string {
    const totalTime = Date.now() - this.startTime;
    const overallMetrics = this.calculateOverallMetrics();
    const qualityAssessment = this.assessQuality();
    
    let report = '';
    
    // Header
    report += this.generateHeader();
    
    // Executive Summary
    report += this.generateExecutiveSummary(overallMetrics, totalTime);
    
    // Quality Assessment
    report += this.generateQualityAssessment(qualityAssessment);
    
    // Detailed Results
    report += this.generateDetailedResults();
    
    // Coverage Analysis
    report += this.generateCoverageAnalysis(overallMetrics.coverage);
    
    // Performance Analysis
    report += this.generatePerformanceAnalysis();
    
    // Security Analysis
    report += this.generateSecurityAnalysis();
    
    // Recommendations
    report += this.generateRecommendations(qualityAssessment);
    
    // Appendix
    report += this.generateAppendix();
    
    return report;
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(): string {
    const overallMetrics = this.calculateOverallMetrics();
    const qualityAssessment = this.assessQuality();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GatherGrove QA Test Report</title>
    <style>
        ${this.getReportCSS()}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🧪 GatherGrove Quality Assurance Report</h1>
            <p class="subtitle">Comprehensive Testing & Quality Analysis</p>
            <p class="timestamp">Generated: ${new Date().toISOString()}</p>
        </header>
        
        <section class="summary">
            <h2>📊 Executive Summary</h2>
            <div class="metrics-grid">
                <div class="metric-card ${this.getStatusClass(overallMetrics.passingTests, overallMetrics.totalTests)}">
                    <h3>Test Success Rate</h3>
                    <div class="metric-value">${((overallMetrics.passingTests / overallMetrics.totalTests) * 100).toFixed(1)}%</div>
                    <div class="metric-detail">${overallMetrics.passingTests} / ${overallMetrics.totalTests} tests passed</div>
                </div>
                
                <div class="metric-card ${this.getCoverageStatusClass(overallMetrics.coverage.statements)}">
                    <h3>Code Coverage</h3>
                    <div class="metric-value">${overallMetrics.coverage.statements.toFixed(1)}%</div>
                    <div class="metric-detail">Statements covered</div>
                </div>
                
                <div class="metric-card ${this.getQualityStatusClass(qualityAssessment.overallScore)}">
                    <h3>Quality Score</h3>
                    <div class="metric-value">${qualityAssessment.overallScore}/100</div>
                    <div class="metric-detail">Overall quality rating</div>
                </div>
                
                <div class="metric-card">
                    <h3>Execution Time</h3>
                    <div class="metric-value">${(overallMetrics.executionTime / 1000).toFixed(2)}s</div>
                    <div class="metric-detail">Total test runtime</div>
                </div>
            </div>
        </section>

        <section class="quality-assessment">
            <h2>🎯 Quality Assessment Breakdown</h2>
            <div class="assessment-grid">
                ${this.generateQualityCards(qualityAssessment)}
            </div>
        </section>

        <section class="test-results">
            <h2>📋 Test Suite Results</h2>
            ${this.generateTestSuitesHTML()}
        </section>

        <section class="coverage-details">
            <h2>📈 Coverage Analysis</h2>
            ${this.generateCoverageHTML(overallMetrics.coverage)}
        </section>

        <section class="recommendations">
            <h2>💡 Recommendations</h2>
            ${this.generateRecommendationsHTML(qualityAssessment)}
        </section>
    </div>
</body>
</html>`;
  }

  /**
   * Save report to file
   */
  async saveReport(outputPath: string, format: 'text' | 'html' | 'json' = 'text'): Promise<void> {
    let content: string;
    let extension: string;

    switch (format) {
      case 'html':
        content = this.generateHTMLReport();
        extension = '.html';
        break;
      case 'json':
        content = JSON.stringify(this.generateJSONReport(), null, 2);
        extension = '.json';
        break;
      default:
        content = this.generateComprehensiveReport();
        extension = '.md';
    }

    const fullPath = path.resolve(outputPath + extension);
    await fs.promises.writeFile(fullPath, content, 'utf-8');
  }

  /**
   * Generate JSON report for programmatic consumption
   */
  generateJSONReport(): object {
    return {
      timestamp: new Date().toISOString(),
      summary: this.calculateOverallMetrics(),
      qualityAssessment: this.assessQuality(),
      suiteResults: this.suiteResults,
      recommendations: this.generateRecommendationsList()
    };
  }

  // Private helper methods

  private generateHeader(): string {
    return `
# 🧪 GatherGrove Quality Assurance Report

**Generated:** ${new Date().toISOString()}
**Report Type:** Comprehensive Testing & Quality Analysis
**Environment:** ${process.env.NODE_ENV || 'development'}

---

`;
  }

  private generateExecutiveSummary(metrics: TestMetrics, totalTime: number): string {
    const successRate = ((metrics.passingTests / metrics.totalTests) * 100).toFixed(1);
    
    return `
## 📊 Executive Summary

### Key Metrics
- **Test Success Rate:** ${successRate}% (${metrics.passingTests}/${metrics.totalTests} passed)
- **Code Coverage:** ${metrics.coverage.statements.toFixed(1)}% statements
- **Total Execution Time:** ${(totalTime / 1000).toFixed(2)} seconds
- **Test Suites:** ${this.suiteResults.length} suites executed
- **Failed Tests:** ${metrics.failingTests} ${metrics.failingTests > 0 ? '❌' : '✅'}

### Status Overview
${this.getStatusEmoji(successRate)} **Overall Status:** ${this.getOverallStatus(successRate)}

`;
  }

  private generateQualityAssessment(assessment: QualityAssessment): string {
    return `
## 🎯 Quality Assessment

### Overall Quality Score: ${assessment.overallScore}/100 ${this.getQualityEmoji(assessment.overallScore)}

| Category | Score | Status |
|----------|-------|---------|
| Coverage | ${assessment.coverage.score}/100 | ${this.getStatusEmoji(assessment.coverage.score)} |
| Performance | ${assessment.performance.score}/100 | ${this.getStatusEmoji(assessment.performance.score)} |
| Security | ${assessment.security.score}/100 | ${this.getStatusEmoji(assessment.security.score)} |
| Maintainability | ${assessment.maintainability.score}/100 | ${this.getStatusEmoji(assessment.maintainability.score)} |

`;
  }

  private generateDetailedResults(): string {
    let report = `
## 📋 Detailed Test Results

`;

    this.suiteResults.forEach(suite => {
      const successRate = ((suite.metrics.passingTests / suite.metrics.totalTests) * 100).toFixed(1);
      
      report += `
### ${suite.suiteName} ${this.getSuiteStatusEmoji(suite.status)}

- **Status:** ${suite.status.toUpperCase()}
- **Tests:** ${suite.metrics.passingTests}/${suite.metrics.totalTests} passed (${successRate}%)
- **Duration:** ${suite.duration.toFixed(2)}ms
- **Coverage:** ${suite.metrics.coverage.statements.toFixed(1)}%

`;

      if (suite.errors.length > 0) {
        report += `
**Errors:**
${suite.errors.map(error => `- ❌ ${error}`).join('\n')}

`;
      }
    });

    return report;
  }

  private generateCoverageAnalysis(coverage: TestMetrics['coverage']): string {
    return `
## 📈 Coverage Analysis

| Metric | Coverage | Status | Target |
|--------|----------|---------|---------|
| Statements | ${coverage.statements.toFixed(1)}% | ${this.getCoverageStatus(coverage.statements)} | 85% |
| Branches | ${coverage.branches.toFixed(1)}% | ${this.getCoverageStatus(coverage.branches)} | 80% |
| Functions | ${coverage.functions.toFixed(1)}% | ${this.getCoverageStatus(coverage.functions)} | 85% |
| Lines | ${coverage.lines.toFixed(1)}% | ${this.getCoverageStatus(coverage.lines)} | 85% |

### Coverage Recommendations
${this.generateCoverageRecommendations(coverage)}

`;
  }

  private generatePerformanceAnalysis(): string {
    const performanceSuites = this.suiteResults.filter(suite => 
      suite.tests.some(test => test.category === 'performance')
    );

    if (performanceSuites.length === 0) {
      return `
## ⚡ Performance Analysis

No performance tests detected. Consider adding performance tests for critical operations.

`;
    }

    let report = `
## ⚡ Performance Analysis

`;

    performanceSuites.forEach(suite => {
      const avgDuration = suite.tests.reduce((sum, test) => sum + test.duration, 0) / suite.tests.length;
      
      report += `
### ${suite.suiteName}
- **Average Test Duration:** ${avgDuration.toFixed(2)}ms
- **Total Suite Duration:** ${suite.duration.toFixed(2)}ms
- **Performance Status:** ${avgDuration < 100 ? '✅ Good' : avgDuration < 500 ? '⚠️ Moderate' : '❌ Slow'}

`;
    });

    return report;
  }

  private generateSecurityAnalysis(): string {
    const securitySuites = this.suiteResults.filter(suite => 
      suite.tests.some(test => test.category === 'security')
    );

    if (securitySuites.length === 0) {
      return `
## 🛡️ Security Analysis

⚠️ **No security tests detected.** This is a critical gap that should be addressed immediately.

### Recommended Security Tests:
- Input sanitization tests
- Authentication/authorization tests  
- SQL injection prevention tests
- XSS prevention tests
- CSRF protection tests

`;
    }

    let report = `
## 🛡️ Security Analysis

`;

    securitySuites.forEach(suite => {
      const securityTests = suite.tests.filter(test => test.category === 'security');
      const passRate = (securityTests.filter(test => test.status === 'passed').length / securityTests.length) * 100;
      
      report += `
### ${suite.suiteName}
- **Security Tests:** ${securityTests.length}
- **Pass Rate:** ${passRate.toFixed(1)}%
- **Status:** ${passRate === 100 ? '✅ Secure' : passRate >= 90 ? '⚠️ Minor Issues' : '❌ Critical Issues'}

`;
    });

    return report;
  }

  private generateRecommendations(assessment: QualityAssessment): string {
    let report = `
## 💡 Recommendations

### High Priority
`;

    const highPriorityRecommendations = [];

    if (assessment.coverage.score < 80) {
      highPriorityRecommendations.push('🎯 **Improve code coverage** - Target 85% minimum for statements and functions');
    }

    if (assessment.security.score < 90) {
      highPriorityRecommendations.push('🛡️ **Enhance security testing** - Add comprehensive security test suite');
    }

    if (assessment.performance.score < 80) {
      highPriorityRecommendations.push('⚡ **Optimize performance** - Address slow tests and add performance benchmarks');
    }

    highPriorityRecommendations.forEach(rec => {
      report += `- ${rec}\n`;
    });

    report += `
### Medium Priority
`;

    const mediumPriorityRecommendations = [];

    if (assessment.maintainability.score < 85) {
      mediumPriorityRecommendations.push('🔧 **Improve test maintainability** - Refactor complex test cases');
    }

    assessment.coverage.recommendations.forEach(rec => {
      mediumPriorityRecommendations.push(`📊 **Coverage:** ${rec}`);
    });

    mediumPriorityRecommendations.forEach(rec => {
      report += `- ${rec}\n`;
    });

    return report;
  }

  private generateAppendix(): string {
    return `
## 📎 Appendix

### Test Categories
- **Unit Tests:** Test individual functions/components in isolation
- **Integration Tests:** Test component interactions and API endpoints  
- **E2E Tests:** Test complete user workflows
- **Performance Tests:** Validate speed and resource usage
- **Security Tests:** Verify protection against vulnerabilities

### Quality Scoring Methodology
- **Coverage Score:** Based on statement, branch, function, and line coverage
- **Performance Score:** Based on execution time and resource usage
- **Security Score:** Based on security test coverage and vulnerability detection
- **Maintainability Score:** Based on test complexity and code quality

### Thresholds
- **Excellent:** 90-100%
- **Good:** 80-89%
- **Fair:** 70-79%
- **Poor:** <70%

---

*Report generated by GatherGrove QA Testing Framework*
*For questions or issues, please contact the development team*

`;
  }

  private calculateOverallMetrics(): TestMetrics {
    const totalTests = this.suiteResults.reduce((sum, suite) => sum + suite.metrics.totalTests, 0);
    const passingTests = this.suiteResults.reduce((sum, suite) => sum + suite.metrics.passingTests, 0);
    const failingTests = this.suiteResults.reduce((sum, suite) => sum + suite.metrics.failingTests, 0);
    const skippedTests = this.suiteResults.reduce((sum, suite) => sum + suite.metrics.skippedTests, 0);
    const executionTime = this.suiteResults.reduce((sum, suite) => sum + suite.duration, 0);

    // Calculate weighted average coverage
    const totalWeight = this.suiteResults.reduce((sum, suite) => sum + suite.metrics.totalTests, 0);
    const avgCoverage = {
      statements: this.suiteResults.reduce((sum, suite) => 
        sum + (suite.metrics.coverage.statements * suite.metrics.totalTests), 0) / totalWeight,
      branches: this.suiteResults.reduce((sum, suite) => 
        sum + (suite.metrics.coverage.branches * suite.metrics.totalTests), 0) / totalWeight,
      functions: this.suiteResults.reduce((sum, suite) => 
        sum + (suite.metrics.coverage.functions * suite.metrics.totalTests), 0) / totalWeight,
      lines: this.suiteResults.reduce((sum, suite) => 
        sum + (suite.metrics.coverage.lines * suite.metrics.totalTests), 0) / totalWeight,
    };

    return {
      totalTests,
      passingTests,
      failingTests,
      skippedTests,
      coverage: avgCoverage,
      executionTime
    };
  }

  private assessQuality(): QualityAssessment {
    const metrics = this.calculateOverallMetrics();
    const successRate = (metrics.passingTests / metrics.totalTests) * 100;
    
    // Coverage score (40% weight)
    const coverageScore = (
      metrics.coverage.statements * 0.4 +
      metrics.coverage.branches * 0.3 +
      metrics.coverage.functions * 0.2 +
      metrics.coverage.lines * 0.1
    );

    // Performance score (25% weight)
    const avgExecutionTime = metrics.executionTime / metrics.totalTests;
    const performanceScore = Math.max(0, 100 - (avgExecutionTime / 10)); // Penalize slow tests

    // Security score (20% weight)
    const hasSecurityTests = this.suiteResults.some(suite => 
      suite.tests.some(test => test.category === 'security')
    );
    const securityScore = hasSecurityTests ? successRate : 0;

    // Maintainability score (15% weight)
    const maintainabilityScore = successRate; // Simplified for now

    const overallScore = Math.round(
      coverageScore * 0.4 +
      performanceScore * 0.25 +
      securityScore * 0.2 +
      maintainabilityScore * 0.15
    );

    return {
      overallScore,
      coverage: {
        score: Math.round(coverageScore),
        recommendations: this.generateCoverageRecommendations(metrics.coverage).split('\n').filter(r => r.trim())
      },
      performance: {
        score: Math.round(performanceScore),
        issues: this.identifyPerformanceIssues()
      },
      security: {
        score: Math.round(securityScore),
        vulnerabilities: this.identifySecurityVulnerabilities()
      },
      maintainability: {
        score: Math.round(maintainabilityScore),
        issues: this.identifyMaintainabilityIssues()
      }
    };
  }

  // Helper methods for status and emoji generation
  private getStatusEmoji(score: number | string): string {
    const numScore = typeof score === 'string' ? parseFloat(score) : score;
    if (numScore >= 90) return '✅';
    if (numScore >= 80) return '⚠️';
    if (numScore >= 70) return '🔶';
    return '❌';
  }

  private getQualityEmoji(score: number): string {
    if (score >= 90) return '🌟';
    if (score >= 80) return '✅';
    if (score >= 70) return '⚠️';
    return '❌';
  }

  private getSuiteStatusEmoji(status: string): string {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'skipped': return '⏭️';
      default: return '❓';
    }
  }

  private getOverallStatus(successRate: string): string {
    const rate = parseFloat(successRate);
    if (rate >= 95) return 'EXCELLENT';
    if (rate >= 85) return 'GOOD';
    if (rate >= 70) return 'FAIR';
    return 'POOR';
  }

  private getCoverageStatus(coverage: number): string {
    if (coverage >= 85) return '✅ Excellent';
    if (coverage >= 70) return '⚠️ Good';
    if (coverage >= 50) return '🔶 Fair';
    return '❌ Poor';
  }

  private generateCoverageRecommendations(coverage: TestMetrics['coverage']): string {
    const recommendations = [];
    
    if (coverage.statements < 85) {
      recommendations.push('- Add tests for uncovered statements');
    }
    if (coverage.branches < 80) {
      recommendations.push('- Improve conditional logic test coverage');
    }
    if (coverage.functions < 85) {
      recommendations.push('- Test all exported functions');
    }
    if (coverage.lines < 85) {
      recommendations.push('- Increase overall line coverage');
    }
    
    return recommendations.join('\n') || '- Coverage targets are met ✅';
  }

  private identifyPerformanceIssues(): string[] {
    const issues = [];
    
    this.suiteResults.forEach(suite => {
      const slowTests = suite.tests.filter(test => test.duration > 1000);
      if (slowTests.length > 0) {
        issues.push(`${suite.suiteName}: ${slowTests.length} slow tests (>1s)`);
      }
    });
    
    return issues;
  }

  private identifySecurityVulnerabilities(): string[] {
    const vulnerabilities = [];
    
    const hasSecurityTests = this.suiteResults.some(suite => 
      suite.tests.some(test => test.category === 'security')
    );
    
    if (!hasSecurityTests) {
      vulnerabilities.push('No security tests found');
    }
    
    return vulnerabilities;
  }

  private identifyMaintainabilityIssues(): string[] {
    const issues = [];
    
    this.suiteResults.forEach(suite => {
      if (suite.tests.length > 50) {
        issues.push(`${suite.suiteName}: Large test suite (${suite.tests.length} tests)`);
      }
    });
    
    return issues;
  }

  private generateRecommendationsList(): string[] {
    const assessment = this.assessQuality();
    const recommendations = [];
    
    if (assessment.coverage.score < 80) {
      recommendations.push('Improve code coverage to at least 80%');
    }
    
    if (assessment.performance.score < 80) {
      recommendations.push('Optimize slow-running tests');
    }
    
    if (assessment.security.score < 90) {
      recommendations.push('Add comprehensive security testing');
    }
    
    return recommendations;
  }

  // CSS for HTML report
  private getReportCSS(): string {
    return `
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        margin: 0; 
        padding: 20px; 
        background: #f5f5f5; 
      }
      .container { 
        max-width: 1200px; 
        margin: 0 auto; 
        background: white; 
        border-radius: 8px; 
        padding: 30px; 
        box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
      }
      header { 
        text-align: center; 
        border-bottom: 2px solid #eee; 
        padding-bottom: 20px; 
        margin-bottom: 30px; 
      }
      .metrics-grid { 
        display: grid; 
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
        gap: 20px; 
        margin: 20px 0; 
      }
      .metric-card { 
        border: 1px solid #ddd; 
        border-radius: 8px; 
        padding: 20px; 
        text-align: center; 
        background: white; 
      }
      .metric-card.excellent { border-left: 4px solid #28a745; }
      .metric-card.good { border-left: 4px solid #ffc107; }
      .metric-card.poor { border-left: 4px solid #dc3545; }
      .metric-value { 
        font-size: 2em; 
        font-weight: bold; 
        margin: 10px 0; 
      }
      .assessment-grid { 
        display: grid; 
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
        gap: 15px; 
      }
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 15px 0; 
      }
      th, td { 
        border: 1px solid #ddd; 
        padding: 12px; 
        text-align: left; 
      }
      th { 
        background: #f8f9fa; 
        font-weight: bold; 
      }
      .recommendations { 
        background: #f8f9fa; 
        border-radius: 5px; 
        padding: 20px; 
        margin: 15px 0; 
      }
    `;
  }

  private getStatusClass(passed: number, total: number): string {
    const rate = (passed / total) * 100;
    if (rate >= 90) return 'excellent';
    if (rate >= 70) return 'good';
    return 'poor';
  }

  private getCoverageStatusClass(coverage: number): string {
    if (coverage >= 85) return 'excellent';
    if (coverage >= 70) return 'good';
    return 'poor';
  }

  private getQualityStatusClass(score: number): string {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    return 'poor';
  }

  private generateQualityCards(assessment: QualityAssessment): string {
    return `
      <div class="metric-card ${this.getQualityStatusClass(assessment.coverage.score)}">
        <h3>Coverage</h3>
        <div class="metric-value">${assessment.coverage.score}/100</div>
      </div>
      <div class="metric-card ${this.getQualityStatusClass(assessment.performance.score)}">
        <h3>Performance</h3>
        <div class="metric-value">${assessment.performance.score}/100</div>
      </div>
      <div class="metric-card ${this.getQualityStatusClass(assessment.security.score)}">
        <h3>Security</h3>
        <div class="metric-value">${assessment.security.score}/100</div>
      </div>
      <div class="metric-card ${this.getQualityStatusClass(assessment.maintainability.score)}">
        <h3>Maintainability</h3>
        <div class="metric-value">${assessment.maintainability.score}/100</div>
      </div>
    `;
  }

  private generateTestSuitesHTML(): string {
    return this.suiteResults.map(suite => `
      <div class="test-suite">
        <h3>${suite.suiteName} ${this.getSuiteStatusEmoji(suite.status)}</h3>
        <p>Status: ${suite.status} | Tests: ${suite.metrics.passingTests}/${suite.metrics.totalTests} | Duration: ${suite.duration}ms</p>
      </div>
    `).join('');
  }

  private generateCoverageHTML(coverage: TestMetrics['coverage']): string {
    return `
      <table>
        <tr><th>Metric</th><th>Coverage</th><th>Status</th></tr>
        <tr><td>Statements</td><td>${coverage.statements.toFixed(1)}%</td><td>${this.getCoverageStatus(coverage.statements)}</td></tr>
        <tr><td>Branches</td><td>${coverage.branches.toFixed(1)}%</td><td>${this.getCoverageStatus(coverage.branches)}</td></tr>
        <tr><td>Functions</td><td>${coverage.functions.toFixed(1)}%</td><td>${this.getCoverageStatus(coverage.functions)}</td></tr>
        <tr><td>Lines</td><td>${coverage.lines.toFixed(1)}%</td><td>${this.getCoverageStatus(coverage.lines)}</td></tr>
      </table>
    `;
  }

  private generateRecommendationsHTML(assessment: QualityAssessment): string {
    const recommendations = this.generateRecommendationsList();
    return `
      <div class="recommendations">
        <ul>
          ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>
    `;
  }
}

export default TestReportGenerator;