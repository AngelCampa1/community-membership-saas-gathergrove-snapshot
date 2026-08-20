/**
 * Integration Tests for Member Segmentation API Endpoints
 * Test coverage for end-to-end API functionality
 */

import request from 'supertest';
import { app } from '@/server/app';
import { setupTestDatabase, cleanupTestDatabase } from '@/tests/utils/database';
import { createTestClub, createTestMember, createTestAdmin } from '@/tests/utils/factories';
import { generateJWT } from '@/tests/utils/auth';

describe('Member Segmentation API Integration', () => {
  let testDb: any;
  let testClub: any;
  let testAdmin: any;
  let adminToken: string;
  let testMembers: any[];

  beforeAll(async () => {
    testDb = await setupTestDatabase();
    testClub = await createTestClub(testDb);
    testAdmin = await createTestAdmin(testDb, testClub.id);
    adminToken = generateJWT(testAdmin);

    // Create test members for segmentation
    testMembers = await Promise.all([
      createTestMember(testDb, {
        clubId: testClub.id,
        name: 'John Doe',
        email: 'john@example.com',
        joinDate: new Date('2024-01-15'),
        status: 'Active'
      }),
      createTestMember(testDb, {
        clubId: testClub.id,
        name: 'Jane Smith',
        email: 'jane@example.com',
        joinDate: new Date('2024-06-01'),
        status: 'Active'
      }),
      createTestMember(testDb, {
        clubId: testClub.id,
        name: 'Bob Johnson',
        email: 'bob@example.com',
        joinDate: new Date('2023-12-01'),
        status: 'Inactive'
      })
    ]);
  });

  afterAll(async () => {
    await cleanupTestDatabase(testDb);
  });

  describe('Custom Fields API', () => {
    describe('GET /api/clubs/:clubId/custom-fields', () => {
      it('should return empty array when no custom fields exist', async () => {
        const response = await request(app)
          .get(`/api/clubs/${testClub.id}/custom-fields`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toEqual([]);
      });
    });

    describe('POST /api/clubs/:clubId/custom-fields', () => {
      it('should create a new custom field', async () => {
        const fieldData = {
          fieldName: 'Emergency Contact',
          fieldType: 'TEXT',
          isRequired: true,
          sortOrder: 1
        };

        const response = await request(app)
          .post(`/api/clubs/${testClub.id}/custom-fields`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(fieldData)
          .expect(201);

        expect(response.body).toMatchObject({
          fieldName: 'Emergency Contact',
          fieldType: 'TEXT',
          isRequired: true,
          clubId: testClub.id
        });
        expect(response.body.id).toBeDefined();
      });

      it('should create a select field with options', async () => {
        const selectFieldData = {
          fieldName: 'Membership Level',
          fieldType: 'SELECT',
          fieldOptions: ['Bronze', 'Silver', 'Gold'],
          isRequired: true,
          sortOrder: 2
        };

        const response = await request(app)
          .post(`/api/clubs/${testClub.id}/custom-fields`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(selectFieldData)
          .expect(201);

        expect(response.body.fieldOptions).toEqual(['Bronze', 'Silver', 'Gold']);
      });

      it('should return 400 for invalid field type', async () => {
        const invalidFieldData = {
          fieldName: 'Invalid Field',
          fieldType: 'INVALID_TYPE',
          isRequired: false
        };

        const response = await request(app)
          .post(`/api/clubs/${testClub.id}/custom-fields`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidFieldData)
          .expect(400);

        expect(response.body.message).toContain('Invalid field type');
      });

      it('should return 409 for duplicate field name', async () => {
        const fieldData = {
          fieldName: 'Emergency Contact', // Already exists from previous test
          fieldType: 'TEXT',
          isRequired: false
        };

        const response = await request(app)
          .post(`/api/clubs/${testClub.id}/custom-fields`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(fieldData)
          .expect(409);

        expect(response.body.message).toContain('already exists');
      });

      it('should return 401 without authentication', async () => {
        const fieldData = {
          fieldName: 'Test Field',
          fieldType: 'TEXT'
        };

        await request(app)
          .post(`/api/clubs/${testClub.id}/custom-fields`)
          .send(fieldData)
          .expect(401);
      });
    });

    describe('PUT /api/clubs/:clubId/custom-fields/:fieldId', () => {
      let customField: any;

      beforeAll(async () => {
        // Create a field to update
        const response = await request(app)
          .post(`/api/clubs/${testClub.id}/custom-fields`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            fieldName: 'Updatable Field',
            fieldType: 'TEXT',
            isRequired: false
          });
        customField = response.body;
      });

      it('should update an existing custom field', async () => {
        const updateData = {
          fieldName: 'Updated Field Name',
          isRequired: true
        };

        const response = await request(app)
          .put(`/api/clubs/${testClub.id}/custom-fields/${customField.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.fieldName).toBe('Updated Field Name');
        expect(response.body.isRequired).toBe(true);
      });

      it('should return 404 for non-existent field', async () => {
        await request(app)
          .put(`/api/clubs/${testClub.id}/custom-fields/invalid-id`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ fieldName: 'Updated' })
          .expect(404);
      });
    });
  });

  describe('Member Tags API', () => {
    describe('POST /api/clubs/:clubId/member-tags', () => {
      it('should create a new member tag', async () => {
        const tagData = {
          tagName: 'VIP Members',
          tagColor: '#FF6B6B',
          description: 'High-value club members'
        };

        const response = await request(app)
          .post(`/api/clubs/${testClub.id}/member-tags`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(tagData)
          .expect(201);

        expect(response.body).toMatchObject({
          tagName: 'VIP Members',
          tagColor: '#FF6B6B',
          description: 'High-value club members',
          clubId: testClub.id
        });
      });

      it('should return 400 for invalid color format', async () => {
        const invalidTagData = {
          tagName: 'Test Tag',
          tagColor: 'invalid-color'
        };

        const response = await request(app)
          .post(`/api/clubs/${testClub.id}/member-tags`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidTagData)
          .expect(400);

        expect(response.body.message).toContain('Invalid color format');
      });
    });

    describe('POST /api/clubs/:clubId/members/:memberId/tags', () => {
      let memberTag: any;

      beforeAll(async () => {
        const tagResponse = await request(app)
          .post(`/api/clubs/${testClub.id}/member-tags`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            tagName: 'New Members',
            tagColor: '#4ECDC4'
          });
        memberTag = tagResponse.body;
      });

      it('should assign a tag to a member', async () => {
        const assignmentData = {
          tagId: memberTag.id,
          assignedBy: testAdmin.id
        };

        const response = await request(app)
          .post(`/api/clubs/${testClub.id}/members/${testMembers[0].id}/tags`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(assignmentData)
          .expect(201);

        expect(response.body).toMatchObject({
          memberId: testMembers[0].id,
          tagId: memberTag.id,
          assignedBy: testAdmin.id
        });
      });

      it('should return 409 for duplicate tag assignment', async () => {
        const assignmentData = {
          tagId: memberTag.id,
          assignedBy: testAdmin.id
        };

        await request(app)
          .post(`/api/clubs/${testClub.id}/members/${testMembers[0].id}/tags`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(assignmentData)
          .expect(409);
      });

      it('should return 404 for invalid member ID', async () => {
        const assignmentData = {
          tagId: memberTag.id,
          assignedBy: testAdmin.id
        };

        await request(app)
          .post(`/api/clubs/${testClub.id}/members/invalid-member-id/tags`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(assignmentData)
          .expect(404);
      });
    });

    describe('GET /api/clubs/:clubId/members/:memberId/tags', () => {
      it('should return tags for a member', async () => {
        const response = await request(app)
          .get(`/api/clubs/${testClub.id}/members/${testMembers[0].id}/tags`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should return empty array for member with no tags', async () => {
        const response = await request(app)
          .get(`/api/clubs/${testClub.id}/members/${testMembers[1].id}/tags`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toEqual([]);
      });
    });
  });

  describe('Member Segmentation API', () => {
    let customField: any;
    let memberTag: any;

    beforeAll(async () => {
      // Create a custom field for segmentation testing
      const fieldResponse = await request(app)
        .post(`/api/clubs/${testClub.id}/custom-fields`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fieldName: 'Age',
          fieldType: 'NUMBER',
          isRequired: false
        });
      customField = fieldResponse.body;

      // Create a tag for segmentation testing
      const tagResponse = await request(app)
        .post(`/api/clubs/${testClub.id}/member-tags`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tagName: 'Active Members',
          tagColor: '#2ECC71'
        });
      memberTag = tagResponse.body;

      // Assign some custom field values and tags
      await request(app)
        .post(`/api/clubs/${testClub.id}/members/${testMembers[0].id}/custom-field-values`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fieldId: customField.id,
          fieldValue: '25'
        });

      await request(app)
        .post(`/api/clubs/${testClub.id}/members/${testMembers[0].id}/tags`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tagId: memberTag.id,
          assignedBy: testAdmin.id
        });
    });

    describe('POST /api/clubs/:clubId/member-segments/preview', () => {
      it('should preview segment with basic filters', async () => {
        const filterCriteria = {
          conditions: [
            {
              field: 'joinDate',
              operator: 'GREATER_THAN',
              value: '2024-01-01',
              logicalOperator: 'AND'
            }
          ]
        };

        const response = await request(app)
          .post(`/api/clubs/${testClub.id}/member-segments/preview`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ filterCriteria })
          .expect(200);

        expect(response.body).toHaveProperty('members');
        expect(response.body).toHaveProperty('totalCount');
        expect(Array.isArray(response.body.members)).toBe(true);
        expect(response.body.totalCount).toBeGreaterThan(0);
      });

      it('should preview segment with tag filters', async () => {
        const filterCriteria = {
          tagFilters: {
            includeTags: [memberTag.id],
            tagOperation: 'AND'
          }
        };

        const response = await request(app)
          .post(`/api/clubs/${testClub.id}/member-segments/preview`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ filterCriteria })
          .expect(200);

        expect(response.body.totalCount).toBeGreaterThan(0);
      });

      it('should preview segment with custom field filters', async () => {
        const filterCriteria = {
          conditions: [
            {
              field: `customField.${customField.id}`,
              operator: 'GREATER_THAN',
              value: '20',
              logicalOperator: 'AND'
            }
          ]
        };

        const response = await request(app)
          .post(`/api/clubs/${testClub.id}/member-segments/preview`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ filterCriteria })
          .expect(200);

        expect(response.body).toHaveProperty('members');
        expect(response.body).toHaveProperty('totalCount');
      });

      it('should return 400 for invalid filter conditions', async () => {
        const invalidFilterCriteria = {
          conditions: [
            {
              field: 'joinDate',
              operator: 'INVALID_OPERATOR',
              value: '2024-01-01'
            }
          ]
        };

        await request(app)
          .post(`/api/clubs/${testClub.id}/member-segments/preview`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ filterCriteria: invalidFilterCriteria })
          .expect(400);
      });
    });

    describe('POST /api/clubs/:clubId/member-segments', () => {
      it('should create a new segment', async () => {
        const segmentData = {
          segmentName: 'New Active Members',
          filterCriteria: {
            conditions: [
              {
                field: 'joinDate',
                operator: 'GREATER_THAN',
                value: '2024-01-01',
                logicalOperator: 'AND'
              },
              {
                field: 'status',
                operator: 'EQUALS',
                value: 'Active'
              }
            ]
          }
        };

        const response = await request(app)
          .post(`/api/clubs/${testClub.id}/member-segments`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(segmentData)
          .expect(201);

        expect(response.body).toMatchObject({
          segmentName: 'New Active Members',
          clubId: testClub.id,
          createdBy: testAdmin.id
        });
        expect(response.body.id).toBeDefined();
        expect(response.body.memberCount).toBeDefined();
      });

      it('should return 400 for empty segment name', async () => {
        const invalidSegmentData = {
          segmentName: '',
          filterCriteria: {
            conditions: [{
              field: 'status',
              operator: 'EQUALS',
              value: 'Active'
            }]
          }
        };

        await request(app)
          .post(`/api/clubs/${testClub.id}/member-segments`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidSegmentData)
          .expect(400);
      });

      it('should return 400 for segment without conditions or tag filters', async () => {
        const invalidSegmentData = {
          segmentName: 'Empty Segment',
          filterCriteria: {
            conditions: []
          }
        };

        await request(app)
          .post(`/api/clubs/${testClub.id}/member-segments`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidSegmentData)
          .expect(400);
      });
    });

    describe('GET /api/clubs/:clubId/member-segments', () => {
      it('should return all segments for a club', async () => {
        const response = await request(app)
          .get(`/api/clubs/${testClub.id}/member-segments`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should include member counts when requested', async () => {
        const response = await request(app)
          .get(`/api/clubs/${testClub.id}/member-segments?includeMemberCount=true`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        response.body.forEach((segment: any) => {
          expect(segment).toHaveProperty('memberCount');
          expect(typeof segment.memberCount).toBe('number');
        });
      });
    });

    describe('GET /api/clubs/:clubId/member-segments/:segmentId/members', () => {
      let testSegment: any;

      beforeAll(async () => {
        const segmentResponse = await request(app)
          .post(`/api/clubs/${testClub.id}/member-segments`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            segmentName: 'Test Segment for Members',
            filterCriteria: {
              conditions: [{
                field: 'status',
                operator: 'EQUALS',
                value: 'Active'
              }]
            }
          });
        testSegment = segmentResponse.body;
      });

      it('should return members in segment', async () => {
        const response = await request(app)
          .get(`/api/clubs/${testClub.id}/member-segments/${testSegment.id}/members`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('members');
        expect(response.body).toHaveProperty('totalCount');
        expect(Array.isArray(response.body.members)).toBe(true);
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get(`/api/clubs/${testClub.id}/member-segments/${testSegment.id}/members?page=1&pageSize=1`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('page', 1);
        expect(response.body).toHaveProperty('pageSize', 1);
        expect(response.body.members.length).toBeLessThanOrEqual(1);
      });

      it('should support search within segment', async () => {
        const response = await request(app)
          .get(`/api/clubs/${testClub.id}/member-segments/${testSegment.id}/members?search=john`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('members');
        // Check if search actually filtered results (if any John exists)
        if (response.body.members.length > 0) {
          expect(response.body.members.some((member: any) => 
            member.name.toLowerCase().includes('john')
          )).toBe(true);
        }
      });
    });
  });

  describe('Bulk Operations API', () => {
    let testSegment: any;
    let memberIds: string[];

    beforeAll(async () => {
      // Create a test segment
      const segmentResponse = await request(app)
        .post(`/api/clubs/${testClub.id}/member-segments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          segmentName: 'Bulk Test Segment',
          filterCriteria: {
            conditions: [{
              field: 'status',
              operator: 'EQUALS',
              value: 'Active'
            }]
          }
        });
      testSegment = segmentResponse.body;

      memberIds = testMembers
        .filter(m => m.status === 'Active')
        .map(m => m.id);
    });

    describe('POST /api/clubs/:clubId/bulk-operations/custom-fields', () => {
      it('should create bulk custom field update operation', async () => {
        const bulkData = {
          memberIds: memberIds,
          fieldUpdates: {
            [`customField.${customField.id}`]: '30'
          }
        };

        const response = await request(app)
          .post(`/api/clubs/${testClub.id}/bulk-operations/custom-fields`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(bulkData)
          .expect(200);

        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('successfulRecords');
        expect(response.body).toHaveProperty('totalRecords', memberIds.length);
      });

      it('should return 400 for empty field updates', async () => {
        const invalidBulkData = {
          memberIds: memberIds,
          fieldUpdates: {}
        };

        await request(app)
          .post(`/api/clubs/${testClub.id}/bulk-operations/custom-fields`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidBulkData)
          .expect(400);
      });
    });

    describe('POST /api/clubs/:clubId/bulk-operations/assign-tags', () => {
      it('should create bulk tag assignment operation', async () => {
        const bulkData = {
          memberIds: memberIds,
          tagIds: [memberTag.id]
        };

        const response = await request(app)
          .post(`/api/clubs/${testClub.id}/bulk-operations/assign-tags`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(bulkData)
          .expect(200);

        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('assignmentsCreated');
      });
    });

    describe('POST /api/clubs/:clubId/bulk-operations/member-status', () => {
      it('should create bulk member status update operation', async () => {
        const bulkData = {
          memberIds: [testMembers[2].id], // Bob Johnson (Inactive)
          newStatus: 'Active',
          reason: 'Bulk activation test'
        };

        const response = await request(app)
          .post(`/api/clubs/${testClub.id}/bulk-operations/member-status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(bulkData)
          .expect(200);

        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('successfulRecords');
      });

      it('should return 400 for empty status', async () => {
        const invalidBulkData = {
          memberIds: memberIds,
          newStatus: '',
          reason: 'Test'
        };

        await request(app)
          .post(`/api/clubs/${testClub.id}/bulk-operations/member-status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidBulkData)
          .expect(400);
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent club', async () => {
      await request(app)
        .get('/api/clubs/invalid-club-id/custom-fields')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 403 for unauthorized access', async () => {
      const otherClub = await createTestClub(testDb, { name: 'Other Club' });
      
      await request(app)
        .get(`/api/clubs/${otherClub.id}/custom-fields`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database failures
      // Implementation depends on your error handling middleware
    });

    it('should validate request body schemas', async () => {
      const invalidData = {
        invalidField: 'invalid'
      };

      await request(app)
        .post(`/api/clubs/${testClub.id}/custom-fields`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on bulk operations', async () => {
      // Make multiple rapid requests
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .post(`/api/clubs/${testClub.id}/bulk-operations/custom-fields`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            memberIds: [testMembers[0].id],
            fieldUpdates: { 'field': 'value' }
          })
      );

      const responses = await Promise.allSettled(requests);
      
      // At least one should be rate limited (429)
      const rateLimitedResponses = responses.filter(
        (response) => response.status === 'fulfilled' && 
        (response.value as any).status === 429
      );
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should handle large segment preview requests efficiently', async () => {
      const startTime = Date.now();

      await request(app)
        .post(`/api/clubs/${testClub.id}/member-segments/preview`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          filterCriteria: {
            conditions: [{
              field: 'status',
              operator: 'EQUALS',
              value: 'Active'
            }]
          },
          sampleSize: 1000
        })
        .expect(200);

      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should paginate large member lists efficiently', async () => {
      const response = await request(app)
        .get(`/api/clubs/${testClub.id}/member-segments/${testSegment?.id || 'any'}/members?pageSize=100`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('members');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('pageSize');
    });
  });
});