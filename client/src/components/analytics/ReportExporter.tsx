'use client';

import React, { useState, useCallback, useMemo } from 'react';
import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { 
  AnalyticsDateRange, 
  EngagementMetric, 
  ROIMetric, 
  EventPerformanceData, 
  CohortData,
  ExportFormat,
  ChartTheme,
  LoadingState 
} from '../../types/analytics';
import premiumAnalyticsService from '../../services/premiumAnalyticsService';

interface ReportExporterProps {
  clubId: number;
  engagementData?: EngagementMetric[];
  roiData?: ROIMetric[];
  eventData?: EventPerformanceData[];
  cohortData?: CohortData[];
  dateRange: AnalyticsDateRange;
  theme: ChartTheme | string;
  loading: LoadingState;
  className?: string;
  userTier: 'basic' | 'pro' | 'unlimited';
  onExportStart?: (format: ExportFormat) => void;
  onExportComplete?: (format: ExportFormat, success: boolean) => void;
  customReportTitle?: string;
  includeCharts?: boolean;
  reportTemplate?: 'standard' | 'executive' | 'detailed';
}

interface ExportProgress {
  format: ExportFormat | null;
  progress: number;
  status: 'idle' | 'preparing' | 'generating' | 'complete' | 'error';
  message: string;
}

