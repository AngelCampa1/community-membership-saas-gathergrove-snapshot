import apiClient from './apiClient';
import { ErrorHandler } from '@/lib/errorHandler';
import { billingService } from './billingService';
import { logger } from '@/lib/logger';

/**
 * Custom Fields Service for Member Profile Management
 * 
 * Provides comprehensive custom field management capabilities for member profiles
 * with performance optimization for 1,000+ members and field configurations.
 * 
 * Features:
 * - Complete CRUD operations for custom field definitions
 * - Bulk value updates with progress tracking
 * - Advanced search and filtering capabilities
 * - Performance optimization for large datasets
 * - Expand tier authorization enforcement
 * - Comprehensive error handling and validation
 */

export interface CustomField {
  id: number;
  clubId: number;
  fieldName: string;
  fieldLabel: string;
  fieldType: 'text' | 'number' | 'boolean' | 'date' | 'email' | 'phone' | 'url' | 'select' | 'multi_select' | 'textarea';
  fieldOptions?: string[]; // For select/multi_select types
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
  memberCount: number; // Number of members with values for this field
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomFieldRequest {
  fieldName: string;
  fieldLabel: string;
  fieldType: CustomField['fieldType'];
  fieldOptions?: string[];
  isRequired?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCustomFieldRequest {
  fieldName?: string;
  fieldLabel?: string;
  fieldType?: CustomField['fieldType'];
  fieldOptions?: string[];
  isRequired?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CustomFieldValue {
  id: number;
  customFieldId: number;
  memberId: number;
  fieldValue: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberCustomFieldValue {
  memberId: number;
  memberName: string;
  customFieldValues: Array<{
    customFieldId: number;
    fieldName: string;
    fieldLabel: string;
    fieldType: string;
    fieldValue: string;
  }>;
}

export interface BulkCustomFieldValueRequest {
  memberIds: number[];
  customFieldValues: Array<{
    customFieldId: number;
    fieldValue: string;
  }>;
}

export interface BulkCustomFieldValueResponse {
  totalMembers: number;
  successfulUpdates: number;
  failedUpdates: number;
  errors: Array<{
    memberId: number;
    customFieldId: number;
    error: string;
    details?: Record<string, unknown>;
  }>;
  processingTime: number;
}

export interface CustomFieldSearchRequest {
  searchCriteria: Array<{
    customFieldId: number;
    fieldValue: string;
    matchMode: 'exact' | 'contains' | 'starts_with' | 'ends_with';
  }>;
  matchAllCriteria?: boolean; // AND vs OR logic
  page?: number;
  pageSize?: number;
}

export interface CustomFieldSearchResult {
  members: Array<{
    id: number;
    fullName: string;
    email: string;
    membershipTypeName: string;
    status: string;
    joinDate: string;
    customFieldValues: Array<{
      customFieldId: number;
      fieldName: string;
      fieldLabel: string;
      fieldValue: string;
    }>;
  }>;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CustomFieldAnalytics {
  totalFields: number;
  activeFields: number;
  totalFieldValues: number;
  averageFieldsPerMember: number;
  mostUsedFields: Array<{
    customFieldId: number;
    fieldName: string;
    fieldLabel: string;
    valueCount: number;
  }>;
  leastUsedFields: Array<{
    customFieldId: number;
    fieldName: string;
    fieldLabel: string;
    valueCount: number;
  }>;
  fieldTypeDistribution: Record<string, number>;
}

// Field type options for UI compatibility
export const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean (Yes/No)' },
  { value: 'date', label: 'Date' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'url', label: 'URL' },
  { value: 'select', label: 'Dropdown' },
  { value: 'multi_select', label: 'Multi-select' },
  { value: 'textarea', label: 'Text Area' }
] as const;

export type FieldType = typeof FIELD_TYPE_OPTIONS[number]['value'];

export class CustomFieldsService {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private requestQueue = new Map<string, Promise<unknown>>();

  /**
   * Verify unlimited tier access for custom fields
   */
  private async verifyUnlimitedAccess(): Promise<void> {
    try {
      const billingStatus = await billingService.getBillingStatus();
      if (billingStatus.currentTier !== 'Expand' && billingStatus.currentTier !== 'Unlimited') {
        throw new Error('Custom fields are only available for Expand tier subscribers');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Custom fields are only available')) {
        throw error;
      }
      // Continue with graceful degradation if billing service is unavailable
      logger.error('Billing service unavailable, proceeding with custom fields operation');
    }
  }

  /**
   * Get all custom fields for a club
   */
  async getCustomFields(clubId: number, options: {
    includeInactive?: boolean;
    sortBy?: 'sortOrder' | 'fieldName' | 'createdAt';
  } = {}): Promise<CustomField[]> {
    await this.verifyUnlimitedAccess();

    const { includeInactive = false, sortBy = 'sortOrder' } = options;
    
    const cacheKey = this.generateCacheKey('custom-fields', { clubId, ...options });
    const cachedResult = this.getFromCache<CustomField[]>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const params = new URLSearchParams();
      if (includeInactive) params.append('includeInactive', 'true');
      params.append('sortBy', sortBy);

      const response = await apiClient.get<CustomField[]>(`/clubs/${clubId}/custom-fields?${params.toString()}`);
      
      const result = response.data;
      this.setCache(cacheKey, result, this.DEFAULT_TTL);
      return result;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading custom fields',
        action: 'Please try refreshing the page',
        customMessages: {
          403: 'You do not have permission to view custom fields',
          404: 'Club not found'
        }
      });
    }
  }

  /**
   * Create a new custom field
   */
  async createCustomField(clubId: number, request: CreateCustomFieldRequest): Promise<CustomField> {
    await this.verifyUnlimitedAccess();

    // Validate field options for select types
    if (['select', 'multi_select'].includes(request.fieldType) && (!request.fieldOptions || request.fieldOptions.length === 0)) {
      throw new Error('Field options are required for select and multi_select field types');
    }

    try {
      const response = await apiClient.post<CustomField>(`/clubs/${clubId}/custom-fields`, request);
      
      // Invalidate caches
      this.invalidateCustomFieldCaches(clubId);
      
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'creating custom field',
        action: 'Please check the field configuration and try again',
        customMessages: {
          400: 'Invalid field configuration',
          409: 'A field with this name already exists',
          422: 'Field validation failed'
        }
      });
    }
  }

  /**
   * Update an existing custom field
   */
  async updateCustomField(clubId: number, fieldId: number, request: UpdateCustomFieldRequest): Promise<CustomField> {
    await this.verifyUnlimitedAccess();

    try {
      const response = await apiClient.put<CustomField>(`/clubs/${clubId}/custom-fields/${fieldId}`, request);
      
      // Invalidate caches
      this.invalidateCustomFieldCaches(clubId);
      
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'updating custom field',
        action: 'Please check the field configuration and try again',
        customMessages: {
          400: 'Invalid field configuration',
          404: 'Custom field not found',
          409: 'A field with this name already exists'
        }
      });
    }
  }

  /**
   * Delete a custom field
   */
  async deleteCustomField(clubId: number, fieldId: number): Promise<{
    success: boolean;
    valuesDeleted: number;
  }> {
    await this.verifyUnlimitedAccess();

    try {
      const response = await apiClient.delete<{
        success: boolean;
        valuesDeleted: number;
      }>(`/clubs/${clubId}/custom-fields/${fieldId}`);
      
      // Invalidate caches
      this.invalidateCustomFieldCaches(clubId);
      
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'deleting custom field',
        action: 'Please try again',
        customMessages: {
          404: 'Custom field not found',
          409: 'Cannot delete field with existing values'
        }
      });
    }
  }

  /**
   * Get custom field values for a specific member
   */
  async getMemberCustomFieldValues(clubId: number, memberId: number): Promise<MemberCustomFieldValue> {
    await this.verifyUnlimitedAccess();

    const cacheKey = this.generateCacheKey('member-custom-fields', { clubId, memberId });
    const cachedResult = this.getFromCache<MemberCustomFieldValue>(cacheKey, 2 * 60 * 1000); // 2 minute cache
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const response = await apiClient.get<MemberCustomFieldValue>(`/clubs/${clubId}/members/${memberId}/custom-fields`);
      
      const result = response.data;
      this.setCache(cacheKey, result, 2 * 60 * 1000);
      return result;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading member custom field values',
        action: 'Please try refreshing the page',
        customMessages: {
          404: 'Member not found'
        }
      });
    }
  }

  /**
   * Update custom field values for a member
   */
  async updateMemberCustomFieldValues(
    clubId: number, 
    memberId: number, 
    values: Array<{
      customFieldId: number;
      fieldValue: string;
    }>
  ): Promise<MemberCustomFieldValue> {
    await this.verifyUnlimitedAccess();

    try {
      const response = await apiClient.put<MemberCustomFieldValue>(
        `/clubs/${clubId}/members/${memberId}/custom-fields`,
        { customFieldValues: values }
      );
      
      // Invalidate member-specific cache
      const cacheKey = this.generateCacheKey('member-custom-fields', { clubId, memberId });
      this.cache.delete(cacheKey);
      
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'updating member custom field values',
        action: 'Please check the values and try again',
        customMessages: {
          400: 'Invalid field values',
          404: 'Member or custom field not found',
          422: 'Field validation failed'
        }
      });
    }
  }

  /**
   * Bulk update custom field values for multiple members
   */
  async bulkUpdateCustomFieldValues(clubId: number, request: BulkCustomFieldValueRequest): Promise<BulkCustomFieldValueResponse> {
    await this.verifyUnlimitedAccess();

    // Validate request size for performance
    if (request.memberIds.length > 1000) {
      throw new Error('Cannot process more than 1,000 members in a single bulk operation');
    }

    if (request.memberIds.length === 0) {
      throw new Error('At least one member ID is required for bulk updates');
    }

    try {
      const response = await apiClient.post<BulkCustomFieldValueResponse>(
        `/clubs/${clubId}/custom-fields/bulk-update`,
        request
      );
      
      // Invalidate relevant caches
      this.invalidateCustomFieldCaches(clubId);
      
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'bulk updating custom field values',
        action: 'Please check the request parameters and try again',
        customMessages: {
          400: 'Invalid bulk update request',
          413: 'Request too large - please reduce the number of members',
          422: 'Some values could not be processed - check the error details'
        }
      });
    }
  }

  /**
   * Search members by custom field values
   */
  async searchMembersByCustomFields(clubId: number, request: CustomFieldSearchRequest): Promise<CustomFieldSearchResult> {
    await this.verifyUnlimitedAccess();

    const { page = 1, pageSize = 25, matchAllCriteria = false } = request;

    const cacheKey = this.generateCacheKey('custom-field-search', { clubId, ...request });
    const cachedResult = this.getFromCache<CustomFieldSearchResult>(cacheKey, 2 * 60 * 1000); // 2 minute cache
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const response = await apiClient.post<CustomFieldSearchResult>(
        `/clubs/${clubId}/custom-fields/search`,
        {
          ...request,
          page,
          pageSize,
          matchAllCriteria
        }
      );
      
      const result = response.data;
      this.setCache(cacheKey, result, 2 * 60 * 1000);
      return result;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'searching members by custom fields',
        action: 'Please check the search criteria and try again',
        customMessages: {
          400: 'Invalid search criteria'
        }
      });
    }
  }

  /**
   * Get custom field usage analytics
   */
  async getCustomFieldAnalytics(clubId: number): Promise<CustomFieldAnalytics> {
    await this.verifyUnlimitedAccess();

    const cacheKey = this.generateCacheKey('custom-field-analytics', { clubId });
    const cachedResult = this.getFromCache<CustomFieldAnalytics>(cacheKey, 30 * 60 * 1000); // 30 minute cache
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const response = await apiClient.get<CustomFieldAnalytics>(`/clubs/${clubId}/custom-fields/analytics`);
      
      const result = response.data;
      this.setCache(cacheKey, result, 30 * 60 * 1000);
      return result;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading custom field analytics',
        action: 'Please try refreshing the page'
      });
    }
  }

  /**
   * Validate field value against field type
   */
  validateFieldValue(fieldType: CustomField['fieldType'], value: string, fieldOptions?: string[]): {
    isValid: boolean;
    error?: string;
  } {
    if (!value || value.trim() === '') {
      return { isValid: true }; // Allow empty values, required validation happens elsewhere
    }

    switch (fieldType) {
      case 'number':
        const num = parseFloat(value);
        if (isNaN(num)) {
          return { isValid: false, error: 'Value must be a valid number' };
        }
        break;

      case 'boolean':
        if (!['true', 'false', '1', '0', 'yes', 'no'].includes(value.toLowerCase())) {
          return { isValid: false, error: 'Value must be true/false, yes/no, or 1/0' };
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return { isValid: false, error: 'Value must be a valid email address' };
        }
        break;

      case 'phone':
        const phoneRegex = /^[\d\s\-\+\(\)\.]+$/;
        if (!phoneRegex.test(value)) {
          return { isValid: false, error: 'Value must be a valid phone number' };
        }
        break;

      case 'url':
        try {
          new URL(value);
        } catch {
          return { isValid: false, error: 'Value must be a valid URL' };
        }
        break;

      case 'date':
        if (isNaN(Date.parse(value))) {
          return { isValid: false, error: 'Value must be a valid date' };
        }
        break;

      case 'select':
        if (fieldOptions && !fieldOptions.includes(value)) {
          return { isValid: false, error: `Value must be one of: ${fieldOptions.join(', ')}` };
        }
        break;

      case 'multi_select':
        const values = value.split(',').map(v => v.trim());
        if (fieldOptions) {
          const invalidValues = values.filter(v => !fieldOptions.includes(v));
          if (invalidValues.length > 0) {
            return { isValid: false, error: `Invalid values: ${invalidValues.join(', ')}` };
          }
        }
        break;
    }

    return { isValid: true };
  }

  // Cache management methods
  private generateCacheKey(operation: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>);

    return `custom-fields:${operation}:${JSON.stringify(sortedParams)}`;
  }

  private getFromCache<T>(key: string, customTtl?: number): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const ttl = customTtl || item.ttl;
    if (Date.now() - item.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  private setCache(key: string, data: unknown, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Cleanup old cache entries periodically
    if (this.cache.size > 1000) {
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private invalidateCustomFieldCaches(clubId: number): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(`\"clubId\":${clubId}`) || key.includes(`custom-fields:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
    this.requestQueue.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRatio: number;
    avgAge: number;
  } {
    const now = Date.now();
    let totalAge = 0;
    
    for (const item of this.cache.values()) {
      totalAge += now - item.timestamp;
    }

    return {
      size: this.cache.size,
      hitRatio: 0, // Would need to track hits/misses to calculate
      avgAge: this.cache.size > 0 ? totalAge / this.cache.size : 0
    };
  }
}

// Export singleton instance
const customFieldsService = new CustomFieldsService();
export default customFieldsService;

// Legacy export for backward compatibility  
export { customFieldsService };
