'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Upload, X } from 'lucide-react';

export interface LogoData {
  file: File;
  preview: string;
}

export interface LogoUploaderProps {
  onLogoChange: (logo: LogoData | null) => void;
  onError: (error: string) => void;
  currentLogo?: string | null;
  maxFileSize?: number;
  acceptedFormats?: string[];
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
}

export function LogoUploader({
  onLogoChange,
  onError,
  currentLogo,
  maxFileSize = 2 * 1024 * 1024, // 2MB
  acceptedFormats = ['image/jpeg', 'image/png', 'image/svg+xml'],
  maxWidth,
  maxHeight,
  className
}: LogoUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(async (file: File): Promise<boolean> => {
    // Check file size
    if (file.size > maxFileSize) {
      onError(`File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      return false;
    }

    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      onError('Invalid file type. Only image files are allowed.');
      return false;
    }

    // Check dimensions if specified
    if (maxWidth || maxHeight) {
      try {
        const dimensions = await validateImageDimensions(file);
        if (maxWidth && dimensions.width > maxWidth) {
          onError(`Image dimensions exceed maximum width of ${maxWidth}px`);
          return false;
        }
        if (maxHeight && dimensions.height > maxHeight) {
          onError(`Image dimensions exceed maximum height of ${maxHeight}px`);
          return false;
        }
      } catch {
        onError('Failed to validate image dimensions');
        return false;
      }
    }

    return true;
  }, [maxFileSize, acceptedFormats, maxWidth, maxHeight, onError]);

  const validateImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  };

  const processFile = useCallback(async (file: File) => {
    setProcessing(true);
    
    try {
      const isValid = await validateFile(file);
      if (!isValid) {
        setProcessing(false);
        return;
      }

      // Create file reader for preview
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPreviewUrl(result);
        onLogoChange({ file, preview: result });
        setProcessing(false);
      };
      
      reader.onerror = () => {
        onError('Failed to read file');
        setProcessing(false);
      };
      
      reader.readAsDataURL(file);
    } catch {
      onError('Failed to process image file');
      setProcessing(false);
    }
  }, [validateFile, onLogoChange, onError]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragIn = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragOut = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  const handleRemoveLogo = () => {
    setPreviewUrl(null);
    onLogoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayedLogo = previewUrl || currentLogo;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <label htmlFor="logo-upload" className="text-sm font-medium">
          Upload Logo
        </label>
        
        {/* Upload Area */}
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer',
            'hover:border-muted-foreground focus-within:border-primary',
            dragActive ? 'border-primary bg-primary/10' : 'border-muted',
            processing && 'opacity-50 pointer-events-none'
          )}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-describedby="upload-description"
        >
          <Input
            ref={fileInputRef}
            id="logo-upload"
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileChange}
            className="sr-only"
            aria-describedby="upload-description"
          />
          
          <div className="flex flex-col items-center justify-center space-y-2 text-center">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground" id="upload-description">
                PNG, JPG, SVG up to {Math.round(maxFileSize / 1024 / 1024)}MB
              </p>
            </div>
          </div>
          
          {processing && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="text-sm text-muted-foreground">Processing...</div>
            </div>
          )}
        </div>
      </div>

      {/* Current Logo Display */}
      {displayedLogo && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {previewUrl ? 'Logo Preview' : 'Current Logo'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveLogo}
              className="text-destructive hover:text-destructive/90"
            >
              <X className="h-4 w-4 mr-1" />
              Remove Logo
            </Button>
          </div>

          <div className="border border-border rounded-lg p-4 bg-muted">
            <img
              src={displayedLogo}
              alt={previewUrl ? 'Logo preview' : 'Current logo'}
              className="max-w-full max-h-32 object-contain mx-auto"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      <div role="alert" aria-live="polite" className="sr-only">
        {/* Error messages will be announced by screen readers */}
      </div>
    </div>
  );
}
