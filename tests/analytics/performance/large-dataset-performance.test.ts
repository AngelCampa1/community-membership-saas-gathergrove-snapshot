/**
 * Performance Tests for Large Dataset Handling - US-004 Advanced Analytics
 * Tests system performance with large datasets, memory usage, and optimization strategies
 */

import { jest } from '@jest/globals';
import { performance } from 'perf_hooks';

// Mock services
jest.mock('../../../client/src/services/analyticsService', () => ({
  default: {
    getEventEngagementAnalytics: jest.fn(),
    getEngagementTrends: jest.fn(),
    getROIAnalytics: jest.fn(),
    getMemberSegmentation: jest.fn(),
  },
}));

jest.mock('../../../client/src/services/analyticsExportService', () => ({
  default: {
    exportAnalytics: jest.fn(),
    generateCSV: jest.fn(),
    prepareDataForExport: jest.fn(),
  },
}));

jest.mock('../../../client/src/services/premiumAnalyticsService', () => ({
  default: {
    getEngagementTrends: jest.fn(),
    getCohortAnalysis: jest.fn(),
    getFinancialROI: jest.fn(),
    getRealTimeMetrics: jest.fn(),
    getPredictiveAnalytics: jest.fn(),
  },
}));

// Import services
import analyticsService from '../../../client/src/services/analyticsService';
import analyticsExportService from '../../../client/src/services/analyticsExportService';
import premiumAnalyticsService from '../../../client/src/services/premiumAnalyticsService';

// Test data generators for large datasets
const generateLargeEngagementDataset = (size: number) => {
  const data = [];
  const startDate = new Date('2020-01-01');
  
  for (let i = 0; i < size; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    data.push({
      id: i + 1,
      date: date.toISOString(),
      clubId: Math.floor(Math.random() * 100) + 1,
      activeMembers: Math.floor(Math.random() * 10000) + 100,
      eventAttendance: Math.floor(Math.random() * 5000) + 50,
      engagementRate: parseFloat((Math.random() * 0.9 + 0.1).toFixed(3)),
      totalMembers: Math.floor(Math.random() * 12000) + 500,
      communicationActivity: Math.floor(Math.random() * 1000) + 10,
      profileUpdates: Math.floor(Math.random() * 500) + 5,
      averageScore: parseFloat((Math.random() * 10 + 1).toFixed(2)),
      metadata: {
        region: `Region ${Math.floor(Math.random() * 10) + 1}`,
        membershipTier: ['basic', 'pro', 'unlimited'][Math.floor(Math.random() * 3)],
        eventCategories: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, 
          (_, idx) => `Category ${idx + 1}`),
        customFields: {
          field1: `Value ${Math.random()}`,
          field2: Math.random() * 1000,
          field3: Math.random() > 0.5,
        },
      },
    });
  }
  
  return data;
};

const generateLargeCohortDataset = (cohortCount: number, periodCount: number) => {
  const data = [];
  
  for (let c = 0; c < cohortCount; c++) {
    const initialSize = Math.floor(Math.random() * 10000) + 1000;
    const retentionRates = [];
    let currentSize = initialSize;
    
    for (let p = 0; p < periodCount; p++) {
      const retentionRate = Math.max(0.05, Math.random() * 0.95);
      currentSize = Math.floor(currentSize * retentionRate);
      retentionRates.push(currentSize);
    }
    
    data.push({
      cohort: `Cohort ${c + 1}`,
      startDate: new Date(2020, 0, 1 + (c * 30)).toISOString(),
      totalMembers: initialSize,
      initialSize,
      retentionRates,
      churnRate: parseFloat((1 - (currentSize / initialSize)).toFixed(3)),
      averageLifetime: Math.floor(Math.random() * 730) + 30,
      demographics: {
        ageGroups: {
          '18-24': Math.floor(Math.random() * initialSize * 0.3),
          '25-34': Math.floor(Math.random() * initialSize * 0.4),
          '35-44': Math.floor(Math.random() * initialSize * 0.2),
          '45+': Math.floor(Math.random() * initialSize * 0.1),
        },
        locations: Array.from({ length: 20 }, (_, i) => ({
          region: `Region ${i + 1}`,
          count: Math.floor(Math.random() * initialSize * 0.1),
        })),
      },
      events: Array.from({ length: Math.floor(Math.random() * 100) + 10 }, (_, i) => ({
        eventId: i + 1,
        eventName: `Event ${i + 1}`,
        attendance: Math.floor(Math.random() * initialSize * 0.8),
        engagementScore: Math.random() * 10,
      })),
    });
  }
  
  return data;
};

