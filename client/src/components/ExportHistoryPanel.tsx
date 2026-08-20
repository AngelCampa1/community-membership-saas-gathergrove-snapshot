'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, Download, Trash2, AlertCircle } from 'lucide-react';
import { type ExportStatus } from '@/services/memberDataExportService';

export interface ExportHistoryEntry {
  exportId: string;
  status: ExportStatus;
  fileName: string;
  fileSizeBytes?: number | null;
  createdAt?: string;
  completedAt?: string | null;
  downloadUrl?: string | null;
  errorMessage?: string | null;
  recordCount?: number | null;
}

interface ExportHistoryPanelProps {
  history?: ExportHistoryEntry[];
  onDownload?: (entry: ExportHistoryEntry) => void;
  onRemove?: (exportId: string) => void;
  className?: string;
  isLoading?: boolean;
}

function formatFileSize(bytes?: number | null): string {
  if (bytes == null) return 'Unknown';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function StatusBadge({ status }: { status: ExportStatus }) {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="default" data-testid="status-completed" className="bg-success text-success-foreground">
          Completed
        </Badge>
      );
    case 'processing':
      return <Badge variant="secondary" data-testid="status-processing">Processing</Badge>;
    case 'queued':
      return <Badge variant="outline" data-testid="status-queued">Queued</Badge>;
    case 'failed':
      return <Badge variant="destructive" data-testid="status-failed">Failed</Badge>;
    case 'cancelled':
      return <Badge variant="outline" data-testid="status-cancelled">Cancelled</Badge>;
    case 'expired':
      return <Badge variant="outline" data-testid="status-expired">Expired</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

export default function ExportHistoryPanel({
  history = [],
  onDownload,
  onRemove,
  className,
  isLoading = false,
}: ExportHistoryPanelProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Exports (this session)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"
              data-testid="loading-spinner"
            />
            <span>Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className ?? ''}`} role="region" aria-label="Recent Exports (this session)">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Exports (this session)
          </CardTitle>
        </CardHeader>

        <CardContent>
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12" data-testid="empty-state">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No exports yet this session.</h3>
              <p className="text-muted-foreground text-center">
                Exports you start will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => {
                const canDownload = entry.status === 'completed';
                return (
                  <div
                    key={entry.exportId}
                    className="flex items-center justify-between border rounded-lg p-3"
                    data-testid={`entry-${entry.exportId}`}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="font-medium truncate"
                          data-testid={`filename-${entry.exportId}`}
                        >
                          {entry.fileName}
                        </span>
                        <StatusBadge status={entry.status} />
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        {entry.fileSizeBytes != null && (
                          <span>{formatFileSize(entry.fileSizeBytes)}</span>
                        )}
                        {entry.recordCount != null && (
                          <span>{entry.recordCount} records</span>
                        )}
                        {entry.createdAt && (
                          <span>Started: {new Date(entry.createdAt).toLocaleString()}</span>
                        )}
                        {entry.completedAt && (
                          <span>Completed: {new Date(entry.completedAt).toLocaleString()}</span>
                        )}
                      </div>

                      {entry.errorMessage && (
                        <div
                          className="flex items-center gap-1 text-destructive text-sm"
                          data-testid={`error-${entry.exportId}`}
                        >
                          <AlertCircle className="h-4 w-4" data-testid="error-icon" />
                          <span>{entry.errorMessage}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!canDownload}
                        title={canDownload ? 'Download export file' : 'Download not available'}
                        onClick={() => canDownload && onDownload?.(entry)}
                        data-testid={`download-button-${entry.exportId}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        title="Remove from list"
                        onClick={() => onRemove?.(entry.exportId)}
                        data-testid={`remove-button-${entry.exportId}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
