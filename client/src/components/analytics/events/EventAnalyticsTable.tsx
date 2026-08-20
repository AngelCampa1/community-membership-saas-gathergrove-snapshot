"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, /* Filter, */ Download, Eye, Calendar, Users, Star,
  TrendingUp, /* TrendingDown, */ ArrowUpDown, ChevronLeft, ChevronRight,
  MapPin, Clock, Award, AlertCircle
} from 'lucide-react';
import { EventAttendanceData, EventFeedbackData } from './types';

interface EventAnalyticsTableProps {
  eventData: EventAttendanceData[];
  feedbackData?: EventFeedbackData[];
  loading?: boolean;
  onEventSelect?: (event: EventAttendanceData) => void;
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;
}

type SortField = keyof EventAttendanceData | 'performanceScore' | 'feedback';
type SortDirection = 'asc' | 'desc';

interface EnhancedEventData extends EventAttendanceData {
  performanceScore: number;
  feedbackRating?: number;
  feedbackCount?: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  isUpcoming: boolean;
}

const getPerformanceScore = (event: EventAttendanceData): number => {
  const attendanceWeight = 0.6;
  const capacityUtilization = (event.actualAttendance / event.expectedAttendance) * 100;
  const sizeBonus = Math.min(event.actualAttendance / 50, 1) * 20; // Bonus for larger events
  
  return Math.min(100, Math.round(capacityUtilization * attendanceWeight + sizeBonus * 0.4));
};

const getStatusFromScore = (score: number): EnhancedEventData['status'] => {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
};

const getStatusColor = (status: EnhancedEventData['status']): string => {
  switch (status) {
    case 'excellent': return 'text-success';
    case 'good': return 'text-primary';
    case 'fair': return 'text-warning';
    case 'poor': return 'text-destructive';
  }
};

const getStatusBadgeVariant = (status: EnhancedEventData['status']) => {
  switch (status) {
    case 'excellent': return 'default';
    case 'good': return 'secondary';
    case 'fair': return 'outline';
    case 'poor': return 'destructive';
  }
};

