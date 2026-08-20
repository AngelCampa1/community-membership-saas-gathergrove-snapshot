'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Trash2 } from 'lucide-react';
import { type ExportStatus } from '@/services/memberDataExportService';
import { formatDistanceToNow } from 'date-fns';

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

interface ExportHistoryViewerProps {
  history?: ExportHistoryEntry[];
  onDownload?: (entry: ExportHistoryEntry) => void;
  onRemove?: (exportId: string) => void;
  className?: string;
  isLoading?: boolean;
}

function getStatusBadge(status: ExportStatus) {
  switch (status) {
    case 'completed':
      return <Badge variant="default">Completed</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    case 'processing':
      return <Badge variant="secondary">Processing</Badge>;
    case 'queued':
      return <Badge variant="outline">Queued</Badge>;
    case 'cancelled':
      return <Badge variant="secondary">Cancelled</Badge>;
    case 'expired':
      return <Badge variant="outline">Expired</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return 'Unknown';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function ExportHistoryViewer({
  history = [],
  onDownload,
  onRemove,
  className,
  isLoading = false,
}: ExportHistoryViewerProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Exports (this session)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Recent Exports (this session)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No exports yet this session.</p>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => (
              <div
                key={entry.exportId}
                className="flex items-center justify-between p-3 rounded border bg-muted/30"
              >
                <div className="space-y-1 min-w-0 flex-1 mr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{entry.fileName}</span>
                    {getStatusBadge(entry.status)}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {entry.createdAt && (
                      <span>
                        Started{' '}
                        {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                      </span>
                    )}
                    {entry.recordCount != null && (
                      <span>{entry.recordCount.toLocaleString()} records</span>
                    )}
                    {entry.fileSizeBytes != null && (
                      <span>{formatFileSize(entry.fileSizeBytes)}</span>
                    )}
                  </div>
                  {entry.errorMessage && (
                    <p className="text-xs text-destructive mt-1">{entry.errorMessage}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {entry.status === 'completed' && onDownload && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownload(entry)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  {onRemove && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(entry.exportId)}
                      title="Remove from list"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
