// Core member segmentation types

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  membershipType: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  joinDate: string;
  lastLoginDate?: string;
  tags: string[];
  customFields: Record<string, string | number | boolean | Date | null>;
  createdAt: string;
  updatedAt: string;
}

// Custom Field Types
export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'textarea' | 'url' | 'email';
  required: boolean;
  options?: string[];
  description?: string;
  defaultValue?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CustomFieldFormData {
  name: string;
  type: CustomField['type'];
  required: boolean;
  options?: string[];
  description?: string;
  defaultValue?: string;
  validation?: CustomField['validation'];
}

// Filter Types
export interface FilterCondition {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'notIn' | 'isNull' | 'isNotNull';
  value: string | number | string[] | [string, string] | [number, number];
  logicalOperator?: 'AND' | 'OR';
}

export interface FilterGroup {
  id: string;
  conditions: FilterCondition[];
  logicalOperator: 'AND' | 'OR';
  groups?: FilterGroup[];
}

export interface MemberFilterState {
  groups: FilterGroup[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface FilterField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  options?: Array<{ value: string; label: string }>;
}

export interface FilterPreviewResult {
  count: number;
  members: Member[];
  query: string;
}

// Tag Types
export interface Tag {
  id: string;
  name: string;
  color: string;
  category?: string;
  description?: string;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TagCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface TagFormData {
  name: string;
  color: string;
  category?: string;
  description?: string;
}

export interface TagCategoryFormData {
  name: string;
  color: string;
  description?: string;
}

export interface TagUsageStats {
  totalMembers: number;
  taggedMembers: number;
  untaggedMembers: number;
  mostUsedTags: Array<{
    tag: Tag;
    memberCount: number;
  }>;
}

// Segment Types
export interface SegmentCriteria {
  id: string;
  type: 'filter' | 'tag' | 'custom' | 'behavior';
  name: string;
  operator?: 'AND' | 'OR' | 'NOT';
  config: Record<string, unknown>;
  weight?: number;
}

export interface Segment {
  id?: string;
  name: string;
  description?: string;
  criteria: SegmentCriteria[];
  isActive: boolean;
  memberCount?: number;
  lastUpdated?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SegmentCriteriaTemplate {
  id: string;
  name: string;
  type: SegmentCriteria['type'];
  description: string;
  fields: string[];
  defaultConfig: Record<string, unknown>;
  icon?: string;
}

export interface SegmentPreview {
  count: number;
  members: Member[];
  criteria: SegmentCriteria[];
  estimatedRefreshTime: string;
}

export interface SegmentInsights {
  id: string;
  segmentId: string;
  memberCount: number;
  growth: {
    current: number;
    previous: number;
    percentage: number;
  };
  engagement: {
    score: number;
    trend: 'up' | 'down' | 'stable';
  };
  demographics: {
    ageDistribution: Array<{ range: string; count: number; percentage: number }>;
    genderDistribution: Array<{ gender: string; count: number; percentage: number }>;
    locationDistribution: Array<{ location: string; count: number; percentage: number }>;
    membershipTypeDistribution: Array<{ type: string; count: number; percentage: number }>;
  };
  behavior: {
    eventAttendance: number;
    communicationEngagement: number;
    featureUsage: Record<string, number>;
    activityTrends: Array<{ date: string; activity: number }>;
  };
  recommendations: Array<{
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    actionType: string;
    config?: Record<string, unknown>;
  }>;
  lastUpdated: string;
}

// Bulk Operations Types
export interface BulkOperation {
  id: string;
  type: 'update_field' | 'add_tag' | 'remove_tag' | 'change_status' | 'send_communication' | 'export' | 'delete';
  name: string;
  description: string;
  icon?: string;
  config: Record<string, unknown>;
  requiresConfirmation?: boolean;
  estimatedTime?: string;
  permissions?: string[];
}

export interface BulkOperationResult {
  operationId: string;
  totalMembers: number;
  processedMembers: number;
  failedMembers: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startedAt: string;
  completedAt?: string;
  errors?: Array<{
    memberId: string;
    error: string;
  }>;
  results?: Record<string, unknown>;
}

export interface BulkOperationConfig {
  memberIds: string[];
  operation: BulkOperation;
  parameters: Record<string, unknown>;
  dryRun?: boolean;
  batchSize?: number;
}

// Analytics Types
export interface SegmentMetrics {
  totalMembers: number;
  growthRate: number;
  engagementScore: number;
  retentionRate: number;
  averageLifetimeValue: number;
  churnRate: number;
  conversionRate: number;
}

export interface AnalyticsTimeframe {
  period: '7d' | '30d' | '90d' | '1y' | 'all';
  startDate?: string;
  endDate?: string;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
  }>;
}

// Communication Types
export interface CommunicationTemplate {
  id: string;
  name: string;
  type: 'email' | 'push' | 'in_app';
  subject: string;
  content: string;
  variables: string[];
  isActive: boolean;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationCampaign {
  id: string;
  name: string;
  segmentId: string;
  templateId?: string;
  type: CommunicationTemplate['type'];
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled' | 'failed';
  subject?: string;
  content?: string;
  scheduledAt?: string;
  sentAt?: string;
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  openRate?: number;
  clickRate?: number;
  unsubscribeRate?: number;
  bounceRate?: number;
  abTestConfig?: {
    isEnabled: boolean;
    variants: Array<{
      id: string;
      name: string;
      percentage: number;
      subject?: string;
      content?: string;
    }>;
    winnerCriteria: 'open_rate' | 'click_rate' | 'conversion';
  };
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationMetrics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalUnsubscribed: number;
  averageOpenRate: number;
  averageClickRate: number;
  averageBounceRate: number;
  averageUnsubscribeRate: number;
  trends: Array<{
    date: string;
    sent: number;
    opened: number;
    clicked: number;
  }>;
}

export interface CommunicationPreview {
  subject: string;
  content: string;
  recipientCount: number;
  variables: Record<string, string>;
  sampleMember?: Member;
}

// Export Types
export interface ExportConfig {
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  fields: string[];
  includeCustomFields: boolean;
  includeTags: boolean;
  filters?: MemberFilterState;
  filename?: string;
}

export interface ExportResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  filename: string;
  recordCount: number;
  createdAt: string;
  expiresAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: string[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Form State Types
export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

// Event Types
export interface SegmentationEvents {
  'segment:created': { segment: Segment };
  'segment:updated': { segment: Segment };
  'segment:deleted': { segmentId: string };
  'tag:created': { tag: Tag };
  'tag:updated': { tag: Tag };
  'tag:deleted': { tagId: string };
  'bulk-operation:started': { operationId: string; memberCount: number };
  'bulk-operation:completed': { operationId: string; result: BulkOperationResult };
  'campaign:sent': { campaignId: string; recipientCount: number };
  'filter:applied': { filter: MemberFilterState; resultCount: number };
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type SortDirection = 'asc' | 'desc';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type ValidationResult = {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
};
