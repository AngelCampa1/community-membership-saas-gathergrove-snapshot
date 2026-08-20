import React, { useState } from 'react';
import { logger } from '../../../lib/logger';

interface EventExportBuilderProps {
  clubId: number;
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  onLoad?: () => void;
}

const EventExportBuilder: React.FC<EventExportBuilderProps> = ({ clubId, format, onLoad }) => {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>(format === 'xlsx' ? 'excel' : 'csv');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  React.useEffect(() => {
    onLoad?.();
  }, [onLoad]);

  const eventFields = [
    { id: 'name', label: 'Event Name', required: true },
    { id: 'eventDateTime', label: 'Event Date & Time', required: true },
    { id: 'location', label: 'Location', required: false },
    { id: 'capacity', label: 'Capacity', required: false },
    { id: 'attendeeCount', label: 'Attendee Count', required: false },
    { id: 'registrationCount', label: 'Registration Count', required: false },
    { id: 'status', label: 'Status', required: false },
  ];

  const handleFieldToggle = (fieldId: string) => {
    const field = eventFields.find(f => f.id === fieldId);
    if (field?.required) return;

    setSelectedFields(prev => 
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleExport = () => {
    logger.info('analytics', 'Event export initiated', { clubId, selectedFields, format, dateRange });
  };

  return (
    <div className="event-export-builder space-y-6">
      <h3 className="text-lg font-medium">Event Data Export</h3>
      
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
              className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Field Selection */}
      <div>
        <h4 className="text-md font-medium mb-3">Select Fields to Export</h4>
        <div className="grid grid-cols-2 gap-3">
          {eventFields.map(field => (
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
            <span>Excel</span>
          </label>
        </div>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        className="px-4 py-2 bg-success text-success-foreground rounded-full hover:bg-success/90"
      >
        Export Event Data
      </button>

      <p className="text-sm text-muted-foreground">
        * Required fields cannot be excluded from export
      </p>
    </div>
  );
};

export default EventExportBuilder;