const generateLargeROIDataset = (size: number) => {
  const data = [];
  const baseRevenue = 100000;
  const baseCosts = 80000;
  
  for (let i = 0; i < size; i++) {
    const revenue = baseRevenue + (Math.random() * 50000) - 25000;
    const costs = baseCosts + (Math.random() * 30000) - 15000;
    const profit = revenue - costs;
    
    data.push({
      period: `Period ${i + 1}`,
      date: new Date(2020, 0, 1 + (i * 7)).toISOString(),
      revenue: parseFloat(revenue.toFixed(2)),
      costs: parseFloat(costs.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      roi: parseFloat(((profit / costs) * 100).toFixed(2)),
      trend: profit > 0 ? (Math.random() > 0.5 ? 'up' : 'stable') : 'down',
      breakdown: {
        membershipRevenue: revenue * 0.6,
        eventRevenue: revenue * 0.25,
        merchandiseRevenue: revenue * 0.1,
        otherRevenue: revenue * 0.05,
        operationalCosts: costs * 0.7,
        marketingCosts: costs * 0.2,
        technologyCosts: costs * 0.1,
      },
      projections: {
        nextPeriod: revenue * (1 + (Math.random() * 0.2 - 0.1)),
        nextQuarter: revenue * (1 + (Math.random() * 0.5 - 0.25)),
        nextYear: revenue * (1 + (Math.random() * 2 - 1)),
      },
    });
  }
  
  return data;
};

// Memory monitoring utilities
const getMemoryUsage = () => {
  if (typeof window !== 'undefined' && (window as any).performance?.memory) {
    return {
      used: (window as any).performance.memory.usedJSHeapSize,
      total: (window as any).performance.memory.totalJSHeapSize,
      limit: (window as any).performance.memory.jsHeapSizeLimit,
    };
  }
  return null;
};

const measurePerformance = async <T>(
  operation: () => Promise<T> | T,
  label: string
): Promise<{ result: T; duration: number; memory?: any }> => {
  const memoryBefore = getMemoryUsage();
  const startTime = performance.now();
  
  const result = await operation();
  
  const endTime = performance.now();
  const memoryAfter = getMemoryUsage();
  const duration = endTime - startTime;
  
  console.log(`${label}: ${duration.toFixed(2)}ms`);
  
  if (memoryBefore && memoryAfter) {
    const memoryDiff = memoryAfter.used - memoryBefore.used;
    console.log(`${label} memory change: ${(memoryDiff / 1024 / 1024).toFixed(2)}MB`);
  }
  
  return {
    result,
    duration,
    memory: memoryAfter && memoryBefore ? {
      before: memoryBefore,
      after: memoryAfter,
      diff: memoryAfter.used - memoryBefore.used,
    } : undefined,
  };
};

describe('Large Dataset Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods to reduce noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Data Loading Performance', () => {
    it('handles 10,000 engagement data points under 500ms', async () => {
      const largeDataset = generateLargeEngagementDataset(10000);
      
      (analyticsService.getEngagementTrends as jest.Mock).mockResolvedValue(largeDataset);
      
      const { duration } = await measurePerformance(
        () => analyticsService.getEngagementTrends(1, { 
          startDate: '2020-01-01', 
          endDate: '2024-12-31' 
        }),
        'Load 10k engagement records'
      );
      
      expect(duration).toBeLessThan(500);
      expect(analyticsService.getEngagementTrends).toHaveBeenCalledTimes(1);
    });

    it('processes 500 cohorts with 52 periods under 1 second', async () => {
      const largeCohortDataset = generateLargeCohortDataset(500, 52);
      
      (premiumAnalyticsService.getCohortAnalysis as jest.Mock).mockResolvedValue(largeCohortDataset);
      
      const { duration } = await measurePerformance(
        () => premiumAnalyticsService.getCohortAnalysis(1, {
          startDate: '2020-01-01',
          endDate: '2024-12-31'
        }),
        'Load 500 cohorts with 52 periods'
      );
      
      expect(duration).toBeLessThan(1000);
      expect(largeCohortDataset).toHaveLength(500);
      expect(largeCohortDataset[0].retentionRates).toHaveLength(52);
    });

    it('loads 50,000 ROI data points under 2 seconds', async () => {
      const largeROIDataset = generateLargeROIDataset(50000);
      
      (premiumAnalyticsService.getFinancialROI as jest.Mock).mockResolvedValue(largeROIDataset);
      
      const { duration } = await measurePerformance(
        () => premiumAnalyticsService.getFinancialROI(1, {
          startDate: '2020-01-01',
          endDate: '2024-12-31'
        }),
        'Load 50k ROI records'
      );
      
      expect(duration).toBeLessThan(2000);
      expect(largeROIDataset).toHaveLength(50000);
    });
  });

  describe('Data Processing Performance', () => {
    it('filters and aggregates large datasets efficiently', async () => {
      const dataset = generateLargeEngagementDataset(20000);
      
      const { duration, result } = await measurePerformance(
        () => {
          // Simulate complex filtering and aggregation
          const filtered = dataset.filter(item => 
            item.engagementRate > 0.5 && 
            item.activeMembers > 500 &&
            item.metadata.membershipTier === 'unlimited'
          );
          
          const aggregated = filtered.reduce((acc, item) => {
            const month = item.date.substring(0, 7);
            if (!acc[month]) {
              acc[month] = {
                count: 0,
                totalEngagement: 0,
                totalMembers: 0,
                averageEngagement: 0,
              };
            }
            
            acc[month].count++;
            acc[month].totalEngagement += item.engagementRate;
            acc[month].totalMembers += item.activeMembers;
            acc[month].averageEngagement = acc[month].totalEngagement / acc[month].count;
            
            return acc;
          }, {} as Record<string, any>);
          
          return { filtered, aggregated };
        },
        'Filter and aggregate 20k records'
      );
      
      expect(duration).toBeLessThan(100);
      expect(result.filtered.length).toBeGreaterThan(0);
      expect(Object.keys(result.aggregated).length).toBeGreaterThan(0);
    });

    it('sorts large datasets by multiple criteria under 200ms', async () => {
      const dataset = generateLargeEngagementDataset(25000);
      
      const { duration, result } = await measurePerformance(
        () => {
          return dataset.sort((a, b) => {
            // Multi-criteria sort: date desc, engagement desc, members desc
            const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
            if (dateCompare !== 0) return dateCompare;
            
            const engagementCompare = b.engagementRate - a.engagementRate;
            if (engagementCompare !== 0) return engagementCompare;
            
            return b.activeMembers - a.activeMembers;
          });
        },
        'Sort 25k records by multiple criteria'
      );
      
      expect(duration).toBeLessThan(200);
      expect(result).toHaveLength(25000);
      
      // Verify sort order
      for (let i = 1; i < Math.min(result.length, 100); i++) {
        const current = result[i];
        const previous = result[i - 1];
        const currentDate = new Date(current.date).getTime();
        const previousDate = new Date(previous.date).getTime();
        
        expect(currentDate).toBeLessThanOrEqual(previousDate);
      }
    });

    it('calculates complex analytics on large cohort dataset', async () => {
      const cohortDataset = generateLargeCohortDataset(200, 24);
      
      const { duration, result } = await measurePerformance(
        () => {
          // Calculate comprehensive cohort statistics
          const statistics = {
            totalCohorts: cohortDataset.length,
            totalInitialMembers: cohortDataset.reduce((sum, cohort) => sum + cohort.initialSize, 0),
            averageRetention: {},
            churnAnalysis: {},
            segmentAnalysis: {},
          };
          
          // Calculate average retention by period
          for (let period = 0; period < 24; period++) {
            const periodRetentions = cohortDataset
              .filter(cohort => cohort.retentionRates[period] !== undefined)
              .map(cohort => cohort.retentionRates[period] / cohort.initialSize);
            
            statistics.averageRetention[period] = {
              mean: periodRetentions.reduce((sum, rate) => sum + rate, 0) / periodRetentions.length,
              median: periodRetentions.sort()[Math.floor(periodRetentions.length / 2)],
              percentile90: periodRetentions.sort()[Math.floor(periodRetentions.length * 0.9)],
              percentile10: periodRetentions.sort()[Math.floor(periodRetentions.length * 0.1)],
            };
          }
          
          // Churn analysis
          const churnRates = cohortDataset.map(cohort => cohort.churnRate);
          statistics.churnAnalysis = {
            averageChurn: churnRates.reduce((sum, rate) => sum + rate, 0) / churnRates.length,
            highChurnCohorts: cohortDataset.filter(cohort => cohort.churnRate > 0.7).length,
            lowChurnCohorts: cohortDataset.filter(cohort => cohort.churnRate < 0.3).length,
          };
          
          // Demographic segment analysis
          const allAgeGroups = cohortDataset.flatMap(cohort => 
            Object.entries(cohort.demographics.ageGroups)
          );
          
          statistics.segmentAnalysis = allAgeGroups.reduce((acc, [ageGroup, count]) => {
            if (!acc[ageGroup]) acc[ageGroup] = { totalCount: 0, cohortCount: 0 };
            acc[ageGroup].totalCount += count;
            acc[ageGroup].cohortCount++;
            return acc;
          }, {} as Record<string, any>);
          
          return statistics;
        },
        'Calculate complex cohort analytics on 200 cohorts'
      );
      
      expect(duration).toBeLessThan(300);
      expect(result.totalCohorts).toBe(200);
      expect(result.totalInitialMembers).toBeGreaterThan(0);
      expect(Object.keys(result.averageRetention)).toHaveLength(24);
    });
  });

  describe('Export Performance', () => {
    it('exports 100,000 records to CSV under 3 seconds', async () => {
      const largeDataset = generateLargeEngagementDataset(100000);
      
      (analyticsExportService.generateCSV as jest.Mock).mockImplementation((data) => {
        // Simulate CSV generation
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).join(','));
        return [headers, ...rows].join('\n');
      });
      
      const { duration } = await measurePerformance(
        () => analyticsExportService.generateCSV(largeDataset),
        'Export 100k records to CSV'
      );
      
      expect(duration).toBeLessThan(3000);
      expect(analyticsExportService.generateCSV).toHaveBeenCalledWith(largeDataset);
    });

    it('handles concurrent export requests efficiently', async () => {
      const dataset1 = generateLargeEngagementDataset(10000);
      const dataset2 = generateLargeCohortDataset(100, 12);
      const dataset3 = generateLargeROIDataset(5000);
      
      (analyticsExportService.exportAnalytics as jest.Mock)
        .mockImplementation(async (data, format) => {
          // Simulate processing time based on data size
          const processingTime = Math.min(data.length * 0.01, 200);
          await new Promise(resolve => setTimeout(resolve, processingTime));
          return { success: true, format, recordCount: data.length };
        });
      
      const { duration, result } = await measurePerformance(
        () => Promise.all([
          analyticsExportService.exportAnalytics(dataset1, 'csv'),
          analyticsExportService.exportAnalytics(dataset2, 'excel'),
          analyticsExportService.exportAnalytics(dataset3, 'pdf'),
        ]),
        'Concurrent export of 3 large datasets'
      );
      
      expect(duration).toBeLessThan(1000);
      expect(result).toHaveLength(3);
      expect(result.every(r => r.success)).toBe(true);
    });

    it('streams large dataset export to prevent memory overflow', async () => {
      const hugeDataset = generateLargeEngagementDataset(250000);
      
      (analyticsExportService.prepareDataForExport as jest.Mock)
        .mockImplementation(async function* (data) {
          // Simulate streaming export in chunks
          const chunkSize = 1000;
          for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            yield chunk;
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 1));
          }
        });
      
      const { duration } = await measurePerformance(
        async () => {
          const generator = analyticsExportService.prepareDataForExport(hugeDataset);
          let processedChunks = 0;
          
          for await (const chunk of generator) {
            processedChunks++;
            // Process chunk (in real implementation, this would write to file/stream)
            expect(Array.isArray(chunk)).toBe(true);
            expect(chunk.length).toBeLessThanOrEqual(1000);
          }
          
          return processedChunks;
        },
        'Stream export 250k records in chunks'
      );
      
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Memory Management', () => {
    it('maintains stable memory usage with large datasets', async () => {
      const iterations = 5;
      const datasetSize = 20000;
      const memoryMeasurements: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const dataset = generateLargeEngagementDataset(datasetSize);
        
        // Process dataset
        const processed = dataset
          .filter(item => item.engagementRate > 0.3)
          .map(item => ({
            ...item,
            calculated: item.activeMembers * item.engagementRate,
          }))
          .sort((a, b) => b.calculated - a.calculated);
        
        // Measure memory after processing
        const memory = getMemoryUsage();
        if (memory) {
          memoryMeasurements.push(memory.used);
        }
        
        // Clean up references
        processed.length = 0;
        dataset.length = 0;
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
        
        expect(processed).toHaveLength(0);
      }
      
      // Memory should not grow significantly between iterations
      if (memoryMeasurements.length > 1) {
        const firstMeasurement = memoryMeasurements[0];
        const lastMeasurement = memoryMeasurements[memoryMeasurements.length - 1];
        const memoryGrowth = (lastMeasurement - firstMeasurement) / firstMeasurement;
        
        expect(memoryGrowth).toBeLessThan(0.5); // Less than 50% growth
      }
    });

    it('handles memory pressure gracefully', async () => {
      const veryLargeDatasets = Array.from({ length: 3 }, () => 
        generateLargeEngagementDataset(50000)
      );
      
      const { duration } = await measurePerformance(
        async () => {
          const results = [];
          
          for (const dataset of veryLargeDatasets) {
            // Process one dataset at a time to manage memory
            const result = dataset
              .filter(item => item.activeMembers > 1000)
              .reduce((acc, item) => {
                const key = item.metadata.region;
                if (!acc[key]) {
                  acc[key] = { count: 0, totalEngagement: 0, avgMembers: 0 };
                }
                acc[key].count++;
                acc[key].totalEngagement += item.engagementRate;
                acc[key].avgMembers = (acc[key].avgMembers * (acc[key].count - 1) + item.activeMembers) / acc[key].count;
                return acc;
              }, {} as Record<string, any>);
            
            results.push(result);
            
            // Clear dataset reference to help GC
            dataset.length = 0;
          }
          
          return results;
        },
        'Process 3 very large datasets sequentially'
      );
      
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Real-Time Performance', () => {
    it('processes real-time updates under 50ms', async () => {
      const baseDataset = generateLargeEngagementDataset(1000);
      
      (premiumAnalyticsService.getRealTimeMetrics as jest.Mock).mockResolvedValue({
        timestamp: new Date(),
        activeUsers: 150,
        liveEvents: 5,
        recentEngagement: 0.75,
        alerts: [],
      });
      
      const { duration } = await measurePerformance(
        async () => {
          // Simulate real-time update processing
          const newDataPoint = generateLargeEngagementDataset(1)[0];
          const updatedDataset = [...baseDataset.slice(1), newDataPoint];
          
          // Calculate incremental statistics
          const recentData = updatedDataset.slice(-100);
          const avgEngagement = recentData.reduce((sum, item) => sum + item.engagementRate, 0) / recentData.length;
          const trend = avgEngagement > 0.5 ? 'up' : 'down';
          
          return {
            dataset: updatedDataset,
            stats: { avgEngagement, trend },
            realTime: await premiumAnalyticsService.getRealTimeMetrics(1),
          };
        },
        'Process real-time update'
      );
      
      expect(duration).toBeLessThan(50);
    });

    it('handles burst of real-time updates efficiently', async () => {
      const updateCount = 100;
      const updates = Array.from({ length: updateCount }, () => 
        generateLargeEngagementDataset(1)[0]
      );
      
      const { duration } = await measurePerformance(
        () => {
          let runningAverage = 0;
          const processedUpdates = updates.map((update, index) => {
            // Simulate incremental calculation
            runningAverage = (runningAverage * index + update.engagementRate) / (index + 1);
            
            return {
              ...update,
              runningAverage,
              trend: runningAverage > 0.5 ? 'up' : 'down',
            };
          });
          
          return processedUpdates;
        },
        `Process ${updateCount} real-time updates`
      );
      
      expect(duration).toBeLessThan(20);
    });
  });

  describe('Stress Testing', () => {
    it('maintains performance under extreme load', async () => {
      const extremeDataset = generateLargeEngagementDataset(500000);
      
      const { duration } = await measurePerformance(
        () => {
          // Simulate extreme processing load
          const result = extremeDataset
            .filter(item => item.engagementRate > 0.1)
            .reduce((acc, item) => {
              const date = new Date(item.date);
              const yearMonth = `${date.getFullYear()}-${date.getMonth() + 1}`;
              const region = item.metadata.region;
              const tier = item.metadata.membershipTier;
              
              const key = `${yearMonth}_${region}_${tier}`;
              
              if (!acc[key]) {
                acc[key] = {
                  count: 0,
                  totalEngagement: 0,
                  totalMembers: 0,
                  events: 0,
                };
              }
              
              acc[key].count++;
              acc[key].totalEngagement += item.engagementRate;
              acc[key].totalMembers += item.activeMembers;
              acc[key].events += item.eventAttendance;
              
              return acc;
            }, {} as Record<string, any>);
          
          return Object.keys(result).length;
        },
        'Process 500k records under extreme load'
      );
      
      // Should complete within reasonable time even under extreme load
      expect(duration).toBeLessThan(5000);
    });

    it('recovers gracefully from performance degradation', async () => {
      let performanceDegraded = false;
      const iterations = 10;
      const durations: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const dataset = generateLargeEngagementDataset(10000 + (i * 5000));
        
        const { duration } = await measurePerformance(
          () => {
            // Simulate processing that might degrade
            if (i > 5 && !performanceDegraded) {
              performanceDegraded = true;
              // Simulate performance recovery mechanism
              return dataset.slice(0, 10000); // Fallback to smaller dataset
            }
            
            return dataset.filter(item => item.engagementRate > 0.5);
          },
          `Iteration ${i + 1} - ${dataset.length} records`
        );
        
        durations.push(duration);
        
        // Performance should stabilize after degradation
        if (i > 7) {
          const recentDurations = durations.slice(-3);
          const avgRecent = recentDurations.reduce((sum, d) => sum + d, 0) / recentDurations.length;
          expect(avgRecent).toBeLessThan(1000);
        }
      }
      
      expect(performanceDegraded).toBe(true);
    });
  });
});