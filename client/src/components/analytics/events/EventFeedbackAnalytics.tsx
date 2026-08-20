"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend as _Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  Star, MessageSquare, TrendingUp as _TrendingUp, ThumbsUp, ThumbsDown,
  AlertTriangle as _AlertTriangle, Heart, Target, Users
} from 'lucide-react';
import { EventFeedbackData } from './types';
import { CHART_SEMANTIC, getChartColor } from '@/utils/chartColors';

interface Props {
  feedbackData: EventFeedbackData[];
  overallSatisfaction: number;
}

export function EventFeedbackAnalytics({ feedbackData, overallSatisfaction }: Props) {
  const [selectedEvent, setSelectedEvent] = useState<string>('all');

  // Generate mock data if none provided
  const mockFeedbackData: EventFeedbackData[] = React.useMemo(() => {
    if (feedbackData && feedbackData.length > 0) return feedbackData;
    
    return Array.from({ length: 8 }, (_, i) => ({
      eventId: i + 1,
      eventName: `Event ${i + 1}`,
      eventDate: new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      totalResponses: Math.floor(Math.random() * 50) + 20,
      overallRating: Math.random() * 2 + 3,
      ratings: {
        organization: Math.random() * 2 + 3,
        content: Math.random() * 2 + 3,
        venue: Math.random() * 2 + 3,
        timing: Math.random() * 2 + 3,
        value: Math.random() * 2 + 3
      },
      feedback: {
        positive: [
          'Great content and well organized',
          'Excellent speakers and engaging format',
          'Perfect timing and venue'
        ],
        negative: [
          'Could use better refreshments',
          'Room was a bit crowded',
          'Would like more networking time'
        ],
        suggestions: [
          'Add more interactive sessions',
          'Provide digital materials',
          'Schedule follow-up events'
        ]
      },
      npsScore: Math.floor(Math.random() * 60) + 20,
      responseRate: Math.random() * 40 + 40
    }));
  }, [feedbackData]);

  const filteredData = selectedEvent === 'all' 
    ? mockFeedbackData 
    : mockFeedbackData.filter(event => event.eventId.toString() === selectedEvent);

  // Rating distribution
  const ratingDistribution = React.useMemo(() => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    mockFeedbackData.forEach(event => {
      const rating = Math.round(event.overallRating);
      distribution[rating as keyof typeof distribution]++;
    });

    return Object.entries(distribution).map(([rating, count]) => ({
      rating: `${rating} Star${rating === '1' ? '' : 's'}`,
      count,
      percentage: (count / mockFeedbackData.length) * 100
    }));
  }, [mockFeedbackData]);

  // NPS distribution
  const npsCategories = React.useMemo(() => {
    const promoters = mockFeedbackData.filter(event => event.npsScore >= 70).length;
    const passives = mockFeedbackData.filter(event => event.npsScore >= 30 && event.npsScore < 70).length;
    const detractors = mockFeedbackData.filter(event => event.npsScore < 30).length;

    return [
      { name: 'Promoters', value: promoters, color: CHART_SEMANTIC.positive, description: 'NPS 70+' },
      { name: 'Passives', value: passives, color: CHART_SEMANTIC.warning, description: 'NPS 30-69' },
      { name: 'Detractors', value: detractors, color: CHART_SEMANTIC.negative, description: 'NPS <30' }
    ];
  }, [mockFeedbackData]);

  // Average ratings by category
  const categoryRatings = React.useMemo(() => {
    const avgRatings = {
      organization: 0,
      content: 0,
      venue: 0,
      timing: 0,
      value: 0
    };

    filteredData.forEach(event => {
      Object.keys(avgRatings).forEach(key => {
        avgRatings[key as keyof typeof avgRatings] += event.ratings[key as keyof typeof event.ratings];
      });
    });

    Object.keys(avgRatings).forEach(key => {
      avgRatings[key as keyof typeof avgRatings] /= filteredData.length;
    });

    return Object.entries(avgRatings).map(([category, rating]) => ({
      subject: category.charAt(0).toUpperCase() + category.slice(1),
      rating: rating,
      fullMark: 5
    }));
  }, [filteredData]);

  // Sentiment analysis data
  const sentimentData = React.useMemo(() => {
    const totalPositive = mockFeedbackData.reduce((sum, event) => sum + event.feedback.positive.length, 0);
    const totalNegative = mockFeedbackData.reduce((sum, event) => sum + event.feedback.negative.length, 0);
    const totalSuggestions = mockFeedbackData.reduce((sum, event) => sum + event.feedback.suggestions.length, 0);

    return [
      { name: 'Positive', value: totalPositive, color: CHART_SEMANTIC.positive },
      { name: 'Negative', value: totalNegative, color: CHART_SEMANTIC.negative },
      { name: 'Suggestions', value: totalSuggestions, color: getChartColor(1) }
    ];
  }, [mockFeedbackData]);

  const getPerformanceLevel = (rating: number) => {
    if (rating >= 4.5) return { level: 'Excellent', color: 'text-success' };
    if (rating >= 4.0) return { level: 'Good', color: 'text-primary' };
    if (rating >= 3.5) return { level: 'Average', color: 'text-warning' };
    return { level: 'Poor', color: 'text-destructive' };
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Event Feedback Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Analyze member satisfaction and feedback across events
          </p>
        </div>
        
        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {mockFeedbackData.map((event) => (
              <SelectItem key={event.eventId} value={event.eventId.toString()}>
                {event.eventName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceLevel(overallSatisfaction).color}`}>
              {overallSatisfaction.toFixed(1)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${
                    star <= Math.round(overallSatisfaction)
                      ? 'fill-warning text-warning'
                      : 'text-muted'
                  }`}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">
                {getPerformanceLevel(overallSatisfaction).level}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockFeedbackData.reduce((sum, event) => sum + event.totalResponses, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {mockFeedbackData.length} events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {(mockFeedbackData.reduce((sum, event) => sum + event.responseRate, 0) / mockFeedbackData.length).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Feedback participation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg NPS Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              {(mockFeedbackData.reduce((sum, event) => sum + event.npsScore, 0) / mockFeedbackData.length).toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Net Promoter Score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>
              Distribution of overall event ratings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ratingDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={getChartColor(1)} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
            <CardDescription>
              Average ratings by event aspect
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={categoryRatings}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis domain={[0, 5]} />
                <Radar
                  name="Rating"
                  dataKey="rating"
                  stroke={getChartColor(1)}
                  fill={getChartColor(1)}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>NPS Distribution</CardTitle>
            <CardDescription>
              Promoters, passives, and detractors breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  dataKey="value"
                  data={npsCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                >
                  {npsCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feedback Sentiment</CardTitle>
            <CardDescription>
              Breakdown of feedback types across all events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  dataKey="value"
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent: _percent }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Event Details */}
      <Card>
        <CardHeader>
          <CardTitle>Event Feedback Details</CardTitle>
          <CardDescription>
            Detailed feedback analysis for {selectedEvent === 'all' ? 'all events' : 'selected event'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {filteredData.slice(0, 3).map((event) => (
              <div key={event.eventId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold">{event.eventName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.eventDate).toLocaleDateString()} • {event.totalResponses} responses
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="font-bold">{event.overallRating.toFixed(1)}</span>
                    </div>
                    <Badge variant="outline" className="mt-1">
                      {event.responseRate.toFixed(1)}% response rate
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <h5 className="font-medium text-success mb-2 flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      Positive Feedback
                    </h5>
                    <div className="space-y-1">
                      {event.feedback.positive.slice(0, 2).map((feedback, index) => (
                        <p key={`positive-${index}-${feedback.substring(0, 20)}`} className="text-sm text-muted-foreground">
                          "• {feedback}"
                        </p>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-destructive mb-2 flex items-center gap-1">
                      <ThumbsDown className="h-4 w-4" />
                      Areas for Improvement
                    </h5>
                    <div className="space-y-1">
                      {event.feedback.negative.slice(0, 2).map((feedback, index) => (
                        <p key={`negative-${index}-${feedback.substring(0, 20)}`} className="text-sm text-muted-foreground">
                          "• {feedback}"
                        </p>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-primary mb-2 flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      Suggestions
                    </h5>
                    <div className="space-y-1">
                      {event.feedback.suggestions.slice(0, 2).map((suggestion, index) => (
                        <p key={`suggestion-${index}-${suggestion.substring(0, 20)}`} className="text-sm text-muted-foreground">
                          "• {suggestion}"
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="grid gap-2 md:grid-cols-5">
                    {Object.entries(event.ratings).map(([category, rating]) => (
                      <div key={category}>
                        <div className="text-xs text-muted-foreground capitalize">{category}</div>
                        <div className="flex items-center gap-1">
                          <Progress value={(rating / 5) * 100} className="h-1 flex-1" />
                          <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}