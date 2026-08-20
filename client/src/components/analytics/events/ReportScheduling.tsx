"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Calendar, Clock, Mail, Settings as _Settings, Plus, Edit2, Trash2, 
    CheckCircle, XCircle, AlertCircle, Send as _Send, Pause, Play,
    FileText, Users, TrendingUp, BarChart3
} from 'lucide-react';
import { format, addDays, addWeeks, addMonths } from 'date-fns';

interface Props {
    clubId: number;
    onScheduleReport: (schedule: ScheduledReport) => Promise<void>;
    onUpdateSchedule: (scheduleId: string, updates: Partial<ScheduledReport>) => Promise<void>;
    onDeleteSchedule: (scheduleId: string) => Promise<void>;
    scheduledReports: ScheduledReport[];
    isLoading: boolean;
}

interface ScheduledReport {
    id: string;
    name: string;
    description?: string;
    reportType: 'comprehensive' | 'attendance' | 'engagement' | 'members';
    format: 'pdf' | 'xlsx' | 'csv';
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number; // 0-6, Sunday = 0
    dayOfMonth?: number; // 1-31
    time: string; // HH:mm format
    recipients: string[];
    isActive: boolean;
    includeCharts: boolean;
    includeMemberDetails: boolean;
    dateRange: 'last_7_days' | 'last_30_days' | 'last_quarter' | 'custom';
    customStartDate?: string;
    customEndDate?: string;
    lastRun?: string;
    nextRun?: string;
    status: 'active' | 'paused' | 'error';
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
}

const reportTypeOptions = [
    {
        value: 'comprehensive',
        label: 'Comprehensive Report',
        description: 'Complete analytics with all metrics and insights',
        icon: FileText
    },
    {
        value: 'attendance',
        label: 'Attendance Report',
        description: 'Detailed attendance and RSVP data',
        icon: Users
    },
    {
        value: 'engagement',
        label: 'Engagement Metrics',
        description: 'Member engagement trends and analytics',
        icon: TrendingUp
    },
    {
        value: 'members',
        label: 'Member Participation',
        description: 'Individual member activity summaries',
        icon: BarChart3
    }
];

const frequencyOptions = [
    { value: 'daily', label: 'Daily', description: 'Every day at specified time' },
    { value: 'weekly', label: 'Weekly', description: 'Once per week on specified day' },
    { value: 'monthly', label: 'Monthly', description: 'Once per month on specified date' },
    { value: 'quarterly', label: 'Quarterly', description: 'Every 3 months' }
];

const formatOptions = [
    { value: 'pdf', label: 'PDF Report', description: 'Professional formatted document' },
    { value: 'xlsx', label: 'Excel Workbook', description: 'Spreadsheet with multiple sheets' },
    { value: 'csv', label: 'CSV File', description: 'Comma-separated values for analysis' }
];

const dateRangeOptions = [
    { value: 'last_7_days', label: 'Last 7 Days', description: 'Rolling 7-day window' },
    { value: 'last_30_days', label: 'Last 30 Days', description: 'Rolling 30-day window' },
    { value: 'last_quarter', label: 'Last Quarter', description: 'Previous 3 months' },
    { value: 'custom', label: 'Custom Range', description: 'Specify exact date range' }
];

