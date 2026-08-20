"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger as _DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch as _Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    Download, FileText, FileSpreadsheet, Database, 
    Settings, ChevronDown, CheckCircle, AlertCircle,
    Users, BarChart3, TrendingUp, Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface Props {
    clubId: number;
    onExport: (format: 'pdf' | 'xlsx' | 'csv', reportType: 'comprehensive' | 'attendance' | 'engagement' | 'members') => Promise<void>;
    isExporting: boolean;
    dateRange: {
        from: Date;
        to: Date;
    };
    selectedEvents: string[];
    includeMemberDetails: boolean;
}

interface ExportOption {
    id: string;
    name: string;
    description: string;
    icon: any;
    formats: Array<{
        value: 'pdf' | 'xlsx' | 'csv';
        label: string;
        description: string;
        recommended?: boolean;
    }>;
    estimatedSize: string;
    type: 'comprehensive' | 'attendance' | 'engagement' | 'members';
}

const exportOptions: ExportOption[] = [
    {
        id: 'comprehensive',
        name: 'Comprehensive Report',
        description: 'Complete event analytics with all metrics, insights, and recommendations',
        icon: FileText,
        formats: [
            { value: 'pdf', label: 'PDF Report', description: 'Professional formatted report with charts', recommended: true },
            { value: 'xlsx', label: 'Excel Workbook', description: 'Spreadsheet with multiple worksheets' },
        ],
        estimatedSize: '2-5 MB',
        type: 'comprehensive'
    },
    {
        id: 'attendance',
        name: 'Attendance Data',
        description: 'Detailed attendance records and RSVP information for all events',
        icon: Users,
        formats: [
            { value: 'xlsx', label: 'Excel Spreadsheet', description: 'Structured data with filtering options', recommended: true },
            { value: 'csv', label: 'CSV File', description: 'Simple comma-separated values' },
            { value: 'pdf', label: 'PDF Report', description: 'Formatted attendance lists' },
        ],
        estimatedSize: '100KB - 2MB',
        type: 'attendance'
    },
    {
        id: 'engagement',
        name: 'Engagement Metrics',
        description: 'Member engagement trends, scores, and behavioral analytics',
        icon: TrendingUp,
        formats: [
            { value: 'xlsx', label: 'Excel Dashboard', description: 'Interactive charts and pivot tables', recommended: true },
            { value: 'pdf', label: 'PDF Report', description: 'Visual report with charts and insights' },
        ],
        estimatedSize: '500KB - 3MB',
        type: 'engagement'
    },
    {
        id: 'members',
        name: 'Member Participation',
        description: 'Individual member participation summaries and engagement levels',
        icon: BarChart3,
        formats: [
            { value: 'xlsx', label: 'Excel Spreadsheet', description: 'Member-by-member breakdown', recommended: true },
            { value: 'csv', label: 'CSV File', description: 'Raw data for external analysis' },
        ],
        estimatedSize: '200KB - 1MB',
        type: 'members'
    }
];

