import React from 'react';

interface LoginActivityDashboardProps {
  clubId: number;
  clubTier: string;
}

export default function LoginActivityDashboard({ clubId, clubTier }: LoginActivityDashboardProps) {
  return (
    <div data-testid="login-activity-dashboard" className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Login Activity Dashboard</h3>
      <div className="space-y-2">
        <p>Club ID: {clubId}</p>
        <p>Club Tier: {clubTier}</p>
        <p>Login activity data will be displayed here</p>
      </div>
    </div>
  );
}