const ReportExporter: React.FC<ReportExporterProps> = ({
  clubId,
  engagementData = [],
  roiData = [],
  eventData = [],
  cohortData = [],
  dateRange,
  theme: _theme,
  loading,
  className = '',
  userTier,
  onExportStart,
  onExportComplete,
  customReportTitle = 'Analytics Report',
  includeCharts = true,
  reportTemplate = 'standard'
}) => {
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    format: null,
    progress: 0,
    status: 'idle',
    message: ''
  });
  const [selectedSections, setSelectedSections] = useState<string[]>([
    'summary', 'engagement', 'roi', 'events', 'cohorts'
  ]);
  const [currentReportTemplate, setReportTemplate] = useState<'standard' | 'executive' | 'detailed'>(reportTemplate);
  const [exportOptions, setExportOptions] = useState({
    includeDateRange: true,
    includeMetadata: true,
    includeCharts: includeCharts && userTier !== 'basic',
    compressImages: true,
    pageOrientation: 'portrait' as 'portrait' | 'landscape'
  });

  // Available export formats based on user tier
  const availableFormats = useMemo(() => {
    const formats: ExportFormat[] = ['csv'];
    
    if (userTier === 'pro' || userTier === 'unlimited') {
      formats.push('excel', 'pdf');
    }
    
    if (userTier === 'unlimited') {
      formats.push('json');
    }
    
    return formats;
  }, [userTier]);

  // Generate report title with date range
  const reportTitle = useMemo(() => {
    const startDate = new Date(dateRange.startDate).toLocaleDateString();
    const endDate = new Date(dateRange.endDate).toLocaleDateString();
    return `${customReportTitle} (${startDate} - ${endDate})`;
  }, [customReportTitle, dateRange]);

  // Update progress helper
  const updateProgress = useCallback((progress: number, message: string, status?: ExportProgress['status']) => {
    setExportProgress(prev => ({
      ...prev,
      progress,
      message,
      ...(status && { status })
    }));
  }, []);

  // Direct API export for unlimited tier users
  const exportViaAPI = useCallback(async (format: ExportFormat, dataType: 'engagement' | 'cohorts' | 'roi' | 'events' | 'segmentation') => {
    try {
      updateProgress(10, 'Requesting export from server...', 'preparing');
      
      const result = await premiumAnalyticsService.exportData(
        clubId, 
        dataType, 
        format, 
        {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString()
        }
      );
      
      updateProgress(50, 'Processing server response...', 'generating');
      
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      updateProgress(100, 'Export complete!', 'complete');
      onExportComplete?.(format, true);
    } catch (error) {
      updateProgress(0, `API export failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      onExportComplete?.(format, false);
    }
  }, [clubId, dateRange, onExportComplete, updateProgress]);

  // Export to CSV
  const exportToCSV = useCallback(async () => {
    try {
      updateProgress(10, 'Preparing CSV data...', 'preparing');
      
      let csvContent = `${reportTitle}\n\n`;
      
      if (selectedSections.includes('engagement') && engagementData.length > 0) {
        csvContent += 'Engagement Metrics\n';
        csvContent += 'Date,Active Members,Event Attendance,Engagement Rate,Total Members\n';
        engagementData.forEach(item => {
          csvContent += `${new Date(item.date).toLocaleDateString()},${item.activeMembers},${item.eventAttendance},${item.engagementRate},${item.totalMembers}\n`;
        });
        csvContent += '\n';
      }
      
      updateProgress(40, 'Processing ROI data...', 'generating');
      
      if (selectedSections.includes('roi') && roiData.length > 0) {
        csvContent += 'ROI Metrics\n';
        csvContent += 'Period,Revenue,Cost,ROI,Profit\n';
        roiData.forEach(item => {
          csvContent += `${item.period},${item.revenue},${item.costs},${item.roi},${item.profit}\n`;
        });
        csvContent += '\n';
      }
      
      updateProgress(70, 'Processing event data...', 'generating');
      
      if (selectedSections.includes('events') && eventData.length > 0) {
        csvContent += 'Event Performance\n';
        csvContent += 'Event Name,Date,Attendance,Revenue,Satisfaction\n';
        eventData.forEach(item => {
          csvContent += `${item.eventName},${new Date(item.date).toLocaleDateString()},${item.attendance},${item.revenue},${item.satisfaction}\n`;
        });
        csvContent += '\n';
      }
      
      updateProgress(90, 'Finalizing CSV...', 'generating');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${customReportTitle.replace(/\s+/g, '_')}_${new Date().getTime()}.csv`);
      
      updateProgress(100, 'CSV export complete!', 'complete');
      onExportComplete?.('csv', true);
    } catch (error) {
      updateProgress(0, `CSV export failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      onExportComplete?.('csv', false);
    }
  }, [engagementData, roiData, eventData, selectedSections, reportTitle, customReportTitle, onExportComplete, updateProgress]);

  // Export to Excel
  const exportToExcel = useCallback(async () => {
    try {
      updateProgress(10, 'Creating Excel workbook...', 'preparing');

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'GatherGrove Analytics';
      workbook.created = new Date();

      // Summary sheet
      if (selectedSections.includes('summary')) {
        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.columns = [
          { header: 'Property', key: 'property', width: 30 },
          { header: 'Value', key: 'value', width: 50 }
        ];

        summarySheet.addRows([
          { property: 'Report Title', value: reportTitle },
          { property: 'Generated', value: new Date().toLocaleString() },
          { property: 'Date Range', value: `${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(dateRange.endDate).toLocaleDateString()}` },
          { property: 'User Tier', value: userTier.charAt(0).toUpperCase() + userTier.slice(1) },
          { property: '', value: '' },
          { property: 'Summary Statistics', value: '' },
          { property: 'Total Engagement Records', value: engagementData.length },
          { property: 'Total ROI Records', value: roiData.length },
          { property: 'Total Events', value: eventData.length },
          { property: 'Total Cohorts', value: cohortData.length }
        ]);

        // Style header row
        summarySheet.getRow(1).font = { bold: true };
        summarySheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF3B82F6' }
        };
        summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      }

      updateProgress(30, 'Processing engagement data...', 'generating');

      // Engagement sheet
      if (selectedSections.includes('engagement') && engagementData.length > 0) {
        const engagementSheet = workbook.addWorksheet('Engagement');
        engagementSheet.columns = [
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Active Members', key: 'activeMembers', width: 18 },
          { header: 'Event Attendance', key: 'eventAttendance', width: 18 },
          { header: 'Engagement Rate (%)', key: 'engagementRate', width: 20 },
          { header: 'Total Members', key: 'totalMembers', width: 18 }
        ];

        engagementData.forEach(item => {
          engagementSheet.addRow({
            date: new Date(item.date).toLocaleDateString(),
            activeMembers: item.activeMembers,
            eventAttendance: item.eventAttendance,
            engagementRate: item.engagementRate,
            totalMembers: item.totalMembers
          });
        });

        // Style header row
        engagementSheet.getRow(1).font = { bold: true };
        engagementSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF3B82F6' }
        };
        engagementSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      }

      updateProgress(50, 'Processing ROI data...', 'generating');

      // ROI sheet
      if (selectedSections.includes('roi') && roiData.length > 0) {
        const roiSheet = workbook.addWorksheet('ROI');
        roiSheet.columns = [
          { header: 'Period', key: 'period', width: 15 },
          { header: 'Revenue', key: 'revenue', width: 15 },
          { header: 'Costs', key: 'costs', width: 15 },
          { header: 'Profit', key: 'profit', width: 15 },
          { header: 'ROI (%)', key: 'roi', width: 12 },
          { header: 'Trend', key: 'trend', width: 15 }
        ];

        roiData.forEach(item => {
          roiSheet.addRow({
            period: item.period,
            revenue: item.revenue,
            costs: item.costs,
            profit: item.profit,
            roi: item.roi,
            trend: item.trend
          });
        });

        // Style header row
        roiSheet.getRow(1).font = { bold: true };
        roiSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF3B82F6' }
        };
        roiSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      }

      updateProgress(70, 'Processing event data...', 'generating');

      // Events sheet
      if (selectedSections.includes('events') && eventData.length > 0) {
        const eventsSheet = workbook.addWorksheet('Events');
        eventsSheet.columns = [
          { header: 'Event Name', key: 'eventName', width: 30 },
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Attendance', key: 'attendance', width: 15 },
          { header: 'Revenue', key: 'revenue', width: 15 },
          { header: 'Satisfaction Score', key: 'satisfaction', width: 20 }
        ];

        eventData.forEach(item => {
          eventsSheet.addRow({
            eventName: item.eventName,
            date: new Date(item.date).toLocaleDateString(),
            attendance: item.attendance,
            revenue: item.revenue,
            satisfaction: item.satisfaction
          });
        });

        // Style header row
        eventsSheet.getRow(1).font = { bold: true };
        eventsSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF3B82F6' }
        };
        eventsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      }

      updateProgress(85, 'Processing cohort data...', 'generating');

      // Cohorts sheet
      if (selectedSections.includes('cohorts') && cohortData.length > 0) {
        const cohortsSheet = workbook.addWorksheet('Cohorts');

        // Build columns dynamically based on max retention periods
        const maxPeriods = Math.max(...cohortData.map(c => c.retentionRates.length));
        const columns: Array<{ header: string; key: string; width: number }> = [
          { header: 'Cohort', key: 'cohort', width: 15 },
          { header: 'Initial Size', key: 'initialSize', width: 15 }
        ];

        for (let i = 0; i < maxPeriods; i++) {
          columns.push({ header: `Period ${i + 1}`, key: `period${i + 1}`, width: 12 });
          columns.push({ header: `Period ${i + 1} %`, key: `period${i + 1}Pct`, width: 12 });
        }

        cohortsSheet.columns = columns;

        cohortData.forEach(cohort => {
          const row: Record<string, string | number> = {
            cohort: cohort.cohort,
            initialSize: cohort.initialSize
          };

          cohort.retentionRates.forEach((rate, index) => {
            row[`period${index + 1}`] = rate;
            row[`period${index + 1}Pct`] = cohort.initialSize > 0 ? Math.round((rate / cohort.initialSize) * 100) : 0;
          });

          cohortsSheet.addRow(row);
        });

        // Style header row
        cohortsSheet.getRow(1).font = { bold: true };
        cohortsSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF3B82F6' }
        };
        cohortsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      }

      updateProgress(95, 'Saving Excel file...', 'generating');

      // Write to buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      saveAs(blob, `${customReportTitle.replace(/\s+/g, '_')}_${new Date().getTime()}.xlsx`);

      updateProgress(100, 'Excel export complete!', 'complete');
      onExportComplete?.('excel', true);
    } catch (error) {
      updateProgress(0, `Excel export failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      onExportComplete?.('excel', false);
    }
  }, [engagementData, roiData, eventData, cohortData, selectedSections, reportTitle, dateRange, userTier, customReportTitle, onExportComplete, updateProgress]);

  // Export to PDF
  const exportToPDF = useCallback(async () => {
    try {
      updateProgress(10, 'Initializing PDF document...', 'preparing');
      
      const pdf = new jsPDF({
        orientation: exportOptions.pageOrientation,
        unit: 'mm',
        format: 'a4'
      });
      
      let yPosition = 20;
      const margin = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const contentWidth = pageWidth - (margin * 2);
      
      // Title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(reportTitle, margin, yPosition);
      yPosition += 15;
      
      // Metadata
      if (exportOptions.includeMetadata) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
        yPosition += 6;
        pdf.text(`User Tier: ${userTier.charAt(0).toUpperCase() + userTier.slice(1)}`, margin, yPosition);
        yPosition += 6;
        pdf.text(`Template: ${currentReportTemplate.charAt(0).toUpperCase() + currentReportTemplate.slice(1)}`, margin, yPosition);
        yPosition += 15;
      }
      
      updateProgress(30, 'Adding summary section...', 'generating');
      
      // Summary Section
      if (selectedSections.includes('summary')) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Executive Summary', margin, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        const summaryData = [
          `Total Engagement Records: ${engagementData.length}`,
          `Total ROI Records: ${roiData.length}`,
          `Total Events Analyzed: ${eventData.length}`,
          `Total Cohorts: ${cohortData.length}`
        ];
        
        summaryData.forEach(line => {
          pdf.text(line, margin, yPosition);
          yPosition += 6;
        });
        
        yPosition += 10;
      }
      
      updateProgress(50, 'Adding engagement metrics...', 'generating');
      
      // Engagement Section
      if (selectedSections.includes('engagement') && engagementData.length > 0) {
        if (yPosition > 240) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Engagement Metrics', margin, yPosition);
        yPosition += 10;
        
        // Create table headers
        const headers = ['Date', 'Active Members', 'Event Attendance', 'Engagement Rate', 'Total Members'];
        const colWidth = contentWidth / headers.length;
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        headers.forEach((header, index) => {
          pdf.text(header, margin + (index * colWidth), yPosition);
        });
        yPosition += 8;
        
        // Add data rows (limit to first 20 for space)
        pdf.setFont('helvetica', 'normal');
        const limitedEngagementData = currentReportTemplate === 'executive' 
          ? engagementData.slice(0, 10) 
          : engagementData.slice(0, 20);
          
        limitedEngagementData.forEach(item => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          
          const rowData = [
            new Date(item.date).toLocaleDateString(),
            item.activeMembers.toLocaleString(),
            item.eventAttendance.toLocaleString(),
            `${item.engagementRate}%`,
            item.totalMembers.toLocaleString()
          ];
          
          rowData.forEach((data, index) => {
            pdf.text(data, margin + (index * colWidth), yPosition);
          });
          yPosition += 6;
        });
        
        yPosition += 10;
      }
      
      updateProgress(70, 'Adding ROI analysis...', 'generating');
      
      // ROI Section
      if (selectedSections.includes('roi') && roiData.length > 0) {
        if (yPosition > 220) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('ROI Analysis', margin, yPosition);
        yPosition += 10;
        
        // Calculate key metrics
        const totalRevenue = roiData.reduce((sum, item) => sum + item.revenue, 0);
        const totalCost = roiData.reduce((sum, item) => sum + item.costs, 0);
        const avgROI = roiData.reduce((sum, item) => sum + item.roi, 0) / roiData.length;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Total Revenue: $${totalRevenue.toLocaleString()}`, margin, yPosition);
        yPosition += 6;
        pdf.text(`Total Cost: $${totalCost.toLocaleString()}`, margin, yPosition);
        yPosition += 6;
        pdf.text(`Average ROI: ${avgROI.toFixed(2)}%`, margin, yPosition);
        yPosition += 15;
      }
      
      updateProgress(85, 'Adding event performance...', 'generating');
      
      // Events Section (summary only for PDF)
      if (selectedSections.includes('events') && eventData.length > 0) {
        if (yPosition > 220) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Event Performance Summary', margin, yPosition);
        yPosition += 10;
        
        const totalAttendance = eventData.reduce((sum, event) => sum + event.attendance, 0);
        const totalRevenue = eventData.reduce((sum, event) => sum + event.revenue, 0);
        const avgSatisfaction = eventData.reduce((sum, event) => sum + event.satisfaction, 0) / eventData.length;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Total Events: ${eventData.length}`, margin, yPosition);
        yPosition += 6;
        pdf.text(`Total Attendance: ${totalAttendance.toLocaleString()}`, margin, yPosition);
        yPosition += 6;
        pdf.text(`Total Revenue: $${totalRevenue.toLocaleString()}`, margin, yPosition);
        yPosition += 6;
        pdf.text(`Average Satisfaction: ${avgSatisfaction.toFixed(1)}/10`, margin, yPosition);
        yPosition += 15;
      }
      
      updateProgress(95, 'Finalizing PDF...', 'generating');
      
      // Add footer
      const pageCount = pdf.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pdf.internal.pageSize.getHeight() - 10);
      }
      
      pdf.save(`${customReportTitle.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
      
      updateProgress(100, 'PDF export complete!', 'complete');
      onExportComplete?.('pdf', true);
    } catch (error) {
      updateProgress(0, `PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      onExportComplete?.('pdf', false);
    }
  }, [engagementData, roiData, eventData, cohortData, selectedSections, reportTitle, userTier, customReportTitle, exportOptions, currentReportTemplate, onExportComplete, updateProgress]);

  // Export to JSON
  const exportToJSON = useCallback(async () => {
    try {
      updateProgress(10, 'Preparing JSON data...', 'preparing');
      
      const reportData = {
        metadata: {
          title: reportTitle,
          generated: new Date().toISOString(),
          dateRange,
          userTier,
          template: currentReportTemplate,
          sections: selectedSections
        },
        data: {
          ...(selectedSections.includes('engagement') && { engagement: engagementData }),
          ...(selectedSections.includes('roi') && { roi: roiData }),
          ...(selectedSections.includes('events') && { events: eventData }),
          ...(selectedSections.includes('cohorts') && { cohorts: cohortData })
        },
        summary: {
          totalEngagementRecords: engagementData.length,
          totalROIRecords: roiData.length,
          totalEvents: eventData.length,
          totalCohorts: cohortData.length
        }
      };
      
      updateProgress(50, 'Generating JSON...', 'generating');
      
      const jsonString = JSON.stringify(reportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      
      updateProgress(90, 'Saving JSON file...', 'generating');
      
      saveAs(blob, `${customReportTitle.replace(/\s+/g, '_')}_${new Date().getTime()}.json`);
      
      updateProgress(100, 'JSON export complete!', 'complete');
      onExportComplete?.('json', true);
    } catch (error) {
      updateProgress(0, `JSON export failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      onExportComplete?.('json', false);
    }
  }, [engagementData, roiData, eventData, cohortData, selectedSections, reportTitle, dateRange, userTier, currentReportTemplate, customReportTitle, onExportComplete, updateProgress]);

  // Handle export
  const handleExport = useCallback(async (format: ExportFormat) => {
    if (loading.isLoading || exportProgress.status === 'generating') return;
    
    setExportProgress({
      format,
      progress: 0,
      status: 'preparing',
      message: 'Initializing export...'
    });
    
    onExportStart?.(format);
    
    try {
      // Use API export for unlimited tier users with comprehensive data
      if (userTier === 'unlimited') {
        // Determine the primary data type based on selected sections
        let dataType: 'engagement' | 'cohorts' | 'roi' | 'events' | 'segmentation' = 'engagement';
        
        if (selectedSections.includes('cohorts')) {
          dataType = 'cohorts';
        } else if (selectedSections.includes('roi')) {
          dataType = 'roi';
        } else if (selectedSections.includes('events')) {
          dataType = 'events';
        }
        
        await exportViaAPI(format, dataType);
      } else {
        // Use client-side export for basic/pro tiers
        switch (format) {
          case 'csv':
            await exportToCSV();
            break;
          case 'excel':
            await exportToExcel();
            break;
          case 'pdf':
            await exportToPDF();
            break;
          case 'json':
            await exportToJSON();
            break;
        }
      }
    } catch (error) {
      setExportProgress(prev => ({
        ...prev,
        status: 'error',
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
      onExportComplete?.(format, false);
    }
  }, [loading.isLoading, exportProgress.status, userTier, selectedSections, onExportStart, onExportComplete, exportViaAPI, exportToCSV, exportToExcel, exportToPDF, exportToJSON]);

  const handleSectionToggle = useCallback((section: string) => {
    setSelectedSections(prev => 
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  }, []);

  // Reset export progress after completion
  React.useEffect(() => {
    if (exportProgress.status === 'complete' || exportProgress.status === 'error') {
      const timer = setTimeout(() => {
        setExportProgress({
          format: null,
          progress: 0,
          status: 'idle',
          message: ''
        });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [exportProgress.status]);

  if (loading.isLoading) {
    return (
      <div className={`flex items-center justify-center h-32 ${className}`} data-testid="loading-spinner">
        <div className="animate-pulse space-y-2 w-full">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="flex space-x-2">
            <div className="h-8 bg-muted rounded w-16"></div>
            <div className="h-8 bg-muted rounded w-16"></div>
            <div className="h-8 bg-muted rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`report-exporter ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Export Reports
            {userTier === 'basic' && (
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                Basic: CSV only
              </span>
            )}
          </h3>
          
          <div className="text-sm text-muted-foreground">
            {reportTitle}
          </div>
        </div>

        {/* Export Options */}
        {(userTier === 'pro' || userTier === 'unlimited') && (
          <div className="space-y-4">
            <h4 className="font-medium">Export Options</h4>
            
            {/* Section Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Include Sections:</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'summary', label: 'Summary' },
                  { key: 'engagement', label: 'Engagement', count: engagementData.length },
                  { key: 'roi', label: 'ROI', count: roiData.length },
                  { key: 'events', label: 'Events', count: eventData.length },
                  { key: 'cohorts', label: 'Cohorts', count: cohortData.length }
                ].map(section => (
                  <button
                    key={section.key}
                    onClick={() => handleSectionToggle(section.key)}
                    disabled={section.count === 0 && section.key !== 'summary'}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      selectedSections.includes(section.key)
                        ? 'bg-primary text-primary-foreground'
                        : section.count === 0 && section.key !== 'summary'
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                    aria-pressed={selectedSections.includes(section.key)}
                  >
                    {section.label} {section.count !== undefined && `(${section.count})`}
                  </button>
                ))}
              </div>
            </div>
            
            {/* PDF/Excel Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeDateRange}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeDateRange: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Include Date Range</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeMetadata}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Include Metadata</span>
                </label>
                
                {(userTier === 'pro' || userTier === 'unlimited') && (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeCharts}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">Include Charts</span>
                  </label>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block">
                  <span className="text-sm font-medium">PDF Orientation:</span>
                  <select
                    value={exportOptions.pageOrientation}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, pageOrientation: e.target.value as 'portrait' | 'landscape' }))}
                    className="w-full mt-1 px-3 py-1 text-sm border rounded"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </label>
                
                <label className="block">
                  <span className="text-sm font-medium">Report Template:</span>
                  <select
                    value={currentReportTemplate}
                    onChange={(e) => setReportTemplate(e.target.value as 'standard' | 'executive' | 'detailed')}
                    className="w-full mt-1 px-3 py-1 text-sm border rounded"
                    disabled={!(userTier === 'pro' || userTier === 'unlimited')}
                  >
                    <option value="standard">Standard</option>
                    <option value="executive">Executive Summary</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Export Buttons */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {availableFormats.map(format => {
              const formatLabels = {
                csv: 'Export CSV',
                excel: 'Export Excel',
                pdf: 'Export PDF',
                json: 'Export JSON'
              };
              
              const isExporting = exportProgress.status === 'generating' && exportProgress.format === format;
              
              return (
                <button
                  key={format}
                  onClick={() => handleExport(format)}
                  disabled={loading.isLoading || exportProgress.status === 'generating'}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                    isExporting
                      ? 'bg-primary text-primary-foreground cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed'
                  }`}
                >
                  {isExporting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Exporting...</span>
                    </div>
                  ) : (
                    formatLabels[format]
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Progress Indicator */}
          {exportProgress.status !== 'idle' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{exportProgress.message}</span>
                <span>{exportProgress.progress}%</span>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    exportProgress.status === 'error'
                      ? 'bg-destructive'
                      : exportProgress.status === 'complete'
                      ? 'bg-success'
                      : 'bg-primary'
                  }`}
                  style={{ width: `${exportProgress.progress}%` }}
                ></div>
              </div>
              
              {exportProgress.status === 'complete' && (
                <p className="text-sm text-success font-medium">
                  Export completed successfully!
                </p>
              )}

              {exportProgress.status === 'error' && (
                <p className="text-sm text-destructive">
                  {exportProgress.message}
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Data Preview */}
        {selectedSections.length > 0 && (
          <div className="mt-6 space-y-4">
            <h4 className="font-medium">Export Preview</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {selectedSections.includes('engagement') && (
                <div className="p-3 bg-primary/10 rounded">
                  <p className="font-medium text-primary">Engagement</p>
                  <p className="text-primary/80">{engagementData.length} records</p>
                </div>
              )}

              {selectedSections.includes('roi') && (
                <div className="p-3 bg-success/10 rounded">
                  <p className="font-medium text-success">ROI</p>
                  <p className="text-success/80">{roiData.length} records</p>
                </div>
              )}

              {selectedSections.includes('events') && (
                <div className="p-3 bg-secondary/10 rounded">
                  <p className="font-medium text-secondary">Events</p>
                  <p className="text-secondary/80">{eventData.length} records</p>
                </div>
              )}

              {selectedSections.includes('cohorts') && (
                <div className="p-3 bg-warning/10 rounded">
                  <p className="font-medium text-warning">Cohorts</p>
                  <p className="text-warning/80">{cohortData.length} cohorts</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportExporter;