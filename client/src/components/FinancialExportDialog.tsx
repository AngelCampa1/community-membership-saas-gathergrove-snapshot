'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DollarSign, Download, Calendar as CalendarIcon, FileText, CreditCard, Receipt } from 'lucide-react';
import { financialExportService, type FinancialExportOptions } from '@/services/financialExportService';
import { toast } from 'sonner';
import { format, subDays, subMonths } from 'date-fns';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface ExportResult {
  success: boolean;
  fileName?: string;
  downloadUrl?: string;
  recordCount?: number;
  errorMessage?: string;
}

export interface FinancialExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: number;
  onExportComplete?: (result: ExportResult) => void;
}

interface DateRange {
  from: Date;
  to: Date;
}

interface ExportPreset {
  key: string;
  label: string;
  description: string;
  dateRange: DateRange;
}

const formatOptions = [
  { value: 'csv', label: 'CSV', description: 'Comma-separated values (Excel compatible)', icon: <FileText className="h-4 w-4" /> },
  { value: 'excel', label: 'Excel', description: 'Microsoft Excel spreadsheet (.xlsx)', icon: <FileText className="h-4 w-4" /> },
  { value: 'json', label: 'JSON', description: 'JavaScript Object Notation (developers)', icon: <FileText className="h-4 w-4" /> },
  { value: 'pdf', label: 'PDF', description: 'Portable Document Format (reports)', icon: <Receipt className="h-4 w-4" /> },
];

const categoryOptions = [
  { key: 'billing', label: 'Membership Billing', description: 'Member billing and invoice data', icon: <Receipt className="h-4 w-4" /> },
  { key: 'payments', label: 'Payments Received', description: 'Payment transactions and receipts', icon: <CreditCard className="h-4 w-4" /> },
  { key: 'dues', label: 'Dues and Fees', description: 'Monthly/annual membership fees', icon: <DollarSign className="h-4 w-4" /> },
  { key: 'events', label: 'Event Revenue', description: 'Event registration and ticket sales', icon: <CalendarIcon className="h-4 w-4" /> },
  { key: 'refunds', label: 'Refunds', description: 'Refunded transactions and adjustments', icon: <DollarSign className="h-4 w-4" /> },
];

const groupByOptions = [
  { value: 'date', label: 'By Date', description: 'Group transactions by date' },
  { value: 'member', label: 'By Member', description: 'Group transactions by member' },
  { value: 'category', label: 'By Category', description: 'Group by transaction type' },
  { value: 'event', label: 'By Event', description: 'Group by event/activity' },
];

