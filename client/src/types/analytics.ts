// Analytics types for US-004 Advanced Analytics Dashboard

export interface AnalyticsDateRange {
  startDate: Date;
  endDate: Date;
  label?: string;
}

export interface EngagementMetric {
  date: string;
  activeMembers: number;
  eventAttendance: number;
  engagementRate: number;
  totalMembers: number;
}

export interface ROIMetric {
  period: string;
  revenue: number;
  costs: number;
  profit: number;
  roi: number;
  trend: 'up' | 'down' | 'stable';
}

export interface EventPerformanceData {
  eventId: string;
  eventName: string;
  date: string;
  attendance: number;
  revenue: number;
  satisfaction: number;
  capacity: number;
  attendanceRate: number;
}

export interface ExportFormatConfig {
  type: 'pdf' | 'excel' | 'csv';
  label: string;
  icon: string;
}

export interface AnalyticsConfig {
  tier: 'basic' | 'pro' | 'unlimited';
  features: {
    extendedDateRange: boolean;
    cohortAnalysis: boolean;
    advancedCharts: boolean;
    dataExport: boolean;
    realTimeUpdates: boolean;
  };
}

export interface ChartTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  grid: string;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
  lastUpdated?: Date;
}

export interface FilterOptions {
  dateRange: AnalyticsDateRange;
  eventTypes?: string[];
  memberSegments?: string[];
  compareMode?: boolean;
}

// Enhanced analytics interfaces for US-004
export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export interface PredictionData {
  date: string;
  predicted: number;
  confidence: number;
  upperBound: number;
  lowerBound: number;
}

export interface AnalyticsAlert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  actionRequired?: boolean;
  relatedMetric?: string;
}

export interface RealTimeMetrics {
  timestamp: Date;
  activeUsers: number;
  liveEvents: number;
  recentEngagement: number;
  alerts: AnalyticsAlert[];
}

export interface ComparisonData {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface GoalTracking {
  id: string;
  name: string;
  target: number;
  current: number;
  progress: number;
  deadline: Date;
  status: 'on_track' | 'at_risk' | 'behind' | 'completed';
}

export interface AdvancedFilters {
  membershipTiers?: string[];
  eventCategories?: string[];
  locationFilters?: string[];
  ageGroups?: string[];
  engagementLevels?: string[];
  customSegments?: string[];
}

export interface ChartAnnotation {
  date: string;
  title: string;
  description?: string;
  type: 'milestone' | 'campaign' | 'event' | 'alert';
  color?: string;
}

export interface PerformanceBenchmark {
  metric: string;
  current: number;
  target: number;
  industry: number;
  best: number;
  status: 'excellent' | 'good' | 'average' | 'below_average';
}

export interface DataQuality {
  completeness: number;
  accuracy: number;
  timeliness: number;
  consistency: number;
  overall: number;
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    affectedRecords: number;
  }>;
}

export interface CohortData {
  cohort: string;
  cohortMonth: string;
  initialSize: number;
  retentionRates: number[];
  period0: number;
  period1: number;
  period2: number;
  period3: number;
  period4: number;
  period5: number;
  [key: string]: string | number | number[];
}

// Enhanced analytics interfaces for US-004 implementation
export interface ChartConfiguration {
  type: 'line' | 'bar' | 'doughnut' | 'pie' | 'radar' | 'area';
  colors: string[];
  gridLines: boolean;
  animations: boolean;
  legend: boolean;
  responsive: boolean;
  maintainAspectRatio: boolean;
  tension?: number; // For line charts
  stacked?: boolean; // For bar charts
}

export interface ExportOptions {
  format: ExportFormat;
  includeCharts: boolean;
  includeData: boolean;
  dateRange: AnalyticsDateRange;
  customTitle?: string;
  branding?: boolean;
}

export interface AnalyticsPermissions {
  canViewAdvanced: boolean;
  canExportData: boolean;
  canAccessRealTime: boolean;
  canCustomizeCharts: boolean;
  maxDataRange: number; // in days
  exportLimits: {
    pdf: number;
    excel: number;
    csv: number;
  };
}

