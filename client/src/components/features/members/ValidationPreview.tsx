"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Note: Collapsible component removed due to JSDOM test compatibility issues - using simple conditional rendering
import { ImportValidationResult } from '@/services/memberImportService';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  ChevronDown, 
  ChevronRight,
  Info,
  Download
} from 'lucide-react';

interface ValidationPreviewProps {
  validationResult: ImportValidationResult;
  skipDuplicates: boolean;
  skipInvalid: boolean;
  notifyMembers: boolean;
  onSkipDuplicatesChange: (value: boolean) => void;
  onSkipInvalidChange: (value: boolean) => void;
  onNotifyMembersChange: (value: boolean) => void;
}

export function ValidationPreview({
  validationResult,
  skipDuplicates,
  skipInvalid,
  notifyMembers,
  onSkipDuplicatesChange,
  onSkipInvalidChange,
  onNotifyMembersChange
}: ValidationPreviewProps) {
  const [showErrors, setShowErrors] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);

  const {
    totalRows,
    validRows,
    invalidRows,
    duplicateEmails,
    validationErrors,
    warnings
  } = validationResult;

  const downloadErrorReport = () => {
    const report = [
      'Row,Field,Value,Error Type,Message',
      ...validationErrors.map(error => 
        `${error.rowNumber},"${error.field}","${error.value}",Error,"${error.error}"`
      ),
      ...warnings.map(warning => 
        `${warning.rowNumber},"${warning.field}","${warning.value}",Warning,"${warning.warning}"`
      )
    ].join('\n');

    const blob = new Blob([report], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-validation-report.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getEffectiveImportCount = () => {
    let count = validRows;
    
    if (skipDuplicates) {
      // Duplicates are included in validRows but will be skipped
      count -= duplicateEmails;
    }
    
    return Math.max(0, count);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div className="text-2xl font-bold text-primary">{totalRows}</div>
          <div className="text-sm text-primary/80">Total Rows</div>
        </div>

        <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
          <div className="text-2xl font-bold text-success">{validRows}</div>
          <div className="text-sm text-success/80">Valid Rows</div>
        </div>

        {invalidRows > 0 && (
          <div className="text-center p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="text-2xl font-bold text-destructive">{invalidRows}</div>
            <div className="text-sm text-destructive/80">Invalid Rows</div>
          </div>
        )}

        {duplicateEmails > 0 && (
          <div className="text-center p-4 bg-warning/10 rounded-lg border border-warning/20">
            <div className="text-2xl font-bold text-warning">{duplicateEmails}</div>
            <div className="text-sm text-warning/80">Duplicates</div>
          </div>
        )}
      </div>

      {/* Overall Status */}
      <div className="flex items-center gap-3 p-4 rounded-lg border">
        {validationResult.isValid ? (
          <>
            <CheckCircle className="h-6 w-6 text-success" />
            <div>
              <p className="font-medium text-success">Validation Passed</p>
              <p className="text-sm text-success/80">
                Ready to import {getEffectiveImportCount()} member{getEffectiveImportCount() !== 1 ? 's' : ''}
              </p>
            </div>
          </>
        ) : (
          <>
            <XCircle className="h-6 w-6 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Validation Issues Found</p>
              <p className="text-sm text-destructive/80">
                {invalidRows} row{invalidRows !== 1 ? 's' : ''} contain{invalidRows === 1 ? 's' : ''} errors that must be fixed
              </p>
            </div>
          </>
        )}
      </div>

      {/* Import Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Import Options</h3>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="skipDuplicates"
              checked={skipDuplicates}
              onCheckedChange={onSkipDuplicatesChange}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="skipDuplicates"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Skip duplicate emails
              </label>
              <p className="text-xs text-muted-foreground">
                Members with email addresses that already exist will be skipped
                {duplicateEmails > 0 && ` (${duplicateEmails} found)`}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="skipInvalid"
              checked={skipInvalid}
              onCheckedChange={onSkipInvalidChange}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="skipInvalid"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Skip invalid rows
              </label>
              <p className="text-xs text-muted-foreground">
                Rows with validation errors will be skipped and import will continue
                {invalidRows > 0 && ` (${invalidRows} found)`}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="notifyMembers"
              checked={notifyMembers}
              onCheckedChange={onNotifyMembersChange}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="notifyMembers"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Send welcome emails to new members
              </label>
              <p className="text-xs text-muted-foreground">
                New members will receive a welcome email with their login information
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              className="justify-start p-0 h-auto flex-1"
              onClick={() => setShowErrors(!showErrors)}
            >
              <div className="flex items-center gap-2">
                {showErrors ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="font-medium">
                  {validationErrors.length} Validation Error{validationErrors.length !== 1 ? 's' : ''}
                </span>
                <Badge variant="destructive">{validationErrors.length}</Badge>
              </div>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadErrorReport}
              className="ml-2"
            >
              <Download className="h-3 w-3 mr-1" />
              Download Report
            </Button>
          </div>
          {showErrors && (
            <div className="space-y-2 mt-2">
              <div className="max-h-60 overflow-y-auto space-y-1">
                {validationErrors.map((error, index) => (
                  <div key={`error-${error.rowNumber}-${error.field}-${index}`} className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
                    <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-destructive">
                        Row {error.rowNumber} - {error.field}
                      </div>
                      <div className="text-destructive/80">
                        Value: &quot;{error.value}&quot; - {error.error}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Validation Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            className="w-full justify-between p-0 h-auto"
            onClick={() => setShowWarnings(!showWarnings)}
          >
            <div className="flex items-center gap-2">
              {showWarnings ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="font-medium">
                {warnings.length} Warning{warnings.length !== 1 ? 's' : ''}
              </span>
              <Badge variant="secondary">{warnings.length}</Badge>
            </div>
          </Button>
          {showWarnings && (
            <div className="space-y-2 mt-2">
              <div className="max-h-60 overflow-y-auto space-y-1">
                {warnings.map((warning, index) => (
                  <div key={`warning-${warning.rowNumber}-${warning.field}-${index}`} className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg text-sm">
                    <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-warning">
                        Row {warning.rowNumber} - {warning.field}
                      </div>
                      <div className="text-warning/80">
                        Value: &quot;{warning.value}&quot; - {warning.warning}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Preview */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Import Preview:</strong> {getEffectiveImportCount()} member{getEffectiveImportCount() !== 1 ? 's' : ''} will be imported.
          {skipDuplicates && duplicateEmails > 0 && (
            <> {duplicateEmails} duplicate{duplicateEmails !== 1 ? 's' : ''} will be skipped.</>
          )}
          {skipInvalid && invalidRows > 0 && (
            <> {invalidRows} invalid row{invalidRows !== 1 ? 's' : ''} will be skipped.</>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}