export function ExportButtons({ clubId: _clubId, onExport, isExporting, dateRange, selectedEvents, includeMemberDetails }: Props) {
    const [selectedOption, setSelectedOption] = useState<ExportOption | null>(null);
    const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'xlsx' | 'csv'>('pdf');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [exportStatus, setExportStatus] = useState<'idle' | 'preparing' | 'generating' | 'complete' | 'error'>('idle');

    const handleQuickExport = async (option: ExportOption, format: 'pdf' | 'xlsx' | 'csv') => {
        setExportStatus('preparing');
        setExportProgress(10);

        try {
            setExportProgress(30);
            setExportStatus('generating');
            
            await onExport(format, option.type);
            
            setExportProgress(100);
            setExportStatus('complete');
            
            setTimeout(() => {
                setExportStatus('idle');
                setExportProgress(0);
            }, 2000);

        } catch {
            setExportStatus('error');
            setTimeout(() => {
                setExportStatus('idle');
                setExportProgress(0);
            }, 3000);
        }
    };

    const handleAdvancedExport = async () => {
        if (!selectedOption) return;

        await handleQuickExport(selectedOption, selectedFormat);
        setShowAdvanced(false);
    };

    const getStatusIcon = (status: typeof exportStatus) => {
        switch (status) {
            case 'preparing':
            case 'generating':
                return <Download className="h-4 w-4 animate-pulse" />;
            case 'complete':
                return <CheckCircle className="h-4 w-4 text-success" />;
            case 'error':
                return <AlertCircle className="h-4 w-4 text-destructive" />;
            default:
                return <Download className="h-4 w-4" />;
        }
    };

    const getStatusText = (status: typeof exportStatus) => {
        switch (status) {
            case 'preparing':
                return 'Preparing...';
            case 'generating':
                return 'Generating...';
            case 'complete':
                return 'Complete!';
            case 'error':
                return 'Error';
            default:
                return 'Export';
        }
    };

    return (
        <div className="flex items-center gap-2">
            {/* Quick Export Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant="outline" 
                        disabled={isExporting || exportStatus !== 'idle'}
                        className="min-w-[120px]"
                    >
                        {getStatusIcon(exportStatus)}
                        <span className="ml-2">{getStatusText(exportStatus)}</span>
                        <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Quick Export Options
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {exportOptions.map((option) => (
                        <div key={option.id}>
                            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground py-1">
                                <option.icon className="h-3 w-3 inline mr-1" />
                                {option.name}
                            </DropdownMenuLabel>
                            {option.formats.map((format) => (
                                <DropdownMenuItem
                                    key={`${option.id}-${format.value}`}
                                    onClick={() => handleQuickExport(option, format.value)}
                                    disabled={isExporting || exportStatus !== 'idle'}
                                    className="pl-6"
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-sm">{format.label}</span>
                                        {format.recommended && (
                                            <Badge variant="secondary" className="text-xs">
                                                Recommended
                                            </Badge>
                                        )}
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    ))}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowAdvanced(true)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Advanced Options
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Export Progress */}
            {exportStatus !== 'idle' && (
                <div className="flex items-center gap-2 min-w-[200px]">
                    <Progress value={exportProgress} className="flex-1" />
                    <span className="text-xs text-muted-foreground">
                        {exportProgress}%
                    </span>
                </div>
            )}

            {/* Advanced Export Dialog */}
            <Dialog open={showAdvanced} onOpenChange={setShowAdvanced}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Advanced Export Options</DialogTitle>
                        <DialogDescription>
                            Customize your export settings and choose the format that best suits your needs.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Export Type Selection */}
                        <div className="space-y-3">
                            <Label>Export Type</Label>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {exportOptions.map((option) => (
                                    <div
                                        key={option.id}
                                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                            selectedOption?.id === option.id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:border-primary/50'
                                        }`}
                                        onClick={() => setSelectedOption(option)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <option.icon className="h-5 w-5 mt-0.5 text-primary" />
                                            <div className="space-y-1">
                                                <h4 className="font-medium text-sm">{option.name}</h4>
                                                <p className="text-xs text-muted-foreground">
                                                    {option.description}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {option.estimatedSize}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Format Selection */}
                        {selectedOption && (
                            <div className="space-y-3">
                                <Label>Export Format</Label>
                                <Select value={selectedFormat} onValueChange={(value: any) => setSelectedFormat(value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedOption.formats.map((format) => (
                                            <SelectItem key={format.value} value={format.value}>
                                                <div className="flex items-center justify-between w-full">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            {format.value === 'pdf' && <FileText className="h-4 w-4" />}
                                                            {format.value === 'xlsx' && <FileSpreadsheet className="h-4 w-4" />}
                                                            {format.value === 'csv' && <Database className="h-4 w-4" />}
                                                            <span>{format.label}</span>
                                                            {format.recommended && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    Recommended
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {format.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Export Summary */}
                        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                            <Label>Export Summary</Label>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Date Range:</span>
                                    <span>{format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Events:</span>
                                    <span>{selectedEvents.length > 0 ? `${selectedEvents.length} selected` : 'All events'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Member Details:</span>
                                    <span>{includeMemberDetails ? 'Included' : 'Excluded'}</span>
                                </div>
                                {selectedOption && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Estimated Size:</span>
                                        <span>{selectedOption.estimatedSize}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status Alert */}
                        {exportStatus === 'error' && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Export failed. Please try again or contact support if the problem persists.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                                Exports are generated in real-time
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => setShowAdvanced(false)}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleAdvancedExport}
                                disabled={!selectedOption || isExporting || exportStatus !== 'idle'}
                            >
                                {getStatusIcon(exportStatus)}
                                <span className="ml-2">
                                    {getStatusText(exportStatus)}
                                </span>
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}