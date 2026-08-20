# ADR-001: Event Data Type Hierarchies

## Status
Accepted

## Context
The EventEngagementDashboard component had multiple critical TypeScript compilation errors due to conflicting and inconsistent event data types:

1. **Type Mismatches**: `EventPerformanceSummary` vs `EventAttendanceData` were used interchangeably causing property access errors
2. **Missing Properties**: Components expected `location` and `expectedAttendance` properties that weren't consistently defined
3. **Undefined Access**: `data.upcomingEvents.length` could be undefined, causing runtime errors
4. **Inconsistent Structures**: Different components used different interfaces for similar data

## Decision
We will implement a unified hierarchical type system with:

### 1. Base Event Interface
```typescript
interface BaseEvent {
  eventId: number;
  eventName: string;
  eventDate: Date | string;
  eventType?: string;
  category?: string;
  duration?: number;
  location?: string;
}
```

### 2. Progressive Enhancement Pattern
- `EventAttendanceData extends BaseEvent` - adds attendance metrics
- `EventPerformanceSummary extends EventAttendanceData` - adds performance metrics  
- `EventAnalyticsData extends EventPerformanceSummary` - adds complete analytics

### 3. Type Guards and Safe Access
- Runtime type validation with type guard functions
- Safe access utility functions for optional properties
- Null-safe array and object property access

### 4. Consistent Member Engagement Types
- `MemberEngagement` base interface
- `MemberEventEngagement extends MemberEngagement` with all required properties
- Missing `engagement` property added to fix MemberEventScoreCard component

## Consequences

### Positive
- **Type Safety**: Eliminates runtime errors from undefined property access
- **Consistency**: Single source of truth for event data structures
- **Maintainability**: Clear inheritance hierarchy makes extending types predictable
- **Developer Experience**: Better IntelliSense and compile-time error detection

### Negative
- **Migration Effort**: Existing components need to be updated to use new types
- **Bundle Size**: Additional type checking functions increase JavaScript output
- **Learning Curve**: Developers need to understand the type hierarchy

## Implementation
The types are defined in `/src/architecture/component-interfaces/EventDataTypes.ts` and exported through the main index file for centralized access.

## Alternatives Considered
1. **Union Types**: Would have maintained existing inconsistencies
2. **Any Types**: Would have eliminated type safety benefits
3. **Separate Interfaces**: Would have continued the fragmentation problem