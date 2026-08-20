/**
 * Performance Benchmark Utility for Member List Operations
 * 
 * This utility provides comprehensive performance testing and monitoring
 * for member list operations, including load testing, memory profiling,
 * and optimization recommendations.
 */

import { MemberResponse, PaginatedMembersResponse } from '@/services/memberService';
import { logger } from '@/lib/logger';

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  memoryUsage: {
    before: number;
    after: number;
    peak: number;
    delta: number;
  };
  itemCount: number;
  timestamp: number;
}

export interface BenchmarkResults {
  testName: string;
  metrics: PerformanceMetrics[];
  averageDuration: number;
  medianDuration: number;
  p95Duration: number;
  memoryEfficiency: number;
  recommendations: string[];
}

class MemberListBenchmark {
  private results: BenchmarkResults[] = [];
  private observer?: PerformanceObserver;

  constructor() {
    this.setupPerformanceObserver();
  }

  private setupPerformanceObserver() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        // Handle performance entries
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name.startsWith('member-list-')) {
            logger.debug('members', 'Performance measurement recorded', {
              entryName: entry.name,
              duration: entry.duration,
              entryType: entry.entryType
            });
          }
        });
      });

      try {
        this.observer.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (e) {
        logger.warn('members', 'Performance Observer not supported', { error: e });
      }
    }
  }

  /**
   * Generate test data for benchmarking
   */
  generateTestMembers(count: number, options: {
    withCustomFields?: boolean;
    withComplexNames?: boolean;
    randomizeData?: boolean;
  } = {}): MemberResponse[] {
    const { withCustomFields = false, withComplexNames = false, randomizeData = true } = options;
    
    return Array.from({ length: count }, (_, i) => {
      const baseIndex = randomizeData ? Math.floor(Math.random() * 10000) + i : i;
      const name = withComplexNames 
        ? `${this.getRandomFirstName()} ${this.getRandomLastName()} ${this.getRandomSuffix()}`
        : `Member ${baseIndex + 1}`;

      return {
        id: baseIndex + 1,
        clubId: 1,
        membershipTypeId: (baseIndex % 5) + 1,
        membershipTypeName: ['Basic', 'Standard', 'Premium', 'VIP', 'Corporate'][baseIndex % 5],
        fullName: name,
        email: `member${baseIndex + 1}@test${Math.floor(baseIndex / 100)}.com`,
        phoneNumber: this.generatePhoneNumber(),
        address: `${baseIndex + 1} ${this.getRandomStreet()}, ${this.getRandomCity()}, ${this.getRandomState()}`,
        status: baseIndex % 20 === 0 ? 'Archived' : 'Active',
        joinDate: new Date(2020 + (baseIndex % 4), baseIndex % 12, (baseIndex % 28) + 1).toISOString(),
        duesPaidUntil: baseIndex % 10 === 0 ? undefined : new Date(2024, (baseIndex % 12) + 1, (baseIndex % 28) + 1).toISOString(),
        hasSmsConsent: baseIndex % 3 !== 0,
        createdAt: new Date(2023, baseIndex % 12, (baseIndex % 28) + 1).toISOString(),
        updatedAt: new Date().toISOString(),
        customFieldValues: withCustomFields ? this.generateCustomFields(baseIndex) : [],
        totalPaidCurrentPeriod: 50 + (baseIndex * 25) + (randomizeData ? Math.random() * 200 : 0),
        expectedDuesAmount: 100 + ((baseIndex % 5) * 50),
        outstandingBalance: baseIndex % 8 === 0 ? 25 + (Math.random() * 75) : undefined,
        hasPartialPayments: baseIndex % 8 === 0
      };
    });
  }

  /**
   * Benchmark rendering performance
   */
  async benchmarkRendering(
    memberCounts: number[],
    renderFunction: (members: MemberResponse[]) => Promise<void>,
    iterations = 5
  ): Promise<BenchmarkResults> {
    const metrics: PerformanceMetrics[] = [];
    const testName = 'Member List Rendering';

    for (const count of memberCounts) {
      const testMembers = this.generateTestMembers(count);
      
      for (let i = 0; i < iterations; i++) {
        const beforeMemory = this.getMemoryUsage();
        const startTime = performance.now();
        
        performance.mark('render-start');
        await renderFunction(testMembers);
        performance.mark('render-end');
        performance.measure('member-list-render', 'render-start', 'render-end');
        
        const endTime = performance.now();
        const afterMemory = this.getMemoryUsage();
        
        metrics.push({
          operation: `render-${count}-items`,
          duration: endTime - startTime,
          memoryUsage: {
            before: beforeMemory.usedJSHeapSize,
            after: afterMemory.usedJSHeapSize,
            peak: afterMemory.totalJSHeapSize,
            delta: afterMemory.usedJSHeapSize - beforeMemory.usedJSHeapSize
          },
          itemCount: count,
          timestamp: Date.now()
        });

        // Allow garbage collection between iterations
        await this.sleep(100);
      }
    }

    return this.generateBenchmarkResults(testName, metrics);
  }

  /**
   * Benchmark search operations
   */
  async benchmarkSearch(
    members: MemberResponse[],
    searchTerms: string[],
    searchFunction: (members: MemberResponse[], term: string) => MemberResponse[]
  ): Promise<BenchmarkResults> {
    const metrics: PerformanceMetrics[] = [];
    const testName = 'Member Search Operations';

    for (const searchTerm of searchTerms) {
      const beforeMemory = this.getMemoryUsage();
      const startTime = performance.now();
      
      performance.mark('search-start');
      const results = searchFunction(members, searchTerm);
      performance.mark('search-end');
      performance.measure('member-list-search', 'search-start', 'search-end');
      
      const endTime = performance.now();
      const afterMemory = this.getMemoryUsage();
      
      metrics.push({
        operation: `search-${searchTerm}-in-${members.length}`,
        duration: endTime - startTime,
        memoryUsage: {
          before: beforeMemory.usedJSHeapSize,
          after: afterMemory.usedJSHeapSize,
          peak: afterMemory.totalJSHeapSize,
          delta: afterMemory.usedJSHeapSize - beforeMemory.usedJSHeapSize
        },
        itemCount: results.length,
        timestamp: Date.now()
      });
    }

    return this.generateBenchmarkResults(testName, metrics);
  }

  /**
   * Benchmark pagination operations
   */
  async benchmarkPagination(
    totalMembers: MemberResponse[],
    pageSizes: number[],
    paginationFunction: (members: MemberResponse[], page: number, pageSize: number) => PaginatedMembersResponse
  ): Promise<BenchmarkResults> {
    const metrics: PerformanceMetrics[] = [];
    const testName = 'Member Pagination Operations';

    for (const pageSize of pageSizes) {
      const totalPages = Math.ceil(totalMembers.length / pageSize);
      const pagesToTest = Math.min(10, totalPages); // Test up to 10 pages

      for (let page = 1; page <= pagesToTest; page++) {
        const beforeMemory = this.getMemoryUsage();
        const startTime = performance.now();
        
        performance.mark('pagination-start');
        const result = paginationFunction(totalMembers, page, pageSize);
        performance.mark('pagination-end');
        performance.measure('member-list-pagination', 'pagination-start', 'pagination-end');
        
        const endTime = performance.now();
        const afterMemory = this.getMemoryUsage();
        
        metrics.push({
          operation: `pagination-page-${page}-size-${pageSize}`,
          duration: endTime - startTime,
          memoryUsage: {
            before: beforeMemory.usedJSHeapSize,
            after: afterMemory.usedJSHeapSize,
            peak: afterMemory.totalJSHeapSize,
            delta: afterMemory.usedJSHeapSize - beforeMemory.usedJSHeapSize
          },
          itemCount: result.members.length,
          timestamp: Date.now()
        });
      }
    }

    return this.generateBenchmarkResults(testName, metrics);
  }

  /**
   * Benchmark virtual scrolling performance
   */
  async benchmarkVirtualScrolling(
    memberCount: number,
    viewportHeight: number,
    itemHeight: number,
    scrollSimulation: (startIndex: number, endIndex: number) => Promise<void>
  ): Promise<BenchmarkResults> {
    const metrics: PerformanceMetrics[] = [];
    const testName = 'Virtual Scrolling Performance';
    
    const visibleItems = Math.ceil(viewportHeight / itemHeight);
    const totalScrollPositions = memberCount - visibleItems;
    const testPositions = Math.min(50, Math.floor(totalScrollPositions / 10)); // Test 50 positions max

    for (let i = 0; i < testPositions; i++) {
      const startIndex = Math.floor((totalScrollPositions / testPositions) * i);
      const endIndex = Math.min(startIndex + visibleItems, memberCount);
      
      const beforeMemory = this.getMemoryUsage();
      const startTime = performance.now();
      
      performance.mark('virtual-scroll-start');
      await scrollSimulation(startIndex, endIndex);
      performance.mark('virtual-scroll-end');
      performance.measure('member-list-virtual-scroll', 'virtual-scroll-start', 'virtual-scroll-end');
      
      const endTime = performance.now();
      const afterMemory = this.getMemoryUsage();
      
      metrics.push({
        operation: `virtual-scroll-${startIndex}-to-${endIndex}`,
        duration: endTime - startTime,
        memoryUsage: {
          before: beforeMemory.usedJSHeapSize,
          after: afterMemory.usedJSHeapSize,
          peak: afterMemory.totalJSHeapSize,
          delta: afterMemory.usedJSHeapSize - beforeMemory.usedJSHeapSize
        },
        itemCount: endIndex - startIndex,
        timestamp: Date.now()
      });
    }

    return this.generateBenchmarkResults(testName, metrics);
  }

  /**
   * Generate comprehensive benchmark report
   */
  generateComprehensiveReport(): {
    summary: {
      totalTests: number;
      averagePerformance: number;
      memoryEfficiency: number;
      overallScore: number;
    };
    detailed: BenchmarkResults[];
    recommendations: string[];
  } {
    const totalTests = this.results.length;
    const averagePerformance = this.results.reduce((sum, result) => sum + result.averageDuration, 0) / totalTests;
    const memoryEfficiency = this.results.reduce((sum, result) => sum + result.memoryEfficiency, 0) / totalTests;
    const overallScore = this.calculateOverallScore();

    return {
      summary: {
        totalTests,
        averagePerformance,
        memoryEfficiency,
        overallScore
      },
      detailed: this.results,
      recommendations: this.generateOverallRecommendations()
    };
  }

  private generateBenchmarkResults(testName: string, metrics: PerformanceMetrics[]): BenchmarkResults {
    const durations = metrics.map(m => m.duration);
    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const sortedDurations = durations.sort((a, b) => a - b);
    const medianDuration = sortedDurations[Math.floor(sortedDurations.length / 2)];
    const p95Duration = sortedDurations[Math.floor(sortedDurations.length * 0.95)];
    
    const memoryDeltas = metrics.map(m => m.memoryUsage.delta);
    const avgMemoryDelta = memoryDeltas.reduce((sum, d) => sum + d, 0) / memoryDeltas.length;
    const memoryEfficiency = Math.max(0, 100 - (avgMemoryDelta / (1024 * 1024))); // Score based on MB usage

    const recommendations = this.generateRecommendations(testName, averageDuration, memoryEfficiency, metrics);

    const result: BenchmarkResults = {
      testName,
      metrics,
      averageDuration,
      medianDuration,
      p95Duration,
      memoryEfficiency,
      recommendations
    };

    this.results.push(result);
    return result;
  }

  private generateRecommendations(
    testName: string, 
    avgDuration: number, 
    memoryEfficiency: number, 
    metrics: PerformanceMetrics[]
  ): string[] {
    const recommendations: string[] = [];

    // Performance-based recommendations
    if (avgDuration > 100) {
      recommendations.push('Consider implementing virtual scrolling for better performance');
    }
    if (avgDuration > 500) {
      recommendations.push('Implement server-side pagination to reduce client-side processing');
    }
    if (avgDuration > 50 && testName.includes('Search')) {
      recommendations.push('Add debouncing to search input to reduce API calls');
    }

    // Memory-based recommendations
    if (memoryEfficiency < 70) {
      recommendations.push('Consider implementing React.memo for component optimization');
    }
    if (memoryEfficiency < 50) {
      recommendations.push('Implement lazy loading and cleanup unused components');
    }

    // Scale-based recommendations
    const maxItems = Math.max(...metrics.map(m => m.itemCount));
    if (maxItems > 1000 && avgDuration > 200) {
      recommendations.push('Implement cursor-based pagination for large datasets');
    }
    if (maxItems > 5000) {
      recommendations.push('Consider server-side filtering and sorting');
    }

    return recommendations;
  }

  private generateOverallRecommendations(): string[] {
    const allRecommendations = this.results.flatMap(result => result.recommendations);
    const uniqueRecommendations = [...new Set(allRecommendations)];
    
    // Add general recommendations based on overall performance
    const overallScore = this.calculateOverallScore();
    if (overallScore < 70) {
      uniqueRecommendations.unshift('Consider implementing comprehensive performance optimizations');
    }
    if (overallScore < 50) {
      uniqueRecommendations.unshift('Performance is below acceptable thresholds - immediate optimization required');
    }

    return uniqueRecommendations;
  }

  private calculateOverallScore(): number {
    if (this.results.length === 0) return 0;
    
    const performanceScore = this.results.reduce((sum, result) => {
      // Score based on response time (lower is better)
      const perfScore = Math.max(0, 100 - (result.averageDuration / 10));
      return sum + perfScore;
    }, 0) / this.results.length;

    const memoryScore = this.results.reduce((sum, result) => sum + result.memoryEfficiency, 0) / this.results.length;
    
    return (performanceScore + memoryScore) / 2;
  }

  private getMemoryUsage(): any {
    if (typeof window !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory;
    }
    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0
    } as any;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility methods for generating realistic test data
  private getRandomFirstName(): string {
    const names = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica', 'William', 'Ashley'];
    return names[Math.floor(Math.random() * names.length)];
  }

  private getRandomLastName(): string {
    const names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    return names[Math.floor(Math.random() * names.length)];
  }

  private getRandomSuffix(): string {
    const suffixes = ['Jr.', 'Sr.', 'III', 'IV', ''];
    return suffixes[Math.floor(Math.random() * suffixes.length)];
  }

  private getRandomStreet(): string {
    const streets = ['Main St', 'Oak Ave', 'Elm Dr', 'Park Blvd', 'Cedar Ln', 'Maple Way', 'Pine St', 'First Ave'];
    return streets[Math.floor(Math.random() * streets.length)];
  }

  private getRandomCity(): string {
    const cities = ['Springfield', 'Madison', 'Franklin', 'Georgetown', 'Arlington', 'Fairview', 'Clinton', 'Bristol'];
    return cities[Math.floor(Math.random() * cities.length)];
  }

  private getRandomState(): string {
    const states = ['CA', 'TX', 'NY', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];
    return states[Math.floor(Math.random() * states.length)];
  }

  private generatePhoneNumber(): string {
    const areaCode = Math.floor(Math.random() * 800) + 200;
    const exchange = Math.floor(Math.random() * 800) + 200;
    const number = Math.floor(Math.random() * 9000) + 1000;
    return `${areaCode}-${exchange}-${number}`;
  }

  private generateCustomFields(index: number) {
    return [
      {
        id: index * 10 + 1,
        customFieldId: 1,
        fieldLabel: 'Department',
        fieldType: 'text',
        fieldValue: ['Engineering', 'Marketing', 'Sales', 'HR'][index % 4],
        updatedAt: new Date().toISOString()
      },
      {
        id: index * 10 + 2,
        customFieldId: 2,
        fieldLabel: 'Years of Experience',
        fieldType: 'number',
        fieldValue: (Math.floor(Math.random() * 20) + 1).toString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  /**
   * Clear all benchmark results
   */
  clearResults(): void {
    this.results = [];
  }

  /**
   * Export results to JSON
   */
  exportResults(): string {
    return JSON.stringify(this.generateComprehensiveReport(), null, 2);
  }

  /**
   * Cleanup performance observer
   */
  dispose(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Singleton instance
export const memberListBenchmark = new MemberListBenchmark();

// Utility functions for common benchmarking scenarios
export const benchmarkUtils = {
  /**
   * Quick performance test for member list rendering
   */
  async quickPerformanceTest(memberCount: number): Promise<PerformanceMetrics> {
    const startTime = performance.now();
    const beforeMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    // Simulate data processing
    const testData = memberListBenchmark.generateTestMembers(memberCount);
    
    // Simulate rendering work
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        // Simulate DOM manipulation
        const fragment = document.createDocumentFragment();
        testData.slice(0, 25).forEach(member => {
          const div = document.createElement('div');
          div.textContent = member.fullName;
          fragment.appendChild(div);
        });
        resolve(null);
      });
    });
    
    const endTime = performance.now();
    const afterMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    return {
      operation: `quick-test-${memberCount}-members`,
      duration: endTime - startTime,
      memoryUsage: {
        before: beforeMemory,
        after: afterMemory,
        peak: afterMemory,
        delta: afterMemory - beforeMemory
      },
      itemCount: memberCount,
      timestamp: Date.now()
    };
  },

  /**
   * Test search performance with common search terms
   */
  async searchPerformanceTest(members: MemberResponse[]): Promise<PerformanceMetrics[]> {
    const searchTerms = ['john', 'test', 'member', '@', '.com', 'smith'];
    const results: PerformanceMetrics[] = [];
    
    for (const term of searchTerms) {
      const startTime = performance.now();
      const beforeMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      const searchResults = members.filter(member => 
        member.fullName.toLowerCase().includes(term.toLowerCase()) ||
        member.email.toLowerCase().includes(term.toLowerCase())
      );
      
      const endTime = performance.now();
      const afterMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      results.push({
        operation: `search-${term}`,
        duration: endTime - startTime,
        memoryUsage: {
          before: beforeMemory,
          after: afterMemory,
          peak: afterMemory,
          delta: afterMemory - beforeMemory
        },
        itemCount: searchResults.length,
        timestamp: Date.now()
      });
    }
    
    return results;
  }
};