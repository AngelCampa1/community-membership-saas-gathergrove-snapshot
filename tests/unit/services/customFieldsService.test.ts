/**
 * Unit Tests for Custom Fields Service
 * Test coverage for CRUD operations, validation, and error handling
 */

import { customFieldsService } from '@/services/customFieldsService';
import { apiClient } from '@/services/apiClient';
import { CustomField, CustomFieldType, CustomFieldValue } from '@/types/customFields';

// Mock the API client
jest.mock('@/services/apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('CustomFieldsService', () => {
  const mockClubId = 'club-123';
  const mockCustomField: CustomField = {
    id: 'field-1',
    clubId: mockClubId,
    fieldName: 'Emergency Contact',
    fieldType: CustomFieldType.TEXT,
    fieldOptions: null,
    isRequired: true,
    sortOrder: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const mockCustomFieldValue: CustomFieldValue = {
    id: 'value-1',
    memberId: 'member-1',
    fieldId: 'field-1',
    fieldValue: 'John Doe',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCustomFields', () => {
    it('should fetch all custom fields for a club', async () => {
      const mockFields = [mockCustomField];
      mockApiClient.get.mockResolvedValue({ data: mockFields });

      const result = await customFieldsService.getCustomFields(mockClubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/api/clubs/${mockClubId}/custom-fields`);
      expect(result).toEqual(mockFields);
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      mockApiClient.get.mockRejectedValue(mockError);

      await expect(customFieldsService.getCustomFields(mockClubId))
        .rejects.toThrow('Network error');
    });

    it('should return empty array for club with no custom fields', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      const result = await customFieldsService.getCustomFields(mockClubId);

      expect(result).toEqual([]);
    });
  });

  describe('createCustomField', () => {
    it('should create a new custom field', async () => {
      const fieldData = {
        fieldName: 'Emergency Contact',
        fieldType: CustomFieldType.TEXT,
        isRequired: true,
        sortOrder: 1
      };

      mockApiClient.post.mockResolvedValue({ data: mockCustomField });

      const result = await customFieldsService.createCustomField(mockClubId, fieldData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/custom-fields`,
        fieldData
      );
      expect(result).toEqual(mockCustomField);
    });

    it('should validate field name is required', async () => {
      const invalidFieldData = {
        fieldName: '',
        fieldType: CustomFieldType.TEXT,
        isRequired: false,
        sortOrder: 1
      };

      await expect(customFieldsService.createCustomField(mockClubId, invalidFieldData))
        .rejects.toThrow('Field name is required');
    });

    it('should validate field type is valid', async () => {
      const invalidFieldData = {
        fieldName: 'Test Field',
        fieldType: 'INVALID_TYPE' as CustomFieldType,
        isRequired: false,
        sortOrder: 1
      };

      await expect(customFieldsService.createCustomField(mockClubId, invalidFieldData))
        .rejects.toThrow('Invalid field type');
    });

    it('should handle duplicate field name error', async () => {
      const fieldData = {
        fieldName: 'Emergency Contact',
        fieldType: CustomFieldType.TEXT,
        isRequired: true,
        sortOrder: 1
      };

      mockApiClient.post.mockRejectedValue({
        response: { status: 409, data: { message: 'Field name already exists' } }
      });

      await expect(customFieldsService.createCustomField(mockClubId, fieldData))
        .rejects.toThrow('Field name already exists');
    });

    it('should create select field with options', async () => {
      const selectFieldData = {
        fieldName: 'Membership Level',
        fieldType: CustomFieldType.SELECT,
        fieldOptions: ['Bronze', 'Silver', 'Gold'],
        isRequired: true,
        sortOrder: 2
      };

      const expectedField = {
        ...mockCustomField,
        fieldName: 'Membership Level',
        fieldType: CustomFieldType.SELECT,
        fieldOptions: ['Bronze', 'Silver', 'Gold']
      };

      mockApiClient.post.mockResolvedValue({ data: expectedField });

      const result = await customFieldsService.createCustomField(mockClubId, selectFieldData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/custom-fields`,
        selectFieldData
      );
      expect(result).toEqual(expectedField);
    });

    it('should validate select field has options', async () => {
      const invalidSelectField = {
        fieldName: 'Membership Level',
        fieldType: CustomFieldType.SELECT,
        fieldOptions: [],
        isRequired: true,
        sortOrder: 2
      };

      await expect(customFieldsService.createCustomField(mockClubId, invalidSelectField))
        .rejects.toThrow('Select field must have at least one option');
    });
  });

  describe('updateCustomField', () => {
    it('should update an existing custom field', async () => {
      const updateData = {
        fieldName: 'Updated Emergency Contact',
        isRequired: false
      };

      const updatedField = { ...mockCustomField, ...updateData };
      mockApiClient.put.mockResolvedValue({ data: updatedField });

      const result = await customFieldsService.updateCustomField(
        mockClubId,
        mockCustomField.id,
        updateData
      );

      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/custom-fields/${mockCustomField.id}`,
        updateData
      );
      expect(result).toEqual(updatedField);
    });

    it('should handle field not found error', async () => {
      mockApiClient.put.mockRejectedValue({
        response: { status: 404, data: { message: 'Custom field not found' } }
      });

      await expect(customFieldsService.updateCustomField(mockClubId, 'invalid-id', {}))
        .rejects.toThrow('Custom field not found');
    });
  });

  describe('deleteCustomField', () => {
    it('should delete a custom field', async () => {
      mockApiClient.delete.mockResolvedValue({ data: { success: true } });

      await customFieldsService.deleteCustomField(mockClubId, mockCustomField.id);

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/custom-fields/${mockCustomField.id}`
      );
    });

    it('should handle deletion of field with existing values', async () => {
      mockApiClient.delete.mockRejectedValue({
        response: { 
          status: 409, 
          data: { message: 'Cannot delete field with existing member values' } 
        }
      });

      await expect(customFieldsService.deleteCustomField(mockClubId, mockCustomField.id))
        .rejects.toThrow('Cannot delete field with existing member values');
    });

    it('should allow force deletion of field with values', async () => {
      mockApiClient.delete.mockResolvedValue({ data: { success: true, deletedValues: 5 } });

      const result = await customFieldsService.deleteCustomField(
        mockClubId, 
        mockCustomField.id, 
        true
      );

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/custom-fields/${mockCustomField.id}?force=true`
      );
      expect(result.deletedValues).toBe(5);
    });
  });

  describe('getCustomFieldValues', () => {
    it('should fetch values for a specific member', async () => {
      const mockValues = [mockCustomFieldValue];
      mockApiClient.get.mockResolvedValue({ data: mockValues });

      const result = await customFieldsService.getCustomFieldValues(
        mockClubId, 
        'member-1'
      );

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/members/member-1/custom-field-values`
      );
      expect(result).toEqual(mockValues);
    });

    it('should fetch values for a specific field', async () => {
      const mockValues = [mockCustomFieldValue];
      mockApiClient.get.mockResolvedValue({ data: mockValues });

      const result = await customFieldsService.getCustomFieldValues(
        mockClubId,
        undefined,
        'field-1'
      );

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/custom-field-values?fieldId=field-1`
      );
      expect(result).toEqual(mockValues);
    });
  });

  describe('setCustomFieldValue', () => {
    it('should set a value for a custom field', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockCustomFieldValue });

      const result = await customFieldsService.setCustomFieldValue(
        mockClubId,
        'member-1',
        'field-1',
        'John Doe'
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/members/member-1/custom-field-values`,
        {
          fieldId: 'field-1',
          fieldValue: 'John Doe'
        }
      );
      expect(result).toEqual(mockCustomFieldValue);
    });

    it('should validate required field has value', async () => {
      await expect(customFieldsService.setCustomFieldValue(
        mockClubId,
        'member-1', 
        'field-1',
        ''
      )).rejects.toThrow('Value is required for this field');
    });

    it('should validate email format for email fields', async () => {
      await expect(customFieldsService.setCustomFieldValue(
        mockClubId,
        'member-1',
        'email-field',
        'invalid-email',
        CustomFieldType.EMAIL
      )).rejects.toThrow('Invalid email format');
    });

    it('should validate URL format for URL fields', async () => {
      await expect(customFieldsService.setCustomFieldValue(
        mockClubId,
        'member-1',
        'url-field',
        'invalid-url',
        CustomFieldType.URL
      )).rejects.toThrow('Invalid URL format');
    });

    it('should validate date format for date fields', async () => {
      await expect(customFieldsService.setCustomFieldValue(
        mockClubId,
        'member-1',
        'date-field',
        'invalid-date',
        CustomFieldType.DATE
      )).rejects.toThrow('Invalid date format');
    });

    it('should validate number format for number fields', async () => {
      await expect(customFieldsService.setCustomFieldValue(
        mockClubId,
        'member-1',
        'number-field',
        'not-a-number',
        CustomFieldType.NUMBER
      )).rejects.toThrow('Invalid number format');
    });

    it('should validate select option for select fields', async () => {
      await expect(customFieldsService.setCustomFieldValue(
        mockClubId,
        'member-1',
        'select-field',
        'Invalid Option',
        CustomFieldType.SELECT,
        ['Option 1', 'Option 2']
      )).rejects.toThrow('Invalid option selected');
    });
  });

  describe('bulkSetCustomFieldValues', () => {
    it('should set values for multiple members', async () => {
      const bulkData = [
        { memberId: 'member-1', fieldId: 'field-1', fieldValue: 'Value 1' },
        { memberId: 'member-2', fieldId: 'field-1', fieldValue: 'Value 2' }
      ];

      mockApiClient.post.mockResolvedValue({ data: { success: true, updated: 2 } });

      const result = await customFieldsService.bulkSetCustomFieldValues(
        mockClubId,
        bulkData
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/custom-field-values/bulk`,
        { values: bulkData }
      );
      expect(result.updated).toBe(2);
    });

    it('should handle partial failures in bulk operations', async () => {
      const bulkData = [
        { memberId: 'member-1', fieldId: 'field-1', fieldValue: 'Value 1' },
        { memberId: 'invalid-member', fieldId: 'field-1', fieldValue: 'Value 2' }
      ];

      mockApiClient.post.mockResolvedValue({ 
        data: { 
          success: false, 
          updated: 1, 
          errors: ['Member not found: invalid-member'] 
        } 
      });

      const result = await customFieldsService.bulkSetCustomFieldValues(
        mockClubId,
        bulkData
      );

      expect(result.success).toBe(false);
      expect(result.updated).toBe(1);
      expect(result.errors).toContain('Member not found: invalid-member');
    });
  });

  describe('validateCustomFieldValue', () => {
    it('should validate text field length limits', () => {
      const longText = 'a'.repeat(1001);
      
      expect(() => customFieldsService.validateCustomFieldValue(
        CustomFieldType.TEXT, longText
      )).toThrow('Text exceeds maximum length of 1000 characters');
    });

    it('should validate phone number format', () => {
      expect(() => customFieldsService.validateCustomFieldValue(
        CustomFieldType.PHONE, 'invalid-phone'
      )).toThrow('Invalid phone number format');
      
      // Valid phone numbers should pass
      expect(() => customFieldsService.validateCustomFieldValue(
        CustomFieldType.PHONE, '+1-555-123-4567'
      )).not.toThrow();
    });

    it('should validate boolean values', () => {
      expect(() => customFieldsService.validateCustomFieldValue(
        CustomFieldType.BOOLEAN, 'maybe'
      )).toThrow('Boolean field must be true or false');
      
      // Valid boolean values should pass
      expect(() => customFieldsService.validateCustomFieldValue(
        CustomFieldType.BOOLEAN, 'true'
      )).not.toThrow();
    });

    it('should validate multi-select options', () => {
      const options = ['Option 1', 'Option 2', 'Option 3'];
      
      expect(() => customFieldsService.validateCustomFieldValue(
        CustomFieldType.MULTI_SELECT, 
        'Option 1,Invalid Option', 
        options
      )).toThrow('Invalid options selected');
      
      // Valid multi-select should pass
      expect(() => customFieldsService.validateCustomFieldValue(
        CustomFieldType.MULTI_SELECT,
        'Option 1,Option 2',
        options
      )).not.toThrow();
    });
  });

  describe('getCustomFieldAnalytics', () => {
    it('should return statistics for custom fields usage', async () => {
      const mockStats = {
        totalFields: 5,
        totalValues: 120,
        fieldUsage: [
          { fieldId: 'field-1', fieldName: 'Emergency Contact', valueCount: 45 },
          { fieldId: 'field-2', fieldName: 'Dietary Restrictions', valueCount: 30 }
        ]
      };

      mockApiClient.get.mockResolvedValue({ data: mockStats });

      const result = await customFieldsService.getCustomFieldAnalytics(mockClubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/custom-fields/stats`
      );
      expect(result).toEqual(mockStats);
    });
  });

  describe('reorderCustomFields', () => {
    it('should update the sort order of custom fields', async () => {
      const fieldOrder = ['field-2', 'field-1', 'field-3'];
      mockApiClient.put.mockResolvedValue({ data: { success: true } });

      await customFieldsService.reorderCustomFields(mockClubId, fieldOrder);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/custom-fields/reorder`,
        { fieldOrder }
      );
    });
  });
});