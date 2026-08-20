import React, { useState } from 'react';
import { logger } from '../../../lib/logger';

interface FinancialExportBuilderProps {
  clubId: number;
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  onLoad?: () => void;
}

const FinancialExportBuilder: React.FC<FinancialExportBuilderProps> = ({ clubId, format, onLoad }) => {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>(format === 'xlsx' ? 'excel' : 'csv');
  const [reportType, setReportType] = useState<'summary' | 'detailed'>('summary');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  React.useEffect(() => {
    onLoad?.();
  }, [onLoad]);

  const financialFields = [
    { id: 'date', label: 'Date', required: true },
    { id: 'amount', label: 'Amount', required: true },
    { id: 'type', label: 'Transaction Type', required: true },
    { id: 'description', label: 'Description', required: false },
    { id: 'category', label: 'Category', required: false },
    { id: 'memberName', label: 'Member Name', required: false },
    { id: 'paymentMethod', label: 'Payment Method', required: false },
  ];

  const handleFieldToggle = (fieldId: string) => {
    const field = financialFields.find(f => f.id === fieldId);
    if (field?.required) return;

    setSelectedFields(prev => 
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleExport = () => {
    logger.info('analytics', 'Financial export initiated', { clubId, selectedFields, format, reportType, dateRange });
  };

  return (
    <div className="financial-export-builder space-y-6">
      <h3 className="text-lg font-medium">Financial Data Export</h3>
      
      {/* Report Type */}
      <div>
        <h4 className="text-md font-medium mb-3">Report Type</h4>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="summary"
              checked={reportType === 'summary'}
              onChange={(e) => setReportType(e.target.value as 'summary')}
            />
            <span>Summary Report</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="detailed"
              checked={reportType === 'detailed'}
              onChange={(e) => setReportType(e.target.value as 'detailed')}
            />
            <span>Detailed Report</span>
          </label>
        </div>
      </div>

      {/* Date Range */}
      <div>
        <h4 className="text-md font-medium mb-3">Date Range</h4>
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium mb-1">From</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Field Selection */}
      <div>
        <h4 className="text-md font-medium mb-3">Select Fields to Export</h4>
        <div className="grid grid-cols-2 gap-3">
          {financialFields.map(field => (
            <label key={field.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={field.required || selectedFields.includes(field.id)}
                onChange={() => handleFieldToggle(field.id)}
                disabled={field.required}
                className="rounded"
              />
              <span className={field.required ? 'font-medium' : ''}>
                {field.label}
                {field.required && ' *'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Export Format */}
      <div>
        <h4 className="text-md font-medium mb-3">Export Format</h4>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="csv"
              checked={exportFormat === 'csv'}
              onChange={(e) => setExportFormat(e.target.value as 'csv')}
            />
            <span>CSV</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="excel"
              checked={exportFormat === 'excel'}
              onChange={(e) => setExportFormat(e.target.value as 'excel')}
            />
            <span>Excel (Recommended)</span>
          </label>
        </div>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/90"
      >
        Export Financial Data
      </button>

      <div className="bg-warning/10 border border-warning/20 rounded p-3">
        <p className="text-sm text-warning-foreground">
          <strong>Note:</strong> Financial exports require additional authorization and may take longer to process.
        </p>
      </div>
    </div>
  );
};

export default FinancialExportBuilder;