export function ReportScheduling({ 
    clubId: _clubId, 
    onScheduleReport, 
    onUpdateSchedule, 
    onDeleteSchedule, 
    scheduledReports, 
    isLoading: _isLoading 
}: Props) {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<ScheduledReport | null>(null);
    const [formData, setFormData] = useState<Partial<ScheduledReport>>({
        name: '',
        description: '',
        reportType: 'comprehensive',
        format: 'pdf',
        frequency: 'weekly',
        time: '09:00',
        recipients: [],
        isActive: true,
        includeCharts: true,
        includeMemberDetails: true,
        dateRange: 'last_30_days',
        dayOfWeek: 1, // Monday
        dayOfMonth: 1
    });
    const [recipientEmail, setRecipientEmail] = useState('');

    useEffect(() => {
        if (editingSchedule) {
            setFormData(editingSchedule);
        } else {
            // Reset form
            setFormData({
                name: '',
                description: '',
                reportType: 'comprehensive',
                format: 'pdf',
                frequency: 'weekly',
                time: '09:00',
                recipients: [],
                isActive: true,
                includeCharts: true,
                includeMemberDetails: true,
                dateRange: 'last_30_days',
                dayOfWeek: 1,
                dayOfMonth: 1
            });
        }
    }, [editingSchedule]);

    const handleSubmit = async () => {
        if (!formData.name || !formData.recipients?.length) {
            return;
        }

        try {
            if (editingSchedule) {
                await onUpdateSchedule(editingSchedule.id, formData);
                setEditingSchedule(null);
            } else {
                await onScheduleReport(formData as ScheduledReport);
                setShowCreateDialog(false);
            }
        } catch (error) {
            logger.error('events', 'Error saving scheduled report', { error, clubId: _clubId, formData });
        }
    };

    const addRecipient = () => {
        if (recipientEmail && !formData.recipients?.includes(recipientEmail)) {
            setFormData({
                ...formData,
                recipients: [...(formData.recipients || []), recipientEmail]
            });
            setRecipientEmail('');
        }
    };

    const removeRecipient = (email: string) => {
        setFormData({
            ...formData,
            recipients: formData.recipients?.filter(r => r !== email) || []
        });
    };

    const toggleScheduleStatus = async (schedule: ScheduledReport) => {
        await onUpdateSchedule(schedule.id, { isActive: !schedule.isActive });
    };

    const getNextRunDate = (schedule: ScheduledReport): string => {
        const now = new Date();
        const [hours, minutes] = schedule.time.split(':').map(Number);
        
        switch (schedule.frequency) {
            case 'daily':
                const daily = addDays(now, 1);
                daily.setHours(hours, minutes, 0, 0);
                return format(daily, 'MMM d, yyyy \'at\' h:mm a');
                
            case 'weekly':
                const weekly = addWeeks(now, 1);
                weekly.setHours(hours, minutes, 0, 0);
                return format(weekly, 'MMM d, yyyy \'at\' h:mm a');
                
            case 'monthly':
                const monthly = addMonths(now, 1);
                monthly.setHours(hours, minutes, 0, 0);
                return format(monthly, 'MMM d, yyyy \'at\' h:mm a');
                
            case 'quarterly':
                const quarterly = addMonths(now, 3);
                quarterly.setHours(hours, minutes, 0, 0);
                return format(quarterly, 'MMM d, yyyy \'at\' h:mm a');
                
            default:
                return 'Not scheduled';
        }
    };

    const getStatusBadge = (status: ScheduledReport['status']) => {
        switch (status) {
            case 'active':
                return <Badge variant="default" className="bg-success/10 text-success">Active</Badge>;
            case 'paused':
                return <Badge variant="secondary">Paused</Badge>;
            case 'error':
                return <Badge variant="destructive">Error</Badge>;
            default:
                return <Badge variant="outline">Unknown</Badge>;
        }
    };

    const getStatusIcon = (status: ScheduledReport['status']) => {
        switch (status) {
            case 'active':
                return <CheckCircle className="h-4 w-4 text-success" />;
            case 'paused':
                return <Pause className="h-4 w-4 text-muted-foreground" />;
            case 'error':
                return <XCircle className="h-4 w-4 text-destructive" />;
            default:
                return <AlertCircle className="h-4 w-4 text-warning" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Scheduled Reports</h3>
                    <p className="text-sm text-muted-foreground">
                        Automate report generation and delivery
                    </p>
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Schedule Report
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px]">
                        <DialogHeader>
                            <DialogTitle>
                                {editingSchedule ? 'Edit Scheduled Report' : 'Create Scheduled Report'}
                            </DialogTitle>
                            <DialogDescription>
                                Configure automatic report generation and email delivery.
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs defaultValue="basic" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                                <TabsTrigger value="delivery">Delivery</TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4">
                                <div className="space-y-3">
                                    <div>
                                        <Label htmlFor="name">Report Name</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Weekly Engagement Report"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="description">Description (Optional)</Label>
                                        <Input
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Automated weekly member engagement summary"
                                        />
                                    </div>

                                    <div>
                                        <Label>Report Type</Label>
                                        <Select 
                                            value={formData.reportType} 
                                            onValueChange={(value: any) => setFormData({ ...formData, reportType: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {reportTypeOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        <div className="flex items-center gap-2">
                                                            <option.icon className="h-4 w-4" />
                                                            <div>
                                                                <div>{option.label}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {option.description}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Export Format</Label>
                                        <Select 
                                            value={formData.format} 
                                            onValueChange={(value: any) => setFormData({ ...formData, format: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {formatOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        <div>
                                                            <div>{option.label}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {option.description}
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Date Range</Label>
                                        <Select 
                                            value={formData.dateRange} 
                                            onValueChange={(value: any) => setFormData({ ...formData, dateRange: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {dateRangeOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        <div>
                                                            <div>{option.label}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {option.description}
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="schedule" className="space-y-4">
                                <div className="space-y-3">
                                    <div>
                                        <Label>Frequency</Label>
                                        <Select 
                                            value={formData.frequency} 
                                            onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {frequencyOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        <div>
                                                            <div>{option.label}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {option.description}
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="time">Time</Label>
                                        <Input
                                            id="time"
                                            type="time"
                                            value={formData.time}
                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                        />
                                    </div>

                                    {formData.frequency === 'weekly' && (
                                        <div>
                                            <Label>Day of Week</Label>
                                            <Select 
                                                value={formData.dayOfWeek?.toString()} 
                                                onValueChange={(value) => setFormData({ ...formData, dayOfWeek: parseInt(value) })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">Sunday</SelectItem>
                                                    <SelectItem value="1">Monday</SelectItem>
                                                    <SelectItem value="2">Tuesday</SelectItem>
                                                    <SelectItem value="3">Wednesday</SelectItem>
                                                    <SelectItem value="4">Thursday</SelectItem>
                                                    <SelectItem value="5">Friday</SelectItem>
                                                    <SelectItem value="6">Saturday</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {formData.frequency === 'monthly' && (
                                        <div>
                                            <Label htmlFor="dayOfMonth">Day of Month</Label>
                                            <Input
                                                id="dayOfMonth"
                                                type="number"
                                                min="1"
                                                max="31"
                                                value={formData.dayOfMonth}
                                                onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="isActive"
                                            checked={formData.isActive}
                                            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                        />
                                        <Label htmlFor="isActive">Active</Label>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="delivery" className="space-y-4">
                                <div className="space-y-3">
                                    <div>
                                        <Label>Email Recipients</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="email@example.com"
                                                value={recipientEmail}
                                                onChange={(e) => setRecipientEmail(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                                            />
                                            <Button type="button" variant="outline" onClick={addRecipient}>
                                                Add
                                            </Button>
                                        </div>
                                        
                                        {formData.recipients && formData.recipients.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {formData.recipients.map((email) => (
                                                    <Badge key={email} variant="secondary" className="flex items-center gap-1">
                                                        {email}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRecipient(email)}
                                                            className="ml-1 text-xs hover:text-destructive"
                                                        >
                                                            ×
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="includeCharts"
                                            checked={formData.includeCharts}
                                            onCheckedChange={(checked) => setFormData({ ...formData, includeCharts: checked })}
                                        />
                                        <Label htmlFor="includeCharts">Include Charts and Visualizations</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="includeMemberDetails"
                                            checked={formData.includeMemberDetails}
                                            onCheckedChange={(checked) => setFormData({ ...formData, includeMemberDetails: checked })}
                                        />
                                        <Label htmlFor="includeMemberDetails">Include Member Details</Label>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleSubmit}
                                disabled={!formData.name || !formData.recipients?.length}
                            >
                                {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Scheduled Reports List */}
            <div className="space-y-4">
                {scheduledReports.map((schedule) => (
                    <Card key={schedule.id}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(schedule.status)}
                                    <div>
                                        <CardTitle className="text-base">{schedule.name}</CardTitle>
                                        {schedule.description && (
                                            <CardDescription>{schedule.description}</CardDescription>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(schedule.status)}
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleScheduleStatus(schedule)}
                                        >
                                            {schedule.isActive ? (
                                                <Pause className="h-4 w-4" />
                                            ) : (
                                                <Play className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingSchedule(schedule)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDeleteSchedule(schedule.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Type:</span>
                                    <div className="font-medium capitalize">{schedule.reportType}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Frequency:</span>
                                    <div className="font-medium capitalize">{schedule.frequency}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Format:</span>
                                    <div className="font-medium uppercase">{schedule.format}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Recipients:</span>
                                    <div className="font-medium">{schedule.recipients.length}</div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>Next run: {getNextRunDate(schedule)}</span>
                                </div>
                                {schedule.lastRun && (
                                    <div className="text-muted-foreground">
                                        Last run: {format(new Date(schedule.lastRun), 'MMM d, yyyy')}
                                    </div>
                                )}
                            </div>

                            {schedule.status === 'error' && schedule.errorMessage && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        {schedule.errorMessage}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <div className="flex flex-wrap gap-1">
                                    {schedule.recipients.slice(0, 3).map((email) => (
                                        <Badge key={email} variant="outline" className="text-xs">
                                            {email}
                                        </Badge>
                                    ))}
                                    {schedule.recipients.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{schedule.recipients.length - 3} more
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {scheduledReports.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Scheduled Reports</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Create your first scheduled report to automate report generation and delivery.
                            </p>
                            <Button onClick={() => setShowCreateDialog(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Schedule Your First Report
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Edit Dialog */}
            {editingSchedule && (
                <Dialog open={!!editingSchedule} onOpenChange={() => setEditingSchedule(null)}>
                    <DialogContent className="sm:max-w-[700px]">
                        <DialogHeader>
                            <DialogTitle>Edit Scheduled Report</DialogTitle>
                            <DialogDescription>
                                Update the configuration for "{editingSchedule.name}".
                            </DialogDescription>
                        </DialogHeader>

                        {/* Reuse the same form content from create dialog */}
                        <Tabs defaultValue="basic" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                                <TabsTrigger value="delivery">Delivery</TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4">
                                <div className="space-y-3">
                                    <div>
                                        <Label htmlFor="edit-name">Report Name</Label>
                                        <Input
                                            id="edit-name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="edit-description">Description (Optional)</Label>
                                        <Input
                                            id="edit-description"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <Label>Report Type</Label>
                                        <Select 
                                            value={formData.reportType} 
                                            onValueChange={(value: any) => setFormData({ ...formData, reportType: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {reportTypeOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        <div className="flex items-center gap-2">
                                                            <option.icon className="h-4 w-4" />
                                                            <div>
                                                                <div>{option.label}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {option.description}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="schedule" className="space-y-4">
                                <div className="space-y-3">
                                    <div>
                                        <Label>Frequency</Label>
                                        <Select 
                                            value={formData.frequency} 
                                            onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {frequencyOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="edit-isActive"
                                            checked={formData.isActive}
                                            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                        />
                                        <Label htmlFor="edit-isActive">Active</Label>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="delivery" className="space-y-4">
                                <div className="space-y-3">
                                    <div>
                                        <Label>Email Recipients</Label>
                                        {formData.recipients && formData.recipients.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {formData.recipients.map((email) => (
                                                    <Badge key={email} variant="secondary" className="flex items-center gap-1">
                                                        {email}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRecipient(email)}
                                                            className="ml-1 text-xs hover:text-destructive"
                                                        >
                                                            ×
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                            <Button variant="outline" onClick={() => setEditingSchedule(null)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit}>
                                Update Schedule
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}