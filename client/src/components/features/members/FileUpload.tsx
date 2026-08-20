"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  maxSizeMB?: number;
  maxRows?: number;
}

export function FileUpload({ 
  onFileSelect, 
  maxSizeMB = 5,
  maxRows = 1000 
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const validateFile = useCallback(async (file: File): Promise<string | null> => {
    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return 'Only CSV files are allowed.';
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size exceeds the limit of ${maxSizeMB}MB.`;
    }

    // Check row count (approximate)
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Subtract header row
      const dataRows = Math.max(0, lines.length - 1);
      
      if (dataRows > maxRows) {
        return `File contains too many rows (${dataRows}). Maximum: ${maxRows}.`;
      }

      // Check for basic CSV structure
      if (lines.length === 0) {
        return 'File is empty.';
      }

      const header = lines[0];
      if (!header.includes(',')) {
        return 'File does not appear to be a valid CSV format.';
      }

      // Check for required columns
      const headerLower = header.toLowerCase();
      const requiredColumns = ['fullname', 'email', 'membershiptype'];
      const missingColumns = requiredColumns.filter(col => 
        !headerLower.includes(col.replace(/([A-Z])/g, '$1').toLowerCase())
      );

      if (missingColumns.length > 0) {
        return `Missing required columns: ${missingColumns.join(', ')}. Please download the template to see the correct format.`;
      }

      return null;
    } catch {
      return 'Error reading file. Please ensure it\'s a valid CSV file.';
    }
  }, [maxSizeMB, maxRows]);

  const handleFileAccepted = useCallback(async (files: File[]) => {
    // Only process if we have files (react-dropzone may call with empty array on rejection)
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    setError(null);

    const validationError = await validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  }, [validateFile, onFileSelect]);

  const handleFileRejected = useCallback((rejectedFiles: FileRejection[]) => {
    const rejection = rejectedFiles[0];
    if (rejection?.errors[0]) {
      const errorCode = rejection.errors[0].code;

      // Provide custom, user-friendly error messages
      if (errorCode === 'file-invalid-type') {
        setError('Only CSV files are allowed.');
      } else if (errorCode === 'file-too-large') {
        setError(`File size exceeds the limit of ${maxSizeMB}MB.`);
      } else {
        setError(rejection.errors[0].message);
      }
    } else {
      setError('File was rejected. Please check the file type and size.');
    }
    setSelectedFile(null);
  }, [maxSizeMB]);

  const { getRootProps, getInputProps, isDragActive: dropzoneIsDragActive } = useDropzone({
    onDrop: handleFileAccepted,
    onDropRejected: (files) => {
      handleFileRejected(files);
      setIsDragActive(false);
    },
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: maxSizeMB * 1024 * 1024,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    noClick: false,
    noKeyboard: false
  });

  const removeFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <div
          {...getRootProps({ role: 'button' })}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${(isDragActive || dropzoneIsDragActive)
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-border/80'
            }
          `}
        >
          <input {...getInputProps({ 'aria-label': 'CSV file upload' })} />
          <Upload className={`
            h-12 w-12 mx-auto mb-4
            ${(isDragActive || dropzoneIsDragActive) ? 'text-primary' : 'text-muted-foreground'}
          `} />
          
          {(isDragActive || dropzoneIsDragActive) ? (
            <div>
              <p className="text-lg font-medium text-primary">Drop your CSV file here</p>
              <p className="text-sm text-muted-foreground">Release to upload</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">
                Drag & drop your CSV file here
              </p>
              <p className="text-muted-foreground mb-4">
                or click to browse files
              </p>
              <Button type="button" variant="outline">
                Choose File
              </Button>
            </div>
          )}
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Accepted formats: CSV</p>
            <p>Maximum size: {maxSizeMB}MB</p>
            <p>Maximum rows: {maxRows} members</p>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-success/10 border-success/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-success" />
              <div>
                <p className="font-medium text-success-foreground">{selectedFile.name}</p>
                <p className="text-sm text-success">
                  {formatFileSize(selectedFile.size)} • CSV file
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-success hover:text-success-foreground hover:bg-success/10"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}