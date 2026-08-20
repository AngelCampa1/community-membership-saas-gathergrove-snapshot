"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input as _Input } from "@/components/ui/input";
import { Textarea as _Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
    FileText, Download as _Download, Calendar, Users, TrendingUp, BarChart3, 
    Clock, Mail, Settings, CheckCircle, AlertCircle, RefreshCw,
    FileSpreadsheet as _FileSpreadsheet, FileBarChart
} from 'lucide-react';
import { ExportButtons } from './ExportButtons';
import { ReportScheduling } from './ReportScheduling';
import { eventReportsService } from '@/services/eventReportsService';
import { format, subDays } from 'date-fns';
import { EventData, MemberEventEngagement } from '@/types/analytics';
import { logger } from '@/lib/logger';

interface Props {
    clubId: number;
    events?: Array<{
        id: number;
        name: string;
        date: string;
    }>;
    onClose?: () => void;
}

interface ReportData {
    metadata: {
        clubId: number;
        reportType: string;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        generatedAt: string;
        eventsIncluded: number;
        totalMembers: number;
    };
    summary: {
        totalEvents: number;
        totalRSVPs: number;
        totalAttendees: number;
        averageAttendanceRate: number;
        highestEngagementEvent: {
            id: string;
            name: string;
            date: string;
            attendanceRate: number;
        };
        overallEngagementScore: number;
    };
    metrics: Record<string, number>;
    attendanceData: EventData[];
    engagementInsights: Record<string, unknown>;
    trendData: Record<string, unknown>;
    memberSummary: MemberEventEngagement[];
    recommendations: Array<{
        type: string;
        priority: string;
        title: string;
        description: string;
        actions: string[];
    }>;
}

