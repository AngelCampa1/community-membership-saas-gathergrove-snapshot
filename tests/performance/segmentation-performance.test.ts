/**
 * Performance Tests for Member Segmentation
 * Test large dataset operations and bulk actions performance
 */

import { performance } from 'perf_hooks';
import { customFieldsService } from '@/services/customFieldsService';
import { memberTaggingService } from '@/services/memberTaggingService';
import { memberSegmentationService } from '@/services/memberSegmentationService';
import { bulkOperationsService } from '@/services/bulkOperationsService';
import { setupPerformanceTestDatabase, cleanupPerformanceTestDatabase } from '@/tests/utils/performance-helpers';
import { createLargeMemberDataset, createManyCustomFields, createManyTags } from '@/tests/utils/data-generators';

describe('Member Segmentation Performance Tests', () => {
  let testDb: any;
  let testClub: any;
  let largeDataset: any;

  const PERFORMANCE_THRESHOLDS = {
    customFieldsCRUD: 500, // 500ms
    tagOperations: 300, // 300ms
    segmentPreview: 2000, // 2s
    segmentCreation: 1500, // 1.5s
    bulkOperations: 5000, // 5s
    largeSegmentQuery: 3000, // 3s
    complexFilterQuery: 4000 // 4s
  };

  beforeAll(async () => {
    testDb = await setupPerformanceTestDatabase();
    testClub = await createTestClub(testDb, { name: 'Performance Test Club' });
    
    // Create large dataset for performance testing
    console.log('Creating large dataset for performance testing...');
    largeDataset = await createLargeMemberDataset(testDb, testClub.id, {
      memberCount: 10000,
      customFieldsCount: 50,
      tagsCount: 100,
      memberTagAssignments: 25000
    });
    console.log('Large dataset created successfully');
  }, 300000); // 5 minute timeout for data setup

  afterAll(async () => {
    await cleanupPerformanceTestDatabase(testDb);
  }, 60000);

  describe('Custom Fields Performance', () => {
    it('should retrieve custom fields quickly with large dataset', async () => {
      const startTime = performance.now();
      
      const customFields = await customFieldsService.getCustomFields(testClub.id);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(customFields).toHaveLength(largeDataset.customFieldsCount);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.customFieldsCRUD);
      
      console.log(`Custom fields retrieval: ${executionTime.toFixed(2)}ms for ${customFields.length} fields`);
    });

    it('should create custom fields efficiently', async () => {
      const fieldData = {
        fieldName: 'Performance Test Field',
        fieldType: 'TEXT',
        isRequired: false,
        sortOrder: 999
      };

      const startTime = performance.now();
      
      const newField = await customFieldsService.createCustomField(testClub.id, fieldData);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(newField.id).toBeDefined();
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.customFieldsCRUD);
      
      console.log(`Custom field creation: ${executionTime.toFixed(2)}ms`);
    });

    it('should handle bulk custom field value updates efficiently', async () => {
      const memberIds = largeDataset.members.slice(0, 1000).map((m: any) => m.id);
      const fieldUpdates = {
        [`customField.${largeDataset.customFields[0].id}`]: 'Bulk Update Value'
      };

      const startTime = performance.now();
      
      const result = await customFieldsService.bulkSetCustomFieldValues(
        testClub.id,
        memberIds.map((memberId: string) => ({
          memberId,
          fieldId: largeDataset.customFields[0].id,
          fieldValue: 'Bulk Update Value'
        }))
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.updated).toBe(1000);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.bulkOperations);
      
      console.log(`Bulk custom field update: ${executionTime.toFixed(2)}ms for ${memberIds.length} members`);
    });

    it('should query custom field values efficiently for large datasets', async () => {
      const startTime = performance.now();
      
      const values = await customFieldsService.getCustomFieldValues(
        testClub.id,
        undefined,
        largeDataset.customFields[0].id
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(values.length).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.customFieldsCRUD);
      
      console.log(`Custom field values query: ${executionTime.toFixed(2)}ms for ${values.length} values`);
    });

    it('should generate custom field statistics efficiently', async () => {
      const startTime = performance.now();
      
      const stats = await customFieldsService.getCustomFieldAnalytics(testClub.id);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(stats.totalFields).toBeGreaterThan(0);
      expect(stats.totalValues).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.customFieldsCRUD);
      
      console.log(`Custom field stats generation: ${executionTime.toFixed(2)}ms`);
    });
  });

  describe('Member Tagging Performance', () => {
    it('should retrieve tags quickly with large dataset', async () => {
      const startTime = performance.now();
      
      const tags = await memberTaggingService.getTags(testClub.id);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(tags).toHaveLength(largeDataset.tagsCount);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.tagOperations);
      
      console.log(`Tags retrieval: ${executionTime.toFixed(2)}ms for ${tags.length} tags`);
    });

    it('should handle bulk tag assignments efficiently', async () => {
      const memberIds = largeDataset.members.slice(0, 2000).map((m: any) => m.id);
      const tagIds = largeDataset.tags.slice(0, 5).map((t: any) => t.id);

      const startTime = performance.now();
      
      const result = await memberTaggingService.bulkAssignTags(testClub.id, {
        memberIds,
        tagIds,
        assignedBy: 'performance-test'
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.assignmentsCreated).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.bulkOperations);
      
      console.log(`Bulk tag assignment: ${executionTime.toFixed(2)}ms for ${memberIds.length} members x ${tagIds.length} tags`);
    });

    it('should search tagged members efficiently', async () => {
      const searchFilters = {
        tagIds: largeDataset.tags.slice(0, 10).map((t: any) => t.id),
        tagOperation: 'OR' as const,
        searchTerm: 'member'
      };

      const startTime = performance.now();
      
      const results = await memberTaggingService.searchTaggedMembers(
        testClub.id,
        searchFilters
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(results.members).toBeDefined();
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.tagOperations * 3); // More lenient for complex search
      
      console.log(`Tagged member search: ${executionTime.toFixed(2)}ms for ${results.totalCount} results`);
    });

    it('should generate tag statistics efficiently', async () => {
      const startTime = performance.now();
      
      const stats = await memberTaggingService.getTagStats(testClub.id);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(stats.totalTags).toBeGreaterThan(0);
      expect(stats.totalAssignments).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.tagOperations);
      
      console.log(`Tag stats generation: ${executionTime.toFixed(2)}ms`);
    });
  });

  describe('Member Segmentation Performance', () => {
    it('should preview simple segments efficiently', async () => {
      const simpleFilter = {
        conditions: [
          {
            field: 'status',
            operator: 'EQUALS',
            value: 'Active'
          }
        ]
      };

      const startTime = performance.now();
      
      const preview = await memberSegmentationService.previewSegment(
        testClub.id,
        simpleFilter
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(preview.totalCount).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.segmentPreview);
      
      console.log(`Simple segment preview: ${executionTime.toFixed(2)}ms for ${preview.totalCount} members`);
    });

    it('should preview complex segments with multiple conditions efficiently', async () => {
      const complexFilter = {
        conditions: [
          {
            field: 'status',
            operator: 'EQUALS',
            value: 'Active',
            logicalOperator: 'AND'
          },
          {
            field: 'joinDate',
            operator: 'GREATER_THAN',
            value: '2024-01-01',
            logicalOperator: 'AND'
          },
          {
            field: `customField.${largeDataset.customFields[0].id}`,
            operator: 'IS_NOT_EMPTY',
            value: ''
          }
        ],
        tagFilters: {
          includeTags: largeDataset.tags.slice(0, 5).map((t: any) => t.id),
          tagOperation: 'OR'
        }
      };

      const startTime = performance.now();
      
      const preview = await memberSegmentationService.previewSegment(
        testClub.id,
        complexFilter
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(preview.totalCount).toBeGreaterThanOrEqual(0);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.complexFilterQuery);
      
      console.log(`Complex segment preview: ${executionTime.toFixed(2)}ms for ${preview.totalCount} members`);
    });

    it('should create segments efficiently', async () => {
      const segmentData = {
        segmentName: 'Performance Test Segment',
        filterCriteria: {
          conditions: [
            {
              field: 'status',
              operator: 'EQUALS',
              value: 'Active'
            }
          ]
        }
      };

      const startTime = performance.now();
      
      const segment = await memberSegmentationService.createSegment(
        testClub.id,
        segmentData,
        'performance-test'
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(segment.id).toBeDefined();
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.segmentCreation);
      
      console.log(`Segment creation: ${executionTime.toFixed(2)}ms`);
    });

    it('should retrieve large segment member lists efficiently with pagination', async () => {
      // Create a segment that will match many members
      const segment = await memberSegmentationService.createSegment(
        testClub.id,
        {
          segmentName: 'Large Segment Test',
          filterCriteria: {
            conditions: [
              {
                field: 'status',
                operator: 'IN',
                value: 'Active,Inactive'
              }
            ]
          }
        },
        'performance-test'
      );

      const startTime = performance.now();
      
      const members = await memberSegmentationService.getSegmentMembers(
        testClub.id,
        segment.id,
        { page: 1, pageSize: 100 }
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(members.members).toHaveLength(100);
      expect(members.totalCount).toBeGreaterThan(100);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.largeSegmentQuery);
      
      console.log(`Large segment query: ${executionTime.toFixed(2)}ms for page 1 of ${members.totalCount} members`);
    });

    it('should refresh segment counts efficiently for all segments', async () => {
      const startTime = performance.now();
      
      const result = await memberSegmentationService.refreshSegmentCounts(testClub.id);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.updatedSegments).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.bulkOperations);
      
      console.log(`Segment count refresh: ${executionTime.toFixed(2)}ms for ${result.updatedSegments} segments`);
    });

    it('should export large segments efficiently', async () => {
      // Get a segment with many members
      const segments = await memberSegmentationService.getSegments(testClub.id);
      const largeSegment = segments.find((s: any) => s.memberCount > 1000);

      if (!largeSegment) {
        console.log('Skipping large segment export test - no large segment available');
        return;
      }

      const startTime = performance.now();
      
      const exportResult = await memberSegmentationService.exportSegmentData(
        testClub.id,
        largeSegment.id,
        { format: 'csv', includeCustomFields: true }
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(exportResult.segment).toBeDefined();
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.bulkOperations * 2); // More lenient for exports
      
      console.log(`Segment export: ${executionTime.toFixed(2)}ms for ${largeSegment.memberCount} members`);
    });
  });

  describe('Bulk Operations Performance', () => {
    it('should execute bulk custom field updates efficiently', async () => {
      const memberIds = largeDataset.members.slice(0, 5000).map((m: any) => m.id);
      const fieldUpdates = {
        [`customField.${largeDataset.customFields[1].id}`]: 'Performance Test Value'
      };

      const startTime = performance.now();
      
      const result = await bulkOperationsService.bulkUpdateCustomFields(
        testClub.id,
        memberIds,
        fieldUpdates,
        'performance-test'
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.successfulRecords).toBe(memberIds.length);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.bulkOperations);
      
      console.log(`Bulk custom field update: ${executionTime.toFixed(2)}ms for ${memberIds.length} members`);
    });

    it('should execute bulk tag operations efficiently', async () => {
      const memberIds = largeDataset.members.slice(0, 3000).map((m: any) => m.id);
      const tagIds = largeDataset.tags.slice(10, 15).map((t: any) => t.id);

      const startTime = performance.now();
      
      const result = await bulkOperationsService.bulkAssignTags(
        testClub.id,
        memberIds,
        tagIds,
        'performance-test'
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.assignmentsCreated).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.bulkOperations);
      
      console.log(`Bulk tag assignment: ${executionTime.toFixed(2)}ms for ${memberIds.length} members x ${tagIds.length} tags`);
    });

    it('should execute bulk status updates efficiently', async () => {
      const memberIds = largeDataset.members.slice(0, 2500).map((m: any) => m.id);

      const startTime = performance.now();
      
      const result = await bulkOperationsService.bulkUpdateMemberStatus(
        testClub.id,
        memberIds,
        'Inactive',
        'Performance test bulk update',
        'performance-test'
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.successfulRecords).toBe(memberIds.length);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.bulkOperations);
      
      console.log(`Bulk status update: ${executionTime.toFixed(2)}ms for ${memberIds.length} members`);
    });

    it('should handle concurrent bulk operations efficiently', async () => {
      const memberChunks = [
        largeDataset.members.slice(0, 1000).map((m: any) => m.id),
        largeDataset.members.slice(1000, 2000).map((m: any) => m.id),
        largeDataset.members.slice(2000, 3000).map((m: any) => m.id)
      ];

      const startTime = performance.now();
      
      const results = await Promise.all([
        bulkOperationsService.bulkUpdateCustomFields(
          testClub.id,
          memberChunks[0],
          { [`customField.${largeDataset.customFields[2].id}`]: 'Concurrent Test 1' },
          'performance-test'
        ),
        bulkOperationsService.bulkUpdateCustomFields(
          testClub.id,
          memberChunks[1],
          { [`customField.${largeDataset.customFields[2].id}`]: 'Concurrent Test 2' },
          'performance-test'
        ),
        bulkOperationsService.bulkUpdateCustomFields(
          testClub.id,
          memberChunks[2],
          { [`customField.${largeDataset.customFields[2].id}`]: 'Concurrent Test 3' },
          'performance-test'
        )
      ]);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      results.forEach((result: any, index: number) => {
        expect(result.successfulRecords).toBe(memberChunks[index].length);
      });

      const totalRecords = memberChunks.reduce((sum, chunk) => sum + chunk.length, 0);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.bulkOperations * 1.5); // Allow some overhead for concurrency
      
      console.log(`Concurrent bulk operations: ${executionTime.toFixed(2)}ms for ${totalRecords} total records`);
    });

    it('should retrieve bulk operation history efficiently', async () => {
      const startTime = performance.now();
      
      const operations = await bulkOperationsService.getBulkOperations(testClub.id, {
        page: 1,
        pageSize: 100
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(operations.operations || operations).toBeDefined();
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.tagOperations);
      
      console.log(`Bulk operations history: ${executionTime.toFixed(2)}ms`);
    });
  });

  describe('Database Query Performance', () => {
    it('should handle complex joins efficiently', async () => {
      // Test a complex query that joins members, custom fields, tags, and segments
      const complexFilter = {
        conditions: [
          {
            field: 'status',
            operator: 'EQUALS',
            value: 'Active',
            logicalOperator: 'AND'
          },
          {
            field: `customField.${largeDataset.customFields[0].id}`,
            operator: 'IS_NOT_EMPTY',
            value: '',
            logicalOperator: 'AND'
          },
          {
            field: `customField.${largeDataset.customFields[1].id}`,
            operator: 'CONTAINS',
            value: 'test'
          }
        ],
        tagFilters: {
          includeTags: largeDataset.tags.slice(0, 20).map((t: any) => t.id),
          excludeTags: largeDataset.tags.slice(20, 25).map((t: any) => t.id),
          tagOperation: 'OR'
        }
      };

      const startTime = performance.now();
      
      const preview = await memberSegmentationService.previewSegment(
        testClub.id,
        complexFilter,
        { sampleSize: 1000 }
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(preview).toBeDefined();
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.complexFilterQuery);
      
      console.log(`Complex join query: ${executionTime.toFixed(2)}ms for ${preview.totalCount} potential matches`);
    });

    it('should handle aggregation queries efficiently', async () => {
      const startTime = performance.now();
      
      const [segmentStats, tagStats, customFieldStats] = await Promise.all([
        memberSegmentationService.getSegmentStats(testClub.id),
        memberTaggingService.getTagStats(testClub.id),
        customFieldsService.getCustomFieldAnalytics(testClub.id)
      ]);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(segmentStats).toBeDefined();
      expect(tagStats).toBeDefined();
      expect(customFieldStats).toBeDefined();
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.tagOperations * 2);
      
      console.log(`Aggregation queries: ${executionTime.toFixed(2)}ms for all stats`);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should handle large dataset operations within memory limits', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform memory-intensive operations
      const largeSegmentPreview = await memberSegmentationService.previewSegment(
        testClub.id,
        {
          conditions: [
            {
              field: 'status',
              operator: 'IN',
              value: 'Active,Inactive,Pending'
            }
          ]
        },
        { sampleSize: 5000 }
      );

      const peakMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (peakMemory - initialMemory) / 1024 / 1024; // MB

      expect(largeSegmentPreview.members).toBeDefined();
      expect(memoryIncrease).toBeLessThan(100); // Should not use more than 100MB additional memory
      
      console.log(`Memory usage for large segment preview: ${memoryIncrease.toFixed(2)}MB increase`);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    });

    it('should clean up memory after bulk operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform bulk operations
      const memberIds = largeDataset.members.slice(0, 5000).map((m: any) => m.id);
      await bulkOperationsService.bulkUpdateCustomFields(
        testClub.id,
        memberIds,
        { [`customField.${largeDataset.customFields[3].id}`]: 'Memory Test Value' },
        'performance-test'
      );

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryDelta = (finalMemory - initialMemory) / 1024 / 1024; // MB

      expect(Math.abs(memoryDelta)).toBeLessThan(50); // Memory should not increase by more than 50MB permanently
      
      console.log(`Memory delta after bulk operation: ${memoryDelta.toFixed(2)}MB`);
    });
  });

  describe('Stress Tests', () => {
    it('should handle rapid consecutive API calls', async () => {
      const numberOfCalls = 50;
      const calls: Promise<any>[] = [];

      const startTime = performance.now();
      
      // Make many concurrent calls
      for (let i = 0; i < numberOfCalls; i++) {
        calls.push(
          memberSegmentationService.previewSegment(
            testClub.id,
            {
              conditions: [
                {
                  field: 'status',
                  operator: 'EQUALS',
                  value: i % 2 === 0 ? 'Active' : 'Inactive'
                }
              ]
            },
            { sampleSize: 100 }
          )
        );
      }

      const results = await Promise.all(calls);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      const avgTimePerCall = executionTime / numberOfCalls;

      expect(results).toHaveLength(numberOfCalls);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.totalCount).toBeGreaterThanOrEqual(0);
      });

      expect(avgTimePerCall).toBeLessThan(PERFORMANCE_THRESHOLDS.segmentPreview / 2); // Should be faster when concurrent
      
      console.log(`Stress test: ${numberOfCalls} concurrent calls in ${executionTime.toFixed(2)}ms (${avgTimePerCall.toFixed(2)}ms avg)`);
    });

    it('should maintain performance under sustained load', async () => {
      const testDurationMs = 30000; // 30 seconds
      const batchSize = 10;
      const startTime = performance.now();
      let totalOperations = 0;
      let totalTime = 0;

      while ((performance.now() - startTime) < testDurationMs) {
        const batchStart = performance.now();
        
        const batch: Promise<any>[] = [];
        for (let i = 0; i < batchSize; i++) {
          batch.push(
            memberTaggingService.getTags(testClub.id)
          );
        }

        await Promise.all(batch);
        
        const batchEnd = performance.now();
        totalOperations += batchSize;
        totalTime += (batchEnd - batchStart);

        // Brief pause to simulate realistic usage
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const avgOperationTime = totalTime / totalOperations;
      const operationsPerSecond = totalOperations / (totalTime / 1000);

      expect(avgOperationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.tagOperations);
      expect(operationsPerSecond).toBeGreaterThan(10); // Should handle at least 10 ops/second
      
      console.log(`Sustained load test: ${totalOperations} operations, ${avgOperationTime.toFixed(2)}ms avg, ${operationsPerSecond.toFixed(2)} ops/sec`);
    }, 35000);
  });
});