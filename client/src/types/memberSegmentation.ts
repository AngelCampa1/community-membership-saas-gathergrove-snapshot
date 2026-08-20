/**
 * Types for member segmentation system (Advanced Member Management)
 */

import { DirectoryMember } from './directoryMember';
import { AnalyticsDateRange } from './analytics';

// ============================================================================
// Custom Fields
// ============================================================================

export interface CustomField {
  /** Unique field ID */
  id: string;
  /** Human-readable field name */
  name: string;
  /** Field type */
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'email' | 'phone' | 'url';
  /** Field description for users */
  description?: string;
  /** Whether field is required */
  required: boolean;
  /** Field options for select/multiselect */
  options?: CustomFieldOption[];
  /** Default value */
  defaultValue?: unknown;
  /** Validation rules */
  validation?: CustomFieldValidation;
  /** Field category for organization */
  category?: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last updated timestamp */
  updatedAt: Date;
  /** Creator user ID */
  createdBy: string;
}

export interface CustomFieldOption {
  /** Option value */
  value: string;
  /** Display label */
  label: string;
  /** Option description */
  description?: string;
  /** Color for visual distinction */
  color?: string;
  /** Sort order */
  order: number;
}

export interface CustomFieldValidation {
  /** Minimum value/length */
  min?: number;
  /** Maximum value/length */
  max?: number;
  /** Regex pattern for validation */
  pattern?: string;
  /** Custom validation message */
  message?: string;
  /** Whether field accepts unique values only */
  unique?: boolean;
}

export interface CustomFieldValue {
  /** Field ID */
  fieldId: string;
  /** Member ID */
  memberId: number;
  /** Field value */
  value: unknown;
  /** Last updated */
  updatedAt: Date;
}

// ============================================================================
// Tags
// ============================================================================

export interface MemberTag {
  /** Unique tag ID */
  id: string;
  /** Tag name */
  name: string;
  /** Tag description */
  description?: string;
  /** Tag color (hex) */
  color: string;
  /** Tag category */
  category?: string;
  /** Whether tag is system-generated */
  isSystem: boolean;
  /** Creation timestamp */
  createdAt: Date;
  /** Creator user ID */
  createdBy: string;
  /** Usage count */
  memberCount: number;
}

export interface MemberTagAssignment {
  /** Assignment ID */
  id: string;
  /** Tag ID */
  tagId: string;
  /** Member ID */
  memberId: number;
  /** Assignment timestamp */
  assignedAt: Date;
  /** Who assigned the tag */
  assignedBy: string;
  /** Assignment reason/notes */
  reason?: string;
}

export type TagColor = 
  | 'slate' | 'red' | 'orange' | 'amber' | 'yellow' | 'lime' 
  | 'green' | 'emerald' | 'teal' | 'cyan' | 'sky' | 'blue' 
  | 'indigo' | 'violet' | 'purple' | 'fuchsia' | 'pink' | 'rose';

// ============================================================================
// Segments
// ============================================================================

export interface MemberSegment {
  /** Unique segment ID */
  id: string;
  /** Segment name */
  name: string;
  /** Segment description */
  description?: string;
  /** Segment query/conditions */
  query: SegmentQuery;
  /** Whether segment is dynamic (auto-updates) */
  isDynamic: boolean;
  /** Segment color theme */
  color: TagColor;
  /** Creation timestamp */
  createdAt: Date;
  /** Last updated timestamp */
  updatedAt: Date;
  /** Creator user ID */
  createdBy: string;
  /** Current member count */
  memberCount: number;
  /** Last calculated timestamp */
  lastCalculated?: Date;
  /** Whether segment is archived */
  isArchived: boolean;
}

export interface SegmentQuery {
  /** Query conditions */
  conditions: SegmentCondition[];
  /** Logic operator between conditions */
  operator: 'AND' | 'OR';
  /** Nested condition groups */
  groups?: SegmentQueryGroup[];
}

export interface SegmentQueryGroup {
  /** Group conditions */
  conditions: SegmentCondition[];
  /** Logic operator within group */
  operator: 'AND' | 'OR';
  /** Group name for UI */
  name?: string;
}