export function EventReportsPanel({ clubId, events = [] }: Props) {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    
    // Report configuration
    const [dateRange, setDateRange] = useState({
        from: subDays(new Date(), 90),
        to: new Date()
    });
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
    const [includeCharts, setIncludeCharts] = useState(true);
    const [includeMemberDetails, setIncludeMemberDetails] = useState(true);

    // Export configuration
    const [exportFormat, setExportFormat] = useState<'json' | 'pdf' | 'xlsx'>('pdf');
    const [isExporting, setIsExporting] = useState(false);

    // Scheduling configuration
    const [showScheduling, setShowScheduling] = useState(false);

    const generateReport = useCallback(async () => {
        if (!clubId) return;

        try {
            setLoading(true);
            setError(null);

            const options = {
                startDate: format(dateRange.from, 'yyyy-MM-dd'),
                endDate: format(dateRange.to, 'yyyy-MM-dd'),
                eventIds: selectedEvents,
                includeCharts,
                includeMemberDetails
            };

            const response = await eventReportsService.generateComprehensiveReport(clubId, options);
            // The service declares a structural approximation of the report payload;
            // this component renders the richer backend shape (EventData / MemberEventEngagement).
            setReportData(response.data as unknown as ReportData);

        } catch (err) {
            logger.error('analytics', 'Error generating event report', {
                error: err,
                clubId,
                startDate: format(dateRange.from, 'yyyy-MM-dd'),
                endDate: format(dateRange.to, 'yyyy-MM-dd'),
            });
            setError(err instanceof Error ? err.message : 'Failed to generate report');
        } finally {
            setLoading(false);
        }
    }, [clubId, dateRange.from, dateRange.to, selectedEvents, includeCharts, includeMemberDetails]);

    useEffect(() => {
        if (clubId) {
            generateReport();
        }
    }, [clubId, generateReport]);

    const handleExport = async (exportFormat: 'pdf' | 'xlsx' | 'csv', reportType: 'comprehensive' | 'attendance' | 'engagement' | 'members') => {
        if (!clubId) return;

        try {
            setIsExporting(true);

            const options = {
                format: exportFormat,
                startDate: format(dateRange.from, 'yyyy-MM-dd'),
                endDate: format(dateRange.to, 'yyyy-MM-dd'),
                eventIds: selectedEvents,
                includeMemberDetails
            };

            let blob: Blob;
            let filename: string;
            const dateStamp = format(new Date(), 'yyyy-MM-dd');
            const fileExtension = format;

            switch (reportType) {
                case 'attendance':
                    blob = await eventReportsService.exportAttendanceData(clubId, options);
                    filename = `attendance-${clubId}-${dateStamp}.${fileExtension}`;
                    break;
                case 'engagement':
                    blob = await eventReportsService.exportEngagementMetrics(clubId, {
                        ...options,
                        period: 'monthly',
                        lookbackDays: 90
                    });
                    filename = `engagement-${clubId}-${dateStamp}.${fileExtension}`;
                    break;
                case 'members':
                    blob = await eventReportsService.exportMemberParticipation(clubId, options);
                    filename = `members-${clubId}-${dateStamp}.${fileExtension}`;
                    break;
                default:
                    const reportResponse = await eventReportsService.generateComprehensiveReport(clubId, { ...options, format: exportFormat });
                    // For comprehensive reports, we need to handle the response data differently
                    blob = new Blob([JSON.stringify(reportResponse.data)], { type: 'application/json' });
                    filename = `comprehensive-report-${clubId}-${dateStamp}.${fileExtension}`;
            }

            // Trigger download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (err) {
            logger.error('analytics', 'Error exporting event report', { error: err, clubId, exportFormat, reportType });
            setError(err instanceof Error ? err.message : 'Failed to export report');
        } finally {
            setIsExporting(false);
        }
    };

    const getEngagementLevelColor = (score: number) => {
        if (score >= 80) return 'text-success';
        if (score >= 60) return 'text-primary';
        if (score >= 40) return 'text-warning';
        return 'text-destructive';
    };

    const getEngagementLevel = (score: number) => {
        if (score >= 80) return 'High';
        if (score >= 60) return 'Moderate';
        if (score >= 40) return 'Low';
        return 'At Risk';
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold">Generating Report</h3>
                        <p className="text-muted-foreground">This may take a few moments...</p>
                        <Progress value={33} className="mt-4 w-64" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Event Reports & Analytics</h2>
                    <p className="text-muted-foreground">
                        Generate comprehensive reports and export event engagement data
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowScheduling(!showScheduling)}
                        className="hidden sm:flex"
                    >
                        <Clock className="h-4 w-4 mr-2" />
                        Schedule Reports
                    </Button>
                    <Button onClick={generateReport} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Report Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Report Configuration
                    </CardTitle>
                    <CardDescription>
                        Customize your report parameters and export settings
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Date Range */}
                        <div className="space-y-2">
                            <Label htmlFor="dateRange">Date Range</Label>
                            <DatePickerWithRange
                                value={dateRange}
                                onChange={(range) => range && setDateRange(range)}
                                className="w-full"
                            />
                        </div>

                        {/* Event Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="events">Specific Events (Optional)</Label>
                            <Select 
                                value={selectedEvents.join(',')} 
                                onValueChange={(value) => setSelectedEvents(value ? value.split(',') : [])}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All events" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All events</SelectItem>
                                    {events.map((event) => (
                                        <SelectItem key={event.id} value={event.id.toString()}>
                                            {event.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Export Format */}
                        <div className="space-y-2">
                            <Label htmlFor="exportFormat">Default Export Format</Label>
                            <Select value={exportFormat} onValueChange={(value: 'json' | 'pdf' | 'xlsx') => setExportFormat(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pdf">PDF Report</SelectItem>
                                    <SelectItem value="xlsx">Excel Spreadsheet</SelectItem>
                                    <SelectItem value="json">JSON Data</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="includeCharts"
                                checked={includeCharts}
                                onCheckedChange={setIncludeCharts}
                            />
                            <Label htmlFor="includeCharts">Include Charts & Visualizations</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="includeMemberDetails"
                                checked={includeMemberDetails}
                                onCheckedChange={setIncludeMemberDetails}
                            />
                            <Label htmlFor="includeMemberDetails">Include Member Details</Label>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t">
                        <Button onClick={generateReport} disabled={loading}>
                            <FileText className="h-4 w-4 mr-2" />
                            Generate Report
                        </Button>
                        <ExportButtons
                            clubId={clubId}
                            onExport={handleExport}
                            isExporting={isExporting}
                            dateRange={dateRange}
                            selectedEvents={selectedEvents}
                            includeMemberDetails={includeMemberDetails}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Scheduled Reports */}
            {showScheduling && (
                <ReportScheduling
                    clubId={clubId}
                    onScheduleReport={async (schedule) => {
                        logger.info('analytics', 'Scheduling event report', { schedule, clubId });
                        setShowScheduling(false);
                    }}
                    onUpdateSchedule={async (scheduleId, updates) => {
                        logger.info('analytics', 'Updating report schedule', { scheduleId, updates, clubId });
                    }}
                    onDeleteSchedule={async (scheduleId) => {
                        logger.info('analytics', 'Deleting report schedule', { scheduleId, clubId });
                    }}
                    scheduledReports={[]}
                    isLoading={false}
                />
            )}

            {/* Report Results */}
            {reportData && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview" className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="attendance" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Attendance
                        </TabsTrigger>
                        <TabsTrigger value="engagement" className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Engagement
                        </TabsTrigger>
                        <TabsTrigger value="insights" className="flex items-center gap-2">
                            <FileBarChart className="h-4 w-4" />
                            Insights
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{reportData.summary.totalEvents}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total RSVPs</CardTitle>
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{reportData.summary.totalRSVPs}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Across all events
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{reportData.summary.totalAttendees}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {reportData.summary.averageAttendanceRate.toFixed(1)}% attendance rate
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${getEngagementLevelColor(reportData.summary.overallEngagementScore)}`}>
                                        {reportData.summary.overallEngagementScore.toFixed(1)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {getEngagementLevel(reportData.summary.overallEngagementScore)} engagement
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Top Performing Event */}
                        {reportData.summary.highestEngagementEvent && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Top Performing Event</CardTitle>
                                    <CardDescription>
                                        Event with the highest attendance rate in your date range
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold">{reportData.summary.highestEngagementEvent.name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(reportData.summary.highestEngagementEvent.date), 'PPP')}
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className="text-success">
                                            {reportData.summary.highestEngagementEvent.attendanceRate.toFixed(1)}% attendance
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="attendance" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Attendance Details</CardTitle>
                                <CardDescription>
                                    Event-by-event attendance breakdown
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {reportData.attendanceData.length > 0 ? (
                                    <div className="space-y-4">
                                        {reportData.attendanceData.slice(0, 10).map((event: EventData, index: number) => (
                                            <div key={event.eventId || event.eventName || `event-${index}`} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div>
                                                    <h4 className="font-medium">{event.eventName}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {format(new Date(event.eventDate), 'PPP')} • {event.location || 'No location'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-semibold">
                                                        {event.actualAttendance}/{event.expectedAttendance}
                                                    </div>
                                                    <Badge variant={event.attendanceRate >= 70 ? 'default' : event.attendanceRate >= 50 ? 'secondary' : 'destructive'}>
                                                        {event.attendanceRate.toFixed(1)}%
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">
                                        No attendance data available for the selected period
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="engagement" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Member Engagement Summary</CardTitle>
                                <CardDescription>
                                    Overview of member participation and engagement levels
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {reportData.memberSummary && reportData.memberSummary.length > 0 ? (
                                    <div className="space-y-4">
                                        {reportData.memberSummary.slice(0, 10).map((member: MemberEventEngagement, index: number) => (
                                            <div key={member.memberId || member.memberName || `member-${index}`} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div>
                                                    <h4 className="font-medium">{member.memberName}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {member.eventsAttended} events attended • {member.attendanceRate.toFixed(1)}% attendance rate
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`font-semibold ${getEngagementLevelColor(member.engagementScore || 0)}`}>
                                                        {member.engagementScore?.toFixed(1) || '0.0'}
                                                    </div>
                                                    <Badge variant="outline">
                                                        {member.engagementTrend || 'stable'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">
                                        No member engagement data available
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="insights" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recommendations</CardTitle>
                                <CardDescription>
                                    AI-powered insights and recommendations to improve event engagement
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {reportData.recommendations.length > 0 ? (
                                    <div className="space-y-4">
                                        {reportData.recommendations.map((rec, index: number) => (
                                            <Alert key={rec.title || `recommendation-${index}`} className={`${
                                                rec.priority === 'high' ? 'border-destructive/20' :
                                                rec.priority === 'medium' ? 'border-warning/20' :
                                                'border-primary/20'
                                            }`}>
                                                <AlertCircle className={`h-4 w-4 ${
                                                    rec.priority === 'high' ? 'text-destructive' :
                                                    rec.priority === 'medium' ? 'text-warning' :
                                                    'text-primary'
                                                }`} />
                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-semibold">{rec.title}</h4>
                                                        <Badge variant={
                                                            rec.priority === 'high' ? 'destructive' :
                                                            rec.priority === 'medium' ? 'secondary' :
                                                            'outline'
                                                        }>
                                                            {rec.priority} priority
                                                        </Badge>
                                                    </div>
                                                    <AlertDescription className="mt-2">
                                                        {rec.description}
                                                    </AlertDescription>
                                                    {rec.actions && rec.actions.length > 0 && (
                                                        <div className="mt-3">
                                                            <p className="text-sm font-medium mb-2">Suggested actions:</p>
                                                            <ul className="text-sm text-muted-foreground space-y-1">
                                                                {rec.actions.map((action: string, actionIndex: number) => (
                                                                    <li key={actionIndex} className="flex items-start gap-2">
                                                                        <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                                        {action}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </Alert>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">
                                        No specific recommendations available. Your events are performing well!
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}

            {/* Report Metadata */}
            {reportData && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Report Information</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <strong>Generated:</strong> {format(new Date(reportData.metadata.generatedAt), 'PPp')}
                            </div>
                            <div>
                                <strong>Date Range:</strong> {format(new Date(reportData.metadata.dateRange.startDate), 'MMM d')} - {format(new Date(reportData.metadata.dateRange.endDate), 'MMM d, yyyy')}
                            </div>
                            <div>
                                <strong>Events Included:</strong> {reportData.metadata.eventsIncluded}
                            </div>
                            <div>
                                <strong>Total Members:</strong> {reportData.metadata.totalMembers}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}