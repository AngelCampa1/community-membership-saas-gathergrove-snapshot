'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// RadioGroup components implemented inline since ui/radio-group doesn't exist
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileText, Table, Code, FileImage } from 'lucide-react';

interface ExportFormatSelectorProps {
  value: 'csv' | 'excel' | 'json' | 'pdf';
  onChange: (format: 'csv' | 'excel' | 'json' | 'pdf') => void;
  supportedFormats?: ('csv' | 'excel' | 'json' | 'pdf')[];
  disabled?: boolean;
}

interface FormatOption {
  id: 'csv' | 'excel' | 'json' | 'pdf';
  name: string;
  description: string;
  icon: React.ReactNode;
  extension: string;
  size: string;
  features: string[];
  badge?: string;
}

export function ExportFormatSelector({ 
  value, 
  onChange, 
  supportedFormats = ['csv', 'excel', 'json', 'pdf'],
  disabled = false 
}: ExportFormatSelectorProps) {
  const formatOptions: FormatOption[] = [
    {
      id: 'csv',
      name: 'CSV',
      description: 'Comma-separated values for spreadsheet applications',
      icon: <Table className="h-4 w-4" />,
      extension: '.csv',
      size: 'Small',
      features: ['Spreadsheet compatible', 'Fast export', 'Universal support'],
      badge: 'Most Compatible'
    },
    {
      id: 'excel',
      name: 'Excel',
      description: 'Microsoft Excel workbook with multiple sheets',
      icon: <FileText className="h-4 w-4 text-success" />,
      extension: '.xlsx',
      size: 'Medium',
      features: ['Multiple sheets', 'Formatted data', 'Charts & graphs'],
      badge: 'Rich Format'
    },
    {
      id: 'json',
      name: 'JSON',
      description: 'JavaScript Object Notation for API integration',
      icon: <Code className="h-4 w-4 text-primary" />,
      extension: '.json',
      size: 'Small',
      features: ['API friendly', 'Structured data', 'Developer tools'],
      badge: 'Developer'
    },
    {
      id: 'pdf',
      name: 'PDF',
      description: 'Formatted report document for presentation',
      icon: <FileImage className="h-4 w-4 text-destructive" />,
      extension: '.pdf',
      size: 'Large',
      features: ['Print ready', 'Professional format', 'Read-only'],
      badge: 'Premium'
    }
  ];

  const availableOptions = formatOptions.filter(option => 
    supportedFormats.includes(option.id)
  );

  const getFileSizeEstimate = (format: string, recordCount: number = 1000): string => {
    const baseSizes = {
      csv: 50, // KB per 1000 records
      excel: 120,
      json: 80,
      pdf: 200
    };

    const estimatedKB = baseSizes[format as keyof typeof baseSizes] * (recordCount / 1000);
    
    if (estimatedKB < 1024) {
      return `~${Math.round(estimatedKB)} KB`;
    } else {
      return `~${(estimatedKB / 1024).toFixed(1)} MB`;
    }
  };

  const getFormatRecommendation = (format: string): string => {
    switch (format) {
      case 'csv':
        return 'Best for: Excel analysis, data import, quick viewing';
      case 'excel':
        return 'Best for: Complex analysis, presentations, charts';
      case 'json':
        return 'Best for: API integration, web applications, automation';
      case 'pdf':
        return 'Best for: Reports, printing, sharing with stakeholders';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Export Format</CardTitle>
        <CardDescription>
          Choose the format that best suits your needs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {availableOptions.map((option) => (
            <div key={option.id} className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  value={option.id}
                  id={option.id}
                  name="export-format"
                  checked={value === option.id}
                  onChange={() => onChange(option.id as any)}
                  disabled={disabled}
                  className="sr-only peer"
                />
                <Label 
                  htmlFor={option.id} 
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <span className="font-medium">{option.name}</span>
                      <span className="text-muted-foreground text-sm">
                        {option.extension}
                      </span>
                      {option.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {option.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{option.size} file</span>
                      <span>{getFileSizeEstimate(option.id)}</span>
                    </div>
                  </div>
                </Label>
              </div>
              
              {value === option.id && (
                <div className="ml-6 space-y-2 p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {option.features.map((feature, index) => (
                      <Badge key={`feature-${index}-${feature.substring(0, 20)}`} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground italic">
                    {getFormatRecommendation(option.id)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {disabled && (
          <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-md">
            <p className="text-sm text-warning-foreground">
              Format selection is disabled during export processing
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}