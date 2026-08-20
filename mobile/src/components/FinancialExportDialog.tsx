import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ErrorDisplay, useErrorHandler } from './ErrorDisplay';
import { LIGHT_THEME } from '../constants/colors';

// Types
interface FinancialExportOptions {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  includeTransactions: boolean;
  includeDonations: boolean;
  includeMemberships: boolean;
  includeEvents: boolean;
  format: 'pdf' | 'excel' | 'csv';
  groupBy: 'date' | 'category' | 'member' | 'none';
  includeSummary: boolean;
  includeDetails: boolean;
}

interface FinancialExportDialogProps {
  visible: boolean;
  onClose: () => void;
  onExport: (options: FinancialExportOptions) => Promise<void>;
  testID?: string;
}

interface ExportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  error?: string;
}

// Mock service
const mockFinancialExportService = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  startExport: async (_options: FinancialExportOptions): Promise<ExportJob> => {
    // Note: options parameter reserved for future API implementation
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now().toString(),
          status: 'processing',
          progress: 0,
        });
      }, 1000);
    });
  },
  
  getExportStatus: async (jobId: string): Promise<ExportJob> => {
    // Mock progressive status updates
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: jobId,
          status: 'completed',
          progress: 100,
          downloadUrl: `https://example.com/exports/${jobId}.xlsx`,
        });
      }, 2000);
    });
  },
};