export default function FinancialExportDialog({ isOpen: open, onClose, clubId, onExportComplete }: FinancialExportDialogProps) {
  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'json' | 'pdf'>('csv');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['billing', 'payments', 'dues']);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 3),
    to: new Date()
  });
  const [includeMemberDetails, setIncludeMemberDetails] = useState(true);
  const [includeProjections, setIncludeProjections] = useState(false);
  const [groupBy, setGroupBy] = useState<'date' | 'member' | 'category' | 'event'>('date');
  const [currency, setCurrency] = useState('USD');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState<'from' | 'to' | null>(null);

  const exportPresets: ExportPreset[] = [
    {
      key: 'last30days',
      label: 'Last 30 Days',
      description: 'Recent financial activity',
      dateRange: { from: subDays(new Date(), 30), to: new Date() }
    },
    {
      key: 'last3months',
      label: 'Last 3 Months',
      description: 'Quarterly summary',
      dateRange: { from: subMonths(new Date(), 3), to: new Date() }
    },
    {
      key: 'thisyear',
      label: 'This Year',
      description: 'Year-to-date financial data',
      dateRange: { from: new Date(new Date().getFullYear(), 0, 1), to: new Date() }
    },
    {
      key: 'lastyear',
      label: 'Last Year',
      description: 'Previous year financial data',
      dateRange: { 
        from: new Date(new Date().getFullYear() - 1, 0, 1), 
        to: new Date(new Date().getFullYear() - 1, 11, 31) 
      }
    },
  ];

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handlePresetSelect = (preset: ExportPreset) => {
    setDateRange(preset.dateRange);
  };

  const handleSelectAllCategories = () => {
    setSelectedCategories(categoryOptions.map(cat => cat.key));
  };

  const handleClearAllCategories = () => {
    setSelectedCategories([]);
  };

  const handleExport = async () => {
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one financial category to export');
      return;
    }

    if (!dateRange.from || !dateRange.to) {
      toast.error('Please select a valid date range');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    const options: FinancialExportOptions = {
      format: exportFormat,
      dateRange: {
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString()
      },
      includeCategories: selectedCategories as ("billing" | "events" | "payments" | "dues" | "refunds")[],
      includeMemberDetails,
      groupBy,
      currency,
      includeProjections,
    };

    try {

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 300);

      const result = await financialExportService.exportFinancialData(clubId, options);

      clearInterval(progressInterval);
      setExportProgress(100);

      if (result.status === 'completed') {
        // Download the generated file
        const blob = await financialExportService.downloadFinancialExport(clubId, result.exportId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName || `financial-export-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success('Financial export downloaded successfully!');
        if (onExportComplete) {
          onExportComplete({
            success: true,
            fileName: result.fileName ?? undefined,
            downloadUrl: result.downloadUrl ?? undefined,
            recordCount: result.recordCount ?? undefined,
            errorMessage: result.errorMessage ?? undefined,
          });
        }
      } else {
        throw new Error(result.errorMessage || `Export ${result.status}`);
      }

      // Reset and close dialog
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        onOpenChange(false);
      }, 1000);

    } catch (error) {
      logger.error('analytics', 'Financial export failed', { error, clubId, options });
      setIsExporting(false);
      setExportProgress(0);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Export failed: ${errorMessage}`);
    }
  };

  const getEstimatedRecordCount = () => {
    if (!dateRange.to || !dateRange.from) return 0;
    const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
    const estimatedTransactionsPerDay = 5; // Conservative estimate
    return daysDiff * estimatedTransactionsPerDay * selectedCategories.length;
  };

  const getEstimatedFileSize = () => {
    const recordCount = getEstimatedRecordCount();
    const bytesPerRecord = exportFormat === 'json' ? 200 : exportFormat === 'pdf' ? 300 : 100;
    const totalBytes = recordCount * bytesPerRecord;
    
    if (totalBytes < 1024) return `${totalBytes}B`;
    if (totalBytes < 1024 * 1024) return `${Math.round(totalBytes / 1024)}KB`;
    return `${Math.round(totalBytes / (1024 * 1024))}MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Export Financial Data
          </DialogTitle>
          <DialogDescription>
            Export your club's financial transactions, billing history, and revenue data.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Export Format Selection */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Export Format</CardTitle>
              <CardDescription>Choose how you want to export your financial data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" role="radiogroup" aria-label="Export format selection">
                {formatOptions.map((format) => {
                  const formatId = `format-${format.value}`;
                  const displayLabel = format.value === 'pdf' ? 'PDF Report' : format.label;
                  
                  return (
                    <label
                      key={format.value}
                      htmlFor={formatId}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        exportFormat === format.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <input
                        id={formatId}
                        type="radio"
                        name="exportFormat"
                        value={format.value}
                        checked={exportFormat === format.value}
                        onChange={() => setExportFormat(format.value as 'csv' | 'excel' | 'json' | 'pdf')}
                        className="sr-only"
                        aria-label={displayLabel}
                      />
                      <div className="flex items-center gap-2 font-medium">
                        {format.icon}
                        {displayLabel}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{format.description}</div>
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Date Range Selection */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Date Range</CardTitle>
              <CardDescription>Select the time period for your financial export</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Presets */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {exportPresets.map((preset) => (
                  <Button
                    key={preset.key}
                    variant="outline"
                    className="h-auto p-3 text-left flex flex-col items-start"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    <div className="font-medium text-sm">{preset.label}</div>
                    <div className="text-xs text-muted-foreground">{preset.description}</div>
                  </Button>
                ))}
              </div>

              {/* Custom Date Range */}
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Popover open={showDatePicker === 'from'} onOpenChange={(open) => setShowDatePicker(open ? 'from' : null)}>
                    <PopoverTrigger asChild>
                      <Button
                        id="start-date"
                        variant="outline"
                        className={cn(
                          'w-[240px] justify-start text-left font-normal',
                          !dateRange.from && 'text-muted-foreground'
                        )}
                        aria-label="Start Date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => {
                          if (date) {
                            setDateRange(prev => ({ ...prev, from: date }));
                            setShowDatePicker(null);
                          }
                        }}
                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Popover open={showDatePicker === 'to'} onOpenChange={(open) => setShowDatePicker(open ? 'to' : null)}>
                    <PopoverTrigger asChild>
                      <Button
                        id="end-date"
                        variant="outline"
                        className={cn(
                          'w-[240px] justify-start text-left font-normal',
                          !dateRange.to && 'text-muted-foreground'
                        )}
                        aria-label="End Date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.to ? format(dateRange.to, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => {
                          if (date) {
                            setDateRange(prev => ({ ...prev, to: date }));
                            setShowDatePicker(null);
                          }
                        }}
                        disabled={(date) => date > new Date() || date < dateRange.from}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Categories */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Financial Categories</CardTitle>
                  <CardDescription>
                    Select which financial data types to include ({selectedCategories.length} of {categoryOptions.length} selected)
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAllCategories}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearAllCategories}>
                    Clear All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryOptions.map((category) => (
                  <div
                    key={category.key}
                    className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <Checkbox
                      id={category.key}
                      checked={selectedCategories.includes(category.key)}
                      onCheckedChange={() => handleCategoryToggle(category.key)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={category.key}
                        className="text-sm font-medium cursor-pointer flex items-center gap-2"
                      >
                        {category.icon}
                        {category.label}
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {category.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Export Options</CardTitle>
              <CardDescription>Customize your financial export settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Group By</Label>
                  <Select value={groupBy} onValueChange={(value: "date" | "event" | "member" | "category") => setGroupBy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {groupByOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD (C$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="include-member-details" className="space-y-0.5 cursor-pointer">
                    <div className="text-sm font-medium">Include Member Details</div>
                    <div className="text-xs text-muted-foreground">
                      Add member names and contact information to transactions
                    </div>
                  </label>
                  <Checkbox
                    id="include-member-details"
                    checked={includeMemberDetails}
                    onCheckedChange={(checked) => setIncludeMemberDetails(checked === true)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="include-summary-totals" className="space-y-0.5 cursor-pointer">
                    <div className="text-sm font-medium">Include Summary Totals</div>
                    <div className="text-xs text-muted-foreground">
                      Add summary totals and subtotals to the export
                    </div>
                  </label>
                  <Checkbox
                    id="include-summary-totals"
                    checked={includeProjections}
                    onCheckedChange={(checked) => setIncludeProjections(checked === true)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="include-charts" className="space-y-0.5 cursor-pointer">
                    <div className="text-sm font-medium">Include Charts (PDF only)</div>
                    <div className="text-xs text-muted-foreground">
                      Add charts and visualizations to PDF reports
                    </div>
                  </label>
                  <Checkbox
                    id="include-charts"
                    checked={exportFormat === 'pdf' ? includeProjections : false}
                    disabled={exportFormat !== 'pdf'}
                    onCheckedChange={(checked) => {
                      if (exportFormat === 'pdf') {
                        setIncludeProjections(checked === true);
                      }
                    }}
                  />
                </div>
              </div>
            </CardContent>
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
                  <p className="font-medium">{exportFormat.toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Categories:</span>
                  <p className="font-medium">{selectedCategories.length} selected</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Est. Records:</span>
                  <p className="font-medium">{getEstimatedRecordCount().toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Est. Size:</span>
                  <p className="font-medium">{getEstimatedFileSize()}</p>
                </div>
              </div>

              {dateRange.from && dateRange.to && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Date Range:</span>
                  <p className="font-medium">
                    {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
                    <span className="text-muted-foreground ml-2">
                      ({Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} days)
                    </span>
                  </p>
                </div>
              )}

              {isExporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Export Progress:</span>
                    <span>{Math.round(exportProgress)}%</span>
                  </div>
                  <Progress value={exportProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Processing financial data and generating export...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || selectedCategories.length === 0 || !dateRange.from || !dateRange.to}
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
                Export Financial Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}