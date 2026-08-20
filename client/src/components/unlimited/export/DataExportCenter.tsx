'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Download, Clock, Users, TrendingUp, DollarSign, Calendar, History } from 'lucide-react';
import { ExportFormatSelector } from './ExportFormatSelector';
import { CustomFieldSelector } from './CustomFieldSelector';
import { ScheduledReportsManager } from './ScheduledReportsManager';
import { ExportHistoryViewer, type ExportHistoryEntry } from './ExportHistoryViewer';
import {
  memberDataExportService,
  type MemberExportOptions,
} from '@/services/memberDataExportService';
import { financialExportService, type FinancialExportOptions } from '@/services/financialExportService';
import { analyticsExportService, type AnalyticsExportOptions } from '@/services/analyticsExportService';
import { useAuth } from '@/hooks/useAuth';
import { useAuthorization } from '@/hooks/useAuthorization';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface ExportCenterProps {
  clubId: number;
}

interface ExportCategory {
  id: 'member' | 'financial' | 'analytics' | 'event';
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  disabled?: boolean;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function DataExportCenter({ clubId }: ExportCenterProps) {
  const { user: _user } = useAuth();
  const { checkAccess } = useAuthorization();
  const [activeTab, setActiveTab] = useState('exports');
  const [selectedCategory, setSelectedCategory] = useState<ExportCategory['id']>('member');
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'json' | 'pdf'>('csv');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [sessionHistory, setSessionHistory] = useState<ExportHistoryEntry[]>([]);

  const hasUnlimitedAccess = checkAccess('unlimited', 'data_export');

  const exportCategories: ExportCategory[] = [
    {
      id: 'member',
      title: 'Member Data',
      description: 'Export member directory, engagement scores, and activity history',
      icon: <Users className="h-5 w-5" />,
      badge: 'Most Popular',
    },
    {
      id: 'financial',
      title: 'Financial Data',
      description: 'Export billing history, payments, and revenue analytics',
      icon: <DollarSign className="h-5 w-5" />,
      badge: 'Premium',
      disabled: !hasUnlimitedAccess,
    },
    {
      id: 'analytics',
      title: 'Analytics Data',
      description: 'Export engagement trends, growth metrics, and insights',
      icon: <TrendingUp className="h-5 w-5" />,
      disabled: !hasUnlimitedAccess,
    },
    {
      id: 'event',
      title: 'Event Data',
      description: 'Export event details, attendance, and RSVP data',
      icon: <Calendar className="h-5 w-5" />,
    },
  ];

  /** Update an existing session-history entry by exportId. */
  const updateHistoryEntry = (exportId: string, patch: Partial<ExportHistoryEntry>) => {
    setSessionHistory((prev) =>
      prev.map((e) => (e.exportId === exportId ? { ...e, ...patch } : e))
    );
  };

  /**
   * Poll getExportStatus until the export reaches a terminal state, then
   * update the session-history entry accordingly.
   */
  const pollUntilTerminal = async (exportId: string, _fileName?: string) => {
    const TERMINAL: Set<string> = new Set(['completed', 'failed', 'cancelled', 'expired']);
    const POLL_INTERVAL_MS = 2000;

    const tick = async () => {
      try {
        const status = await memberDataExportService.getExportStatus(clubId, exportId);
        updateHistoryEntry(exportId, {
          status: status.status,
          downloadUrl: status.downloadUrl ?? null,
          errorMessage: status.errorMessage ?? null,
          completedAt: status.completedAt ?? null,
        });
        setExportProgress(status.progress ?? 0);

        if (!TERMINAL.has(status.status)) {
          setTimeout(tick, POLL_INTERVAL_MS);
        } else if (status.status === 'completed') {
          toast.success('Export ready — click Download in the history panel.');
        } else if (status.status === 'failed') {
          toast.error(`Export failed: ${status.errorMessage ?? 'Unknown error'}`);
        }
      } catch (err) {
        logger.error('analytics', 'Error polling export status', { err, exportId });
      }
    };

    tick();
  };

  const handleExport = async () => {
    if (!hasUnlimitedAccess && ['financial', 'analytics'].includes(selectedCategory)) {
      toast.error('This export type requires Expand tier access');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      switch (selectedCategory) {
        case 'member': {
          const memberOptions: MemberExportOptions = {
            format: exportFormat as 'csv' | 'excel' | 'json',
            includeFields: selectedFields,
            includeEngagementData: selectedFields.includes('engagement'),
            includeCustomFields: selectedFields.includes('customFields'),
            includeAttendanceHistory: selectedFields.includes('attendance'),
          };
          const result = await memberDataExportService.exportMembers(clubId, memberOptions);

          // Add to session history immediately so the user can track progress.
          const entry: ExportHistoryEntry = {
            exportId: result.exportId,
            status: result.status,
            fileName: result.fileName,
            fileSizeBytes: result.fileSizeBytes ?? null,
            createdAt: result.requestedAt ?? result.createdAt,
            completedAt: result.completedAt ?? null,
            downloadUrl: result.downloadUrl ?? null,
            errorMessage: result.errorMessage ?? null,
            recordCount: result.recordCount ?? null,
          };
          setSessionHistory((prev) => [entry, ...prev]);

          if (result.status === 'completed') {
            // Immediately downloadable.
            const blob = await memberDataExportService.downloadExport(clubId, result.exportId);
            triggerBlobDownload(blob, result.fileName);
            updateHistoryEntry(result.exportId, { status: 'completed' });
            setExportProgress(100);
            toast.success('Export downloaded successfully.');
          } else {
            // Background processing — poll until terminal.
            toast.info('Export is being processed. We\'ll update the history when it\'s ready.');
            pollUntilTerminal(result.exportId, result.fileName);
          }
          break;
        }

        case 'financial': {
          const financialOptions: FinancialExportOptions = {
            format: exportFormat as 'csv' | 'excel' | 'json' | 'pdf',
            dateRange: {
              startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              endDate: new Date().toISOString(),
            },
            includeCategories: ['billing', 'payments', 'dues', 'events'],
            includeMemberDetails: selectedFields.includes('memberDetails'),
            groupBy: 'date',
          };
          const result = await financialExportService.exportFinancialData(clubId, financialOptions);
          if (result.status === 'completed') {
            const blob = await financialExportService.downloadFinancialExport(clubId, result.exportId);
            triggerBlobDownload(
              blob,
              result.fileName || `financial-export-${new Date().toISOString().split('T')[0]}.${exportFormat}`
            );
            toast.success('Financial export downloaded.');
          } else {
            toast.error(result.errorMessage || `Financial export ${result.status}`);
          }
          setExportProgress(100);
          break;
        }

        case 'analytics': {
          const analyticsOptions: AnalyticsExportOptions = {
            format: exportFormat as 'csv' | 'excel' | 'json' | 'pdf',
            dateRange: {
              startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              endDate: new Date().toISOString(),
            },
            includeCategories: ['engagement', 'events', 'members', 'growth'],
            granularity: 'daily',
            includeComparisons: selectedFields.includes('comparisons'),
            includePredictions: selectedFields.includes('predictions'),
          };
          const blob = await analyticsExportService.exportAnalyticsData(clubId, analyticsOptions);
          if (blob instanceof Blob) {
            triggerBlobDownload(
              blob,
              `analytics-export-${new Date().toISOString().split('T')[0]}.${exportFormat}`
            );
          }
          setExportProgress(100);
          toast.success('Analytics export downloaded.');
          break;
        }

        default:
          throw new Error('Export type not implemented');
      }
    } catch (error) {
      logger.error('analytics', 'Data export failed', {
        error,
        clubId,
        selectedCategory,
        exportFormat,
      });
      toast.error('Export failed. Please try again.');
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 2000);
    }
  };