export interface SegmentCondition {
  /** Condition ID for tracking */
  id: string;
  /** Field being filtered */
  field: string;
  /** Condition operator */
  operator: SegmentOperator;
  /** Filter value(s) */
  value: unknown;
  /** Display name for field */
  fieldLabel: string;
  /** Condition type for UI rendering */
  type: 'standard' | 'custom' | 'tag' | 'activity' | 'calculated';
}

export type SegmentOperator =
  | 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with'
  | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal'
  | 'is_empty' | 'is_not_empty' | 'in' | 'not_in' | 'between' | 'not_between'
  | 'is_true' | 'is_false' | 'before' | 'after' | 'within_days' | 'older_than_days';

// ============================================================================
// Filters & Search
// ============================================================================

export interface AdvancedMemberFilter extends Record<string, unknown> {
  /** Search term */
  searchTerm?: string;
  /** Membership type filter */
  membershipTypes?: string[];
  /** Dues status filter */
  duesStatus?: string[];
  /** Join date range */
  joinDateRange?: AnalyticsDateRange;
  /** Activity level filter */
  activityLevel?: 'HighlyActive' | 'Moderate' | 'LowActivity' | 'Inactive';
  /** Days since last login */
  daysSinceLastLogin?: number;
  /** At risk status */
  isAtRisk?: boolean;
  /** Platform filter */
  platform?: 'web' | 'mobile' | 'all';
  /** Tag filters */
  tags?: string[];
  /** Custom field filters */
  customFields?: CustomFieldFilter[];
  /** Segment filters */
  segments?: string[];
  /** Location filter */
  location?: string;
  /** Age range filter */
  ageRange?: { min?: number; max?: number };
  /** Email verification status */
  emailVerified?: boolean;
  /** Phone verification status */
  phoneVerified?: boolean;
  /** Event attendance filter */
  eventAttendance?: EventAttendanceFilter;
  /** Communication preferences */
  communicationPrefs?: CommunicationFilter;
}

export interface CustomFieldFilter {
  /** Field ID */
  fieldId: string;
  /** Filter operator */
  operator: SegmentOperator;
  /** Filter value */
  value: unknown;
}

export interface EventAttendanceFilter {
  /** Minimum events attended */
  minEvents?: number;
  /** Maximum events attended */
  maxEvents?: number;
  /** Date range for attendance */
  dateRange?: AnalyticsDateRange;
  /** Specific event types */
  eventTypes?: string[];
  /** Attendance status */
  status?: 'attended' | 'registered' | 'cancelled' | 'no_show';
}

export interface CommunicationFilter {
  /** Email preferences */
  email?: boolean;
  /** Push notification preferences */
  push?: boolean;
  /** Newsletter subscription */
  newsletter?: boolean;
  /** Event notifications */
  eventNotifications?: boolean;
}

// ============================================================================
// Bulk Operations
// ============================================================================

export interface BulkOperation {
  /** Operation ID */
  id: string;
  /** Operation type */
  type: BulkOperationType;
  /** Operation name */
  name: string;
  /** Target member IDs */
  memberIds: number[];
  /** Operation parameters */
  parameters: BulkOperationParams;
  /** Operation status */
  status: BulkOperationStatus;
  /** Progress percentage */
  progress: number;
  /** Started timestamp */
  startedAt: Date;
  /** Completed timestamp */
  completedAt?: Date;
  /** Initiated by user ID */
  initiatedBy: string;
  /** Operation results */
  results?: BulkOperationResult;
  /** Error details if failed */
  error?: string;
}

export type BulkOperationType =
  | 'add_tags' | 'remove_tags' | 'update_fields' | 'send_message'
  | 'export_data' | 'delete_members' | 'update_membership'
  | 'send_email' | 'assign_segment';

export type BulkOperationStatus =
  | 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';

export interface BulkOperationParams {
  /** Tags for tag operations */
  tags?: string[];
  /** Field updates for update operations */
  fieldUpdates?: Record<string, unknown>;
  /** Message content for communication */
  message?: {
    subject?: string;
    content: string;
    type: 'email' | 'push';
  };
  /** Export settings */
  export?: {
    format: 'csv' | 'xlsx' | 'json' | 'pdf';
    fields: string[];
    includeCustomFields: boolean;
  };
  /** Membership updates */
  membershipUpdate?: {
    typeId?: number;
    status?: string;
    expirationDate?: Date;
  };
  /** Additional parameters */
  [key: string]: unknown;
}

