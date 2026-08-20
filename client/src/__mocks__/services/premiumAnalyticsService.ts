/**
 * Mock implementation for premiumAnalyticsService
 * Provides mock data for premium analytics features
 */

export interface PredictiveAnalytics {
  predictions: Array<{
    date: string;
    predicted: number;
  }>;
  accuracy: number;
  method: string;
  factors?: Array<{
    name: string;
    impact: number;
  }>;
}

export interface GoalTracking {
  id: string;
  name: string;
  current: number;
  target: number;
  progress: number;
  status: 'completed' | 'on_track' | 'at_risk' | 'behind';
  deadline: string;
}

export interface AutomatedInsight {
  type: 'insight' | 'recommendation' | 'alert' | 'trend';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionItems?: string[];
}

const mockPredictiveAnalytics: PredictiveAnalytics = {
  predictions: [
    { date: '2024-01-01', predicted: 15000 },
    { date: '2024-02-01', predicted: 16500 },
    { date: '2024-03-01', predicted: 18200 },
  ],
  accuracy: 0.85,
  method: 'Linear Regression',
  factors: [
    { name: 'Seasonal Trends', impact: 0.3 },
    { name: 'Marketing Spend', impact: 0.25 },
    { name: 'Member Growth', impact: 0.2 },
  ],
};

const mockGoalTracking: GoalTracking[] = [
  {
    id: 'goal-1',
    name: 'Annual Revenue',
    current: 185000,
    target: 250000,
    progress: 0.74,
    status: 'on_track',
    deadline: '2024-12-31',
  },
  {
    id: 'goal-2',
    name: 'Member Growth',
    current: 450,
    target: 500,
    progress: 0.9,
    status: 'on_track',
    deadline: '2024-06-30',
  },
];

const mockAutomatedInsights: AutomatedInsight[] = [
  {
    type: 'recommendation',
    title: 'Optimize Marketing Spend',
    description: 'Current marketing ROI shows 15% improvement opportunity in digital channels',
    impact: 'high',
    confidence: 0.89,
    actionItems: [
      'Increase social media advertising budget by 25%',
      'Reduce traditional advertising spend by 10%',
    ],
  },
  {
    type: 'insight',
    title: 'Peak Performance Period',
    description: 'Q2 consistently shows highest member engagement and revenue',
    impact: 'medium',
    confidence: 0.92,
    actionItems: [
      'Plan major campaigns for Q2',
      'Prepare inventory for increased demand',
    ],
  },
];

const premiumAnalyticsService = {
  getPredictiveAnalytics: jest.fn().mockImplementation(
    (clubId?: number, metric?: string, horizon?: number) => {
      console.log(`Mock: getPredictiveAnalytics called with clubId: ${clubId}, metric: ${metric}, horizon: ${horizon}`);
      return Promise.resolve(mockPredictiveAnalytics);
    }
  ),

  getGoalTracking: jest.fn().mockImplementation(
    (clubId?: number) => {
      console.log(`Mock: getGoalTracking called with clubId: ${clubId}`);
      return Promise.resolve(mockGoalTracking);
    }
  ),

  getAutomatedInsights: jest.fn().mockImplementation(
    (clubId?: number, type?: string) => {
      console.log(`Mock: getAutomatedInsights called with clubId: ${clubId}, type: ${type}`);
      return Promise.resolve(mockAutomatedInsights);
    }
  ),
};

export default premiumAnalyticsService;