  const handleDownloadEntry = async (entry: ExportHistoryEntry) => {
    try {
      const blob = await memberDataExportService.downloadExport(clubId, entry.exportId);
      triggerBlobDownload(blob, entry.fileName);
    } catch (error) {
      logger.error('analytics', 'Error downloading export', { error, exportId: entry.exportId });
      toast.error('Failed to download export. Please try again.');
    }
  };

  const handleRemoveEntry = (exportId: string) => {
    setSessionHistory((prev) => prev.filter((e) => e.exportId !== exportId));
  };

  const getAvailableFields = (category: ExportCategory['id']): string[] => {
    switch (category) {
      case 'member':
        return [
          'firstName',
          'lastName',
          'email',
          'phone',
          'membershipType',
          'joinDate',
          'engagement',
          'attendance',
          'customFields',
        ];
      case 'financial':
        return [
          'amount',
          'date',
          'description',
          'memberDetails',
          'eventDetails',
          'paymentMethod',
          'status',
        ];
      case 'analytics':
        return [
          'engagementScore',
          'eventMetrics',
          'growthData',
          'comparisons',
          'predictions',
          'segmentation',
        ];
      case 'event':
        return [
          'eventName',
          'date',
          'location',
          'rsvpCount',
          'attendeeCount',
          'engagementMetrics',
        ];
      default:
        return [];
    }
  };

  if (!hasUnlimitedAccess) {
    return (
      <Card className="p-8 text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <Download className="h-5 w-5" />
            Data Export Center
          </CardTitle>
          <CardDescription>
            Advanced data export features are available with Expand tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            Upgrade to Expand
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Export Center
          </CardTitle>
          <CardDescription>
            Export your club data in various formats for external analysis
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="exports">Export Data</TabsTrigger>
          <TabsTrigger value="scheduled">
            <Clock className="h-4 w-4 mr-1" />
            Scheduled Reports
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-1" />
            Export History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exportCategories.map((category) => (
              <Card
                key={category.id}
                className={`cursor-pointer transition-colors ${
                  selectedCategory === category.id
                    ? 'ring-2 ring-primary'
                    : 'hover:bg-muted/50'
                } ${category.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !category.disabled && setSelectedCategory(category.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {category.icon}
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                    </div>
                    {category.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {category.badge}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <ExportFormatSelector
                value={exportFormat}
                onChange={setExportFormat}
                supportedFormats={
                  selectedCategory === 'analytics'
                    ? ['csv', 'excel', 'pdf']
                    : selectedCategory === 'financial'
                    ? ['csv', 'excel', 'json', 'pdf']
                    : ['csv', 'excel', 'json']
                }
              />

              <CustomFieldSelector
                availableFields={getAvailableFields(selectedCategory)}
                selectedFields={selectedFields}
                onChange={setSelectedFields}
                category={selectedCategory}
              />
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Export Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Category:</span>
                    <Badge>{exportCategories.find((c) => c.id === selectedCategory)?.title}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Format:</span>
                    <Badge variant="outline">{exportFormat.toUpperCase()}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Fields:</span>
                    <span>{selectedFields.length} selected</span>
                  </div>

                  {isExporting && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress:</span>
                        <span>{Math.round(exportProgress)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${exportProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleExport}
                    disabled={isExporting || selectedFields.length === 0}
                    className="w-full"
                  >
                    {isExporting ? 'Exporting...' : 'Export Data'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="scheduled">
          <ScheduledReportsManager clubId={clubId} />
        </TabsContent>

        <TabsContent value="history">
          <ExportHistoryViewer
            history={sessionHistory}
            onDownload={handleDownloadEntry}
            onRemove={handleRemoveEntry}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