export interface BulkOperationResult {
  /** Total members processed */
  totalProcessed: number;
  /** Successful operations */
  successful: number;
  /** Failed operations */
  failed: number;
  /** Skipped operations */
  skipped: number;
  /** Error details */
  errors: Array<{
    memberId: number;
    error: string;
  }>;
  /** Generated files/exports */
  exports?: Array<{
    filename: string;
    url: string;
    size: number;
    expiresAt: Date;
  }>;
}

// ============================================================================
// Analytics & Insights
// ============================================================================

export interface SegmentAnalytics {
  /** Segment ID */
  segmentId: string;
  /** Analysis period */
  period: AnalyticsDateRange;
  /** Segment statistics */
  stats: SegmentStats;
  /** Member composition */
  composition: SegmentComposition;
  /** Growth trends */
  growth: SegmentGrowthData[];
  /** Engagement metrics */
  engagement: SegmentEngagementMetrics;
  /** Comparison data */
  comparison?: SegmentComparison;
  /** Generated insights */
  insights: AnalyticsInsight[];
  /** Last updated */
  lastUpdated: Date;
}

export interface SegmentStats {
  /** Total members in segment */
  totalMembers: number;
  /** New members this period */
  newMembers: number;
  /** Members who left segment */
  leftMembers: number;
  /** Growth rate percentage */
  growthRate: number;
  /** Average member value */
  averageMemberValue?: number;
  /** Retention rate */
  retentionRate: number;
  /** Activity rate */
  activityRate: number;
}

export interface SegmentComposition {
  /** By membership type */
  membershipTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  /** By age group */
  ageGroups: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  /** By location */
  locations: Array<{
    location: string;
    count: number;
    percentage: number;
  }>;
  /** By join period */
  joinPeriods: Array<{
    period: string;
    count: number;
    percentage: number;
  }>;
}

export interface SegmentGrowthData {
  /** Date */
  date: string;
  /** Member count */
  memberCount: number;
  /** New members */
  newMembers: number;
  /** Lost members */
  lostMembers: number;
  /** Net growth */
  netGrowth: number;
}

export interface SegmentEngagementMetrics {
  /** Average login frequency */
  avgLoginFrequency: number;
  /** Event attendance rate */
  eventAttendanceRate: number;
  /** Email open rate */
  emailOpenRate: number;
  /** Communication response rate */
  responseRate: number;
  /** Feature usage rates */
  featureUsage: Record<string, number>;
}

export interface SegmentComparison {
  /** Comparison segment ID */
  compareSegmentId: string;
  /** Comparison segment name */
  compareSegmentName: string;
  /** Metric comparisons */
  metrics: Array<{
    metric: string;
    current: number;
    comparison: number;
    difference: number;
    percentageDifference: number;
    trend: 'up' | 'down' | 'stable';
  }>;
}

export interface AnalyticsInsight {
  /** Insight ID */
  id: string;
  /** Insight title */
  title: string;
  /** Insight description */
  description: string;
  /** Insight type */
  type: 'trend' | 'anomaly' | 'recommendation' | 'warning' | 'opportunity';
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** Related metrics */
  metrics: string[];
  /** Impact assessment */
  impact: 'positive' | 'negative' | 'neutral';
  /** Confidence score (0-1) */
  confidence: number;
  /** Generated timestamp */
  timestamp: Date;
  /** Recommended actions */
  actionItems?: string[];
  /** Additional context */
  context?: Record<string, unknown>;
}

// ============================================================================
// UI State Management
// ============================================================================

export interface SegmentationState {
  /** Selected members */
  selectedMembers: number[];
  /** Active filters */
  activeFilters: AdvancedMemberFilter;
  /** Current segment being viewed */
  currentSegment?: string;
  /** Loading states */
  loading: {
    members: boolean;
    segments: boolean;
    analytics: boolean;
    bulkOperation: boolean;
  };
  /** Error states */
  errors: {
    members?: string;
    segments?: string;
    analytics?: string;
    bulkOperation?: string;
  };
  /** UI preferences */
  preferences: {
    viewMode: 'list' | 'grid' | 'table';
    pageSize: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    showPreview: boolean;
    compactMode: boolean;
  };
  /** Active bulk operation */
  activeBulkOperation?: BulkOperation;
  /** Segment builder state */
  segmentBuilder: {
    isOpen: boolean;
    query: SegmentQuery;
    preview: {
      count: number;
      loading: boolean;
    };
  };
}

