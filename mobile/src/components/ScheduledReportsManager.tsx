import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ErrorDisplay, useErrorHandler } from './ErrorDisplay';
import { LIGHT_THEME } from '../constants/colors';

// Types
interface ScheduledReport {
  id: string;
  name: string;
  type: 'financial' | 'member' | 'activity';
  schedule: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  format: 'pdf' | 'excel' | 'csv';
  parameters?: Record<string, string | number | boolean | Date>;
}

interface ScheduledReportsManagerProps {
  testID?: string;
  onReportScheduled?: (report: ScheduledReport) => void;
  onReportUpdated?: (report: ScheduledReport) => void;
  onReportDeleted?: (reportId: string) => void;
}

// Mock service functions (these would be implemented in actual services)
const mockScheduledReportsService = {
  getScheduledReports: async (): Promise<ScheduledReport[]> => {
    // Mock data - in real app this would come from API
    return [
      {
        id: '1',
        name: 'Monthly Financial Summary',
        type: 'financial',
        schedule: 'monthly',
        recipients: ['support@gathergrove.club'],
        enabled: true,
        lastRun: new Date(2024, 8, 1),
        nextRun: new Date(2024, 9, 1),
        format: 'pdf',
      },
      {
        id: '2',
        name: 'Weekly Member Report',
        type: 'member',
        schedule: 'weekly',
        recipients: ['support@gathergrove.club'],
        enabled: false,
        lastRun: new Date(2024, 8, 15),
        nextRun: new Date(2024, 8, 22),
        format: 'excel',
      },
    ];
  },
  
  createScheduledReport: async (report: Omit<ScheduledReport, 'id'>): Promise<ScheduledReport> => {
    return { ...report, id: Date.now().toString() };
  },
  
  updateScheduledReport: async (id: string, updates: Partial<ScheduledReport>): Promise<ScheduledReport> => {
    // Mock implementation
    const reports = await mockScheduledReportsService.getScheduledReports();
    const report = reports.find(r => r.id === id);
    if (!report) throw new Error('Report not found');
    return { ...report, ...updates };
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteScheduledReport: async (_id: string): Promise<void> => {
    // Mock implementation - id parameter for future use
  },
  
  toggleReportStatus: async (id: string, enabled: boolean): Promise<ScheduledReport> => {
    return mockScheduledReportsService.updateScheduledReport(id, { enabled });
  },
};

export const ScheduledReportsManager: React.FC<ScheduledReportsManagerProps> = ({
  testID = 'scheduled-reports-manager',
  onReportScheduled,
  onReportUpdated,
  onReportDeleted,
}) => {
  const { colors } = useTheme();
  const { error, handleError, clearError } = useErrorHandler();
  
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReport, setNewReport] = useState<Partial<ScheduledReport>>({
    name: '',
    type: 'financial',
    schedule: 'monthly',
    recipients: [],
    enabled: true,
    format: 'pdf',
  });

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const data = await mockScheduledReportsService.getScheduledReports();
      setReports(data);
    } catch (err) {
      handleError(err, 'Loading scheduled reports');
    } finally {
      setLoading(false);
    }
  }, []); // handleError removed - not needed in deps (causes infinite loop)

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleToggleReport = useCallback(async (reportId: string, enabled: boolean) => {
    try {
      const updatedReport = await mockScheduledReportsService.toggleReportStatus(reportId, enabled);
      setReports(prev => prev.map(r => r.id === reportId ? updatedReport : r));
      onReportUpdated?.(updatedReport);
    } catch (err) {
      handleError(err, 'Toggling report status');
    }
  }, [onReportUpdated]); // handleError removed from deps

  const handleDeleteReport = useCallback((report: ScheduledReport) => {
    Alert.alert(
      'Delete Scheduled Report',
      `Are you sure you want to delete "${report.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await mockScheduledReportsService.deleteScheduledReport(report.id);
              setReports(prev => prev.filter(r => r.id !== report.id));
              onReportDeleted?.(report.id);
            } catch (err) {
              handleError(err, 'Deleting scheduled report');
            }
          },
        },
      ]
    );
  }, [onReportDeleted]); // handleError removed from deps

  const handleCreateReport = useCallback(async () => {
    try {
      if (!newReport.name || !newReport.recipients?.length) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const createdReport = await mockScheduledReportsService.createScheduledReport(
        newReport as Omit<ScheduledReport, 'id'>
      );

      setReports(prev => [...prev, createdReport]);
      setShowCreateModal(false);
      setNewReport({
        name: '',
        type: 'financial',
        schedule: 'monthly',
        recipients: [],
        enabled: true,
        format: 'pdf',
      });

      onReportScheduled?.(createdReport);
      Alert.alert('Success', 'Scheduled report created successfully');
    } catch (err) {
      handleError(err, 'Creating scheduled report');
    }
  }, [newReport, onReportScheduled]); // handleError removed from deps

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString();
  };

  const getTypeColor = (type: ScheduledReport['type']) => {
    switch (type) {
      case 'financial':
        return colors.status.success;
      case 'member':
        return colors.interactive.primary;
      case 'activity':
        return colors.status.warning;
      default:
        return colors.text.secondary;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]} testID={testID}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text.primary }]}>
            Loading scheduled reports...
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
          Scheduled Reports
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.interactive.primary }]}
          onPress={() => setShowCreateModal(true)}
          testID={`${testID}-add-button`}
        >
          <Text style={[styles.addButtonText, { color: colors.text.inverse }]}>
            + Add Report
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {reports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              No scheduled reports found. Create your first automated report.
            </Text>
          </View>
        ) : (
          reports.map((report) => (
            <View
              key={report.id}
              style={[styles.reportCard, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}
              testID={`${testID}-report-${report.id}`}
            >
              <View style={styles.reportHeader}>
                <View style={styles.reportInfo}>
                  <Text style={[styles.reportName, { color: colors.text.primary }]}>
                    {report.name}
                  </Text>
                  <View style={styles.reportMeta}>
                    <View style={[styles.typeTag, { backgroundColor: getTypeColor(report.type) }]}>
                      <Text style={[styles.typeTagText, { color: colors.text.inverse }]}>
                        {report.type.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.scheduleText, { color: colors.text.secondary }]}>
                      {report.schedule.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={report.enabled}
                  onValueChange={(enabled) => handleToggleReport(report.id, enabled)}
                  trackColor={{ false: colors.border.primary, true: colors.interactive.primary }}
                  thumbColor={report.enabled ? colors.text.inverse : colors.text.secondary}
                  testID={`${testID}-toggle-${report.id}`}
                />
              </View>

              <View style={styles.reportDetails}>
                <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>
                  Recipients: {report.recipients.join(', ')}
                </Text>
                <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>
                  Format: {report.format.toUpperCase()}
                </Text>
                <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>
                  Last Run: {formatDate(report.lastRun)}
                </Text>
                <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>
                  Next Run: {formatDate(report.nextRun)}
                </Text>
              </View>

              <View style={styles.reportActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.status.warning }]}
                  onPress={() => Alert.alert('Edit', 'Edit functionality would be implemented here')}
                  testID={`${testID}-edit-${report.id}`}
                >
                  <Text style={[styles.actionButtonText, { color: colors.text.inverse }]}>
                    Edit
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.status.error }]}
                  onPress={() => handleDeleteReport(report)}
                  testID={`${testID}-delete-${report.id}`}
                >
                  <Text style={[styles.actionButtonText, { color: colors.text.inverse }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Report Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Create Scheduled Report
            </Text>

            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>
                Report Name *
              </Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.background.secondary, color: colors.text.primary, borderColor: colors.border.primary }]}
                value={newReport.name}
                onChangeText={(text) => setNewReport(prev => ({ ...prev, name: text }))}
                placeholder="Enter report name"
                placeholderTextColor={colors.text.secondary}
                testID={`${testID}-create-name-input`}
              />
            </View>

            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>
                Recipients (comma separated) *
              </Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.background.secondary, color: colors.text.primary, borderColor: colors.border.primary }]}
                value={newReport.recipients?.join(', ') || ''}
                onChangeText={(text) => setNewReport(prev => ({ 
                  ...prev, 
                  recipients: text.split(',').map(email => email.trim()).filter(Boolean)
                }))}
                placeholder="admin@example.com, manager@example.com"
                placeholderTextColor={colors.text.secondary}
                testID={`${testID}-create-recipients-input`}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.text.secondary }]}
                onPress={() => setShowCreateModal(false)}
                testID={`${testID}-create-cancel`}
              >
                <Text style={[styles.modalButtonText, { color: colors.text.inverse }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.interactive.primary }]}
                onPress={handleCreateReport}
                testID={`${testID}-create-submit`}
              >
                <Text style={[styles.modalButtonText, { color: colors.text.inverse }]}>
                  Create
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
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
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  reportCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  reportDetails: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  reportActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: LIGHT_THEME.background.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 44,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ScheduledReportsManager;