export interface TierFeatures {
  chartTypes: string[];
  maxDataPoints: number;
  realTimeUpdates: boolean;
  customization: boolean;
  exportFormats: ExportFormat[];
  aiInsights: boolean;
  cohortAnalysis: boolean;
  benchmarkComparison: boolean;
}

export interface AnalyticsError {
  code: string;
  message: string;
  timestamp: Date;
  recoverable: boolean;
  context?: Record<string, unknown>;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
  }>;
}

export interface ExportProgress {
  status: 'preparing' | 'processing' | 'generating' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number; // in seconds
}

export interface AnalyticsInsight {
  id: string;
  title: string;
  description: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'warning';
  priority: 'low' | 'medium' | 'high' | 'critical';
  metrics: string[];
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number; // 0-1
  timestamp: Date;
  actionItems?: string[];
}

export interface MetricTarget {
  metric: string;
  current: number;
  target: number;
  deadline: Date;
  progress: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface AnalyticsQuery {
  metrics: string[];
  dimensions: string[];
  filters: Record<string, unknown>;
  dateRange: AnalyticsDateRange;
  groupBy?: string;
  orderBy?: string;
  limit?: number;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'insight';
  title: string;
  position: { x: number; y: number; width: number; height: number };
  config: Record<string, unknown>;
  data?: unknown;
  loading: boolean;
  error?: string;
}

export interface AnalyticsSession {
  sessionId: string;
  userId: string;
  clubId: number;
  startTime: Date;
  lastActivity: Date;
  viewedMetrics: string[];
  performedActions: string[];
  exportCount: number;
}

// Missing event analytics types for EventEngagementComponents
export interface EventAttendanceData {
  eventId: string;
  eventName: string;
  date: string;
  attendees: number;
  capacity: number;
  attendanceRate: number;
  satisfaction?: number;
}

export interface EventTrendData {
  period: string;
  attendanceCount: number;
  eventCount: number;
  averageAttendance: number;
  trend: 'up' | 'down' | 'stable';
}

export interface MemberEventData {
  memberId: number;
  memberName: string;
  eventsAttended: number;
  totalEvents: number;
  attendanceRate: number;
  engagementScore: number;
}

export interface EventFeedbackData {
  positive: string[];
  negative: string[];
  suggestions: string[];
  overallSatisfaction: number;
  responseRate: number;
}

// Additional missing interfaces from test files
export interface EventData {
  eventId: string | number;
  eventName: string;
  eventDate: string;
  expectedAttendance?: number;
  actualAttendance?: number;
  attendees?: number;
  capacity?: number;
  attendanceRate: number;
  category?: string;
  eventType?: string;
  duration?: number;
  location?: string;
  satisfaction?: number;
}

export interface MemberEventEngagement {
  memberId: number;
  memberName: string;
  eventsAttended: number;
  totalEventsInvited?: number;
  totalEvents?: number;
  attendanceRate: number;
  averageRating?: number;
  engagementScore?: number;
  preferredEventTypes?: string[];
  lastEventAttended?: string;
  engagementTrend?: 'increasing' | 'decreasing' | 'stable';
}

export interface EventFeedback {
  eventId: string | number;
  eventName: string;
  eventDate: string;
  totalResponses: number;
  overallRating: number;
  ratings: {
    organization: number;
    content: number;
    venue: number;
    timing: number;
    value: number;
  };
  feedback: EventFeedbackData;
  npsScore: number;
  responseRate: number;
}

export interface ChartPluginConfig {
  enabled: boolean;
  options: Record<string, unknown>;
}

export interface AdvancedChartOptions {
  animation: ChartPluginConfig;
  legend: ChartPluginConfig;
  tooltip: ChartPluginConfig;
  zoom: ChartPluginConfig;
  pan: ChartPluginConfig;
  crossfilter: ChartPluginConfig;
}

export interface DataValidation {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: string[];
}

export interface AnalyticsAudit {
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ThemeConfiguration {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
  chartDefaults: Partial<ChartConfiguration>;
}

// ============================================================================
// COMPREHENSIVE EVENT SERVICE & ANALYTICS TYPES
// ============================================================================

// Event Series & Multi-Session Types
export interface EventSeries {
  id: number;
  clubId: number;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  startDate: string;
  endDate?: string;
  recurrenceRule?: string;
  eventIds: number[];
  createdAt: string;
  updatedAt: string;
}

export interface MultiSessionEvent {
  id: number;
  clubId: number;
  parentEventId?: number;
  title: string;
  description?: string;
  sessions: EventSession[];
  totalCapacity: number;
  registrationDeadline?: string;
  requiresAttendanceTracking: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventSession {
  sessionId: number;
  sessionNumber: number;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  capacity: number;
  attendees: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

// Waitlist Management Types
export interface WaitlistEntry {
  id: number;
  eventId: number;
  memberId: number;
  memberName: string;
  memberEmail: string;
  position: number;
  joinedAt: string;
  priority: 'normal' | 'high' | 'vip';
  status: 'active' | 'promoted' | 'removed' | 'expired';
  notifiedAt?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface WaitlistReorderRequest {
  entryId: number;
  newPosition: number;
}

export interface WaitlistNotification {
  entryIds: number[];
  message: string;
  notificationType: 'spot_available' | 'reminder' | 'expired' | 'custom';
  channels: Array<'email' | 'push'>;
}

// QR Code Types
export interface QRCodeData {
  id: string;
  eventId: number;
  type: 'check-in' | 'registration' | 'payment' | 'info';
  qrCodeUrl: string;
  shortUrl?: string;
  format: 'png' | 'svg' | 'pdf';
  size: 'small' | 'medium' | 'large';
  expiresAt?: string;
  isActive: boolean;
  scanCount: number;
  lastScannedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface QRCodeOptions {
  type: 'check-in' | 'registration' | 'payment' | 'info';
  format?: 'png' | 'svg' | 'pdf';
  size?: 'small' | 'medium' | 'large';
  includeEventDetails?: boolean;
  customLogo?: string;
  expirationHours?: number;
}

export interface QRCodeAnalytics {
  qrCodeId: string;
  eventId: number;
  totalScans: number;
  uniqueScans: number;
  scansByHour: Array<{ hour: string; count: number }>;
  scansByDevice: Array<{ device: string; count: number }>;
  scansByLocation: Array<{ location: string; count: number }>;
  averageScanTime: number;
  peakScanTime: string;
}

export interface QRCodeHistoryEntry {
  id: string;
  qrCodeId: string;
  scannedBy: string;
  scannedAt: string;
  location?: string;
  device?: string;
  action: 'check-in' | 'view' | 'register' | 'payment';
  success: boolean;
  errorMessage?: string;
}

export interface BulkQRCodeRequest {
  eventIds: number[];
  options: QRCodeOptions;
  deliveryFormat: 'zip' | 'pdf_booklet';
}

// Feedback & Survey Types
export interface FeedbackSurvey {
  id: string;
  eventId: number;
  clubId: number;
  title: string;
  description?: string;
  questions: SurveyQuestion[];
  status: 'draft' | 'active' | 'closed';
  responseLimit?: number;
  allowAnonymous: boolean;
  requiresAuthentication: boolean;
  opensAt?: string;
  closesAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyQuestion {
  id: string;
  questionText: string;
  questionType: 'text' | 'rating' | 'multiple_choice' | 'checkbox' | 'scale' | 'yes_no';
  required: boolean;
  order: number;
  options?: string[];
  minRating?: number;
  maxRating?: number;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  eventId: number;
  memberId?: number;
  isAnonymous: boolean;
  answers: SurveyAnswer[];
  submittedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SurveyAnswer {
  questionId: string;
  questionText: string;
  answerType: string;
  value: string | number | string[];
}

export interface FeedbackAnalytics {
  surveyId: string;
  totalResponses: number;
  responseRate: number;
  averageCompletionTime: number;
  questionAnalytics: QuestionAnalytics[];
  sentimentAnalysis?: SentimentAnalysis;
  npsScore?: number;
  recommendations: string[];
}

export interface QuestionAnalytics {
  questionId: string;
  questionText: string;
  responseCount: number;
  responseDistribution: Array<{ value: string | number; count: number; percentage: number }>;
  averageRating?: number;
  textResponses?: string[];
  commonThemes?: Array<{ theme: string; frequency: number }>;
}

export interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative';
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  keyPositives: string[];
  keyNegatives: string[];
  confidenceScore: number;
}

export interface FeedbackTemplate {
  id: string;
  name: string;
  description: string;
  category: 'post_event' | 'registration' | 'general' | 'nps' | 'custom';
  questions: SurveyQuestion[];
  isPublic: boolean;
  usageCount: number;
  rating: number;
}

export interface FeedbackInvitation {
  memberIds?: number[];
  sendToAll?: boolean;
  subject: string;
  message: string;
  reminderSchedule?: Array<{ delay: number; unit: 'hours' | 'days' }>;
  channels: Array<'email' | 'in_app'>;
}

// Advanced Analytics Types
export interface EventMetrics {
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  totalAttendees: number;
  averageAttendance: number;
  capacityUtilization: number;
  growthRate: number;
  trendDirection: 'up' | 'down' | 'stable';
  comparisonPeriod?: ComparisonData;
}

export interface EventAnalyticsData {
  eventId: number;
  eventName: string;
  date: string;
  category?: string;
  location?: string;
  metrics: {
    registrations: number;
    attendance: number;
    capacity: number;
    attendanceRate: number;
    checkInRate: number;
    revenue?: number;
    cost?: number;
    roi?: number;
    satisfaction?: number;
    npsScore?: number;
  };
  engagement: {
    views: number;
    shares: number;
    comments: number;
    saves: number;
    emailOpens?: number;
    emailClicks?: number;
  };
  demographics?: {
    ageGroups: Array<{ range: string; count: number }>;
    membershipTypes: Array<{ type: string; count: number }>;
    locations: Array<{ location: string; count: number }>;
  };
}

export interface ComparativeAnalysis {
  metric: string;
  timeRange: string;
  periods: Array<{
    period: string;
    value: number;
    change?: number;
    changePercent?: number;
  }>;
  trend: 'improving' | 'declining' | 'stable';
  insights: string[];
  recommendations: string[];
}

export interface PredictiveInsights {
  eventId?: number;
  predictions: Array<{
    metric: string;
    forecast: PredictionData[];
    accuracy: number;
    confidenceLevel: 'high' | 'medium' | 'low';
  }>;
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    impact: string;
    mitigation: string;
  }>;
  opportunities: Array<{
    opportunity: string;
    potential: number;
    effort: 'low' | 'medium' | 'high';
    timeline: string;
  }>;
}

export interface PerformanceBenchmarkData {
  category: string;
  metrics: Array<{
    name: string;
    current: number;
    clubAverage: number;
    industryAverage: number;
    topPerformer: number;
    percentile: number;
    status: 'excellent' | 'above_average' | 'average' | 'below_average' | 'needs_improvement';
  }>;
  timeRange: string;
  lastUpdated: string;
}

// Report & Export Types
export interface ReportConfiguration {
  id: string;
  name: string;
  description?: string;
  reportType: 'event_summary' | 'engagement' | 'financial' | 'member_analytics' | 'custom';
  metrics: string[];
  dimensions: string[];
  filters: AdvancedFilters;
  dateRange: AnalyticsDateRange;
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  includeCharts: boolean;
  chartTypes?: string[];
  customFields?: Array<{ field: string; label: string; aggregation?: string }>;
}

export interface AnalyticsExportRequest {
  format: ExportFormat;
  reportConfig: ReportConfiguration;
  includeRawData: boolean;
  includeVisualizations: boolean;
  includeInsights: boolean;
  branding?: {
    logo?: string;
    colors?: Record<string, string>;
    companyName?: string;
  };
  deliveryMethod?: 'download' | 'email' | 'webhook';
  recipients?: string[];
  scheduleRecurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time?: string;
  };
}

export interface ExportResult {
  exportId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: ExportProgress;
  fileUrl?: string;
  fileSize?: number;
  expiresAt?: string;
  error?: string;
  metadata: {
    format: ExportFormat;
    recordCount: number;
    chartCount: number;
    generatedAt: string;
    requestedBy: string;
  };
}

// Pagination & Filtering Types
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
    previousCursor?: string;
  };
}

export interface AnalyticsFilterParams extends AdvancedFilters {
  searchQuery?: string;
  dateRange?: AnalyticsDateRange;
  status?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeDeleted?: boolean;
}

// Chart Data Service Types (from chartDataService.ts)
export interface ChartDataPoint {
  label: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface TimeSeriesData {
  data: ChartDataPoint[];
  trend: 'up' | 'down' | 'stable';
  growthRate: number;
  seasonality?: {
    detected: boolean;
    pattern?: 'weekly' | 'monthly' | 'quarterly';
    strength: number;
  };
}

export interface CorrelationAnalysis {
  metricA: string;
  metricB: string;
  correlation: number;
  strength: 'weak' | 'moderate' | 'strong';
  significance: number;
  interpretation: string;
}

export interface AnomalyDetection {
  dataPoint: ChartDataPoint;
  anomalyType: 'spike' | 'drop' | 'outlier';
  severity: 'low' | 'medium' | 'high';
  expectedValue: number;
  deviation: number;
  possibleCauses: string[];
}

export interface ForecastData {
  historical: ChartDataPoint[];
  forecast: ChartDataPoint[];
  confidenceInterval: {
    upper: ChartDataPoint[];
    lower: ChartDataPoint[];
  };
  accuracy: number;
  method: 'linear' | 'exponential' | 'seasonal' | 'arima';
}

export interface SegmentationData {
  segment: string;
  data: ChartDataPoint[];
  size: number;
  characteristics: Record<string, unknown>;
  performance: {
    rank: number;
    percentile: number;
    compared_to_average: number;
  };
}

// Chart Options & Configuration
export interface ChartDatasetConfig {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  pointHoverRadius?: number;
  borderDash?: number[];
  yAxisID?: string;
  type?: 'line' | 'bar';
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  aspectRatio?: number;
  plugins?: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
      labels?: Record<string, unknown>;
    };
    tooltip?: {
      enabled?: boolean;
      mode?: 'index' | 'point' | 'nearest' | 'dataset';
      intersect?: boolean;
      callbacks?: Record<string, unknown>;
    };
    title?: {
      display?: boolean;
      text?: string;
      font?: Record<string, unknown>;
    };
  };
  scales?: {
    x?: {
      display?: boolean;
      title?: { display?: boolean; text?: string };
      grid?: { display?: boolean };
      ticks?: Record<string, unknown>;
    };
    y?: {
      display?: boolean;
      title?: { display?: boolean; text?: string };
      grid?: { display?: boolean };
      ticks?: Record<string, unknown>;
      beginAtZero?: boolean;
    };
  };
  interaction?: {
    mode?: 'index' | 'point' | 'nearest' | 'dataset';
    intersect?: boolean;
  };
  animation?: boolean | Record<string, unknown>;
}

export interface EnhancedChartData extends ChartData {
  metadata?: {
    generatedAt: string;
    dataSource: string;
    totalRecords: number;
    filters?: Record<string, unknown>;
  };
}

// Utility Types
export type TimeRangeOption = '7d' | '30d' | '90d' | '1y' | 'all' | 'custom';

export type MetricAggregation = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'median';

export type ComparisonPeriod = 'previous_period' | 'previous_year' | 'custom';

export interface MetricDefinition {
  key: string;
  label: string;
  description: string;
  unit?: string;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
  aggregation: MetricAggregation;
  category: 'engagement' | 'financial' | 'attendance' | 'satisfaction' | 'custom';
}

export interface DimensionDefinition {
  key: string;
  label: string;
  description: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  values?: string[];
}

// Real-time Updates & WebSocket Types
export interface AnalyticsUpdateEvent {
  type: 'metric_update' | 'new_event' | 'alert' | 'export_complete';
  timestamp: string;
  data: unknown;
  clubId: number;
  userId?: string;
}

export interface SubscriptionOptions {
  metrics?: string[];
  events?: number[];
  updateInterval?: number;
  includeAggregates?: boolean;
}
