import React from 'react';
import { ImportValidationResult } from '@/services/memberImportService';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle, Info, FileText } from 'lucide-react';

interface ValidationPreviewProps {
  validationResult: ImportValidationResult;
  skipDuplicates: boolean;
  skipInvalid: boolean;
  notifyMembers: boolean;
  onSkipDuplicatesChange: (value: boolean) => void;
  onSkipInvalidChange: (value: boolean) => void;
  onNotifyMembersChange: (value: boolean) => void;
}

export function ValidationPreviewTest({
  validationResult,
  skipDuplicates,
  skipInvalid,
  notifyMembers,
  onSkipDuplicatesChange,
  onSkipInvalidChange,
  onNotifyMembersChange
}: ValidationPreviewProps) {
  // Removed unused state variables for eslint compliance

  const {
    validRows,
    invalidRows,
    duplicateEmails,
    validationErrors,
    warnings
  } = validationResult;

  // Download functionality would be implemented here if needed
  const _downloadErrorReport = () => {
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
      count = Math.max(0, count - duplicateEmails);
    }
    
    if (skipInvalid) {
      count = Math.max(0, count - invalidRows);
    }
    
    return count;
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Total Rows</span>
          </div>
          <Badge variant="outline">{validationResult.totalRows}</Badge>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm font-medium">Valid Rows</span>
          </div>
          <Badge variant="default">{validRows}</Badge>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium">Invalid Rows</span>
          </div>
          <Badge variant="destructive">{invalidRows}</Badge>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium">Duplicates</span>
          </div>
          <Badge variant="secondary">{duplicateEmails}</Badge>
        </div>
      </div>

      {/* Import Options */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-sm font-medium">Import Options</h3>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="skip-duplicates"
              checked={skipDuplicates}
              onCheckedChange={onSkipDuplicatesChange}
            />
            <div className="grid gap-1.5 leading-none">
              <label htmlFor="skip-duplicates" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Skip duplicate email addresses
              </label>
              <p className="text-xs text-muted-foreground">
                {duplicateEmails > 0 
                  ? `${duplicateEmails} duplicate${duplicateEmails !== 1 ? 's' : ''} detected`
                  : 'No duplicates found'}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox 
              id="skip-invalid"
              checked={skipInvalid}
              onCheckedChange={onSkipInvalidChange}
            />
            <div className="grid gap-1.5 leading-none">
              <label htmlFor="skip-invalid" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Skip invalid rows
              </label>
              <p className="text-xs text-muted-foreground">
                {invalidRows > 0 
                  ? `${invalidRows} invalid row${invalidRows !== 1 ? 's' : ''} detected`
                  : 'No invalid rows found'}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox 
              id="notify-members"
              checked={notifyMembers}
              onCheckedChange={onNotifyMembersChange}
            />
            <div className="grid gap-1.5 leading-none">
              <label htmlFor="notify-members" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Send welcome emails to new members
              </label>
              <p className="text-xs text-muted-foreground">
                New members will receive a welcome email with their login information
              </p>
            </div>
          </div>
        </div>
      </div>

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