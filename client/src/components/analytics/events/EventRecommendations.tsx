"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Lightbulb, Target, Users, Calendar, Clock, TrendingUp, 
  Star, Trophy, AlertCircle, CheckCircle, BookOpen, Zap
} from 'lucide-react';
import { EventRecommendation, EventAttendanceData } from './types';

interface Props {
  recommendations: EventRecommendation[];
  performanceData: EventAttendanceData[];
}

export function EventRecommendations({ recommendations, performanceData }: Props) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Generate mock recommendations if none provided
  const mockRecommendations: EventRecommendation[] = React.useMemo(() => {
    if (recommendations && recommendations.length > 0) return recommendations;
    
    return [
      {
        eventType: 'workshop',
        category: 'Educational',
        recommendedTime: 'Tuesday 7:00 PM',
        recommendedDuration: 120,
        targetAudience: ['new-members', 'professionals'],
        expectedAttendance: 35,
        confidence: 88,
        reasoning: [
          'High engagement from similar educational events',
          'Optimal time slot based on member availability',
          'Strong interest in professional development topics'
        ],
        basedOnEvents: ['Workshop: Leadership Skills', 'Professional Development Session', 'Career Advancement Workshop']
      },
      {
        eventType: 'social',
        category: 'Networking',
        recommendedTime: 'Friday 6:00 PM',
        recommendedDuration: 180,
        targetAudience: ['all-members'],
        expectedAttendance: 42,
        confidence: 92,
        reasoning: [
          'Friday evening shows highest attendance for social events',
          'Members prefer longer networking sessions',
          'Previous social events had 85%+ attendance rates'
        ],
        basedOnEvents: ['Friday Mixer', 'Networking Night', 'Social Hour']
      },
      {
        eventType: 'tournament',
        category: 'Sports',
        recommendedTime: 'Saturday 2:00 PM',
        recommendedDuration: 240,
        targetAudience: ['active-members', 'sports-enthusiasts'],
        expectedAttendance: 28,
        confidence: 75,
        reasoning: [
          'Weekend afternoons work best for tournament format',
          'Sports events show consistent participation',
          'Longer duration allows for proper tournament structure'
        ],
        basedOnEvents: ['Chess Tournament', 'Table Tennis Competition', 'Game Day']
      },
      {
        eventType: 'meeting',
        category: 'Business',
        recommendedTime: 'Wednesday 7:30 PM',
        recommendedDuration: 90,
        targetAudience: ['members', 'board-members'],
        expectedAttendance: 22,
        confidence: 95,
        reasoning: [
          'Mid-week timing avoids weekend conflicts',
          'Shorter duration maintains engagement',
          'Business meetings show predictable attendance patterns'
        ],
        basedOnEvents: ['Monthly Board Meeting', 'Committee Meeting', 'Planning Session']
      }
    ];
  }, [recommendations]);

  // Generate insights based on performance data
  const performanceInsights = React.useMemo(() => {
    if (!performanceData || performanceData.length === 0) {
      return {
        bestPerformingCategory: 'Educational',
        optimalDuration: 120,
        peakAttendanceDay: 'Friday',
        averageAttendanceRate: 78
      };
    }

    const categoryPerformance = performanceData.reduce((acc, event) => {
      if (!acc[event.category]) {
        acc[event.category] = { total: 0, count: 0 };
      }
      acc[event.category].total += event.attendanceRate;
      acc[event.category].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const bestCategory = Object.entries(categoryPerformance)
      .map(([category, data]) => ({ category, avg: data.total / data.count }))
      .sort((a, b) => b.avg - a.avg)[0];

    return {
      bestPerformingCategory: bestCategory?.category || 'Educational',
      optimalDuration: Math.round(performanceData.reduce((sum, event) => sum + event.duration, 0) / performanceData.length),
      peakAttendanceDay: 'Friday', // Mock based on common patterns
      averageAttendanceRate: Math.round(performanceData.reduce((sum, event) => sum + event.attendanceRate, 0) / performanceData.length)
    };
  }, [performanceData]);

  const filteredRecommendations = categoryFilter === 'all' 
    ? mockRecommendations 
    : mockRecommendations.filter(rec => rec.category.toLowerCase() === categoryFilter.toLowerCase());

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-success bg-success/10';
    if (confidence >= 80) return 'text-primary bg-primary/10';
    if (confidence >= 70) return 'text-warning bg-warning/10';
    return 'text-destructive bg-destructive/10';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 90) return CheckCircle;
    if (confidence >= 80) return Target;
    if (confidence >= 70) return AlertCircle;
    return AlertCircle;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Event Recommendations & Insights
          </h3>
          <p className="text-sm text-muted-foreground">
            AI-powered suggestions based on member behavior and event performance
          </p>
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="educational">Educational</SelectItem>
            <SelectItem value="networking">Networking</SelectItem>
            <SelectItem value="sports">Sports</SelectItem>
            <SelectItem value="business">Business</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Insights */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Category</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-success">
              {performanceInsights.bestPerformingCategory}
            </div>
            <p className="text-xs text-muted-foreground">
              Highest attendance rates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimal Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-primary">
              {performanceInsights.optimalDuration} min
            </div>
            <p className="text-xs text-muted-foreground">
              Sweet spot for engagement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Day</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-secondary">
              {performanceInsights.peakAttendanceDay}
            </div>
            <p className="text-xs text-muted-foreground">
              Best attendance day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-warning">
              {performanceInsights.averageAttendanceRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average attendance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredRecommendations.map((recommendation, index) => {
          const ConfidenceIcon = getConfidenceIcon(recommendation.confidence);
          
          return (
            <Card key={recommendation.eventType || `recommendation-${index}`} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    {recommendation.eventType.charAt(0).toUpperCase() + recommendation.eventType.slice(1)} Event
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(recommendation.confidence)}`}>
                    <ConfidenceIcon className="h-3 w-3 inline mr-1" />
                    {recommendation.confidence}% confidence
                  </div>
                </CardTitle>
                <CardDescription>
                  {recommendation.category} • {recommendation.recommendedTime}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Key Details */}
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Expected Attendance</div>
                    <div className="text-lg font-semibold flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {recommendation.expectedAttendance} members
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                    <div className="text-lg font-semibold flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {recommendation.recommendedDuration} minutes
                    </div>
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Target Audience</div>
                  <div className="flex flex-wrap gap-1">
                    {recommendation.targetAudience.map((audience, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {audience.replace('-', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Confidence Progress */}
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Recommendation Strength</div>
                  <Progress value={recommendation.confidence} className="h-2" />
                </div>

                {/* Reasoning */}
                <div>
                  <div className="text-sm font-medium mb-2 flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    Why This Works
                  </div>
                  <ul className="space-y-1">
                    {recommendation.reasoning.map((reason, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Based On Events */}
                <div>
                  <div className="text-sm font-medium mb-2">Similar Successful Events</div>
                  <div className="space-y-1">
                    {recommendation.basedOnEvents.slice(0, 2).map((event, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {event}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <Button className="w-full" variant="outline">
                  Create Event Plan
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Strategic Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Strategic Insights
          </CardTitle>
          <CardDescription>
            Data-driven recommendations for improving event performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-3">
              <h4 className="font-medium text-success">Growth Opportunities</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-success mt-0.5" />
                  Educational events show 15% higher retention rates
                </li>
                <li className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-success mt-0.5" />
                  Weekend events could increase attendance by 20%
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-success mt-0.5" />
                  2-hour sessions show optimal engagement levels
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-warning">Areas to Watch</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                  Monday events show 25% lower attendance
                </li>
                <li className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-warning mt-0.5" />
                  Summer months see 30% attendance drop
                </li>
                <li className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-warning mt-0.5" />
                  Events over 3 hours show member fatigue
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-primary">Best Practices</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  Send reminders 3 days before events
                </li>
                <li className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-primary mt-0.5" />
                  Include networking time in all events
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-primary mt-0.5" />
                  Follow up with attendees within 24 hours
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
          <CardDescription>
            Priority actions to improve event engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
                <div>
                  <div className="font-medium">Schedule Educational Workshop</div>
                  <div className="text-sm text-muted-foreground">
                    Based on high confidence recommendation (92%)
                  </div>
                </div>
              </div>
              <Badge className="bg-success/10 text-success">High Priority</Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium">Plan Friday Social Event</div>
                  <div className="text-sm text-muted-foreground">
                    Leverage peak attendance day for networking
                  </div>
                </div>
              </div>
              <Badge className="bg-primary/10 text-primary">Medium Priority</Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-warning/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <div className="font-medium">Review Event Duration Strategy</div>
                  <div className="text-sm text-muted-foreground">
                    Optimize event length based on engagement data
                  </div>
                </div>
              </div>
              <Badge className="bg-warning/10 text-warning">Low Priority</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}