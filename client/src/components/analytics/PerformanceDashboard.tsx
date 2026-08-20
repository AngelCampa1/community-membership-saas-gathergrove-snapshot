'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WebVitalsData {
  metric: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: string;
}

interface AnalyticsData {
  webVitals: WebVitalsData[];
  pageViews: number;
  conversionRate: number;
  averageSessionDuration: number;
  bounceRate: number;
}

// Mock data for development - in production this would come from your analytics API
const mockData: AnalyticsData = {
  webVitals: [
    { metric: 'LCP', value: 2.1, rating: 'good', timestamp: new Date().toISOString() },
    { metric: 'FID', value: 85, rating: 'good', timestamp: new Date().toISOString() },
    { metric: 'CLS', value: 0.08, rating: 'good', timestamp: new Date().toISOString() },
    { metric: 'FCP', value: 1.4, rating: 'good', timestamp: new Date().toISOString() },
    { metric: 'TTFB', value: 720, rating: 'good', timestamp: new Date().toISOString() },
  ],
  pageViews: 1247,
  conversionRate: 3.2,
  averageSessionDuration: 245,
  bounceRate: 47,
};

// Thresholds for Web Vitals ratings
const thresholds = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

function getRatingColor(rating: string) {
  switch (rating) {
    case 'good': return 'bg-success/10 text-success';
    case 'needs-improvement': return 'bg-warning/10 text-warning';
    case 'poor': return 'bg-destructive/10 text-destructive';
    default: return 'bg-muted text-muted-foreground';
  }
}

function formatMetricValue(metric: string, value: number) {
  switch (metric) {
    case 'LCP':
    case 'FCP':
    case 'TTFB':
      return `${(value / 1000).toFixed(2)}s`;
    case 'FID':
      return `${value}ms`;
    case 'CLS':
      return value.toFixed(3);
    default:
      return value.toString();
  }
}

export default function PerformanceDashboard() {
  const [data] = useState<AnalyticsData>(mockData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // In production, fetch real data from your analytics API
    // fetchAnalyticsData().then(setData);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Performance Analytics
        </h1>
        <p className="text-muted-foreground mt-2">
          Real-time performance metrics and user engagement data
        </p>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Page Views
              </p>
              <p className="text-2xl font-bold text-foreground">
                {data.pageViews.toLocaleString()}
              </p>
            </div>
            <div className="text-success">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Conversion Rate
              </p>
              <p className="text-2xl font-bold text-foreground">
                {data.conversionRate}%
              </p>
            </div>
            <div className="text-primary">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Avg. Session Duration
              </p>
              <p className="text-2xl font-bold text-foreground">
                {Math.floor(data.averageSessionDuration / 60)}m {data.averageSessionDuration % 60}s
              </p>
            </div>
            <div className="text-secondary">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Bounce Rate
              </p>
              <p className="text-2xl font-bold text-foreground">
                {data.bounceRate}%
              </p>
            </div>
            <div className="text-destructive">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Web Vitals */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Core Web Vitals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {data.webVitals.map((vital) => (
            <div
              key={vital.metric}
              className="bg-muted rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {vital.metric}
                </h3>
                <Badge className={getRatingColor(vital.rating)}>
                  {vital.rating}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatMetricValue(vital.metric, vital.value)}
              </p>
              <div className="mt-2">
                <div className="w-full bg-border rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      vital.rating === 'good'
                        ? 'bg-success'
                        : vital.rating === 'needs-improvement'
                        ? 'bg-warning'
                        : 'bg-destructive'
                    }`}
                    style={{
                      width: `${Math.min(
                        (vital.value / (thresholds[vital.metric as keyof typeof thresholds]?.poor || 100)) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Performance Recommendations */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Performance Recommendations
        </h2>
        <div className="space-y-3">
          {data.webVitals
            .filter(vital => vital.rating !== 'good')
            .map((vital) => (
              <div
                key={vital.metric}
                className="flex items-start space-x-3 p-3 bg-warning/10 rounded-lg border border-warning/20"
              >
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-warning" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-warning">
                    Improve {vital.metric}
                  </h3>
                  <p className="text-sm text-warning/80">
                    Current value: {formatMetricValue(vital.metric, vital.value)}. 
                    {vital.metric === 'LCP' && ' Consider optimizing images and reducing server response time.'}
                    {vital.metric === 'FID' && ' Minimize main thread work and reduce JavaScript execution time.'}
                    {vital.metric === 'CLS' && ' Ensure images and ads have dimensions and avoid inserting content above existing content.'}
                    {vital.metric === 'FCP' && ' Optimize fonts, CSS, and eliminate render-blocking resources.'}
                    {vital.metric === 'TTFB' && ' Optimize server response time and consider using a CDN.'}
                  </p>
                </div>
              </div>
            ))}
        </div>
        
        {data.webVitals.every(vital => vital.rating === 'good') && (
          <div className="flex items-center space-x-3 p-3 bg-success/10 rounded-lg border border-success/20">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-success">
                Excellent Performance!
              </h3>
              <p className="text-sm text-success/80">
                All Core Web Vitals are in the good range. Keep monitoring to maintain optimal performance.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}