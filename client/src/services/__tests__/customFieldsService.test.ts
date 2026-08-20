import customFieldsService, {
  type CustomField,
  type CreateCustomFieldRequest,
  type UpdateCustomFieldRequest,
  type MemberCustomFieldValue,
  type BulkCustomFieldValueRequest,
  type BulkCustomFieldValueResponse,
  type CustomFieldSearchRequest,
  type CustomFieldSearchResult,
  type CustomFieldAnalytics,
} from '../customFieldsService';
import apiClient from '../apiClient';
import { billingService } from '../billingService';

// Mock apiClient at the HTTP boundary
jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock billingService to control tier access
jest.mock('../billingService', () => ({
  billingService: {
    getBillingStatus: jest.fn(),
  },
}));

// Mock logger to avoid console noise
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

// Get typed reference to mocked billingService
const mockBillingService = billingService as jest.Mocked<typeof billingService>;

describe('CustomFieldsService', () => {
  const clubId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
    customFieldsService.clearCache();

    // Default: user has Unlimited tier access
    mockBillingService.getBillingStatus.mockResolvedValue({
      currentTier: 'Unlimited',
      hasActiveSubscription: true,
      memberCount: 500,
      memberLimit: Number.MAX_SAFE_INTEGER,
      canUpgrade: false,
    } as any);

    // Reset apiClient mocks
    (apiClient.get as jest.Mock).mockReset();
    (apiClient.post as jest.Mock).mockReset();
    (apiClient.put as jest.Mock).mockReset();
    (apiClient.delete as jest.Mock).mockReset();
  });

  describe('getCustomFields', () => {
    it('should fetch all custom fields for a club', async () => {
      // Arrange
      const mockFields: CustomField[] = [
        {
          id: 1,
          clubId,
          fieldName: 'department',
          fieldLabel: 'Department',
          fieldType: 'select',
          fieldOptions: ['Engineering', 'Sales', 'Marketing'],
          isRequired: false,
          isActive: true,
          sortOrder: 1,
          memberCount: 50,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          clubId,
          fieldName: 'join_year',
          fieldLabel: 'Join Year',
          fieldType: 'number',
          isRequired: false,
          isActive: true,
          sortOrder: 2,
          memberCount: 75,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockFields });

      // Act
      const result = await customFieldsService.getCustomFields(clubId);

      // Assert
      expect(result).toEqual(mockFields);
      expect(result).toHaveLength(2);
      expect(result[0].fieldName).toBe('department');
      expect(mockBillingService.getBillingStatus).toHaveBeenCalled();
    });

    it('should include inactive fields when requested', async () => {
      // Arrange
      const mockFields: CustomField[] = [
        {
          id: 1,
          clubId,
          fieldName: 'active_field',
          fieldLabel: 'Active Field',
          fieldType: 'text',
          isRequired: false,
          isActive: true,
          sortOrder: 1,
          memberCount: 30,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          clubId,
          fieldName: 'inactive_field',
          fieldLabel: 'Inactive Field',
          fieldType: 'text',
          isRequired: false,
          isActive: false,
          sortOrder: 2,
          memberCount: 0,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockFields });

      // Act
      const result = await customFieldsService.getCustomFields(clubId, {
        includeInactive: true,
      });

      // Assert
      expect(result).toHaveLength(2);
      expect(result.some(f => !f.isActive)).toBe(true);
    });

    it('should support different sort options', async () => {
      // Arrange
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      // Act
      await customFieldsService.getCustomFields(clubId, { sortBy: 'fieldName' });

      // Assert
      expect(apiClient.get).toHaveBeenCalled();
    });

    it('should reject access for non-Expand tiers', async () => {
      // Arrange
      mockBillingService.getBillingStatus.mockResolvedValue({
        currentTier: 'Grow',
        hasActiveSubscription: true,
        memberCount: 100,
        memberLimit: 200,
        canUpgrade: true,
      } as any);

      // Act & Assert
      await expect(customFieldsService.getCustomFields(clubId)).rejects.toThrow(
        'Custom fields are only available for Expand tier subscribers'
      );
    });

    it('should allow access for Expand tier', async () => {
      mockBillingService.getBillingStatus.mockResolvedValue({ currentTier: 'Expand' } as never);
      (apiClient.get as jest.Mock).mockResolvedValue({ data: [] });

      const result = await customFieldsService.getCustomFields(clubId);

      expect(result).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      (apiClient.get as jest.Mock).mockRejectedValueOnce({
        response: { status: 500, data: { message: 'Server error' } },
      });

      // Act & Assert
      await expect(customFieldsService.getCustomFields(clubId)).rejects.toThrow();
    });

    it('should cache results for subsequent calls', async () => {
      // Arrange
      const mockFields: CustomField[] = [
        {
          id: 1,
          clubId,
          fieldName: 'test',
          fieldLabel: 'Test',
          fieldType: 'text',
          isRequired: false,
          isActive: true,
          sortOrder: 1,
          memberCount: 10,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockFields });

      // Act
      const result1 = await customFieldsService.getCustomFields(clubId);
      const result2 = await customFieldsService.getCustomFields(clubId);

      // Assert
      expect(result1).toEqual(result2);
      expect(apiClient.get).toHaveBeenCalledTimes(1); // Second call should use cache
    });
  });

  describe('createCustomField', () => {
    it('should create a text field successfully', async () => {
      // Arrange
      const request: CreateCustomFieldRequest = {
        fieldName: 'company',
        fieldLabel: 'Company',
        fieldType: 'text',
        isRequired: false,
        isActive: true,
        sortOrder: 3,
      };

      const mockResponse: CustomField = {
        id: 3,
        clubId,
        ...request,
        memberCount: 0,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      // Act
      const result = await customFieldsService.createCustomField(clubId, request);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.id).toBe(3);
      expect(result.fieldName).toBe('company');
    });

    it('should create a select field with options', async () => {
      // Arrange
      const request: CreateCustomFieldRequest = {
        fieldName: 'skill_level',
        fieldLabel: 'Skill Level',
        fieldType: 'select',
        fieldOptions: ['Beginner', 'Intermediate', 'Advanced'],
        isRequired: true,
        isActive: true,
        sortOrder: 1,
      };

      const mockResponse: CustomField = {
        id: 1,
        clubId,
        ...request,
        memberCount: 0,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      // Act
      const result = await customFieldsService.createCustomField(clubId, request);

      // Assert
      expect(result.fieldOptions).toEqual(['Beginner', 'Intermediate', 'Advanced']);
    });

    it('should validate that select fields require options', async () => {
      // Arrange
      const request: CreateCustomFieldRequest = {
        fieldName: 'bad_select',
        fieldLabel: 'Bad Select',
        fieldType: 'select',
        // Missing fieldOptions!
        isRequired: false,
        isActive: true,
        sortOrder: 1,
      };

      // Act & Assert
      await expect(
        customFieldsService.createCustomField(clubId, request)
      ).rejects.toThrow('Field options are required for select and multi_select field types');
    });

    it('should handle duplicate field name errors', async () => {
      // Arrange
      const request: CreateCustomFieldRequest = {
        fieldName: 'department',
        fieldLabel: 'Department',
        fieldType: 'text',
        isRequired: false,
        isActive: true,
        sortOrder: 1,
      };

      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        response: { status: 409, data: { message: 'A field with this name already exists' } },
      });

      // Act & Assert
      await expect(
        customFieldsService.createCustomField(clubId, request)
      ).rejects.toThrow();
    });

    it('should invalidate cache after creating field', async () => {
      // Arrange
      const mockFields: CustomField[] = [];

      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: mockFields })
        .mockResolvedValueOnce({ data: mockFields });
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: {
          id: 1,
          clubId,
          fieldName: 'new_field',
          fieldLabel: 'New Field',
          fieldType: 'text',
          isRequired: false,
          isActive: true,
          sortOrder: 1,
          memberCount: 0,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        } as CustomField,
      });

      // Act
      await customFieldsService.getCustomFields(clubId); // Populate cache
      expect(apiClient.get).toHaveBeenCalledTimes(1);

      await customFieldsService.createCustomField(clubId, {
        fieldName: 'new_field',
        fieldLabel: 'New Field',
        fieldType: 'text',
      });

      await customFieldsService.getCustomFields(clubId); // Should re-fetch

      // Assert
      expect(apiClient.get).toHaveBeenCalledTimes(2); // Cache was invalidated
    });
  });

  describe('updateCustomField', () => {
    it('should update an existing field', async () => {
      // Arrange
      const fieldId = 1;
      const request: UpdateCustomFieldRequest = {
        fieldLabel: 'Updated Department',
        isActive: false,
      };

      const mockResponse: CustomField = {
        id: fieldId,
        clubId,
        fieldName: 'department',
        fieldLabel: 'Updated Department',
        fieldType: 'text',
        isRequired: false,
        isActive: false,
        sortOrder: 1,
        memberCount: 50,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      };

      (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      // Act
      const result = await customFieldsService.updateCustomField(clubId, fieldId, request);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.fieldLabel).toBe('Updated Department');
      expect(result.isActive).toBe(false);
    });

    it('should handle not found errors', async () => {
      // Arrange
      (apiClient.put as jest.Mock).mockRejectedValueOnce({
        response: { status: 404, data: { message: 'Custom field not found' } },
      });

      // Act & Assert
      await expect(
        customFieldsService.updateCustomField(clubId, 999, { isActive: false })
      ).rejects.toThrow();
    });
  });

  describe('deleteCustomField', () => {
    it('should delete a field and return deletion stats', async () => {
      // Arrange
      const fieldId = 1;
      const mockResponse = {
        success: true,
        valuesDeleted: 50,
      };

      (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      // Act
      const result = await customFieldsService.deleteCustomField(clubId, fieldId);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.success).toBe(true);
      expect(result.valuesDeleted).toBe(50);
    });

    it('should handle deletion of non-existent fields', async () => {
      // Arrange
      (apiClient.delete as jest.Mock).mockRejectedValueOnce({
        response: { status: 404, data: { message: 'Custom field not found' } },
      });

      // Act & Assert
      await expect(
        customFieldsService.deleteCustomField(clubId, 999)
      ).rejects.toThrow();
    });

    it('should handle conflict when deleting field with values', async () => {
      // Arrange
      (apiClient.delete as jest.Mock).mockRejectedValueOnce({
        response: { status: 409, data: { message: 'Cannot delete field with existing values' } },
      });

      // Act & Assert
      await expect(
        customFieldsService.deleteCustomField(clubId, 1)
      ).rejects.toThrow();
    });
  });

  describe('getMemberCustomFieldValues', () => {
    it('should fetch custom field values for a member', async () => {
      // Arrange
      const memberId = 1;
      const mockResponse: MemberCustomFieldValue = {
        memberId,
        memberName: 'John Doe',
        customFieldValues: [
          {
            customFieldId: 1,
            fieldName: 'department',
            fieldLabel: 'Department',
            fieldType: 'select',
            fieldValue: 'Engineering',
          },
          {
            customFieldId: 2,
            fieldName: 'join_year',
            fieldLabel: 'Join Year',
            fieldType: 'number',
            fieldValue: '2020',
          },
        ],
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      // Act
      const result = await customFieldsService.getMemberCustomFieldValues(clubId, memberId);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.memberId).toBe(1);
      expect(result.customFieldValues).toHaveLength(2);
    });

    it('should handle member not found', async () => {
      // Arrange
      (apiClient.get as jest.Mock).mockRejectedValueOnce({
        response: { status: 404, data: { message: 'Member not found' } },
      });

      // Act & Assert
      await expect(
        customFieldsService.getMemberCustomFieldValues(clubId, 999)
      ).rejects.toThrow();
    });
  });

  describe('updateMemberCustomFieldValues', () => {
    it('should update custom field values for a member', async () => {
      // Arrange
      const memberId = 1;
      const values = [
        { customFieldId: 1, fieldValue: 'Sales' },
        { customFieldId: 2, fieldValue: '2021' },
      ];

      const mockResponse: MemberCustomFieldValue = {
        memberId,
        memberName: 'John Doe',
        customFieldValues: [
          {
            customFieldId: 1,
            fieldName: 'department',
            fieldLabel: 'Department',
            fieldType: 'select',
            fieldValue: 'Sales',
          },
          {
            customFieldId: 2,
            fieldName: 'join_year',
            fieldLabel: 'Join Year',
            fieldType: 'number',
            fieldValue: '2021',
          },
        ],
      };

      (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      // Act
      const result = await customFieldsService.updateMemberCustomFieldValues(
        clubId,
        memberId,
        values
      );

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.customFieldValues[0].fieldValue).toBe('Sales');
    });

    it('should handle validation errors', async () => {
      // Arrange
      const memberId = 1;
      const values = [{ customFieldId: 1, fieldValue: 'InvalidOption' }];

      (apiClient.put as jest.Mock).mockRejectedValueOnce({
        response: { status: 422, data: { message: 'Field validation failed' } },
      });

      // Act & Assert
      await expect(
        customFieldsService.updateMemberCustomFieldValues(clubId, memberId, values)
      ).rejects.toThrow();
    });
  });

  describe('bulkUpdateCustomFieldValues', () => {
    it('should update values for multiple members successfully', async () => {
      // Arrange
      const request: BulkCustomFieldValueRequest = {
        memberIds: [1, 2, 3],
        customFieldValues: [
          { customFieldId: 1, fieldValue: 'Engineering' },
          { customFieldId: 2, fieldValue: '2024' },
        ],
      };

      const mockResponse: BulkCustomFieldValueResponse = {
        totalMembers: 3,
        successfulUpdates: 6,
        failedUpdates: 0,
        errors: [],
        processingTime: 250,
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      // Act
      const result = await customFieldsService.bulkUpdateCustomFieldValues(clubId, request);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.successfulUpdates).toBe(6);
      expect(result.failedUpdates).toBe(0);
    });

    it('should handle partial failures', async () => {
      // Arrange
      const request: BulkCustomFieldValueRequest = {
        memberIds: [1, 999],
        customFieldValues: [{ customFieldId: 1, fieldValue: 'Test' }],
      };

      const mockResponse: BulkCustomFieldValueResponse = {
        totalMembers: 2,
        successfulUpdates: 1,
        failedUpdates: 1,
        errors: [
          {
            memberId: 999,
            customFieldId: 1,
            error: 'Member not found',
          },
        ],
        processingTime: 150,
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      // Act
      const result = await customFieldsService.bulkUpdateCustomFieldValues(clubId, request);

      // Assert
      expect(result.failedUpdates).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].memberId).toBe(999);
    });

    it('should reject requests with more than 1000 members', async () => {
      // Arrange
      const request: BulkCustomFieldValueRequest = {
        memberIds: Array.from({ length: 1001 }, (_, i) => i + 1),
        customFieldValues: [{ customFieldId: 1, fieldValue: 'Test' }],
      };

      // Act & Assert
      await expect(
        customFieldsService.bulkUpdateCustomFieldValues(clubId, request)
      ).rejects.toThrow('Cannot process more than 1,000 members in a single bulk operation');
    });

    it('should reject requests with no member IDs', async () => {
      // Arrange
      const request: BulkCustomFieldValueRequest = {
        memberIds: [],
        customFieldValues: [{ customFieldId: 1, fieldValue: 'Test' }],
      };

      // Act & Assert
      await expect(
        customFieldsService.bulkUpdateCustomFieldValues(clubId, request)
      ).rejects.toThrow('At least one member ID is required for bulk updates');
    });
  });

  describe('searchMembersByCustomFields', () => {
    it('should search members by custom field values', async () => {
      // Arrange
      const request: CustomFieldSearchRequest = {
        searchCriteria: [
          {
            customFieldId: 1,
            fieldValue: 'Engineering',
            matchMode: 'exact',
          },
        ],
        matchAllCriteria: true,
        page: 1,
        pageSize: 25,
      };

      const mockResponse: CustomFieldSearchResult = {
        members: [
          {
            id: 1,
            fullName: 'John Doe',
            email: 'john@example.com',
            membershipTypeName: 'Premium',
            status: 'Active',
            joinDate: '2020-01-15',
            customFieldValues: [
              {
                customFieldId: 1,
                fieldName: 'department',
                fieldLabel: 'Department',
                fieldValue: 'Engineering',
              },
            ],
          },
        ],
        totalCount: 45,
        currentPage: 1,
        pageSize: 25,
        totalPages: 2,
        hasNext: true,
        hasPrevious: false,
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      // Act
      const result = await customFieldsService.searchMembersByCustomFields(clubId, request);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.members).toHaveLength(1);
      expect(result.totalCount).toBe(45);
      expect(result.hasNext).toBe(true);
    });

    it('should support different match modes', async () => {
      // Arrange
      const matchModes: Array<'exact' | 'contains' | 'starts_with' | 'ends_with'> = [
        'exact',
        'contains',
        'starts_with',
        'ends_with',
      ];

      const emptyResponse: CustomFieldSearchResult = {
        members: [],
        totalCount: 0,
        currentPage: 1,
        pageSize: 25,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      };

      for (const matchMode of matchModes) {
        (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: emptyResponse });

        // Act
        await customFieldsService.searchMembersByCustomFields(clubId, {
          searchCriteria: [
            {
              customFieldId: 1,
              fieldValue: 'Test',
              matchMode,
            },
          ],
        });
      }

      // Assert
      expect(apiClient.post).toHaveBeenCalledTimes(4);
    });

    it('should support OR logic with matchAllCriteria=false', async () => {
      // Arrange
      const request: CustomFieldSearchRequest = {
        searchCriteria: [
          { customFieldId: 1, fieldValue: 'Engineering', matchMode: 'exact' },
          { customFieldId: 2, fieldValue: '2024', matchMode: 'exact' },
        ],
        matchAllCriteria: false,
      };

      const emptyResponse: CustomFieldSearchResult = {
        members: [],
        totalCount: 0,
        currentPage: 1,
        pageSize: 25,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: emptyResponse });

      // Act
      await customFieldsService.searchMembersByCustomFields(clubId, request);

      // Assert
      expect(apiClient.post).toHaveBeenCalled();
    });
  });

  describe('getCustomFieldAnalytics', () => {
    it('should fetch analytics for custom fields', async () => {
      // Arrange
      const mockResponse: CustomFieldAnalytics = {
        totalFields: 10,
        activeFields: 8,
        totalFieldValues: 500,
        averageFieldsPerMember: 2.5,
        mostUsedFields: [
          {
            customFieldId: 1,
            fieldName: 'department',
            fieldLabel: 'Department',
            valueCount: 150,
          },
          {
            customFieldId: 2,
            fieldName: 'join_year',
            fieldLabel: 'Join Year',
            valueCount: 120,
          },
        ],
        leastUsedFields: [
          {
            customFieldId: 10,
            fieldName: 'certification',
            fieldLabel: 'Certification',
            valueCount: 5,
          },
        ],
        fieldTypeDistribution: {
          text: 4,
          select: 3,
          number: 2,
          date: 1,
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      // Act
      const result = await customFieldsService.getCustomFieldAnalytics(clubId);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.totalFields).toBe(10);
      expect(result.mostUsedFields).toHaveLength(2);
      expect(result.leastUsedFields).toHaveLength(1);
    });
  });

  describe('validateFieldValue', () => {
    it('should validate number fields', () => {
      // Valid numbers
      expect(customFieldsService.validateFieldValue('number', '123').isValid).toBe(true);
      expect(customFieldsService.validateFieldValue('number', '123.45').isValid).toBe(true);
      expect(customFieldsService.validateFieldValue('number', '-50').isValid).toBe(true);

      // Invalid numbers
      const result = customFieldsService.validateFieldValue('number', 'abc');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Value must be a valid number');
    });

    it('should validate boolean fields', () => {
      // Valid booleans
      expect(customFieldsService.validateFieldValue('boolean', 'true').isValid).toBe(true);
      expect(customFieldsService.validateFieldValue('boolean', 'false').isValid).toBe(true);
      expect(customFieldsService.validateFieldValue('boolean', 'yes').isValid).toBe(true);
      expect(customFieldsService.validateFieldValue('boolean', 'no').isValid).toBe(true);
      expect(customFieldsService.validateFieldValue('boolean', '1').isValid).toBe(true);
      expect(customFieldsService.validateFieldValue('boolean', '0').isValid).toBe(true);

      // Invalid booleans
      const result = customFieldsService.validateFieldValue('boolean', 'maybe');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Value must be true/false, yes/no, or 1/0');
    });

    it('should validate email fields', () => {
      // Valid emails
      expect(customFieldsService.validateFieldValue('email', 'test@example.com').isValid).toBe(
        true
      );
      expect(
        customFieldsService.validateFieldValue('email', 'user.name+tag@example.co.uk').isValid
      ).toBe(true);

      // Invalid emails
      const result = customFieldsService.validateFieldValue('email', 'invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Value must be a valid email address');
    });

    it('should validate phone fields', () => {
      // Valid phones
      expect(customFieldsService.validateFieldValue('phone', '123-456-7890').isValid).toBe(true);
      expect(customFieldsService.validateFieldValue('phone', '(123) 456-7890').isValid).toBe(
        true
      );
      expect(customFieldsService.validateFieldValue('phone', '+1 123 456 7890').isValid).toBe(
        true
      );

      // Invalid phones
      const result = customFieldsService.validateFieldValue('phone', 'abc-def-ghij');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Value must be a valid phone number');
    });

    it('should validate URL fields', () => {
      // Valid URLs
      expect(
        customFieldsService.validateFieldValue('url', 'https://example.com').isValid
      ).toBe(true);
      expect(customFieldsService.validateFieldValue('url', 'http://test.org/path').isValid).toBe(
        true
      );

      // Invalid URLs
      const result = customFieldsService.validateFieldValue('url', 'not-a-url');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Value must be a valid URL');
    });

    it('should validate date fields', () => {
      // Valid dates
      expect(customFieldsService.validateFieldValue('date', '2024-01-15').isValid).toBe(true);
      expect(
        customFieldsService.validateFieldValue('date', '2024-01-15T10:00:00Z').isValid
      ).toBe(true);

      // Invalid dates
      const result = customFieldsService.validateFieldValue('date', 'not-a-date');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Value must be a valid date');
    });

    it('should validate select fields with options', () => {
      // Valid select
      const options = ['Option1', 'Option2', 'Option3'];
      expect(
        customFieldsService.validateFieldValue('select', 'Option1', options).isValid
      ).toBe(true);

      // Invalid select
      const result = customFieldsService.validateFieldValue('select', 'Option4', options);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Value must be one of: Option1, Option2, Option3');
    });

    it('should validate multi_select fields with options', () => {
      // Valid multi-select
      const options = ['Option1', 'Option2', 'Option3'];
      expect(
        customFieldsService.validateFieldValue('multi_select', 'Option1, Option2', options)
          .isValid
      ).toBe(true);

      // Invalid multi-select
      const result = customFieldsService.validateFieldValue(
        'multi_select',
        'Option1, Option4',
        options
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid values: Option4');
    });

    it('should allow empty values', () => {
      // Empty values should be valid (required validation happens elsewhere)
      expect(customFieldsService.validateFieldValue('text', '').isValid).toBe(true);
      expect(customFieldsService.validateFieldValue('number', '  ').isValid).toBe(true);
    });

    it('should accept text and textarea without validation', () => {
      expect(customFieldsService.validateFieldValue('text', 'Any text').isValid).toBe(true);
      expect(customFieldsService.validateFieldValue('textarea', 'Long text...').isValid).toBe(
        true
      );
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      // Act
      customFieldsService.clearCache();

      // Assert
      const stats = customFieldsService.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should provide cache statistics', async () => {
      // Arrange
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      // Act
      await customFieldsService.getCustomFields(clubId);
      const stats = customFieldsService.getCacheStats();

      // Assert
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.avgAge).toBeGreaterThanOrEqual(0);
    });
  });

  describe('verifyUnlimitedAccess edge cases', () => {
    it('should continue with graceful degradation when billing service fails (non-access error)', async () => {
      // Arrange - billing service throws a generic network error, not an access error
      mockBillingService.getBillingStatus.mockRejectedValueOnce(new Error('Network error'));

      const mockFields: CustomField[] = [
        {
          id: 1,
          clubId,
          fieldName: 'test',
          fieldLabel: 'Test',
          fieldType: 'text',
          isRequired: false,
          isActive: true,
          sortOrder: 1,
          memberCount: 10,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockFields });

      // Act
      const result = await customFieldsService.getCustomFields(clubId);

      // Assert - should proceed with the operation despite billing service failure
      expect(result).toEqual(mockFields);
    });
  });

  describe('validateFieldValue edge cases', () => {
    it('should validate select field without fieldOptions parameter', () => {
      // When fieldOptions is undefined, any value should be valid
      const result = customFieldsService.validateFieldValue('select', 'AnyValue');
      expect(result.isValid).toBe(true);
    });

    it('should validate multi_select field without fieldOptions parameter', () => {
      // When fieldOptions is undefined, any value should be valid
      const result = customFieldsService.validateFieldValue('multi_select', 'Value1, Value2');
      expect(result.isValid).toBe(true);
    });

    it('should validate empty select field with options', () => {
      // Empty value should be valid regardless of field type
      const options = ['Option1', 'Option2'];
      const result = customFieldsService.validateFieldValue('select', '', options);
      expect(result.isValid).toBe(true);
    });
  });
});
