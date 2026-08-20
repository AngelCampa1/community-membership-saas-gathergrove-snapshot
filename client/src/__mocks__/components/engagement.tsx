import React from 'react';

// Mock MemberEngagementScore component
export const MemberEngagementScore = ({ 
  memberId,
  memberName,
  className,
  ...props 
}: any) => (
  <div 
    className={`member-engagement-score ${className || ''}`}
    data-testid="member-engagement-score"
    data-member-id={memberId}
    data-member-name={memberName}
    {...props}
  >
    <div className="engagement-score">85</div>
    <div className="engagement-level">High</div>
  </div>
);

// Mock other engagement components
export const EngagementDashboard = ({ className, ...props }: any) => (
  <div 
    className={`engagement-dashboard ${className || ''}`}
    data-testid="engagement-dashboard"
    {...props}
  >
    Mock Engagement Dashboard
  </div>
);

export const EngagementMetricsPanel = ({ className, ...props }: any) => (
  <div 
    className={`engagement-metrics-panel ${className || ''}`}
    data-testid="engagement-metrics-panel"
    {...props}
  >
    Mock Engagement Metrics Panel
  </div>
);

export const AtRiskMembersAlert = ({ className, ...props }: any) => (
  <div 
    className={`at-risk-members-alert ${className || ''}`}
    data-testid="at-risk-members-alert"
    {...props}
  >
    Mock At Risk Members Alert
  </div>
);

export default {
  MemberEngagementScore,
  EngagementDashboard,
  EngagementMetricsPanel,
  AtRiskMembersAlert
};