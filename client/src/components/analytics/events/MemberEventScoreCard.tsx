"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  User, Calendar, Star, TrendingUp, TrendingDown, Activity,
  Search, Filter, Award, Clock, CheckCircle, XCircle,
  Users, Heart, Target, BarChart3
} from 'lucide-react';
import { MemberEventEngagement } from './types';

interface MemberEventScoreCardProps {
  memberData: MemberEventEngagement[];
  loading?: boolean;
  onMemberSelect?: (member: MemberEventEngagement) => void;
  showDetailedScores?: boolean;
}

type SortField = 'name' | 'attendanceRate' | 'eventsAttended' | 'averageRating' | 'engagement';
type FilterType = 'all' | 'high' | 'medium' | 'low' | 'increasing' | 'stable' | 'decreasing';

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'increasing':
      return <TrendingUp className="h-4 w-4 text-success" />;
    case 'decreasing':
      return <TrendingDown className="h-4 w-4 text-destructive" />;
    default:
      return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
};

const getTrendBadgeVariant = (trend: string) => {
  switch (trend) {
    case 'increasing':
      return 'default';
    case 'decreasing':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getEngagementLevel = (rate: number): { level: string; color: string; icon: React.ReactNode } => {
  if (rate >= 80) {
    return {
      level: 'Excellent',
      color: 'text-success',
      icon: <Award className="h-4 w-4 text-success" />
    };
  } else if (rate >= 60) {
    return {
      level: 'Good',
      color: 'text-primary',
      icon: <CheckCircle className="h-4 w-4 text-primary" />
    };
  } else if (rate >= 40) {
    return {
      level: 'Fair',
      color: 'text-warning',
      icon: <Clock className="h-4 w-4 text-warning" />
    };
  } else {
    return {
      level: 'Needs Attention',
      color: 'text-destructive',
      icon: <XCircle className="h-4 w-4 text-destructive" />
    };
  }
};

const calculateMemberScore = (member: MemberEventEngagement): number => {
  const attendanceWeight = 0.4;
  const ratingWeight = 0.3;
  const consistencyWeight = 0.2;
  const recentActivityWeight = 0.1;
  
  const attendanceScore = member.attendanceRate;
  const ratingScore = (member.averageRating / 5) * 100;
  const consistencyScore = member.engagementTrend === 'increasing' ? 100 : 
                          member.engagementTrend === 'stable' ? 75 : 50;
  
  // Calculate recency score based on last event attended
  const lastEventDate = new Date(member.lastEventAttended);
  const daysSinceLastEvent = Math.floor((Date.now() - lastEventDate.getTime()) / (1000 * 60 * 60 * 24));
  const recentActivityScore = Math.max(0, 100 - (daysSinceLastEvent * 2)); // Decrease by 2 points per day
  
  return Math.round(
    attendanceScore * attendanceWeight +
    ratingScore * ratingWeight +
    consistencyScore * consistencyWeight +
    recentActivityScore * recentActivityWeight
  );
};

export function MemberEventScoreCard({ 
  memberData, 
  loading = false,
  onMemberSelect,
  showDetailedScores = false
}: MemberEventScoreCardProps) {
  const [sortField, setSortField] = useState<SortField>('attendanceRate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<MemberEventEngagement | null>(null);

  // Calculate enhanced member data with scores
  const enhancedMemberData = useMemo(() => {
    return memberData.map(member => ({
      ...member,
      score: calculateMemberScore(member),
      engagement: getEngagementLevel(member.attendanceRate)
    }));
  }, [memberData]);

  // Filter and sort members
  const filteredAndSortedMembers = useMemo(() => {
    const filtered = enhancedMemberData.filter(member => {
      // Text search filter
      const matchesSearch = member.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           member.preferredEventTypes.some(type => 
                             type.toLowerCase().includes(searchQuery.toLowerCase())
                           );
      
      if (!matchesSearch) return false;

      // Performance filter
      switch (filterType) {
        case 'high':
          return member.attendanceRate >= 80;
        case 'medium':
          return member.attendanceRate >= 40 && member.attendanceRate < 80;
        case 'low':
          return member.attendanceRate < 40;
        case 'increasing':
          return member.engagementTrend === 'increasing';
        case 'stable':
          return member.engagementTrend === 'stable';
        case 'decreasing':
          return member.engagementTrend === 'decreasing';
        default:
          return true;
      }
    });

    // Sort members
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.memberName.toLowerCase();
          bValue = b.memberName.toLowerCase();
          break;
        case 'attendanceRate':
          aValue = a.attendanceRate;
          bValue = b.attendanceRate;
          break;
        case 'eventsAttended':
          aValue = a.eventsAttended;
          bValue = b.eventsAttended;
          break;
        case 'averageRating':
          aValue = a.averageRating;
          bValue = b.averageRating;
          break;
        case 'engagement':
          aValue = a.score;
          bValue = b.score;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [enhancedMemberData, searchQuery, filterType, sortField, sortDirection]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalMembers = enhancedMemberData.length;
    const highPerformers = enhancedMemberData.filter(m => m.attendanceRate >= 80).length;
    const averageAttendance = enhancedMemberData.reduce((sum, m) => sum + m.attendanceRate, 0) / totalMembers;
    const averageScore = enhancedMemberData.reduce((sum, m) => sum + m.score, 0) / totalMembers;
    
    return {
      totalMembers,
      highPerformers,
      averageAttendance: Math.round(averageAttendance),
      averageScore: Math.round(averageScore),
      highPerformerPercentage: Math.round((highPerformers / totalMembers) * 100)
    };
  }, [enhancedMemberData]);

  const handleMemberClick = (member: MemberEventEngagement) => {
    setSelectedMember(member);
    onMemberSelect?.(member);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 w-48 bg-muted rounded"></div>
            <div className="h-4 w-72 bg-muted rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">Active members tracked</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              High Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{summaryStats.highPerformers}</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.highPerformerPercentage}% of members (≥80% attendance)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Avg Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{summaryStats.averageAttendance}%</div>
            <p className="text-xs text-muted-foreground">Across all members</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Avg Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{summaryStats.averageScore}</div>
            <p className="text-xs text-muted-foreground">Engagement score</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Score Cards */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Member Event Scores
              </CardTitle>
              <CardDescription>
                Individual member engagement and attendance performance
              </CardDescription>
            </div>
            
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-48"
                />
              </div>
              
              <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
                <SelectTrigger className="w-36">
                  <Filter className="h-4 w-4 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  <SelectItem value="high">High Performers</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Needs Attention</SelectItem>
                  <SelectItem value="increasing">Improving</SelectItem>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="decreasing">Declining</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Sort Controls */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            {[
              { field: 'name', label: 'Name' },
              { field: 'attendanceRate', label: 'Attendance Rate' },
              { field: 'eventsAttended', label: 'Events Attended' },
              { field: 'averageRating', label: 'Average Rating' },
              { field: 'engagement', label: 'Engagement Score' }
            ].map(({ field, label }) => (
              <Button
                key={field}
                variant={sortField === field ? "default" : "outline"}
                size="sm"
                onClick={() => handleSort(field as SortField)}
                className="text-xs"
              >
                {label}
                {sortField === field && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {filteredAndSortedMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No members found matching your criteria</p>
              </div>
            ) : (
              filteredAndSortedMembers.map((member) => (
                <Card
                  key={member.memberId}
                  className={`transition-all cursor-pointer hover:shadow-md border ${
                    selectedMember?.memberId === member.memberId ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleMemberClick(member)}
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for ${member.memberName}, ${member.attendanceRate.toFixed(1)}% attendance rate`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleMemberClick(member);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      {/* Member Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10">
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {member.memberName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                        </Avatar>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{member.memberName}</h3>
                            {member.engagement.icon}
                            <Badge 
                              variant={getTrendBadgeVariant(member.engagementTrend)}
                              className="text-xs"
                            >
                              <span className="mr-1">{getTrendIcon(member.engagementTrend)}</span>
                              {member.engagementTrend}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {member.eventsAttended} events attended
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {member.averageRating.toFixed(1)} avg rating
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(member.lastEventAttended).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {member.preferredEventTypes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {member.preferredEventTypes.slice(0, 3).map((type, index) => (
                                <Badge key={`pref-type-${index}-${type}`} variant="outline" className="text-xs">
                                  {type}
                                </Badge>
                              ))}
                              {member.preferredEventTypes.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{member.preferredEventTypes.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Metrics */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {showDetailedScores && (
                          <div className="text-right">
                            <div className="text-lg font-bold text-secondary">
                              {member.score}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Engagement Score
                            </div>
                          </div>
                        )}
                        
                        <div className="text-right">
                          <div className={`text-lg font-bold ${member.engagement.color}`}>
                            {member.attendanceRate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {member.eventsAttended}/{member.totalEventsInvited} attended
                          </div>
                        </div>
                        
                        <Badge 
                          variant={
                            member.attendanceRate >= 80 ? 'default' :
                            member.attendanceRate >= 60 ? 'secondary' : 'destructive'
                          }
                          className="text-xs"
                        >
                          {member.engagement.level}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">Attendance Progress</span>
                        <span className="text-xs text-muted-foreground">
                          {member.attendanceRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            member.attendanceRate >= 80 ? 'bg-success' :
                            member.attendanceRate >= 60 ? 'bg-primary' :
                            member.attendanceRate >= 40 ? 'bg-warning' : 'bg-destructive'
                          }`}
                          style={{ width: `${Math.min(member.attendanceRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          {filteredAndSortedMembers.length > 0 && (
            <div className="mt-4 pt-4 border-t text-sm text-muted-foreground text-center">
              Showing {filteredAndSortedMembers.length} of {memberData.length} members
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Member Details */}
      {selectedMember && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Member Details: {selectedMember.memberName}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMember(null)}
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Performance Metrics
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Engagement Score:</span>
                    <span className="font-semibold text-secondary">{Math.round(selectedMember.attendanceRate * 100)}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Attendance Rate:</span>
                    <span className="font-semibold text-success">
                      {selectedMember.attendanceRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Events Attended:</span>
                    <span>{selectedMember.eventsAttended}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Invited:</span>
                    <span>{selectedMember.totalEventsInvited}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Rating:</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      {selectedMember.averageRating.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Engagement Trend:</span>
                    <span className="flex items-center gap-1">
                      {getTrendIcon(selectedMember.engagementTrend)}
                      <span className="capitalize">{selectedMember.engagementTrend}</span>
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Preferences & Activity
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium">Last Event Attended:</span>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedMember.lastEventAttended).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium">Preferred Event Types:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedMember.preferredEventTypes.map((type, index) => (
                        <Badge key={`selected-type-${index}-${type}`} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium">Performance Level:</span>
                    <div className="flex items-center gap-2 mt-1">
                      {(selectedMember as any).engagement?.icon || null}
                      <Badge 
                        variant={
                          selectedMember.attendanceRate >= 80 ? 'default' :
                          selectedMember.attendanceRate >= 60 ? 'secondary' : 'destructive'
                        }
                      >
                        {(selectedMember as any).engagement?.level || (selectedMember as any).engagementLevel}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}