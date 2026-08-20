'use client';

import React, { useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Database,
  CheckCircle,
  AlertTriangle,
  Clock,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ExportFormat,
  ExportProgress,
  AnalyticsDateRange,
} from '@/types/analytics';

// Define export data interface
interface ExportableDataItem {
  [key: string]: string | number | boolean | Date | null | undefined;
}

type ExportableData = ExportableDataItem[] | ExportableDataItem;

interface DataExportManagerProps {
  data: ExportableData;
  userTier: 'basic' | 'pro' | 'unlimited';
  dateRange?: AnalyticsDateRange;
  onExport: (format: ExportFormat, data: unknown) => Promise<void>;
  className?: string;
}

interface ExportFormatConfig {
  format: ExportFormat;
  icon: React.ReactNode;
  label: string;
  description: string;
  fileExtension: string;
  available: boolean;
  premium?: boolean;
}

const tierLimits = {
  basic: {
    formats: ['csv'] as ExportFormat[],
    dailyLimit: 5,
    maxRecords: 1000,
    includeBranding: false,
  },
  pro: {
    formats: ['csv', 'excel'] as ExportFormat[],
    dailyLimit: 25,
    maxRecords: 10000,
    includeBranding: false,
  },
  unlimited: {
    formats: ['csv', 'excel', 'pdf', 'json'] as ExportFormat[],
    dailyLimit: 500,
    maxRecords: 100000,
    includeBranding: true,
  },
};