export function EventAnalyticsTable({ 
  eventData, 
  feedbackData = [],
  loading = false,
  onEventSelect,
  onExport
}: EventAnalyticsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('eventDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTimeRange, setFilterTimeRange] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedEvents, setSelectedEvents] = useState<Set<number>>(new Set());

  // Enhance event data with calculated metrics
  const enhancedData: EnhancedEventData[] = useMemo(() => {
    return eventData.map(event => {
      const feedback = feedbackData.find(f => f.eventId === event.eventId);
      const performanceScore = getPerformanceScore(event);
      const isUpcoming = new Date(event.eventDate) > new Date();
      
      return {
        ...event,
        performanceScore,
        feedbackRating: feedback?.overallRating,
        feedbackCount: feedback?.totalResponses || 0,
        status: getStatusFromScore(performanceScore),
        isUpcoming
      };
    });
  }, [eventData, feedbackData]);

  // Get unique categories and event types for filters
  const categories = useMemo(() => {
    const cats = Array.from(new Set(enhancedData.map(e => e.category)));
    return cats.filter(Boolean);
  }, [enhancedData]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    const filtered = enhancedData.filter(event => {
      // Search filter
      const searchMatch = event.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!searchMatch) return false;

      // Category filter
      if (filterCategory !== 'all' && event.category !== filterCategory) return false;

      // Status filter
      if (filterStatus !== 'all' && event.status !== filterStatus) return false;

      // Time range filter
      const eventDate = new Date(event.eventDate);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (filterTimeRange) {
        case 'upcoming':
          return event.isUpcoming;
        case 'past-week':
          return daysDiff >= 0 && daysDiff <= 7;
        case 'past-month':
          return daysDiff >= 0 && daysDiff <= 30;
        case 'past-quarter':
          return daysDiff >= 0 && daysDiff <= 90;
        case 'all':
        default:
          return true;
      }
    });

    // Sort filtered data
    filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number;

      switch (sortField) {
        case 'performanceScore':
          aValue = a.performanceScore;
          bValue = b.performanceScore;
          break;
        case 'feedback':
          aValue = a.feedbackRating || 0;
          bValue = b.feedbackRating || 0;
          break;
        default:
          aValue = a[sortField as keyof EventAttendanceData];
          bValue = b[sortField as keyof EventAttendanceData];
      }

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [enhancedData, searchQuery, sortField, sortDirection, filterCategory, filterStatus, filterTimeRange]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Summary statistics
  const summaryStats = useMemo(() => {
    const total = filteredData.length;
    const totalAttendance = filteredData.reduce((sum, e) => sum + e.actualAttendance, 0);
    const totalExpected = filteredData.reduce((sum, e) => sum + e.expectedAttendance, 0);
    const avgAttendanceRate = total > 0 ? (totalAttendance / totalExpected) * 100 : 0;
    const avgPerformanceScore = total > 0 ? filteredData.reduce((sum, e) => sum + e.performanceScore, 0) / total : 0;
    const highPerformingEvents = filteredData.filter(e => e.status === 'excellent' || e.status === 'good').length;
    
    return {
      totalEvents: total,
      totalAttendance,
      totalExpected,
      avgAttendanceRate: Math.round(avgAttendanceRate * 10) / 10,
      avgPerformanceScore: Math.round(avgPerformanceScore),
      highPerformingEvents,
      highPerformingPercentage: total > 0 ? Math.round((highPerformingEvents / total) * 100) : 0
    };
  }, [filteredData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleEventSelect = (event: EnhancedEventData) => {
    onEventSelect?.(event);
  };

  const handleBulkSelect = (eventId: number) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEvents.size === paginatedData.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(paginatedData.map(e => e.eventId)));
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (onExport) {
      onExport(format);
    } else {
      // Default CSV export
      if (format === 'csv') {
        const headers = [
          'Event Name', 'Date', 'Category', 'Type', 'Location', 'Duration (min)',
          'Expected Attendance', 'Actual Attendance', 'Attendance Rate (%)',
          'Performance Score', 'Status', 'Feedback Rating', 'Feedback Count'
        ];
        
        const csvData = [
          headers,
          ...filteredData.map(event => [
            event.eventName,
            new Date(event.eventDate).toLocaleDateString(),
            event.category,
            event.eventType,
            event.location,
            event.duration.toString(),
            event.expectedAttendance.toString(),
            event.actualAttendance.toString(),
            event.attendanceRate.toFixed(1),
            event.performanceScore.toString(),
            event.status,
            event.feedbackRating?.toFixed(1) || 'N/A',
            (event.feedbackCount ?? 0).toString()
          ])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `event-analytics-${Date.now()}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded"></div>
          <div className="h-4 w-72 bg-muted rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{summaryStats.totalEvents}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Attendance</p>
                <p className="text-2xl font-bold">{summaryStats.totalAttendance.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Attendance Rate</p>
                <p className="text-2xl font-bold text-secondary">{summaryStats.avgAttendanceRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Performing</p>
                <p className="text-2xl font-bold text-warning">{summaryStats.highPerformingPercentage}%</p>
              </div>
              <Award className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Event Analytics Table
              </CardTitle>
              <CardDescription>
                Detailed event statistics and performance metrics
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events, locations, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="poor">Poor</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterTimeRange} onValueChange={setFilterTimeRange}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past-week">Past Week</SelectItem>
                <SelectItem value="past-month">Past Month</SelectItem>
                <SelectItem value="past-quarter">Past Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border">
            <Table role="table" aria-label="Event analytics with performance metrics">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={paginatedData.length > 0 && selectedEvents.size === paginatedData.length}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('eventName')}
                  >
                    <div className="flex items-center gap-1">
                      Event
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('eventDate')}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('attendanceRate')}
                  >
                    <div className="flex items-center gap-1">
                      Attendance
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('performanceScore')}
                  >
                    <div className="flex items-center gap-1">
                      Performance
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('feedback')}
                  >
                    <div className="flex items-center gap-1">
                      Feedback
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 opacity-50" />
                        <p>No events found matching your criteria</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((event) => (
                    <TableRow 
                      key={event.eventId}
                      className={`cursor-pointer hover:bg-muted/50 ${
                        event.isUpcoming ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => handleEventSelect(event)}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedEvents.has(event.eventId)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleBulkSelect(event.eventId);
                          }}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{event.eventName}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(event.eventDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.duration}min
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {event.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {event.actualAttendance ?? 0}/{event.expectedAttendance ?? 0}
                        </div>
                        <div className={`text-xs ${getStatusColor(event.status)}`}>
                          {event.attendanceRate != null ? event.attendanceRate.toFixed(1) : '0.0'}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`text-sm font-medium ${getStatusColor(event.status)}`}>
                            {event.performanceScore ?? 0}
                          </div>
                          <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                event.status === 'excellent' ? 'bg-success' :
                                event.status === 'good' ? 'bg-primary' :
                                event.status === 'fair' ? 'bg-warning' : 'bg-destructive'
                              }`}
                              style={{ width: `${event.performanceScore ?? 0}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {event.feedbackRating ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-warning text-warning" />
                            <span className="text-sm">{event.feedbackRating.toFixed(1)}</span>
                            <span className="text-xs text-muted-foreground">
                              ({event.feedbackCount})
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No feedback</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(event.status)}>
                          {event.status}
                        </Badge>
                        {event.isUpcoming && (
                          <Badge variant="outline" className="ml-1 text-xs">
                            Upcoming
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventSelect(event);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} events
              </div>
              
              <div className="flex items-center gap-2">
                <Select 
                  value={pageSize.toString()} 
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="text-sm">
                  Page {currentPage} of {totalPages}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {selectedEvents.size > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  {selectedEvents.size} event{selectedEvents.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Bulk Export
                  </Button>
                  <Button variant="outline" size="sm">
                    Compare Events
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEvents(new Set())}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}