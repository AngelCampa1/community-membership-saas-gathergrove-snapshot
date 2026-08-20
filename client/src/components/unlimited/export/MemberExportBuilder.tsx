import React, { useState } from 'react';
import { logger } from '../../../lib/logger';

interface MemberExportBuilderProps {
  clubId: number;
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  onLoad?: () => void;
}

const MemberExportBuilder: React.FC<MemberExportBuilderProps> = ({ clubId, format, onLoad }) => {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>(format === 'xlsx' ? 'excel' : 'csv');

  React.useEffect(() => {
    onLoad?.();
  }, [onLoad]);

  const memberFields = [
    { id: 'fullName', label: 'Full Name', required: true },
    { id: 'email', label: 'Email', required: true },
    { id: 'phoneNumber', label: 'Phone Number', required: false },
    { id: 'joinedAt', label: 'Join Date', required: false },
    { id: 'status', label: 'Status', required: false },
    { id: 'lastActivity', label: 'Last Activity', required: false },
  ];

  const handleFieldToggle = (fieldId: string) => {
    const field = memberFields.find(f => f.id === fieldId);
    if (field?.required) return; // Can't toggle required fields

    setSelectedFields(prev => 
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleExport = () => {
    // Implementation for export would go here
    logger.info('analytics', 'Member export initiated', { clubId, selectedFields, format });
  };

  return (
    <div className="member-export-builder space-y-6">
      <h3 className="text-lg font-medium">Member Data Export</h3>
      
      {/* Field Selection */}
      <div>
        <h4 className="text-md font-medium mb-3">Select Fields to Export</h4>
        <div className="grid grid-cols-2 gap-3">
          {memberFields.map(field => (
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
        className="px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90"
      >
        Export Member Data
      </button>

      <p className="text-sm text-muted-foreground">
        * Required fields cannot be excluded from export
      </p>
    </div>
  );
};

export default MemberExportBuilder;