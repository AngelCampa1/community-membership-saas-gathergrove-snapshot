'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Users, Download, Settings, FileText, Database, Calendar, ChevronDown, ChevronUp, UserCheck } from 'lucide-react';
import { memberDataExportService, type MemberExportOptions, type ExportStatus } from '@/services/memberDataExportService';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface MemberExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: number;
  onExportComplete?: (result: { success: boolean; fileName?: string; downloadUrl?: string; recordCount?: number; errorMessage?: string }) => void;
}

export interface ExportField {
  key: string;
  label: string;
  category: 'basic' | 'contact' | 'membership' | 'engagement' | 'custom';
  description?: string;
  premium?: boolean;
}

const availableFields: ExportField[] = [
  // Basic fields
  { key: 'firstName', label: 'First Name', category: 'basic', description: 'Member first name' },
  { key: 'lastName', label: 'Last Name', category: 'basic', description: 'Member last name' },
  { key: 'email', label: 'Email Address', category: 'basic', description: 'Primary email address' },
  { key: 'membershipType', label: 'Membership Type', category: 'basic', description: 'Current membership tier' },
  { key: 'joinDate', label: 'Join Date', category: 'basic', description: 'Date member joined the club' },

  // Contact fields
  { key: 'phone', label: 'Phone Number', category: 'contact', description: 'Primary phone number' },
  { key: 'address', label: 'Address', category: 'contact', description: 'Full mailing address' },

  // Membership fields
  { key: 'membershipStatus', label: 'Membership Status', category: 'membership', description: 'Active, inactive, suspended' },
  { key: 'renewalDate', label: 'Renewal Date', category: 'membership', description: 'Next membership renewal date' },
  { key: 'membershipHistory', label: 'Membership History', category: 'membership', description: 'Historical membership changes' },

  // Engagement fields
  { key: 'engagement', label: 'Engagement Score', category: 'engagement', description: 'Member engagement metrics', premium: true },
  { key: 'attendance', label: 'Attendance History', category: 'engagement', description: 'Event attendance record', premium: true },
  { key: 'lastActivityDate', label: 'Last Activity', category: 'engagement', description: 'Date of last club activity' },
  { key: 'eventsAttended', label: 'Events Attended', category: 'engagement', description: 'Total number of events attended' },

  // Custom fields
  { key: 'customFields', label: 'Custom Fields', category: 'custom', description: 'All custom member fields', premium: true },
  { key: 'notes', label: 'Member Notes', category: 'custom', description: 'Administrative notes about member' },
];

const formatOptions = [
  { value: 'csv', label: 'CSV', description: 'Comma-separated values (Excel compatible)' },
  { value: 'excel', label: 'Excel', description: 'Microsoft Excel spreadsheet (.xlsx)' },
  { value: 'pdf', label: 'PDF', description: 'Portable Document Format' },
  { value: 'json', label: 'JSON', description: 'JavaScript Object Notation (developers)' },
];

const TERMINAL_STATUSES: ExportStatus[] = ['completed', 'failed', 'cancelled', 'expired'];
const POLL_INTERVAL_MS = 2000;

