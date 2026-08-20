import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ErrorDisplay, useErrorHandler } from './ErrorDisplay';

// Types
interface ExportJob {
  id: string;
  type: 'financial' | 'member' | 'activity' | 'scheduled';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime: Date;
  endTime?: Date;
  downloadUrl?: string;
  error?: string;
  fileName?: string;
  fileSize?: number;
  totalRecords?: number;
  processedRecords?: number;
  parameters?: Record<string, unknown>;
  user: {
    id: string;
    name: string;
  };
}

interface ExportJobTrackerProps {
  testID?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showAllJobs?: boolean;
  maxJobs?: number;
  onJobSelected?: (job: ExportJob) => void;
}

// Mock service
const mockExportJobService = {
  getJobs: async (limit?: number): Promise<ExportJob[]> => {
    // Mock data representing various export job states
    return new Promise((resolve) => {
      setTimeout(() => {
        const jobs: ExportJob[] = [
          {
            id: '1',
            type: 'financial',
            status: 'processing',
            progress: 65,
            startTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
            totalRecords: 1250,
            processedRecords: 812,
            fileName: 'financial-report-2024-09.xlsx',
            parameters: {
              dateRange: { start: '2024-09-01', end: '2024-09-30' },
              format: 'excel'
            },
            user: { id: '1', name: 'Admin User' }
          },
          {
            id: '2',
            type: 'member',
            status: 'completed',
            progress: 100,
            startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            endTime: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
            downloadUrl: 'https://example.com/exports/members-2024.csv',
            fileName: 'members-export-2024.csv',
            fileSize: 2.4 * 1024 * 1024, // 2.4 MB
            totalRecords: 450,
            processedRecords: 450,
            parameters: {
              membershipTypes: ['premium', 'standard'],
              format: 'csv'
            },
            user: { id: '1', name: 'Admin User' }
          },
          {
            id: '3',
            type: 'activity',
            status: 'failed',
            progress: 23,
            startTime: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
            endTime: new Date(Date.now() - 40 * 60 * 1000),
            error: 'Database connection timeout during export processing',
            totalRecords: 2000,
            processedRecords: 460,
            fileName: 'activity-report-failed.xlsx',
            parameters: {
              dateRange: { start: '2024-08-01', end: '2024-08-31' },
              includeDetails: true
            },
            user: { id: '2', name: 'Manager User' }
          },
          {
            id: '4',
            type: 'scheduled',
            status: 'pending',
            progress: 0,
            startTime: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
            fileName: 'monthly-financial-summary.pdf',
            parameters: {
              reportType: 'monthly_summary',
              format: 'pdf'
            },
            user: { id: 'system', name: 'System Scheduler' }
          },
          {
            id: '5',
            type: 'member',
            status: 'cancelled',
            progress: 15,
            startTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
            endTime: new Date(Date.now() - 55 * 60 * 1000),
            totalRecords: 800,
            processedRecords: 120,
            fileName: 'member-backup-cancelled.xlsx',
            user: { id: '1', name: 'Admin User' }
          }
        ];
        
        const limitedJobs = typeof limit === 'number' ? jobs.slice(0, limit) : jobs;
        resolve(limitedJobs);
      }, 500);
    });
  },
  
  cancelJob: async (jobId: string): Promise<void> => {
    // Mock API call - in real app would call actual API
    void jobId; // Mark as used for logging/API call
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  },

  retryJob: async (jobId: string): Promise<ExportJob> => {
    // Mock creating new job - in real app would call actual API
    void jobId; // Mark as used for logging/API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now().toString(),
          type: 'financial',
          status: 'pending',
          progress: 0,
          startTime: new Date(),
          fileName: 'retry-export.xlsx',
          user: { id: '1', name: 'Admin User' }
        });
      }, 1000);
    });
  },
  
  downloadJob: async (_jobId: string, downloadUrl: string): Promise<void> => {
    // In real app, this would handle file download
    await Linking.openURL(downloadUrl);
  }
};

