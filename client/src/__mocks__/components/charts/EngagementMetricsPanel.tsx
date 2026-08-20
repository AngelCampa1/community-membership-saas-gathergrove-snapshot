/**
 * Mock implementation for EngagementMetricsPanel component
 */
import React from 'react';

export interface EngagementMetricsPanelProps {
  title?: string;
  data?: any[];
  timeFrame?: string;
  className?: string;
  children?: React.ReactNode;
}

export const EngagementMetricsPanel: React.FC<EngagementMetricsPanelProps> = ({
  title = 'Engagement Metrics',
  data = [],
  timeFrame = '30d',
  className = '',
  children
}) => {
  return (
    <div 
      className={`engagement-metrics-panel ${className}`}
      data-testid="engagement-metrics-panel"
      role="region"
      aria-label={title}
    >
      <h3 data-testid="panel-title">{title}</h3>
      <div data-testid="panel-timeframe">Time Frame: {timeFrame}</div>
      <div data-testid="panel-data" aria-live="polite">
        {data.length > 0 ? `${data.length} metrics available` : 'No data available'}
      </div>
      {children}
    </div>
  );
};

export default EngagementMetricsPanel;