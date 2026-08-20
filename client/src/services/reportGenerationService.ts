'use client';

import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { logger } from '@/lib/logger';

export interface ReportData {
  title: string;
  subtitle?: string;
  data: any[];
  metadata?: {
    generatedAt: string;
    clubName: string;
    dateRange: {
      startDate: string;
      endDate: string;
    };
  };
}

export interface ExportOptions {
  filename?: string;
  includeCharts?: boolean;
  customHeaders?: string[];
  brandingConfig?: {
    logo?: string;
    colors?: {
      primary: string;
      secondary: string;
    };
  };
}

/**
 * Service for generating and exporting reports in multiple formats
 */
class ReportGenerationService {
  /**
   * Export data as CSV file
   */
  async exportAsCSV(data: ReportData, options: ExportOptions = {}): Promise<void> {
    try {
      const { filename = 'analytics-report' } = options;
      
      if (!data.data || data.data.length === 0) {
        throw new Error('No data available for export');
      }

      // Convert data to CSV format
      const headers = options.customHeaders || Object.keys(data.data[0]);
      const csvContent = [
        headers.join(','),
        ...data.data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape commas and quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
          }).join(',')
        )
      ].join('\n');

      // Add BOM for proper UTF-8 encoding
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${filename}.csv`);

    } catch (error) {
      logger.error('Error exporting CSV', error);
      throw new Error('Failed to export CSV file');
    }
  }

  /**
   * Export data as Excel file
   */
  async exportAsExcel(data: ReportData, options: ExportOptions = {}): Promise<void> {
    try {
      const { filename = 'analytics-report' } = options;

      if (!data.data || data.data.length === 0) {
        throw new Error('No data available for export');
      }

      // Create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'GatherGrove Analytics';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Create main data worksheet
      const worksheet = workbook.addWorksheet('Analytics Data');

      // Add headers and data
      if (data.data.length > 0) {
        // Get headers from first data row or custom headers
        const headers = options.customHeaders || Object.keys(data.data[0]);

        // Set up columns with headers
        worksheet.columns = headers.map(header => ({
          header,
          key: header,
          width: 15
        }));

        // Add data rows
        data.data.forEach(row => worksheet.addRow(row));

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF3B82F6' } // Primary blue color
        };
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      }

      // Add metadata sheet if available
      if (data.metadata) {
        const metadataSheet = workbook.addWorksheet('Metadata');

        // Convert metadata object to rows
        metadataSheet.columns = [
          { header: 'Property', key: 'property', width: 25 },
          { header: 'Value', key: 'value', width: 40 }
        ];

        // Add metadata rows
        Object.entries(data.metadata).forEach(([key, value]) => {
          metadataSheet.addRow({
            property: key,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value)
          });
        });

        // Style the header row
        metadataSheet.getRow(1).font = { bold: true };
        metadataSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      }

      // Generate Excel file buffer
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${filename}.xlsx`);

    } catch (error) {
      logger.error('Error exporting Excel', error);
      throw new Error('Failed to export Excel file');
    }
  }

  /**
   * Export data as PDF file
   */
  async exportAsPDF(data: ReportData, options: ExportOptions = {}): Promise<void> {
    try {
      const { filename = 'analytics-report', brandingConfig } = options;
      
      if (!data.data || data.data.length === 0) {
        throw new Error('No data available for export');
      }

      const pdf = new jsPDF();
      let yPosition = 20;

      // Add branding if available
      if (brandingConfig?.logo) {
        try {
          pdf.addImage(brandingConfig.logo, 'PNG', 20, yPosition, 50, 20);
          yPosition += 30;
        } catch (logoError) {
          logger.error('Could not add logo to PDF', logoError);
        }
      }

      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(brandingConfig?.colors?.primary || '#000000');
      pdf.text(data.title, 20, yPosition);
      yPosition += 15;

      // Add subtitle if available
      if (data.subtitle) {
        pdf.setFontSize(12);
        pdf.setTextColor('#666666');
        pdf.text(data.subtitle, 20, yPosition);
        yPosition += 10;
      }

      // Add metadata
      if (data.metadata) {
        pdf.setFontSize(10);
        pdf.setTextColor('#888888');
        pdf.text(`Generated: ${data.metadata.generatedAt}`, 20, yPosition);
        yPosition += 5;
        if (data.metadata.clubName) {
          pdf.text(`Club: ${data.metadata.clubName}`, 20, yPosition);
          yPosition += 5;
        }
        if (data.metadata.dateRange) {
          pdf.text(`Period: ${data.metadata.dateRange.startDate} to ${data.metadata.dateRange.endDate}`, 20, yPosition);
          yPosition += 15;
        }
      }

      // Add table data
      if (data.data.length > 0) {
        const headers = Object.keys(data.data[0]);
        const tableData = data.data.map(row => headers.map(header => String(row[header] || '')));

        // Simple table implementation
        pdf.setFontSize(8);
        pdf.setTextColor('#000000');
        
        // Table headers
        const xPosition = 20;
        const columnWidth = (pdf.internal.pageSize.width - 40) / headers.length;
        
        pdf.setFont('helvetica', 'bold');
        headers.forEach((header, index) => {
          pdf.text(header, xPosition + (index * columnWidth), yPosition);
        });
        yPosition += 10;

        // Table rows
        pdf.setFont('helvetica', 'normal');
        tableData.forEach(row => {
          if (yPosition > pdf.internal.pageSize.height - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          
          row.forEach((cell, index) => {
            const truncatedCell = cell.length > 20 ? cell.substring(0, 17) + '...' : cell;
            pdf.text(truncatedCell, xPosition + (index * columnWidth), yPosition);
          });
          yPosition += 8;
        });
      }

      // Save PDF
      pdf.save(`${filename}.pdf`);

    } catch (error) {
      logger.error('Error exporting PDF', error);
      throw new Error('Failed to export PDF file');
    }
  }

  /**
   * Export data as JSON file
   */
  async exportAsJSON(data: ReportData, options: ExportOptions = {}): Promise<void> {
    try {
      const { filename = 'analytics-report' } = options;
      
      const jsonData = {
        ...data,
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      saveAs(blob, `${filename}.json`);

    } catch (error) {
      logger.error('Error exporting JSON', error);
      throw new Error('Failed to export JSON file');
    }
  }

  /**
   * Validate export data before processing
   */
  private validateExportData(data: ReportData): void {
    if (!data) {
      throw new Error('No data provided for export');
    }
    
    if (!data.title) {
      throw new Error('Report title is required');
    }
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Report data must be an array');
    }
    
    if (data.data.length === 0) {
      throw new Error('No data available for export');
    }
  }

  /**
   * Get supported export formats
   */
  getSupportedFormats(): string[] {
    return ['csv', 'excel', 'pdf', 'json'];
  }

  /**
   * Export data in the specified format
   */
  async exportData(
    data: ReportData, 
    format: 'csv' | 'excel' | 'pdf' | 'json',
    options: ExportOptions = {}
  ): Promise<void> {
    this.validateExportData(data);

    switch (format) {
      case 'csv':
        return this.exportAsCSV(data, options);
      case 'excel':
        return this.exportAsExcel(data, options);
      case 'pdf':
        return this.exportAsPDF(data, options);
      case 'json':
        return this.exportAsJSON(data, options);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}

// Export singleton instance
const reportGenerationService = new ReportGenerationService();
export default reportGenerationService;