"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUpload } from './FileUpload';
import { ValidationPreviewTest as ValidationPreview } from './ValidationPreviewTest';
import { ImportProgress } from './ImportProgress';
import { CheckCircle, AlertCircle, FileText, Upload, Play } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { validateImportSize } from '@/utils/memberUtils';
import { memberImportService } from '@/services/memberImportService';

interface ImportMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: number;
  onSuccess: () => void;
}

interface ImportValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateEmails: number;
  validationErrors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  rowNumber: number;
  field: string;
  value: string;
  error: string;
}

interface ValidationWarning {
  rowNumber: number;
  field: string;
  value: string;
  warning: string;
}

interface ImportResult {
  importId: string;
  status: string;
  summary: {
    totalProcessed: number;
    successful: number;
    skipped: number;
    failed: number;
  };
  errors: ImportError[];
}

interface ImportError {
  rowNumber: number;
  memberData: Record<string, unknown>;
  error: string;
}

type ImportStep = 'upload' | 'validate' | 'confirm' | 'import' | 'complete';

export function ImportMembersModal({ isOpen, onClose, clubId, onSuccess }: ImportMembersModalProps) {
  const { user } = useAuth();
  const isExpandTier = user?.clubTier === 'Unlimited' || user?.clubTier === 'Expand';
  const maxImportRows = isExpandTier ? 2000 : user?.clubTier === 'Grow' ? 200 : 100;
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<string>('');

  // Import options
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [skipInvalid, setSkipInvalid] = useState(true);
  const [notifyMembers, setNotifyMembers] = useState(false);

  const resetModal = useCallback(() => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setValidationResult(null);
    setImportResult(null);
    setIsValidating(false);
    setIsImporting(false);
    setError(null);
    setCsvData('');
  }, []);

  const handleClose = useCallback(() => {
    resetModal();
    onClose();
  }, [resetModal, onClose]);

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setError(null);
    
    // US-002: Validate file size and tier limits before processing
    const tier = user?.clubTier || 'Grow';
    
    // Estimate row count from file size (rough approximation)
    const estimatedRows = Math.floor(file.size / 100); // ~100 bytes per row average
    const validation = validateImportSize(estimatedRows, tier);
    
    if (!validation.isValid && validation.message) {
      setError(validation.message);
      return;
    }
    
    try {
      // Read file content for later use
      const text = await file.text();
      const base64 = btoa(text);
      setCsvData(base64);
      
      setCurrentStep('validate');
    } catch {
      setError('Failed to read file. Please ensure it\'s a valid CSV file.');
    }
  }, [user?.clubTier]);

  const validateFile = useCallback(async () => {
    if (!selectedFile) return;

    setIsValidating(true);
    setError(null);

    try {
      const result = await memberImportService.validateCsv(clubId, selectedFile, user?.clubTier);
      setValidationResult(result);
      setCurrentStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  }, [selectedFile, clubId, user?.clubTier]);

  const executeImport = useCallback(async () => {
    if (!csvData) return;

    setIsImporting(true);
    setError(null);

    try {
      const result = await memberImportService.executeImport(
        clubId,
        {
          csvData,
          options: {
            skipDuplicates,
            skipInvalid,
            notifyMembers
          }
        },
        user?.clubTier
      );
      setImportResult(result);
      setCurrentStep('complete');

      // Call success callback after a brief delay to show results
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  }, [csvData, clubId, skipDuplicates, skipInvalid, notifyMembers, onSuccess, user?.clubTier]);

  const downloadTemplate = useCallback(async () => {
    try {
      const blob = await memberImportService.downloadTemplate(clubId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `member-import-template-${clubId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download template');
    }
  }, [clubId]);

  const getStepIcon = (step: ImportStep) => {
    switch (step) {
      case 'upload':
        return <Upload className="h-5 w-5" />;
      case 'validate':
        return <FileText className="h-5 w-5" />;
      case 'confirm':
        return <CheckCircle className="h-5 w-5" />;
      case 'import':
        return <Play className="h-5 w-5" />;
      case 'complete':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Upload className="h-5 w-5" />;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'upload':
        return 'Upload CSV File';
      case 'validate':
        return 'Validating File...';
      case 'confirm':
        return 'Review & Confirm';
      case 'import':
        return 'Importing Members...';
      case 'complete':
        return 'Import Complete';
      default:
        return 'Import Members';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-strong border-border/50 backdrop-blur-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStepIcon(currentStep)}
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'upload' && 'Select and upload a CSV file to import multiple members into your club.'}
            {currentStep === 'validate' && 'Please wait while we validate your CSV file for errors and duplicates.'}
            {currentStep === 'confirm' && 'Review the validation results and configure import options before proceeding.'}
            {currentStep === 'import' && 'Your members are being imported. This may take a few moments.'}
            {currentStep === 'complete' && 'Member import has been completed. Review the results below.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator for Large Imports */}
          {isImporting && validationResult && validationResult.totalRows > 1000 && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-primary">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="text-sm font-medium">Processing large dataset ({validationResult.totalRows.toLocaleString()} members)</span>
              </div>
              <p className="text-xs text-primary/80 mt-1">
                This may take several minutes. Please don't close this window.
              </p>
            </div>
          )}

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {(['upload', 'validate', 'confirm', 'import', 'complete'] as ImportStep[]).map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep === step ? 'bg-primary text-primary-foreground' :
                    ['upload', 'validate', 'confirm', 'import', 'complete'].indexOf(currentStep) > index
                      ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {index + 1}
                </div>
                {index < 4 && (
                  <div className={`
                    w-12 h-0.5 mx-2
                    ${['upload', 'validate', 'confirm', 'import', 'complete'].indexOf(currentStep) > index
                      ? 'bg-success' : 'bg-muted'
                    }
                  `} />
                )}
              </div>
            ))}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step Content */}
          {currentStep === 'upload' && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Upload a CSV file to import multiple members at once.
                </p>
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="mb-4"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download CSV Template
                </Button>
              </div>
              
              <FileUpload
                onFileSelect={handleFileSelect}
                maxSizeMB={10}
                maxRows={maxImportRows}
              />
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Maximum file size: {isExpandTier ? '10MB' : '5MB'}</p>
                <p>• Maximum rows: {maxImportRows.toLocaleString()} members</p>
                <p>• Required fields: Full Name, Email, Membership Type</p>
                <p>• Optional fields: Phone Number, Address, Join Date</p>
                {isExpandTier && (
                  <p className="text-success">✨ Expand plan: Import up to 2,000 members.</p>
                )}
              </div>
            </div>
          )}

          {currentStep === 'validate' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Validating your CSV file...
                </p>
              </div>
              <Button onClick={validateFile} disabled={isValidating}>
                {isValidating ? 'Validating...' : 'Start Validation'}
              </Button>
            </div>
          )}

          {currentStep === 'confirm' && validationResult && (
            <>
              <ValidationPreview
                validationResult={validationResult}
                skipDuplicates={skipDuplicates}
                skipInvalid={skipInvalid}
                notifyMembers={notifyMembers}
                onSkipDuplicatesChange={setSkipDuplicates}
                onSkipInvalidChange={setSkipInvalid}
                onNotifyMembersChange={setNotifyMembers}
              />
              
              {/* US-002: Show tier-specific information */}
              {isExpandTier && validationResult.totalRows > 1000 && (
                <div className="mt-4 p-4 bg-success/10 border border-success/20 rounded-lg">
                  <div className="flex items-center gap-2 text-success mb-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Large Import Detected</span>
                  </div>
                  <p className="text-sm text-success/90">
                    Your Expand plan supports importing {validationResult.totalRows.toLocaleString()} members.
                    This process may take several minutes to complete.
                  </p>
                </div>
              )}
            </>
          )}

          {currentStep === 'import' && (
            <ImportProgress
              isImporting={isImporting}
              progress={50} // You could implement real progress tracking
            />
          )}

          {currentStep === 'complete' && importResult && (
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Import Completed!</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-3 bg-success/10 border border-success/20 rounded-lg">
                    <div className="font-semibold text-success">{importResult.summary.successful}</div>
                    <div className="text-success/80">Successful</div>
                  </div>
                  <div className="text-center p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <div className="font-semibold text-warning">{importResult.summary.skipped}</div>
                    <div className="text-warning/80">Skipped</div>
                  </div>
                  <div className="text-center p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="font-semibold text-destructive">{importResult.summary.failed}</div>
                    <div className="text-destructive/80">Failed</div>
                  </div>
                  <div className="text-center p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="font-semibold text-primary">{importResult.summary.totalProcessed}</div>
                    <div className="text-primary/80">Total</div>
                  </div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Errors:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResult.errors.map((error, index) => (
                      <div key={`error-${error.rowNumber}-${index}`} className="text-sm p-2 bg-destructive/10 rounded text-destructive">
                        Row {error.rowNumber}: {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {currentStep === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
          
          {currentStep === 'validate' && (
            <>
              <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                Back
              </Button>
              <Button onClick={validateFile} disabled={isValidating}>
                {isValidating ? 'Validating...' : 'Validate File'}
              </Button>
            </>
          )}
          
          {currentStep === 'confirm' && validationResult && (
            <>
              <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                Back
              </Button>
              <Button 
                onClick={() => {
                  setCurrentStep('import');
                  executeImport();
                }}
                disabled={!validationResult.isValid && !skipInvalid}
              >
                Import {validationResult.validRows} Valid Members
              </Button>
            </>
          )}
          
          {currentStep === 'complete' && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
