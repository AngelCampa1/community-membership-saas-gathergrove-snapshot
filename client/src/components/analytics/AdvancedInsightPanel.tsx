'use client';

/**
 * Advanced Insight Panel for US-004 Advanced Analytics Dashboard
 * Provides AI-powered insights, recommendations, and predictive analytics
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import {
  TrendingUp,
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Brain,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import premiumAnalyticsService from '../../services/premiumAnalyticsService';

interface AdvancedInsightPanelProps {
  clubId: number;
  userTier: 'basic' | 'pro' | 'unlimited';
  className?: string;
  onInsightClick?: (insight: AutomatedInsight) => void;
}

interface AutomatedInsight {
  type: 'insight' | 'recommendation' | 'alert' | 'trend';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  actionItems: string[];
  dataPoints: Record<string, unknown>;
  visualizations?: string[];
}

interface _PredictiveData {
  predictions: Array<{
    date: string;
    predicted: number;
    confidence: number;
    upperBound: number;
    lowerBound: number;
  }>;
  accuracy: number;
  method: string;
  factors: Array<{
    name: string;
    impact: number;
    confidence: number;
  }>;
}

const AdvancedInsightPanel: React.FC<AdvancedInsightPanelProps> = ({
  clubId,
  userTier,
  className,
  onInsightClick,
}) => {
  const [activeInsightType, setActiveInsightType] = useState<'performance' | 'opportunities' | 'risks'>('performance');
  const [selectedMetric, setSelectedMetric] = useState<'engagement' | 'retention' | 'revenue'>('engagement');

  const isUnlimited = userTier === 'unlimited';

  // Fetch automated insights
  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['automated-insights', clubId, activeInsightType],
    queryFn: () => premiumAnalyticsService.getAutomatedInsights(clubId, activeInsightType),
    enabled: isUnlimited,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch predictive analytics
  const { data: predictions, isLoading: predictionsLoading } = useQuery({
    queryKey: ['predictive-analytics', clubId, selectedMetric],
    queryFn: () => premiumAnalyticsService.getPredictiveAnalytics(clubId, selectedMetric, 30),
    enabled: isUnlimited,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  // Fetch performance benchmarks
  const { data: benchmarks } = useQuery({
    queryKey: ['performance-benchmarks', clubId],
    queryFn: () => premiumAnalyticsService.getPerformanceBenchmarks(clubId),
    enabled: isUnlimited,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'medium': return 'text-warning bg-warning/10 border-warning/20';
      case 'low': return 'text-success bg-success/10 border-success/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'recommendation': return <Lightbulb className="h-4 w-4" />;
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      case 'trend': return <TrendingUp className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  if (!isUnlimited) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center space-y-3">
            <Brain className="h-8 w-8 text-muted-foreground mx-auto" />
            <div className="text-muted-foreground">
              Advanced AI insights available in Expand tier
            </div>
            <Button variant="outline" size="sm">
              Upgrade to Expand
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <Tabs value={activeInsightType} onValueChange={(value) => setActiveInsightType(value as 'performance' | 'opportunities' | 'risks')}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-Powered Insights
            </h3>
            <p className="text-sm text-muted-foreground">
              Advanced analytics and recommendations powered by machine learning
            </p>
          </div>
          
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="risks">Risks</TabsTrigger>
          </TabsList>
        </div>

        {/* Performance Insights */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Automated Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insightsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }, (_, i) => (
                      <div key={`insight-skeleton-${i}`} className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    ))}
                  </div>
                ) : insights?.length ? (
                  insights.slice(0, 3).map((insight, index) => (
                    <div
                      key={`insight-${index}-${insight.title?.substring(0, 20)}`}
                      className={cn(
                        'p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50',
                        getImpactColor(insight.impact)
                      )}
                      onClick={() => onInsightClick?.(insight)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 p-1">
                          {getInsightIcon(insight.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="font-medium text-sm">{insight.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {insight.description}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {Math.round(insight.confidence * 100)}% confidence
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {insight.impact} impact
                            </Badge>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No performance insights available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Benchmark Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Benchmark Comparison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {benchmarks?.length ? (
                  benchmarks.slice(0, 4).map((benchmark, index) => (
                    <div key={benchmark.metric || `benchmark-${index}`} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{benchmark.metric}</span>
                        <Badge 
                          variant={
                            benchmark.status === 'excellent' ? 'default' :
                            benchmark.status === 'good' ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          {benchmark.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Current: {benchmark.current}</span>
                          <span>Target: {benchmark.target}</span>
                        </div>
                        <Progress 
                          value={(benchmark.current / benchmark.target) * 100} 
                          className="h-1.5"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <Skeleton className="h-24 w-full" />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Opportunities */}
        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Growth Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={`recommendation-skeleton-${i}`} className="h-16 w-full" />
                  ))}
                </div>
              ) : insights?.filter(insight => insight.type === 'recommendation').length ? (
                <div className="space-y-3">
                  {insights
                    .filter(insight => insight.type === 'recommendation')
                    .map((insight, index) => (
                      <div
                        key={`recommendation-${index}-${insight.title?.substring(0, 20)}`}
                        className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="font-medium">{insight.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {insight.description}
                            </div>
                            {insight.actionItems.length > 0 && (
                              <div className="space-y-1">
                                <div className="text-xs font-medium text-muted-foreground">
                                  Action Items:
                                </div>
                                <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                                  {insight.actionItems.slice(0, 2).map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Badge 
                              variant={
                                insight.impact === 'high' ? 'default' : 'secondary'
                              }
                              className="text-xs"
                            >
                              {insight.impact} impact
                            </Badge>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Target className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  No growth opportunities identified at this time
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Analysis */}
        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }, (_, i) => (
                    <Skeleton key={`alert-skeleton-${i}`} className="h-20 w-full" />
                  ))}
                </div>
              ) : insights?.filter(insight => insight.type === 'alert').length ? (
                <div className="space-y-3">
                  {insights
                    .filter(insight => insight.type === 'alert')
                    .map((insight, index) => (
                      <div
                        key={`alert-${index}-${insight.title?.substring(0, 20)}`}
                        className={cn(
                          'p-4 border rounded-lg',
                          insight.impact === 'high' ? 'border-destructive/20 bg-destructive/5' :
                          insight.impact === 'medium' ? 'border-warning/20 bg-warning/5' :
                          'border-border bg-muted/50'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle 
                            className={cn(
                              'h-5 w-5 flex-shrink-0 mt-0.5',
                              insight.impact === 'high' ? 'text-destructive' :
                              insight.impact === 'medium' ? 'text-warning' :
                              'text-muted-foreground'
                            )}
                          />
                          <div className="flex-1 space-y-2">
                            <div className="font-medium">{insight.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {insight.description}
                            </div>
                            {insight.actionItems.length > 0 && (
                              <div className="space-y-1">
                                <div className="text-xs font-medium">Recommended Actions:</div>
                                <ul className="text-xs space-y-1 list-disc list-inside">
                                  {insight.actionItems.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          <Badge 
                            variant={
                              insight.impact === 'high' ? 'destructive' :
                              insight.impact === 'medium' ? 'outline' :
                              'secondary'
                            }
                            className="text-xs"
                          >
                            {insight.impact} risk
                          </Badge>
                        </div>
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <CheckCircle className="h-8 w-8 mx-auto mb-3 text-success" />
                  No significant risks detected
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Predictive Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Predictive Analytics
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Forecast for:</span>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as "engagement" | "retention" | "revenue")}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="engagement">Engagement</option>
                <option value="retention">Retention</option>
                <option value="revenue">Revenue</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {predictionsLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : predictions ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center space-y-1">
                  <div className="text-2xl font-bold text-success">
                    {Math.round(predictions.accuracy * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Model Accuracy
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <div className="text-2xl font-bold">
                    {predictions.predictions[predictions.predictions.length - 1]?.predicted || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    30-Day Forecast
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <div className="text-2xl font-bold text-primary">
                    {predictions.method}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ML Method
                  </div>
                </div>
              </div>

              {predictions.factors.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Key Factors:</div>
                  <div className="space-y-1">
                    {predictions.factors.slice(0, 3).map((factor, index) => (
                      <div key={factor.name || `factor-${index}`} className="flex items-center gap-2 text-xs">
                        <div className="w-20 truncate">{factor.name}</div>
                        <Progress 
                          value={Math.abs(factor.impact) * 100} 
                          className="flex-1 h-1.5" 
                        />
                        <div className={cn(
                          'w-12 text-right',
                          factor.impact > 0 ? 'text-success' : 'text-destructive'
                        )}>
                          {factor.impact > 0 ? '+' : ''}{Math.round(factor.impact * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              No prediction data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedInsightPanel;
