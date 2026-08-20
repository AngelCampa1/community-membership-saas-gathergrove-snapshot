# ADR-003: Chart Configuration Types

## Status
Accepted

## Context
The EngagementDashboard had Chart.js integration issues:

1. **Type Conflicts**: Line vs Bar chart type conflicts in configuration options
2. **Inconsistent Configs**: Different chart instances used different configuration patterns
3. **Mixed Types**: Chart configuration types were not properly typed
4. **Compilation Errors**: TypeScript compilation failed due to chart type mismatches

## Decision
We will implement a unified chart configuration system with:

### 1. Base Chart Configuration Interface
```typescript
interface BaseChartConfig<T extends'line' |'bar' |'doughnut' |'pie'> {
  type: T;
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: { /* ... */ };
  scales?: { /* ... */ };
}
```

### 2. Chart-Specific Extensions
- `LineChartConfig extends BaseChartConfig<'line'>` - with line-specific options
- `BarChartConfig extends BaseChartConfig<'bar'>` - with bar-specific options  
- `DoughnutChartConfig extends BaseChartConfig<'doughnut'>` - with doughnut-specific options

### 3. Typed Chart Data Interfaces
- `LineChartData`, `BarChartData`, `DoughnutChartData` with proper typing
- Consistent dataset structure across chart types
- Type-safe color and styling options

### 4. Configuration Factory Functions
```typescript
const createLineChartConfig = (options: Partial<LineChartConfig> = {}): LineChartConfig => { /* ... */ }
const createBarChartConfig = (options: Partial<BarChartConfig> = {}): BarChartConfig => { /* ... */ }
```

### 5. Chart Themes and Utilities
- Predefined color themes (default, dark)
- Utility functions for formatting tooltips, generating colors
- Type-safe chart component props

## Consequences

### Positive
- **Type Safety**: Eliminates Chart.js configuration type errors
- **Consistency**: Standardized chart appearance and behavior
- **Reusability**: Factory functions reduce code duplication
- **Maintainability**: Centralized chart configuration management
- **Theme Support**: Easy switching between chart themes

### Negative
- **Complexity**: Additional abstraction layer over Chart.js
- **Learning Curve**: Developers need to learn new configuration system
- **Flexibility**: Some Chart.js features may not be exposed

## Implementation
Chart types are implemented in `/src/architecture/component-interfaces/ChartConfigurationTypes.ts` with:

### Factory Functions
```typescript
const lineChartConfig = createLineChartConfig({
  elements: {
    line: { tension: 0.4 }
  }
});

const lineChartData = createLineChartData(
  ['Jan','Feb','Mar'],
  [{ label:'Engagement', data: [10, 20, 30] }]
);
```

### Type-Safe Component Props
```typescript
interface ChartComponentProps<T extends'line' |'bar' |'doughnut'> {
  data: T extends'line' ? LineChartData : T extends'bar' ? BarChartData : DoughnutChartData;
  config: T extends'line' ? LineChartConfig : T extends'bar' ? BarChartConfig : DoughnutChartConfig;
  // ...
}
```

### Theme System
```typescript
const chartThemes = {
  default: { primary:'#3b82f6', secondary:'#10b981', /* ... */ },
   { primary:'#60a5fa', secondary:'#34d399', /* ... */ },
};
```

## Alternatives Considered
1. **Direct Chart.js Usage**: Would have maintained type conflicts
2. **Chart Component Library**: Would have added external dependencies
3. **Separate Config Files**: Would have made maintenance difficult
4. **Any Types**: Would have eliminated type safety benefits

## Migration Strategy
1. Replace existing chart configurations with factory functions
2. Update chart data structures to use typed interfaces
3. Apply consistent theming across all charts
4. Add type-safe component wrappers where needed