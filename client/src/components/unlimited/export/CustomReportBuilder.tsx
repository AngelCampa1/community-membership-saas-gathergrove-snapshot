import React, { useState } from 'react';
import { logger } from '@/lib/logger';

interface CustomReportBuilderProps {
  clubId: number;
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  onLoad?: () => void;
}

const CustomReportBuilder: React.FC<CustomReportBuilderProps> = ({ clubId, format, onLoad }) => {
  const [reportName, setReportName] = useState('');
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<{[table: string]: string[]}>({});
  const [filters, setFilters] = useState<{field: string, operator: string, value: string}[]>([]);

  React.useEffect(() => {
    onLoad?.();
  }, [onLoad]);

  const availableTables = [
    { id: 'members', label: 'Members', fields: ['fullName', 'email', 'joinedAt', 'status'] },
    { id: 'events', label: 'Events', fields: ['name', 'eventDateTime', 'location', 'capacity'] },
    { id: 'attendance', label: 'Attendance', fields: ['eventId', 'memberId', 'status', 'checkedInAt'] },
    { id: 'payments', label: 'Payments', fields: ['amount', 'date', 'type', 'memberId'] },
  ];

  const handleTableToggle = (tableId: string) => {
    setSelectedTables(prev => {
      const newSelection = prev.includes(tableId)
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId];
      
      // Clear field selections for removed tables
      if (!newSelection.includes(tableId)) {
        setSelectedFields(prev => {
          const newFields = { ...prev };
          delete newFields[tableId];
          return newFields;
        });
      }
      
      return newSelection;
    });
  };

  const handleFieldToggle = (tableId: string, fieldId: string) => {
    setSelectedFields(prev => ({
      ...prev,
      [tableId]: prev[tableId]?.includes(fieldId)
        ? prev[tableId].filter(f => f !== fieldId)
        : [...(prev[tableId] || []), fieldId]
    }));
  };

  const addFilter = () => {
    setFilters(prev => [...prev, { field: '', operator: 'equals', value: '' }]);
  };

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, key: string, value: string) => {
    setFilters(prev => prev.map((filter, i) => 
      i === index ? { ...filter, [key]: value } : filter
    ));
  };

  const handleBuildReport = () => {
    logger.info('analytics', 'Building custom report', {
      clubId,
      format,
      reportName,
      selectedTables,
      selectedFields,
      filters
    });
  };

  return (
    <div className="custom-report-builder space-y-6">
      <h3 className="text-lg font-medium">Custom Report Builder</h3>
      
      {/* Report Name */}
      <div>
        <label className="block text-sm font-medium mb-2">Report Name</label>
        <input
          type="text"
          value={reportName}
          onChange={(e) => setReportName(e.target.value)}
          placeholder="Enter report name..."
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Table Selection */}
      <div>
        <h4 className="text-md font-medium mb-3">Select Data Sources</h4>
        <div className="grid grid-cols-2 gap-3">
          {availableTables.map(table => (
            <label key={table.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedTables.includes(table.id)}
                onChange={() => handleTableToggle(table.id)}
                className="rounded"
              />
              <span>{table.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Field Selection */}
      {selectedTables.length > 0 && (
        <div>
          <h4 className="text-md font-medium mb-3">Select Fields</h4>
          {selectedTables.map(tableId => {
            const table = availableTables.find(t => t.id === tableId);
            return (
              <div key={tableId} className="mb-4 p-4 border rounded">
                <h5 className="font-medium mb-2">{table?.label}</h5>
                <div className="grid grid-cols-2 gap-2">
                  {table?.fields.map(field => (
                    <label key={field} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedFields[tableId]?.includes(field) || false}
                        onChange={() => handleFieldToggle(tableId, field)}
                        className="rounded"
                      />
                      <span className="text-sm">{field}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-md font-medium">Filters</h4>
          <button
            onClick={addFilter}
            className="px-3 py-1 text-sm bg-muted text-foreground rounded hover:bg-muted/80"
          >
            Add Filter
          </button>
        </div>
        
        {filters.map((filter, index) => (
          <div key={`filter-${index}-${filter.field}`} className="flex space-x-2 mb-2">
            <select
              value={filter.field}
              onChange={(e) => updateFilter(index, 'field', e.target.value)}
              className="px-2 py-1 border rounded flex-1"
            >
              <option value="">Select field...</option>
              {selectedTables.flatMap(tableId => {
                const table = availableTables.find(t => t.id === tableId);
                return table?.fields.map(field => (
                  <option key={`${tableId}.${field}`} value={`${tableId}.${field}`}>
                    {table.label}.{field}
                  </option>
                )) || [];
              })}
            </select>
            
            <select
              value={filter.operator}
              onChange={(e) => updateFilter(index, 'operator', e.target.value)}
              className="px-2 py-1 border rounded"
            >
              <option value="equals">Equals</option>
              <option value="contains">Contains</option>
              <option value="greater">Greater than</option>
              <option value="less">Less than</option>
            </select>
            
            <input
              type="text"
              value={filter.value}
              onChange={(e) => updateFilter(index, 'value', e.target.value)}
              placeholder="Value..."
              className="px-2 py-1 border rounded flex-1"
            />
            
            <button
              onClick={() => removeFilter(index)}
              className="px-2 py-1 text-destructive hover:bg-destructive/10 rounded"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Build Report Button */}
      <button
        onClick={handleBuildReport}
        disabled={!reportName || selectedTables.length === 0}
        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Build Custom Report
      </button>

      <div className="bg-primary/10 border border-primary/20 rounded p-3">
        <p className="text-sm text-primary-foreground">
          <strong>Tip:</strong> Custom reports can be saved and scheduled for automatic generation.
        </p>
      </div>
    </div>
  );
};

export default CustomReportBuilder;