/**
 * ARCHITECTURE COMPONENT INTERFACES
 * 
 * Centralized export point for all architectural interfaces and patterns
 * This module provides consistent type definitions and utility functions
 * to maintain data flow integrity across the GatherGrove application.
 */

// Event Data Types
export * from './EventDataTypes';

// Null Safety Patterns
export * from './NullSafetyPatterns';

// Chart Configuration Types
export * from './ChartConfigurationTypes';

// Analytics Service Types
export * from './AnalyticsServiceTypes';

// Re-export commonly used types for convenience
export type {
  BaseEvent,
  EventAttendanceData,
  EventPerformanceSummary,
  EventAnalyticsData,
  EventDashboardData,
  MemberEngagement,
  MemberEventEngagement,
} from './EventDataTypes';

export type {
  BaseChartConfig,
  LineChartConfig,
  BarChartConfig,
  DoughnutChartConfig,
  ChartComponentProps,
} from './ChartConfigurationTypes';

// Architecture utilities
export {
  safeRouteMatching,
  safeArrayAccess,
  safeObjectAccess,
  dataValidation,
  componentStateSafety,
  errorBoundaryPatterns,
  loadingStatePatterns,
} from './NullSafetyPatterns';

export {
  safeEventAccess,
  safeMemberAccess,
  isEventAttendanceData,
  isEventPerformanceSummary,
  isMemberEventEngagement,
} from './EventDataTypes';

export {
  createLineChartConfig,
  createBarChartConfig,
  createDoughnutChartConfig,
  createLineChartData,
  createBarChartData,
  createDoughnutChartData,
  chartUtils,
  chartThemes,
} from './ChartConfigurationTypes';