export const ExportJobTracker: React.FC<ExportJobTrackerProps> = ({
  testID = 'export-job-tracker',
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  // showAllJobs = true, // Reserved for future filtering
  maxJobs = 50,
  onJobSelected,
}) => {
  const { colors } = useTheme();
  const { error, handleError, clearError } = useErrorHandler();
  
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ExportJob | null>(null);

  const loadJobs = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setRefreshing(isRefresh);
      
      const data = await mockExportJobService.getJobs(maxJobs);
      setJobs(data);
      clearError();
    } catch (err) {
      handleError(err, 'Loading export jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [maxJobs, handleError, clearError]);

  // Initial load
  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadJobs(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadJobs]);

  const handleCancelJob = useCallback(async (job: ExportJob) => {
    Alert.alert(
      'Cancel Export Job',
      `Are you sure you want to cancel "${job.fileName}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await mockExportJobService.cancelJob(job.id);
              await loadJobs(true); // Refresh jobs list
              Alert.alert('Success', 'Export job has been cancelled.');
            } catch (err) {
              handleError(err, 'Cancelling export job');
            }
          }
        }
      ]
    );
  }, [loadJobs, handleError]);

  const handleRetryJob = useCallback(async (job: ExportJob) => {
    try {
      await mockExportJobService.retryJob(job.id);
      await loadJobs(true); // Refresh jobs list
      Alert.alert('Success', 'Export job has been restarted.');
    } catch (err) {
      handleError(err, 'Retrying export job');
    }
  }, [loadJobs, handleError]);

  const handleDownloadJob = useCallback(async (job: ExportJob) => {
    if (!job.downloadUrl) return;
    
    try {
      await mockExportJobService.downloadJob(job.id, job.downloadUrl);
    } catch (err) {
      handleError(err, 'Downloading export file');
    }
  }, [handleError]);

  const handleJobPress = useCallback((job: ExportJob) => {
    setSelectedJob(job);
    onJobSelected?.(job);
  }, [onJobSelected]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDuration = (start: Date, end?: Date): string => {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getStatusColor = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return colors.status.success;
      case 'processing':
        return colors.interactive.primary;
      case 'pending':
        return colors.status.warning;
      case 'failed':
        return colors.status.error;
      case 'cancelled':
        return colors.text.secondary;
      default:
        return colors.text.secondary;
    }
  };

  const getTypeIcon = (type: ExportJob['type']) => {
    switch (type) {
      case 'financial':
        return '💰';
      case 'member':
        return '👥';
      case 'activity':
        return '📊';
      case 'scheduled':
        return '⏰';
      default:
        return '📄';
    }
  };

  const renderJobActions = (job: ExportJob) => {
    const actions = [];

    if (job.status === 'completed' && job.downloadUrl) {
      actions.push(
        <TouchableOpacity
          key="download"
          style={[styles.actionButton, { backgroundColor: colors.status.success }]}
          onPress={() => handleDownloadJob(job)}
          testID={`${testID}-download-${job.id}`}
        >
          <Text style={[styles.actionButtonText, { color: colors.text.inverse }]}>
            Download
          </Text>
        </TouchableOpacity>
      );
    }

    if (job.status === 'failed') {
      actions.push(
        <TouchableOpacity
          key="retry"
          style={[styles.actionButton, { backgroundColor: colors.status.warning }]}
          onPress={() => handleRetryJob(job)}
          testID={`${testID}-retry-${job.id}`}
        >
          <Text style={[styles.actionButtonText, { color: colors.text.inverse }]}>
            Retry
          </Text>
        </TouchableOpacity>
      );
    }

    if (job.status === 'processing' || job.status === 'pending') {
      actions.push(
        <TouchableOpacity
          key="cancel"
          style={[styles.actionButton, { backgroundColor: colors.status.error }]}
          onPress={() => handleCancelJob(job)}
          testID={`${testID}-cancel-${job.id}`}
        >
          <Text style={[styles.actionButtonText, { color: colors.text.inverse }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      );
    }

    return actions;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]} testID={testID}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.interactive.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.text.primary }]}>
            Loading export jobs...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]} testID={testID}>
      <ErrorDisplay error={error} onDismiss={clearError} testID={`${testID}-error`} />
      
      <View style={[styles.header, { borderBottomColor: colors.border.primary }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Export Jobs
        </Text>
        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: colors.interactive.primary }]}
          onPress={() => loadJobs(true)}
          disabled={refreshing}
          testID={`${testID}-refresh`}
        >
          {refreshing ? (
            <ActivityIndicator color={colors.text.inverse} size="small" />
          ) : (
            <Text style={[styles.refreshButtonText, { color: colors.text.inverse }]}>
              Refresh
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadJobs(true)}
            tintColor={colors.interactive.primary}
            colors={[colors.interactive.primary]}
          />
        }
      >
        {jobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              No export jobs found. Start an export to see job progress here.
            </Text>
          </View>
        ) : (
          jobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={[
                styles.jobCard,
                { 
                  backgroundColor: colors.background.secondary,
                  borderColor: selectedJob?.id === job.id ? colors.interactive.primary : colors.border.primary,
                  borderWidth: selectedJob?.id === job.id ? 2 : 1
                }
              ]}
              onPress={() => handleJobPress(job)}
              testID={`${testID}-job-${job.id}`}
            >
              <View style={styles.jobHeader}>
                <View style={styles.jobInfo}>
                  <View style={styles.jobTitleRow}>
                    <Text style={styles.typeIcon}>
                      {getTypeIcon(job.type)}
                    </Text>
                    <Text style={[styles.jobFileName, { color: colors.text.primary }]} numberOfLines={1}>
                      {job.fileName || `${job.type} export`}
                    </Text>
                  </View>
                  <View style={styles.jobMeta}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
                      <Text style={[styles.statusText, { color: colors.text.inverse }]}>
                        {job.status.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.userText, { color: colors.text.secondary }]}>
                      by {job.user.name}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Progress Bar */}
              {(job.status === 'processing' || job.status === 'pending') && (
                <View style={styles.progressSection}>
                  <View style={[styles.progressBar, { backgroundColor: colors.border.primary }]}>
                    <View
                      style={[
                        styles.progressFill,
                        { 
                          backgroundColor: colors.interactive.primary,
                          width: `${job.progress}%`
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressText, { color: colors.text.secondary }]}>
                    {job.progress}% complete
                  </Text>
                </View>
              )}

              {/* Job Details */}
              <View style={styles.jobDetails}>
                <Text style={[styles.detailText, { color: colors.text.secondary }]}>
                  Started: {job.startTime.toLocaleString()}
                </Text>
                
                {job.endTime && (
                  <Text style={[styles.detailText, { color: colors.text.secondary }]}>
                    Duration: {formatDuration(job.startTime, job.endTime)}
                  </Text>
                )}
                
                {job.totalRecords && (
                  <Text style={[styles.detailText, { color: colors.text.secondary }]}>
                    Records: {job.processedRecords || 0} / {job.totalRecords}
                  </Text>
                )}
                
                {job.fileSize && (
                  <Text style={[styles.detailText, { color: colors.text.secondary }]}>
                    Size: {formatFileSize(job.fileSize)}
                  </Text>
                )}
                
                {job.error && (
                  <Text style={[styles.errorText, { color: colors.status.error }]} numberOfLines={2}>
                    Error: {job.error}
                  </Text>
                )}
              </View>

              {/* Actions */}
              <View style={styles.jobActions}>
                {renderJobActions(job)}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  refreshButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  jobCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  jobHeader: {
    marginBottom: 12,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  jobFileName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  userText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'right',
  },
  jobDetails: {
    marginBottom: 16,
  },
  detailText: {
    fontSize: 12,
    marginBottom: 2,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  jobActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ExportJobTracker;