export default function MemberExportDialog({ isOpen: open, onClose, clubId, onExportComplete }: MemberExportDialogProps) {
  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };
  const [selectedFields, setSelectedFields] = useState<string[]>(['firstName', 'lastName', 'email', 'membershipType']);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf' | 'json'>('csv');
  const [includeEngagementData, setIncludeEngagementData] = useState(false);
  const [includeCustomFields, setIncludeCustomFields] = useState(false);
  const [includeAttendanceHistory, setIncludeAttendanceHistory] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportId, setExportId] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<ExportStatus | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [membershipTypeFilter, setMembershipTypeFilter] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string>('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // Clean up polling on unmount
  useEffect(() => {
    return () => stopPolling();
  }, []);

  const categories = [
    { key: 'all', label: 'All Fields', icon: <Database className="h-4 w-4" /> },
    { key: 'basic', label: 'Basic Info', icon: <Users className="h-4 w-4" /> },
    { key: 'contact', label: 'Contact', icon: <FileText className="h-4 w-4" /> },
    { key: 'membership', label: 'Membership', icon: <UserCheck className="h-4 w-4" /> },
    { key: 'engagement', label: 'Engagement', icon: <Calendar className="h-4 w-4" /> },
    { key: 'custom', label: 'Custom', icon: <Settings className="h-4 w-4" /> },
  ];

  const filteredFields = availableFields.filter(field =>
    selectedCategory === 'all' || field.category === selectedCategory
  );

  useEffect(() => {
    // Auto-select engagement options when engagement fields are selected
    const hasEngagementFields = selectedFields.some(field =>
      ['engagement', 'attendance', 'lastActivityDate', 'eventsAttended'].includes(field)
    );
    if (hasEngagementFields) {
      setIncludeEngagementData(true);
    }

    // Auto-select custom fields option when custom fields are selected
    const hasCustomFields = selectedFields.some(field =>
      ['customFields', 'notes'].includes(field)
    );
    if (hasCustomFields) {
      setIncludeCustomFields(true);
    }

    // Auto-select attendance history when attendance field is selected
    if (selectedFields.includes('attendance')) {
      setIncludeAttendanceHistory(true);
    }
  }, [selectedFields]);

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields(prev => {
      const newFields = prev.includes(fieldKey)
        ? prev.filter(key => key !== fieldKey)
        : [...prev, fieldKey];

      // Clear validation error when fields are selected
      if (newFields.length > 0 && validationError) {
        setValidationError('');
      }

      return newFields;
    });
  };

  const handleSelectAll = () => {
    const categoryFields = filteredFields.map(field => field.key);
    const newFields = [...new Set([...selectedFields, ...categoryFields])];
    setSelectedFields(newFields);

    // Clear validation error when fields are selected
    if (newFields.length > 0 && validationError) {
      setValidationError('');
    }
  };

  const handleClearAll = () => {
    if (selectedCategory === 'all') {
      // Clear all fields when 'All Fields' category is selected
      setSelectedFields([]);
    } else {
      // Clear only fields from the current category
      const categoryFields = filteredFields.map(field => field.key);
      setSelectedFields(prev => prev.filter(key => !categoryFields.includes(key)));
    }
  };

  const triggerBrowserDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      setValidationError('Please select at least one field to export');
      return;
    }

    setValidationError('');
    setIsExporting(true);
    setExportProgress(0);
    setExportId(null);
    setExportStatus(null);

    try {
      const options: MemberExportOptions = {
        format: exportFormat,
        includeFields: selectedFields,
        includeEngagementData,
        includeCustomFields,
        includeAttendanceHistory,
        ...(startDate && endDate && {
          dateRange: {
            startDate: new Date(startDate + 'T00:00:00.000Z').toISOString(),
            endDate: new Date(endDate + 'T23:59:59.999Z').toISOString()
          }
        }),
        ...(membershipTypeFilter.length > 0 && {
          filterBy: {
            membershipType: membershipTypeFilter
          }
        })
      };

      const result = await memberDataExportService.exportMembers(clubId, options);
      setExportId(result.exportId);
      setExportStatus(result.status);

      if (result.status === 'completed') {
        // Immediate download
        setExportProgress(100);
        const blob = await memberDataExportService.downloadExport(clubId, result.exportId);
        triggerBrowserDownload(blob, result.fileName || `members_export.${exportFormat}`);
        toast.success('Export completed successfully!');
        if (onExportComplete) {
          onExportComplete({ success: true, fileName: result.fileName, downloadUrl: result.downloadUrl ?? undefined, recordCount: result.recordCount ?? undefined });
        }
        setTimeout(() => {
          setIsExporting(false);
          setExportProgress(0);
          onClose();
        }, 1000);
      } else if (result.status === 'failed') {
        setIsExporting(false);
        const msg = result.errorMessage ?? 'Export failed';
        toast.error(`Export failed: ${msg}`);
        if (onExportComplete) {
          onExportComplete({ success: false, errorMessage: msg });
        }
      } else {
        // queued / processing — start polling
        stopPolling();
        pollRef.current = setInterval(async () => {
          try {
            const statusResp = await memberDataExportService.getExportStatus(clubId, result.exportId);
            setExportStatus(statusResp.status);
            setExportProgress(statusResp.progressPercentage ?? statusResp.progress ?? 0);

            if (TERMINAL_STATUSES.includes(statusResp.status)) {
              stopPolling();
              if (statusResp.status === 'completed') {
                setExportProgress(100);
                const blob = await memberDataExportService.downloadExport(clubId, result.exportId);
                triggerBrowserDownload(blob, result.fileName || `members_export.${exportFormat}`);
                toast.success('Export completed successfully!');
                if (onExportComplete) {
                  onExportComplete({ success: true, fileName: result.fileName, downloadUrl: statusResp.downloadUrl ?? undefined });
                }
                setTimeout(() => {
                  setIsExporting(false);
                  setExportProgress(0);
                  onClose();
                }, 1000);
              } else {
                setIsExporting(false);
                const msg = statusResp.errorMessage ?? `Export ${statusResp.status}`;
                toast.error(`Export failed: ${msg}`);
                if (onExportComplete) {
                  onExportComplete({ success: false, errorMessage: msg });
                }
              }
            }
          } catch (pollError) {
            stopPolling();
            setIsExporting(false);
            const errorMessage = pollError instanceof Error ? pollError.message : 'Unknown error occurred';
            toast.error(`Export failed: ${errorMessage}`);
          }
        }, POLL_INTERVAL_MS);
      }
    } catch (error) {
      logger.error('members', 'Member data export failed', { error, clubId, exportFormat, selectedFieldsCount: selectedFields.length });
      setIsExporting(false);
      setExportProgress(0);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Export failed: ${errorMessage}`);
    }
  };

  const getSelectedFieldsCount = () => {
    return filteredFields.filter(field => selectedFields.includes(field.key)).length;
  };

  const getTotalFieldsCount = () => {
    return filteredFields.length;
  };

  const getEstimatedFileSize = () => {
    const baseSize = selectedFields.length * 50; // 50 bytes per field per member on average
    const memberCount = 1000; // Estimate 1000 members
    const totalBytes = baseSize * memberCount;

    if (totalBytes < 1024) return `${totalBytes}B`;
    if (totalBytes < 1024 * 1024) return `${Math.round(totalBytes / 1024)}KB`;
    return `${Math.round(totalBytes / (1024 * 1024))}MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" role="dialog" aria-labelledby="dialog-title">
        <DialogHeader>
          <DialogTitle id="dialog-title" className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Export Member Data
          </DialogTitle>
          <DialogDescription>
            Configure your member data export settings
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Export Format Selection */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Export Format</CardTitle>
              <CardDescription>Choose how you want to export your member data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4" role="radiogroup" aria-label="Export format">
                {formatOptions.map((format) => (
                  <div
                    key={format.value}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      exportFormat === format.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setExportFormat(format.value as 'csv' | 'excel' | 'pdf' | 'json')}
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="exportFormat"
                        value={format.value}
                        checked={exportFormat === format.value}
                        onChange={() => setExportFormat(format.value as 'csv' | 'excel' | 'pdf' | 'json')}
                        aria-label={format.label}
                      />
                      <div>
                        <div className="font-medium" data-testid={`format-label-${format.value}`}>{format.label}</div>
                        <div className="text-sm text-muted-foreground mt-1">{format.description}</div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Field Selection */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Select Fields to Export</CardTitle>
                  <CardDescription>
                    Choose which member information to include ({getSelectedFieldsCount()} of {getTotalFieldsCount()} selected)
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearAll}>
                    Clear All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4" aria-label="Select fields to export">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.key}
                    variant={selectedCategory === category.key ? 'default' : 'outline'}
                    size="sm"
                    className="h-8"
                    onClick={() => setSelectedCategory(category.key)}
                  >
                    {category.icon}
                    <span className="ml-2">{category.label}</span>
                  </Button>
                ))}
              </div>

              {/* Field Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredFields.map((field) => (
                  <div
                    key={field.key}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <Checkbox
                      id={field.key}
                      checked={selectedFields.includes(field.key)}
                      onCheckedChange={() => handleFieldToggle(field.key)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={field.key}
                        className="text-sm font-medium cursor-pointer flex items-center gap-2"
                      >
                        {field.label}
                        {field.premium && (
                          <Badge variant="secondary" className="text-xs">
                            Premium
                          </Badge>
                        )}
                      </label>
                      {field.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {field.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Options */}
          <Card>
            <CardHeader className="pb-4">
              <Collapsible open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <div className="text-left">
                      <CardTitle className="text-lg">Advanced Options</CardTitle>
                      <CardDescription>Additional export settings and enhancements</CardDescription>
                    </div>
                    {showAdvancedOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="include-engagement" className="text-sm font-medium">Include Engagement Data</Label>
                          <div className="text-xs text-muted-foreground">
                            Add engagement scores, activity metrics, and participation data
                          </div>
                        </div>
                        <Checkbox
                          id="include-engagement"
                          checked={includeEngagementData}
                          onCheckedChange={(checked) => setIncludeEngagementData(checked === true)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="include-custom" className="text-sm font-medium">Include Custom Fields</Label>
                          <div className="text-xs text-muted-foreground">
                            Export all custom member fields and metadata
                          </div>
                        </div>
                        <Checkbox
                          id="include-custom"
                          checked={includeCustomFields}
                          onCheckedChange={(checked) => setIncludeCustomFields(checked === true)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="include-attendance" className="text-sm font-medium">Include Attendance History</Label>
                          <div className="text-xs text-muted-foreground">
                            Export detailed event attendance records
                          </div>
                        </div>
                        <Checkbox
                          id="include-attendance"
                          checked={includeAttendanceHistory}
                          onCheckedChange={(checked) => setIncludeAttendanceHistory(checked === true)}
                        />
                      </div>

                      {/* Date Range Selection */}
                      <div className="space-y-4 pt-4 border-t">
                        <h4 className="text-sm font-medium">Date Range Filter</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="start-date">Start Date</Label>
                            <Input
                              id="start-date"
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="end-date">End Date</Label>
                            <Input
                              id="end-date"
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </CardHeader>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-4">
              <Collapsible open={showFilters} onOpenChange={setShowFilters}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <div className="text-left">
                      <CardTitle className="text-lg">Filters</CardTitle>
                      <CardDescription>Filter members by specific criteria</CardDescription>
                    </div>
                    {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="membership-type-filter">Membership Type</Label>
                        <Select value="" onValueChange={(value) => {
                          if (!membershipTypeFilter.includes(value)) {
                            setMembershipTypeFilter([...membershipTypeFilter, value]);
                          }
                        }}>
                          <SelectTrigger id="membership-type-filter" aria-label="Membership Type">
                            <SelectValue placeholder="Select membership types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Premium">Premium</SelectItem>
                            <SelectItem value="Basic">Basic</SelectItem>
                            <SelectItem value="Student">Student</SelectItem>
                            <SelectItem value="Senior">Senior</SelectItem>
                          </SelectContent>
                        </Select>
                        {membershipTypeFilter.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {membershipTypeFilter.map((type) => (
                              <Badge key={type} variant="secondary" className="text-xs">
                                {type}
                                <button
                                  onClick={() => setMembershipTypeFilter(prev => prev.filter(t => t !== type))}
                                  className="ml-1 hover:text-destructive"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </CardHeader>
          </Card>

          {/* Export Preview */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Export Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Format:</span>
                  <p className="font-medium" data-testid="export-format-preview">{exportFormat.toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fields:</span>
                  <p className="font-medium">{selectedFields.length} selected</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Est. Size:</span>
                  <p className="font-medium">{getEstimatedFileSize()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p className="font-medium">Member Data</p>
                </div>
              </div>

              {isExporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Export Progress: {Math.round(exportProgress)}%</span>
                    <span>Estimated completion: 12:05</span>
                  </div>
                  <Progress value={exportProgress} className="h-2" />
                  {exportId && (
                    <p className="text-xs text-muted-foreground">
                      Export ID: {exportId}{exportStatus ? ` — ${exportStatus}` : ''}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          {validationError && (
            <div className="w-full mb-4">
              <p className="text-sm text-destructive" role="alert">
                {validationError}
              </p>
            </div>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