// ============================================================================
// API Responses
// ============================================================================

export interface PaginatedMembersResponse {
  /** Members data */
  members: (DirectoryMember & {
    customFields: CustomFieldValue[];
    tags: MemberTag[];
    activityMetrics: {
      lastLoginAt?: Date;
      loginCount: number;
      eventAttendanceCount: number;
      engagementScore: number;
      isAtRisk: boolean;
    };
  })[];
  /** Pagination info */
  pagination: {
    currentPage: number;
    totalPages: number;
    totalMembers: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  /** Applied filters summary */
  filterSummary: {
    appliedFilters: string[];
    matchingMembers: number;
    totalMembers: number;
  };
}

export interface SegmentPreviewResponse {
  /** Preview member count */
  count: number;
  /** Sample members (first 10) */
  sampleMembers: DirectoryMember[];
  /** Query execution time */
  executionTime: number;
  /** Any warnings about the query */
  warnings: string[];
}

// ============================================================================
// Form Types
// ============================================================================

export interface CustomFieldFormData {
  name: string;
  type: CustomField['type'];
  description: string;
  required: boolean;
  category: string;
  options: CustomFieldOption[];
  validation: CustomFieldValidation;
}

export interface TagFormData {
  name: string;
  description: string;
  color: TagColor;
  category: string;
}

export interface SegmentFormData {
  name: string;
  description: string;
  color: TagColor;
  isDynamic: boolean;
  query: SegmentQuery;
}

export interface BulkOperationFormData {
  type: BulkOperationType;
  name: string;
  parameters: BulkOperationParams;
  memberIds: number[];
}

// ============================================================================
// Component Props
// ============================================================================

export interface SegmentationComponentProps {
  /** Current club ID */
  clubId: number;
  /** User permissions */
  permissions: {
    canCreateSegments: boolean;
    canEditMembers: boolean;
    canExportData: boolean;
    canSendMessages: boolean;
    canManageTags: boolean;
    canCreateCustomFields: boolean;
  };
  /** Event callbacks */
  onMemberSelect?: (memberIds: number[]) => void;
  onSegmentChange?: (segmentId: string) => void;
  onFilterChange?: (filters: AdvancedMemberFilter) => void;
  /** Custom styling */
  className?: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateCustomFieldRequest {
  clubId: number;
  name: string;
  type: CustomField['type'];
  description?: string;
  required: boolean;
  category?: string;
  options?: CustomFieldOption[];
  validation?: CustomFieldValidation;
  defaultValue?: unknown;
}

export interface UpdateCustomFieldRequest {
  name?: string;
  description?: string;
  required?: boolean;
  category?: string;
  options?: CustomFieldOption[];
  validation?: CustomFieldValidation;
  defaultValue?: unknown;
}

export interface CreateSegmentRequest {
  clubId: number;
  name: string;
  description?: string;
  color: TagColor;
  isDynamic: boolean;
  query: SegmentQuery;
}

export interface UpdateSegmentRequest {
  name?: string;
  description?: string;
  color?: TagColor;
  isDynamic?: boolean;
  query?: SegmentQuery;
}

export interface CreateTagRequest {
  clubId: number;
  name: string;
  description?: string;
  color: string;
  category?: string;
}

export interface UpdateTagRequest {
  name?: string;
  description?: string;
  color?: string;
  category?: string;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Validation errors */
  errors: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
  /** Validation warnings */
  warnings: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
}

export interface FieldValidationRule {
  /** Rule type */
  type: 'required' | 'min' | 'max' | 'pattern' | 'unique' | 'custom';
  /** Rule value/configuration */
  value?: unknown;
  /** Error message */
  message: string;
  /** Custom validation function */
  validator?: (value: unknown) => boolean;
}