export const DataExportManager: React.FC<DataExportManagerProps> = ({
  data,
  userTier,
  dateRange,
  onExport,
  className,
}) => {
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportHistory, setExportHistory] = useState<Array<{
    format: ExportFormat;
    timestamp: Date;
    status: 'success' | 'error';
    filename: string;
  }>>([]);

  const tierConfig = tierLimits[userTier];

  const exportFormats: ExportFormatConfig[] = [
    {
      format: 'csv',
      icon: <Database className="h-4 w-4" />,
      label: 'CSV',
      description: 'Comma-separated values for spreadsheets',
      fileExtension: 'csv',
      available: tierConfig.formats.includes('csv'),
    },
    {
      format: 'excel',
      icon: <FileSpreadsheet className="h-4 w-4" />,
      label: 'Excel',
      description: 'Microsoft Excel workbook with charts',
      fileExtension: 'xlsx',
      available: tierConfig.formats.includes('excel'),
      premium: userTier === 'basic',
    },
    {
      format: 'pdf',
      icon: <FileText className="h-4 w-4" />,
      label: 'PDF Report',
      description: 'Professional report with charts and insights',
      fileExtension: 'pdf',
      available: tierConfig.formats.includes('pdf'),
      premium: userTier !== 'unlimited',
    },
    {
      format: 'json',
      icon: <Database className="h-4 w-4" />,
      label: 'JSON',
      description: 'Raw data for developers and integrations',
      fileExtension: 'json',
      available: tierConfig.formats.includes('json'),
      premium: userTier !== 'unlimited',
    },
  ];

  const generateFilename = useCallback((format: ExportFormat): string => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const dateRangeString = dateRange
      ? `_${dateRange.startDate.toISOString().slice(0, 10)}_to_${dateRange.endDate.toISOString().slice(0, 10)}`
      : '';
    const ext = exportFormats.find(f => f.format === format)?.fileExtension || 'dat';
    return `analytics_export${dateRangeString}_${timestamp}.${ext}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- exportFormats is defined above and doesn't change
  }, [dateRange]);

  const exportToCsv = useCallback(async (data: ExportableDataItem[]): Promise<void> => {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No data available for export');
      }

      // Convert data to CSV format
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.slice(0, tierConfig.maxRecords).map(row =>
          headers.map(header => {
            const value = row[header];
            // Handle values that might contain commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
          }).join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, generateFilename('csv'));
    } catch (error) {
      throw new Error(`CSV export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [tierConfig.maxRecords, generateFilename]);

  const exportToExcel = useCallback(async (data: ExportableDataItem[]): Promise<void> => {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No data available for export');
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'GatherGrove';
      workbook.created = new Date();

      // Main data sheet
      const limitedData = data.slice(0, tierConfig.maxRecords);
      const worksheet = workbook.addWorksheet('Analytics Data');

      if (limitedData.length > 0) {
        // Set up columns with headers
        worksheet.columns = Object.keys(limitedData[0]).map(key => ({
          header: key,
          key: key,
          width: 15
        }));

        // Add data rows
        limitedData.forEach(row => worksheet.addRow(row));

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF3B82F6' } // Primary blue
        };
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      }

      // Summary sheet for unlimited tier
      if (userTier === 'unlimited') {
        const summarySheet = workbook.addWorksheet('Export Summary');
        const summary = {
          'Export Date': new Date().toISOString(),
          'Total Records': data.length,
          'Date Range': dateRange ? `${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}` : 'All time',
          'User Tier': userTier,
        };

        summarySheet.columns = [
          { header: 'Property', key: 'property', width: 20 },
          { header: 'Value', key: 'value', width: 40 }
        ];

        Object.entries(summary).forEach(([key, value]) => {
          summarySheet.addRow({ property: key, value: String(value) });
        });

        summarySheet.getRow(1).font = { bold: true };
      }

      // Write to buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      saveAs(blob, generateFilename('excel'));
    } catch (error) {
      throw new Error(`Excel export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [tierConfig.maxRecords, userTier, dateRange, generateFilename]);

  const exportToPdf = useCallback(async (data: ExportableDataItem[]): Promise<void> => {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No data available for export');
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPosition = 20;

      // Header
      doc.setFontSize(20);
      doc.text('Analytics Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Date range and metadata
      doc.setFontSize(12);
      if (dateRange) {
        doc.text(
          `Period: ${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`,
          20,
          yPosition
        );
        yPosition += 10;
      }
      
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Records: ${Math.min(data.length, tierConfig.maxRecords)} of ${data.length}`, 20, yPosition);
      yPosition += 20;

      // Data table (simplified)
      const limitedData = data.slice(0, Math.min(50, tierConfig.maxRecords)); // Limit for PDF readability
      const headers = Object.keys(limitedData[0]);
      
      // Table headers
      doc.setFontSize(10);
      headers.forEach((header, index) => {
        doc.text(header, 20 + (index * 30), yPosition);
      });
      yPosition += 10;

      // Table data
      limitedData.forEach((row) => {
        if (yPosition > 270) { // New page if needed
          doc.addPage();
          yPosition = 20;
        }
        
        headers.forEach((header, colIndex) => {
          const value = row[header];
          const displayValue = typeof value === 'number' 
            ? value.toLocaleString() 
            : String(value || '').slice(0, 15);
          doc.text(displayValue, 20 + (colIndex * 30), yPosition);
        });
        yPosition += 8;
      });

      // Footer with branding for unlimited tier
      if (tierConfig.includeBranding) {
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.text(
            'Generated by GatherGrove Analytics',
            pageWidth / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }
      }

      doc.save(generateFilename('pdf'));
    } catch (error) {
      throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [tierConfig, dateRange, generateFilename]);

  const exportToJson = useCallback(async (data: ExportableDataItem[]): Promise<void> => {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No data available for export');
      }

      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          totalRecords: data.length,
          exportedRecords: Math.min(data.length, tierConfig.maxRecords),
          dateRange: dateRange ? {
            start: dateRange.startDate.toISOString(),
            end: dateRange.endDate.toISOString(),
          } : null,
          userTier,
        },
        data: data.slice(0, tierConfig.maxRecords),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      saveAs(blob, generateFilename('json'));
    } catch (error) {
      throw new Error(`JSON export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [tierConfig, dateRange, userTier, generateFilename]);

  const handleExport = useCallback(async (format: ExportFormat) => {
    if (!tierConfig.formats.includes(format)) {
      return;
    }

    try {
      setExportProgress({
        status: 'preparing',
        progress: 0,
        message: 'Preparing export...',
      });

      setExportProgress({
        status: 'processing',
        progress: 25,
        message: 'Processing data...',
      });

      setExportProgress({
        status: 'generating',
        progress: 75,
        message: 'Generating file...',
      });

      // Call the appropriate export function
      switch (format) {
        case 'csv':
          await exportToCsv(Array.isArray(data) ? data : [data]);
          break;
        case 'excel':
          await exportToExcel(Array.isArray(data) ? data : [data]);
          break;
        case 'pdf':
          await exportToPdf(Array.isArray(data) ? data : [data]);
          break;
        case 'json':
          await exportToJson(Array.isArray(data) ? data : [data]);
          break;
        default:
          // Fallback to external export handler
          await onExport(format, data);
      }

      setExportProgress({
        status: 'complete',
        progress: 100,
        message: 'Export completed successfully!',
      });

      // Add to export history
      setExportHistory(prev => [...prev, {
        format,
        timestamp: new Date(),
        status: 'success',
        filename: generateFilename(format),
      }]);

      // Clear progress after delay
      setTimeout(() => {
        setExportProgress(null);
      }, 2000);

    } catch (error) {
      setExportProgress({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Export failed',
      });

      setExportHistory(prev => [...prev, {
        format,
        timestamp: new Date(),
        status: 'error',
        filename: `failed_${generateFilename(format)}`,
      }]);

      // Clear error after delay
      setTimeout(() => {
        setExportProgress(null);
      }, 5000);
    }
  }, [data, tierConfig, onExport, exportToCsv, exportToExcel, exportToPdf, exportToJson, generateFilename]);

  const todaysExports = exportHistory.filter(
    export_ => export_.timestamp.toDateString() === new Date().toDateString()
  ).length;

  const remainingExports = Math.max(0, tierConfig.dailyLimit - todaysExports);

  return (
    <Card className={cn("export-manager", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Data Export
        </CardTitle>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">
            {userTier.charAt(0).toUpperCase() + userTier.slice(1)} Tier
          </Badge>
          <span>•</span>
          <span>{remainingExports} exports remaining today</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4" data-testid="export-manager">
        {/* Export Progress */}
        {exportProgress && (
          <div className="space-y-2" data-testid="export-progress">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{exportProgress.message}</span>
              <Badge variant={
                exportProgress.status === 'complete' ? 'default' :
                exportProgress.status === 'error' ? 'destructive' : 'secondary'
              }>
                {exportProgress.status}
              </Badge>
            </div>
            <Progress value={exportProgress.progress} className="h-2" />
          </div>
        )}

        {/* Export Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {exportFormats.map((formatConfig) => (
            <Button
              key={formatConfig.format}
              variant={formatConfig.available ? "outline" : "ghost"}
              className={cn(
                "h-auto p-4 flex flex-col items-center space-y-2",
                !formatConfig.available && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => formatConfig.available && handleExport(formatConfig.format)}
              disabled={
                !formatConfig.available || 
                remainingExports <= 0 || 
                exportProgress?.status === 'processing' ||
                exportProgress?.status === 'generating'
              }
              aria-label={`Export ${formatConfig.label}`}
            >
              <div className="flex items-center gap-2">
                {formatConfig.available ? formatConfig.icon : <Lock className="h-4 w-4" />}
                <span className="font-medium">{formatConfig.label}</span>
                {formatConfig.premium && (
                  <Badge variant="secondary" className="text-xs">
                    Premium
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {formatConfig.description}
              </p>
            </Button>
          ))}
        </div>

        {/* Export Limits Warning */}
        {remainingExports <= 3 && remainingExports > 0 && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              You have {remainingExports} exports remaining today. 
              {userTier !== 'unlimited' && ' Upgrade to Expand for higher limits.'}
            </AlertDescription>
          </Alert>
        )}

        {remainingExports === 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Daily export limit reached. Upgrade your plan or try again tomorrow.
            </AlertDescription>
          </Alert>
        )}

        {/* Recent Exports */}
        {exportHistory.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Recent Exports</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {exportHistory.slice(-5).reverse().map((export_, index) => (
                <div key={export_.timestamp ? String(export_.timestamp) : `export-${index}`} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {export_.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    <span>{export_.format.toUpperCase()}</span>
                    <span className="text-muted-foreground">
                      {export_.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <Badge variant={export_.status === 'success' ? 'default' : 'destructive'}>
                    {export_.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading state for external exports */}
        {exportProgress?.status === 'processing' && (
          <div className="text-center py-4" data-testid="export-loading">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Processing your export...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
