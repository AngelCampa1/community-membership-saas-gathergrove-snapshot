/**
 * MOCK: Feature Usage Analytics Component
 * Creates missing component to prevent test failures
 */

import React from 'react';

interface FeatureUsageAnalyticsProps {
  clubId: string;
}

export const FeatureUsageAnalytics: React.FC<FeatureUsageAnalyticsProps> = ({ clubId }) => {
  return (
    <div data-testid="feature-usage-analytics">
      <h2>Feature Usage Analytics</h2>
      <p>Club ID: {clubId}</p>
      <div className="analytics-content">
        Analytics data would be displayed here
      </div>
    </div>
  );
};

export default FeatureUsageAnalytics;