export const FinancialExportDialog: React.FC<FinancialExportDialogProps> = ({
  visible,
  onClose,
  onExport,
  testID = 'financial-export-dialog',
}) => {
  const { colors } = useTheme();
  const { error, handleError, clearError } = useErrorHandler();
  
  const [exportOptions, setExportOptions] = useState<FinancialExportOptions>({
    dateRange: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
      endDate: new Date(), // Today
    },
    includeTransactions: true,
    includeDonations: true,
    includeMemberships: true,
    includeEvents: false,
    format: 'excel',
    groupBy: 'date',
    includeSummary: true,
    includeDetails: true,
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportJob, setExportJob] = useState<ExportJob | null>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const updateOption = useCallback(<K extends keyof FinancialExportOptions>(
    key: K,
    value: FinancialExportOptions[K]
  ) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleStartExport = useCallback(async () => {
    try {
      setIsExporting(true);
      clearError();
      
      // Validate options
      if (exportOptions.dateRange.startDate > exportOptions.dateRange.endDate) {
        Alert.alert('Invalid Date Range', 'Start date must be before end date.');
        return;
      }

      if (!exportOptions.includeTransactions && !exportOptions.includeDonations && 
          !exportOptions.includeMemberships && !exportOptions.includeEvents) {
        Alert.alert('No Data Selected', 'Please select at least one data type to export.');
        return;
      }

      // Start export job
      const job = await mockFinancialExportService.startExport(exportOptions);
      setExportJob(job);
      
      // Call parent handler
      await onExport(exportOptions);
      
      // Poll for completion (in real app, you'd use WebSocket or polling)
      setTimeout(async () => {
        try {
          const completedJob = await mockFinancialExportService.getExportStatus(job.id);
          setExportJob(completedJob);
          
          if (completedJob.status === 'completed') {
            Alert.alert(
              'Export Complete', 
              'Your financial data has been exported successfully. Check your downloads folder.',
              [
                { text: 'OK', onPress: onClose }
              ]
            );
          } else if (completedJob.status === 'failed') {
            handleError(new Error(completedJob.error || 'Export failed'), 'Financial export');
          }
        } catch (err) {
          handleError(err, 'Checking export status');
        } finally {
          setIsExporting(false);
        }
      }, 3000);
      
    } catch (err) {
      handleError(err, 'Starting financial export');
      setIsExporting(false);
    }
  }, [exportOptions, onExport, onClose, handleError, clearError]);

  const handleClose = useCallback(() => {
    if (!isExporting) {
      setExportJob(null);
      clearError();
      onClose();
    }
  }, [isExporting, onClose, clearError]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
          <ErrorDisplay error={error} onDismiss={clearError} testID={`${testID}-error`} />
          
          <View style={[styles.header, { borderBottomColor: colors.border.primary }]}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Export Financial Data
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={isExporting}
              testID={`${testID}-close`}
            >
              <Text style={[styles.closeButtonText, { color: colors.text.secondary }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Date Range Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Date Range
              </Text>
              <View style={[styles.dateRangeContainer, { borderColor: colors.border.primary }]}>
                <Text style={[styles.dateText, { color: colors.text.secondary }]}>
                  {formatDate(exportOptions.dateRange.startDate)} - {formatDate(exportOptions.dateRange.endDate)}
                </Text>
                <TouchableOpacity
                  style={[styles.changeDateButton, { backgroundColor: colors.interactive.primary }]}
                  onPress={() => Alert.alert('Date Picker', 'Date picker would be implemented here')}
                  testID={`${testID}-change-date`}
                >
                  <Text style={[styles.changeDateButtonText, { color: colors.text.inverse }]}>
                    Change
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Data Types Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Include Data Types
              </Text>
              
              <View style={styles.optionRow}>
                <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
                  Transactions
                </Text>
                <Switch
                  value={exportOptions.includeTransactions}
                  onValueChange={(value) => updateOption('includeTransactions', value)}
                  trackColor={{ false: colors.border.primary, true: colors.interactive.primary }}
                  thumbColor={exportOptions.includeTransactions ? colors.text.inverse : colors.text.secondary}
                  testID={`${testID}-include-transactions`}
                />
              </View>

              <View style={styles.optionRow}>
                <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
                  Donations
                </Text>
                <Switch
                  value={exportOptions.includeDonations}
                  onValueChange={(value) => updateOption('includeDonations', value)}
                  trackColor={{ false: colors.border.primary, true: colors.interactive.primary }}
                  thumbColor={exportOptions.includeDonations ? colors.text.inverse : colors.text.secondary}
                  testID={`${testID}-include-donations`}
                />
              </View>

              <View style={styles.optionRow}>
                <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
                  Memberships
                </Text>
                <Switch
                  value={exportOptions.includeMemberships}
                  onValueChange={(value) => updateOption('includeMemberships', value)}
                  trackColor={{ false: colors.border.primary, true: colors.interactive.primary }}
                  thumbColor={exportOptions.includeMemberships ? colors.text.inverse : colors.text.secondary}
                  testID={`${testID}-include-memberships`}
                />
              </View>

              <View style={styles.optionRow}>
                <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
                  Events
                </Text>
                <Switch
                  value={exportOptions.includeEvents}
                  onValueChange={(value) => updateOption('includeEvents', value)}
                  trackColor={{ false: colors.border.primary, true: colors.interactive.primary }}
                  thumbColor={exportOptions.includeEvents ? colors.text.inverse : colors.text.secondary}
                  testID={`${testID}-include-events`}
                />
              </View>
            </View>

            {/* Format Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Export Format
              </Text>
              <View style={styles.formatOptions}>
                {(['excel', 'csv', 'pdf'] as const).map((format) => (
                  <TouchableOpacity
                    key={format}
                    style={[
                      styles.formatOption,
                      { 
                        backgroundColor: exportOptions.format === format 
                          ? colors.interactive.primary 
                          : colors.background.secondary,
                        borderColor: colors.border.primary 
                      }
                    ]}
                    onPress={() => updateOption('format', format)}
                    testID={`${testID}-format-${format}`}
                  >
                    <Text style={[
                      styles.formatOptionText,
                      { 
                        color: exportOptions.format === format 
                          ? colors.text.inverse 
                          : colors.text.primary 
                      }
                    ]}>
                      {format.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Group By Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Group Data By
              </Text>
              <View style={styles.formatOptions}>
                {(['date', 'category', 'member', 'none'] as const).map((groupBy) => (
                  <TouchableOpacity
                    key={groupBy}
                    style={[
                      styles.formatOption,
                      { 
                        backgroundColor: exportOptions.groupBy === groupBy 
                          ? colors.interactive.primary 
                          : colors.background.secondary,
                        borderColor: colors.border.primary 
                      }
                    ]}
                    onPress={() => updateOption('groupBy', groupBy)}
                    testID={`${testID}-group-${groupBy}`}
                  >
                    <Text style={[
                      styles.formatOptionText,
                      { 
                        color: exportOptions.groupBy === groupBy 
                          ? colors.text.inverse 
                          : colors.text.primary 
                      }
                    ]}>
                      {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Additional Options */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Additional Options
              </Text>
              
              <View style={styles.optionRow}>
                <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
                  Include Summary
                </Text>
                <Switch
                  value={exportOptions.includeSummary}
                  onValueChange={(value) => updateOption('includeSummary', value)}
                  trackColor={{ false: colors.border.primary, true: colors.interactive.primary }}
                  thumbColor={exportOptions.includeSummary ? colors.text.inverse : colors.text.secondary}
                  testID={`${testID}-include-summary`}
                />
              </View>

              <View style={styles.optionRow}>
                <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
                  Include Details
                </Text>
                <Switch
                  value={exportOptions.includeDetails}
                  onValueChange={(value) => updateOption('includeDetails', value)}
                  trackColor={{ false: colors.border.primary, true: colors.interactive.primary }}
                  thumbColor={exportOptions.includeDetails ? colors.text.inverse : colors.text.secondary}
                  testID={`${testID}-include-details`}
                />
              </View>
            </View>

            {/* Export Progress */}
            {exportJob && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  Export Progress
                </Text>
                <View style={[styles.progressContainer, { backgroundColor: colors.background.secondary }]}>
                  <Text style={[styles.progressText, { color: colors.text.primary }]}>
                    Status: {exportJob.status.charAt(0).toUpperCase() + exportJob.status.slice(1)}
                  </Text>
                  <Text style={[styles.progressText, { color: colors.text.secondary }]}>
                    Progress: {exportJob.progress}%
                  </Text>
                  {isExporting && (
                    <ActivityIndicator 
                      color={colors.interactive.primary} 
                      style={styles.loadingIndicator} 
                    />
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border.primary }]}>
            <TouchableOpacity
              style={[styles.footerButton, { backgroundColor: colors.text.secondary }]}
              onPress={handleClose}
              disabled={isExporting}
              testID={`${testID}-cancel`}
            >
              <Text style={[styles.footerButtonText, { color: colors.text.inverse }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.footerButton, 
                { 
                  backgroundColor: isExporting ? colors.text.secondary : colors.interactive.primary,
                  opacity: isExporting ? 0.6 : 1 
                }
              ]}
              onPress={handleStartExport}
              disabled={isExporting}
              testID={`${testID}-export`}
            >
              {isExporting ? (
                <ActivityIndicator color={colors.text.inverse} size="small" />
              ) : (
                <Text style={[styles.footerButtonText, { color: colors.text.inverse }]}>
                  Start Export
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: LIGHT_THEME.background.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 14,
  },
  changeDateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  changeDateButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  optionLabel: {
    fontSize: 14,
    flex: 1,
  },
  formatOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formatOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  formatOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressContainer: {
    padding: 12,
    borderRadius: 8,
  },
  progressText: {
    fontSize: 14,
    marginBottom: 4,
  },
  loadingIndicator: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  footerButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FinancialExportDialog;