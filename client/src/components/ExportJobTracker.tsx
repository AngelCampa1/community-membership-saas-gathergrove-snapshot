'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Download, RefreshCw, CheckCircle, XCircle, AlertCircle, PlayCircle } from 'lucide-react';
import { memberDataExportService, type ExportStatusResponse } from '@/services/memberDataExportService';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface ExportJobTrackerProps {
  clubId: number;
  exportId: string;
  onComplete?: (status: ExportStatusResponse) => void;
  onError?: (status: ExportStatusResponse) => void;
}

const POLL_INTERVAL = 2000; // 2 seconds

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'cancelled', 'expired']);

export default function ExportJobTracker({ clubId, exportId, onComplete, onError }: ExportJobTrackerProps) {
  const [status, setStatus] = useState<ExportStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await memberDataExportService.getExportStatus(clubId, exportId);
      setStatus(data);
      setError(null);

      if (data.status === 'completed' && onComplete) {
        onComplete(data);
      } else if (data.status === 'failed' && onError) {
        onError(data);
      }

      // Return whether to continue polling
      return !TERMINAL_STATUSES.has(data.status);
    } catch (err) {
      logger.error('analytics', 'Error fetching export status', { error: err, exportId });
      setError(err instanceof Error ? err.message : 'Failed to fetch export status');
      return false;
    }
  }, [clubId, exportId, onComplete, onError]);

  const handleRetry = async () => {
    setError(null);
    await fetchStatus();
  };

  const handleDownload = async () => {
    if (!status || status.status !== 'completed') return;

    setIsDownloading(true);
    try {
      const blob = await memberDataExportService.downloadExport(clubId, exportId);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_${exportId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Export downloaded successfully!');
    } catch (err) {
      logger.error('analytics', 'Export download failed', { error: err, exportId });
      const errorMessage = err instanceof Error ? err.message : 'Download failed';
      toast.error(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let mounted = true;

    const startPolling = async () => {
      if (!mounted) return;

      const shouldContinue = await fetchStatus();
      if (shouldContinue && mounted) {
        timeoutId = setTimeout(startPolling, POLL_INTERVAL);
      }
    };

    startPolling();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [fetchStatus]);

  const getStatusIcon = () => {
    if (!status) return <Clock className="h-5 w-5" />;

    switch (status.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-destructive" data-testid="error-icon" />;
      case 'processing':
        return <PlayCircle className="h-5 w-5 text-primary" />;
      case 'queued':
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    if (!status) return <Badge variant="outline">Loading</Badge>;

    switch (status.status) {
      case 'completed':
        return <Badge variant="default" data-testid="status-completed">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive" data-testid="status-failed">Failed</Badge>;
      case 'processing':
        return <Badge variant="secondary" data-testid="status-processing">Processing</Badge>;
      case 'queued':
        return <Badge variant="outline">Queued</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const progress = status ? Math.round(status.progressPercentage) : 0;

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Error loading export status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Export Job Tracker
        </CardTitle>
        <CardDescription>
          Export ID: {exportId}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status and Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>Status:</div>
            {getStatusBadge()}
          </div>

          <div className="flex items-center justify-between">
            <div>Progress:</div>
            <div>{progress}%</div>
          </div>

          {status && (
            <Progress value={progress} className="h-2" data-testid="progress-bar" />
          )}
        </div>

        {/* Error Message */}
        {status?.status === 'failed' && status.errorMessage && (
          <div className="border-t pt-3">
            <div className="text-sm text-destructive">
              {status.errorMessage}
            </div>
          </div>
        )}

        {/* Status Announcement for Screen Readers */}
        <div
          data-testid="status-announcement"
          role="status"
          aria-live="polite"
          className="sr-only"
        >
          {status?.status === 'completed' ? 'Export completed successfully' :
           status?.status === 'failed' ? `Export failed: ${status.errorMessage || 'Unknown error'}` :
           status?.status === 'processing' ? `Export processing: ${progress}% complete` :
           'Export status pending'}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-3 border-t">
          {/* Download Button */}
          {status?.status === 'completed' && status.downloadUrl && (
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              data-testid="download-button"
              className="flex items-center gap-2"
            >
              {isDownloading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download Export
            </Button>
          )}

          {/* Retry Button for Failed Jobs */}
          {status?.status === 'failed' && (
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Export
            </Button>
          )}
        </div>

        {/* Progress Bar with Proper ARIA */}
        {status && (
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Export progress: ${progress}%`}
            className="sr-only"
          />
        )}
      </CardContent>
    </Card>
  );
}
