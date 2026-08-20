'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Clock, Mail, Play, Trash2, Plus, Edit, Eye } from 'lucide-react';
import { scheduledReportsService, type ScheduledReport } from '@/services/scheduledReportsService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface ScheduledReportsManagerProps {
  clubId: number;
}

interface CreateReportForm {
  name: string;
  description: string;
  reportType: 'member' | 'financial' | 'analytics' | 'event';
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
    dayOfWeek?: string;
    dayOfMonth?: number;
    time?: string;
    timezone: string;
  };
  recipients: string[];
  format: 'csv' | 'excel' | 'json' | 'pdf';
  options: Record<string, any>;
}

export function ScheduledReportsManager({ clubId }: ScheduledReportsManagerProps) {
  const { user: _user } = useAuth();
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [executions, setExecutions] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ScheduledReport | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateReportForm>({
    name: '',
    description: '',
    reportType: 'member',
    schedule: {
      frequency: 'weekly',
      dayOfWeek: 'monday',
      time: '09:00',
      timezone: 'America/New_York'
    },
    recipients: [],
    format: 'csv',
    options: {}
  });
  const [recipientInput, setRecipientInput] = useState('');

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadReports is defined below and only depends on clubId
  }, [clubId]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const reportsData = await scheduledReportsService.getScheduledReports(clubId);
      setReports(reportsData);

      // Load recent executions for each report
      const executionPromises = reportsData.map(async (report) => {
        const reportExecutions = await scheduledReportsService.getReportExecutionHistory(report.id, 5);
        return { reportId: report.id, executions: reportExecutions };
      });

      const executionResults = await Promise.all(executionPromises);
      const executionMap = executionResults.reduce((acc, result) => {
        acc[result.reportId] = result.executions;
        return acc;
      }, {} as Record<string, any[]>);

      setExecutions(executionMap);
    } catch (error) {
      logger.error('analytics', 'Error loading scheduled reports', { error, clubId });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async () => {
    try {
      const validation = scheduledReportsService.validateSchedule(formData.schedule);
      if (!validation.isValid) {
        toast.error('Schedule validation failed: ' + validation.errors.join(', '));
        return;
      }

      await scheduledReportsService.createScheduledReport(clubId, {
        ...formData,
        enabled: true,
        includeFields: []
      });

      setShowCreateDialog(false);
      resetForm();
      loadReports();
      toast.success('Scheduled report created successfully');
    } catch (error) {
      logger.error('analytics', 'Error creating scheduled report', { error, clubId, formData });
      toast.error('Failed to create scheduled report');
    }
  };

  const handleUpdateReport = async () => {
    if (!selectedReport) return;

    try {
      const validation = scheduledReportsService.validateSchedule(formData.schedule);
      if (!validation.isValid) {
        toast.error('Schedule validation failed: ' + validation.errors.join(', '));
        return;
      }

      await scheduledReportsService.updateScheduledReport(selectedReport.id, formData);
      setShowEditDialog(false);
      setSelectedReport(null);
      resetForm();
      loadReports();
      toast.success('Scheduled report updated successfully');
    } catch (error) {
      logger.error('analytics', 'Error updating scheduled report', { error, reportId: selectedReport?.id, formData });
      toast.error('Failed to update scheduled report');
    }
  };

  const handleToggleReport = async (reportId: string, isActive: boolean) => {
    try {
      await scheduledReportsService.updateScheduledReport(reportId, { enabled: isActive });
      loadReports();
    } catch (error) {
      logger.error('analytics', 'Error toggling scheduled report', { error, reportId, isActive });
    }
  };

  const handleRunReportNow = async (reportId: string) => {
    try {
      const result = await scheduledReportsService.runScheduledReport(reportId);
      toast.success(`Report execution started with ID: ${result.executionId}`);
      loadReports();
    } catch (error) {
      logger.error('analytics', 'Error running scheduled report now', { error, reportId });
      toast.error('Failed to start report execution');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await scheduledReportsService.deleteScheduledReport(reportId);
      setReportToDelete(null); // Close dialog
      loadReports();
      toast.success('Report deleted successfully');
    } catch (error) {
      logger.error('analytics', 'Error deleting scheduled report', { error, reportId });
      toast.error('Failed to delete report');
      setReportToDelete(null); // Close dialog even on error
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      reportType: 'member',
      schedule: {
        frequency: 'weekly',
        dayOfWeek: 'monday',
        time: '09:00',
        timezone: 'America/New_York'
      },
      recipients: [],
      format: 'csv',
      options: {}
    });
    setRecipientInput('');
  };

  const openEditDialog = (report: ScheduledReport) => {
    setSelectedReport(report);
    setFormData({
      name: report.name,
      description: report.description || '',
      reportType: report.reportType,
      schedule: report.schedule,
      recipients: report.recipients,
      format: report.format,
      options: {}
    });
    setRecipientInput(report.recipients.join(', '));
    setShowEditDialog(true);
  };

  const addRecipient = () => {
    if (recipientInput.trim()) {
      const emails = recipientInput.split(',').map(email => email.trim()).filter(Boolean);
      const validEmails = emails.filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

      if (validEmails.length !== emails.length) {
        toast.error('Some email addresses are invalid');
        return;
      }

      setFormData(prev => ({
        ...prev,
        recipients: [...prev.recipients, ...validEmails].filter((email, index, self) => 
          self.indexOf(email) === index
        )
      }));
      setRecipientInput('');
    }
  };

  const removeRecipient = (email: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email)
    }));
  };

  const getStatusBadge = (report: ScheduledReport) => {
    if (!report.enabled) {
      return <Badge variant="secondary">Paused</Badge>;
    }

    const recentExecution = executions[report.id]?.[0];
    if (recentExecution) {
      switch (recentExecution.status) {
        case 'completed':
          return <Badge variant="default">Active</Badge>;
        case 'failed':
          return <Badge variant="destructive">Failed</Badge>;
        case 'processing':
          return <Badge variant="secondary">Running</Badge>;
        default:
          return <Badge variant="outline">Scheduled</Badge>;
      }
    }

    return <Badge variant="outline">Scheduled</Badge>;
  };

  const formatNextRun = (nextRunAt?: string) => {
    if (!nextRunAt) return 'Not scheduled';
    
    const nextRun = new Date(nextRunAt);
    const now = new Date();
    const diffMs = nextRun.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours}h from now`;
    } else {
      return nextRun.toLocaleDateString() + ' at ' + nextRun.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading scheduled reports...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Scheduled Reports
              </CardTitle>
              <CardDescription>
                Automate report generation and delivery to your team
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Report
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Scheduled Report</DialogTitle>
                  <DialogDescription>
                    Set up automatic report generation and delivery
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Basic Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Report Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Weekly Member Report"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reportType">Report Type</Label>
                      <Select value={formData.reportType} onValueChange={(value: any) => 
                        setFormData(prev => ({ ...prev, reportType: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member Data</SelectItem>
                          <SelectItem value="financial">Financial</SelectItem>
                          <SelectItem value="analytics">Analytics</SelectItem>
                          <SelectItem value="event">Events</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of this report..."
                    />
                  </div>

                  {/* Schedule */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Schedule</Label>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="frequency">Frequency</Label>
                        <Select value={formData.schedule.frequency} onValueChange={(value: any) =>
                          setFormData(prev => ({ 
                            ...prev, 
                            schedule: { ...prev.schedule, frequency: value }
                          }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="annually">Annually</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="time">Time</Label>
                        <Input
                          id="time"
                          type="time"
                          value={formData.schedule.time}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            schedule: { ...prev.schedule, time: e.target.value }
                          }))}
                        />
                      </div>
                    </div>

                    {formData.schedule.frequency === 'weekly' && (
                      <div className="space-y-2">
                        <Label htmlFor="dayOfWeek">Day of Week</Label>
                        <Select 
                          value={formData.schedule.dayOfWeek?.toString()} 
                          onValueChange={(value) =>
                            setFormData(prev => ({ 
                              ...prev, 
                              schedule: { ...prev.schedule, dayOfWeek: value }
                            }))
                          }
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

                    {(formData.schedule.frequency === 'monthly' || formData.schedule.frequency === 'quarterly') && (
                      <div className="space-y-2">
                        <Label htmlFor="dayOfMonth">Day of Month</Label>
                        <Input
                          id="dayOfMonth"
                          type="number"
                          min="1"
                          max="31"
                          value={formData.schedule.dayOfMonth || 1}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            schedule: { ...prev.schedule, dayOfMonth: parseInt(e.target.value) }
                          }))}
                        />
                      </div>
                    )}
                  </div>

                  {/* Format and Recipients */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="format">Export Format</Label>
                      <Select value={formData.format} onValueChange={(value: any) => 
                        setFormData(prev => ({ ...prev, format: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Recipients */}
                  <div className="space-y-2">
                    <Label>Email Recipients</Label>
                    <div className="flex gap-2">
                      <Input
                        value={recipientInput}
                        onChange={(e) => setRecipientInput(e.target.value)}
                        placeholder="Enter email addresses (comma separated)"
                        onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                      />
                      <Button type="button" onClick={addRecipient}>Add</Button>
                    </div>
                    
                    {formData.recipients.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.recipients.map((email) => (
                          <Badge key={email} variant="secondary" className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {email}
                            <button
                              onClick={() => removeRecipient(email)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateReport}>
                      Create Report
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Reports List */}
      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Scheduled Reports</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first scheduled report to automate data exports
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                      {getStatusBadge(report)}
                    </div>
                    <CardDescription>
                      {scheduledReportsService.formatScheduleDescription(report.schedule)}
                      {report.description && ` • ${report.description}`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={report.enabled}
                      onCheckedChange={(checked) => handleToggleReport(report.id, checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p className="font-medium capitalize">{report.reportType}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Format:</span>
                    <p className="font-medium">{report.format.toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Recipients:</span>
                    <p className="font-medium">{report.recipients.length} emails</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Next Run:</span>
                    <p className="font-medium">{formatNextRun(report.nextRunAt || undefined)}</p>
                  </div>
                </div>

                {executions[report.id] && executions[report.id].length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Recent Executions
                    </h4>
                    <div className="space-y-1">
                      {executions[report.id].slice(0, 3).map((execution) => (
                        <div key={execution.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                          <span>{new Date(execution.startedAt).toLocaleString()}</span>
                          <Badge 
                            variant={
                              execution.status === 'completed' ? 'default' :
                              execution.status === 'failed' ? 'destructive' : 'secondary'
                            }
                          >
                            {execution.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRunReportNow(report.id)}
                    disabled={!report.enabled}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Run Now
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(report)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <AlertDialog open={reportToDelete === report.id} onOpenChange={(open) => !open && setReportToDelete(null)}>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => setReportToDelete(report.id)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Scheduled Report</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{report.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteReport(report.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Scheduled Report</DialogTitle>
            <DialogDescription>
              Update report settings and schedule
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Report Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Weekly Member Report"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-reportType">Report Type</Label>
                <Select value={formData.reportType} onValueChange={(value: any) =>
                  setFormData(prev => ({ ...prev, reportType: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member Data</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="event">Events</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this report..."
              />
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Schedule</Label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-frequency">Frequency</Label>
                  <Select value={formData.schedule.frequency} onValueChange={(value: any) =>
                    setFormData(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule, frequency: value }
                    }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-time">Time</Label>
                  <Input
                    id="edit-time"
                    type="time"
                    value={formData.schedule.time}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule, time: e.target.value }
                    }))}
                  />
                </div>
              </div>

              {formData.schedule.frequency === 'weekly' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-dayOfWeek">Day of Week</Label>
                  <Select
                    value={formData.schedule.dayOfWeek?.toString()}
                    onValueChange={(value) =>
                      setFormData(prev => ({
                        ...prev,
                        schedule: { ...prev.schedule, dayOfWeek: value }
                      }))
                    }
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

              {(formData.schedule.frequency === 'monthly' || formData.schedule.frequency === 'quarterly') && (
                <div className="space-y-2">
                  <Label htmlFor="edit-dayOfMonth">Day of Month</Label>
                  <Input
                    id="edit-dayOfMonth"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.schedule.dayOfMonth || 1}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule, dayOfMonth: parseInt(e.target.value) }
                    }))}
                  />
                </div>
              )}
            </div>

            {/* Format and Recipients */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-format">Export Format</Label>
                <Select value={formData.format} onValueChange={(value: any) =>
                  setFormData(prev => ({ ...prev, format: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Recipients */}
            <div className="space-y-2">
              <Label>Email Recipients</Label>
              <div className="flex gap-2">
                <Input
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  placeholder="Enter email addresses (comma separated)"
                  onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                />
                <Button type="button" onClick={addRecipient}>Add</Button>
              </div>

              {formData.recipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.recipients.map((email) => (
                    <Badge key={email} variant="secondary" className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {email}
                      <button
                        onClick={() => removeRecipient(email)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateReport}>
                Update Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}