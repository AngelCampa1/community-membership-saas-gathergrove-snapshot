import React, { useState, useCallback, useEffect } from 'react';
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
  TextInput,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ErrorDisplay, useErrorHandler } from './ErrorDisplay';
import { LIGHT_THEME } from '../constants/colors';

// Types
interface MemberExportOptions {
  includePersonalInfo: boolean;
  includeContactInfo: boolean;
  includeMembershipDetails: boolean;
  includePaymentHistory: boolean;
  includeActivityHistory: boolean;
  includePreferences: boolean;
  format: 'excel' | 'csv' | 'pdf';
  membershipTypes: string[];
  memberStatus: ('active' | 'inactive' | 'pending')[];
  customFields: string[];
  sortBy: 'name' | 'joinDate' | 'membershipType' | 'lastActivity';
  sortOrder: 'asc' | 'desc';
  includeMemberPhotos: boolean;
  anonymizeData: boolean;
}

interface MemberExportDialogProps {
  visible: boolean;
  onClose: () => void;
  onExport: (options: MemberExportOptions) => Promise<void>;
  testID?: string;
}

interface MembershipType {
  id: string;
  name: string;
  memberCount: number;
}

interface ExportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  error?: string;
  totalMembers?: number;
  processedMembers?: number;
}

// Mock data and services
const mockMembershipTypes: MembershipType[] = [
  { id: '1', name: 'Premium Member', memberCount: 150 },
  { id: '2', name: 'Standard Member', memberCount: 300 },
  { id: '3', name: 'Student Member', memberCount: 75 },
  { id: '4', name: 'Senior Member', memberCount: 90 },
];

const mockMemberDataExportService = {
  startExport: async (_options: MemberExportOptions): Promise<ExportJob> => {
    const totalMembers = mockMembershipTypes
      .filter(type => _options.membershipTypes.includes(type.id))
      .reduce((sum, type) => sum + type.memberCount, 0);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now().toString(),
          status: 'processing',
          progress: 0,
          totalMembers,
          processedMembers: 0,
        });
      }, 1000);
    });
  },
  
  getExportStatus: async (jobId: string): Promise<ExportJob> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: jobId,
          status: 'completed',
          progress: 100,
          totalMembers: 250,
          processedMembers: 250,
          downloadUrl: `https://example.com/exports/members-${jobId}.xlsx`,
        });
      }, 3000);
    });
  },
  
  getMembershipTypes: async (): Promise<MembershipType[]> => {
    return mockMembershipTypes;
  },
};

export const MemberExportDialog: React.FC<MemberExportDialogProps> = ({
  visible,
  onClose,
  onExport,
  testID = 'member-export-dialog',
}) => {
  const { colors } = useTheme();
  const { error, handleError, clearError } = useErrorHandler();
  
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [exportOptions, setExportOptions] = useState<MemberExportOptions>({
    includePersonalInfo: true,
    includeContactInfo: true,
    includeMembershipDetails: true,
    includePaymentHistory: false,
    includeActivityHistory: false,
    includePreferences: false,
    format: 'excel',
    membershipTypes: [],
    memberStatus: ['active'],
    customFields: [],
    sortBy: 'name',
    sortOrder: 'asc',
    includeMemberPhotos: false,
    anonymizeData: false,
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportJob, setExportJob] = useState<ExportJob | null>(null);
  const [customFieldInput, setCustomFieldInput] = useState('');

  const loadMembershipTypes = useCallback(async () => {
    try {
      const types = await mockMemberDataExportService.getMembershipTypes();
      setMembershipTypes(types);
      // Pre-select all membership types
      setExportOptions(prev => ({
        ...prev,
        membershipTypes: types.map(t => t.id),
      }));
    } catch (err) {
      handleError(err, 'Loading membership types');
    }
  }, [handleError]);

  // Load membership types when dialog opens
  useEffect(() => {
    if (visible) {
      loadMembershipTypes();
    }
  }, [visible, loadMembershipTypes]);

  const updateOption = useCallback(<K extends keyof MemberExportOptions>(
    key: K,
    value: MemberExportOptions[K]
  ) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleMembershipType = useCallback((typeId: string) => {
    setExportOptions(prev => ({
      ...prev,
      membershipTypes: prev.membershipTypes.includes(typeId)
        ? prev.membershipTypes.filter(id => id !== typeId)
        : [...prev.membershipTypes, typeId],
    }));
  }, []);

  const toggleMemberStatus = useCallback((status: 'active' | 'inactive' | 'pending') => {
    setExportOptions(prev => ({
      ...prev,
      memberStatus: prev.memberStatus.includes(status)
        ? prev.memberStatus.filter(s => s !== status)
        : [...prev.memberStatus, status],
    }));
  }, []);

  const addCustomField = useCallback(() => {
    if (customFieldInput.trim()) {
      setExportOptions(prev => ({
        ...prev,
        customFields: [...prev.customFields, customFieldInput.trim()],
      }));
      setCustomFieldInput('');
    }
  }, [customFieldInput]);

  const removeCustomField = useCallback((field: string) => {
    setExportOptions(prev => ({
      ...prev,
      customFields: prev.customFields.filter(f => f !== field),
    }));
  }, []);

  const proceedWithExport = useCallback(async () => {
    try {
      // Start export job
      const job = await mockMemberDataExportService.startExport(exportOptions);
      setExportJob(job);
      
      // Call parent handler
      await onExport(exportOptions);
      
      // Poll for completion
      setTimeout(async () => {
        try {
          const completedJob = await mockMemberDataExportService.getExportStatus(job.id);
          setExportJob(completedJob);
          
          if (completedJob.status === 'completed') {
            Alert.alert(
              'Export Complete', 
              `Successfully exported data for ${completedJob.processedMembers} members. Check your downloads folder.`,
              [
                { text: 'OK', onPress: onClose }
              ]
            );
          } else if (completedJob.status === 'failed') {
            handleError(new Error(completedJob.error || 'Export failed'), 'Member export');
          }
        } catch (err) {
          handleError(err, 'Checking export status');
        } finally {
          setIsExporting(false);
        }
      }, 4000);
      
    } catch (err) {
      handleError(err, 'Processing member export');
      setIsExporting(false);
    }
  }, [exportOptions, onExport, onClose, handleError]);

  const handleStartExport = useCallback(async () => {
    try {
      setIsExporting(true);
      clearError();
      
      // Validate options
      if (exportOptions.membershipTypes.length === 0) {
        Alert.alert('No Membership Types', 'Please select at least one membership type.');
        return;
      }

      if (exportOptions.memberStatus.length === 0) {
        Alert.alert('No Member Status', 'Please select at least one member status.');
        return;
      }

      if (!exportOptions.includePersonalInfo && !exportOptions.includeContactInfo && 
          !exportOptions.includeMembershipDetails && !exportOptions.includePaymentHistory &&
          !exportOptions.includeActivityHistory && !exportOptions.includePreferences) {
        Alert.alert('No Data Selected', 'Please select at least one data category to include.');
        return;
      }

      // Show privacy warning if including sensitive data
      if ((exportOptions.includePaymentHistory || exportOptions.includePersonalInfo) && 
          !exportOptions.anonymizeData) {
        Alert.alert(
          'Privacy Warning',
          'You are about to export sensitive member data including personal and payment information. Please ensure you have proper authorization and will handle this data securely.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Continue',
              style: 'default',
              onPress: () => proceedWithExport()
            }
          ]
        );
        return;
      }

      await proceedWithExport();
      
    } catch (err) {
      handleError(err, 'Starting member export');
      setIsExporting(false);
    }
  }, [exportOptions, handleError, clearError, proceedWithExport]);

  const handleClose = useCallback(() => {
    if (!isExporting) {
      setExportJob(null);
      setCustomFieldInput('');
      clearError();
      onClose();
    }
  }, [isExporting, onClose, clearError]);

  const getTotalMemberCount = useCallback(() => {
    return membershipTypes
      .filter(type => exportOptions.membershipTypes.includes(type.id))
      .reduce((sum, type) => sum + type.memberCount, 0);
  }, [membershipTypes, exportOptions.membershipTypes]);

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
              Export Member Data
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
            {/* Member Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Select Members ({getTotalMemberCount()} total)
              </Text>
              
              {/* Membership Types */}
              <Text style={[styles.subsectionTitle, { color: colors.text.secondary }]}>
                Membership Types
              </Text>
              {membershipTypes.map(type => (
                <View key={type.id} style={styles.optionRow}>
                  <View style={styles.optionLabelContainer}>
                    <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
                      {type.name}
                    </Text>
                    <Text style={[styles.memberCount, { color: colors.text.secondary }]}>
                      ({type.memberCount} members)
                    </Text>
                  </View>
                  <Switch
                    value={exportOptions.membershipTypes.includes(type.id)}
                    onValueChange={() => toggleMembershipType(type.id)}
                    trackColor={{ false: colors.border.primary, true: colors.interactive.primary }}
                    thumbColor={exportOptions.membershipTypes.includes(type.id) ? colors.text.inverse : colors.text.secondary}
                    testID={`${testID}-membership-${type.id}`}
                  />
                </View>
              ))}

              {/* Member Status */}
              <Text style={[styles.subsectionTitle, { color: colors.text.secondary }]}>
                Member Status
              </Text>
              {(['active', 'inactive', 'pending'] as const).map(status => (
                <View key={status} style={styles.optionRow}>
                  <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)} Members
                  </Text>
                  <Switch
                    value={exportOptions.memberStatus.includes(status)}
                    onValueChange={() => toggleMemberStatus(status)}
                    trackColor={{ false: colors.border.primary, true: colors.interactive.primary }}
                    thumbColor={exportOptions.memberStatus.includes(status) ? colors.text.inverse : colors.text.secondary}
                    testID={`${testID}-status-${status}`}
                  />
                </View>
              ))}
            </View>

            {/* Data Categories */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Include Data Categories
              </Text>
              
              <View style={styles.optionRow}>
                <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
                  Personal Information
                </Text>
                <Switch
                  value={exportOptions.includePersonalInfo}
                  onValueChange={(value) => updateOption('includePersonalInfo', value)}
                  trackColor={{ false: colors.border.primary, true: colors.interactive.primary }}
                  thumbColor={exportOptions.includePersonalInfo ? colors.text.inverse : colors.text.secondary}
                  testID={`${testID}-include-personal`}
                />
              </View>

              <View style={styles.optionRow}>
                <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
                  Contact Information
                </Text>
                <Switch
                  value={exportOptions.includeContactInfo}
                  onValueChange={(value) => updateOption('includeContactInfo', value)}
                  trackColor={{ false: colors.border.primary, true: colors.interactive.primary }}
                  thumbColor={exportOptions.includeContactInfo ? colors.text.inverse : colors.text.secondary}
                  testID={`${testID}-include-contact`}
                />
              </View>

              <View style={styles.optionRow}>
                <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
                  Membership Details
                </Text>
                <Switch
                  value={exportOptions.includeMembershipDetails}
                  onValueChange={(value) => updateOption('includeMembershipDetails', value)}
                  trackColor={{ false: colors.border.primary, true: colors.interactive.primary }}
                  thumbColor={exportOptions.includeMembershipDetails ? colors.text.inverse : colors.text.secondary}
                  testID={`${testID}-include-membership`}
                />
              </View>

              <View style={styles.optionRow}>
                <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
                  Payment History
                </Text>
                <Switch
                  value={exportOptions.includePaymentHistory}
                  onValueChange={(value) => updateOption('includePaymentHistory', value)}
                  trackColor={{ false: colors.border.primary, true: colors.interactive.primary }}
                  thumbColor={exportOptions.includePaymentHistory ? colors.text.inverse : colors.text.secondary}
                  testID={`${testID}-include-payment`}
                />
              </View>

              <View style={styles.optionRow}>
                <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
                  Activity History
                </Text>
                <Switch
                  value={exportOptions.includeActivityHistory}
                  onValueChange={(value) => updateOption('includeActivityHistory', value)}
                  trackColor={{ false: colors.border.primary, true: colors.interactive.primary }}
                  thumbColor={exportOptions.includeActivityHistory ? colors.text.inverse : colors.text.secondary}
                  testID={`${testID}-include-activity`}
                />
              </View>

              <View style={styles.optionRow}>
                <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
                  Member Preferences
                </Text>
                <Switch
                  value={exportOptions.includePreferences}
                  onValueChange={(value) => updateOption('includePreferences', value)}
                  trackColor={{ false: colors.border.primary, true: colors.interactive.primary }}
                  thumbColor={exportOptions.includePreferences ? colors.text.inverse : colors.text.secondary}
                  testID={`${testID}-include-preferences`}
                />
              </View>

              <View style={styles.optionRow}>
                <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
                  Member Photos
                </Text>
                <Switch
                  value={exportOptions.includeMemberPhotos}
                  onValueChange={(value) => updateOption('includeMemberPhotos', value)}
                  trackColor={{ false: colors.border.primary, true: colors.interactive.primary }}
                  thumbColor={exportOptions.includeMemberPhotos ? colors.text.inverse : colors.text.secondary}
                  testID={`${testID}-include-photos`}
                />
              </View>
            </View>

            {/* Custom Fields */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Custom Fields
              </Text>
              
              <View style={styles.customFieldInput}>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: colors.background.secondary, 
                    color: colors.text.primary, 
                    borderColor: colors.border.primary 
                  }]}
                  value={customFieldInput}
                  onChangeText={setCustomFieldInput}
                  placeholder="Add custom field name"
                  placeholderTextColor={colors.text.secondary}
                  testID={`${testID}-custom-field-input`}
                />
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: colors.interactive.primary }]}
                  onPress={addCustomField}
                  testID={`${testID}-add-custom-field`}
                >
                  <Text style={[styles.addButtonText, { color: colors.text.inverse }]}>
                    Add
                  </Text>
                </TouchableOpacity>
              </View>

              {exportOptions.customFields.map((field, index) => (
                <View key={index} style={styles.customFieldRow}>
                  <Text style={[styles.customFieldText, { color: colors.text.primary }]}>
                    {field}
                  </Text>
                  <TouchableOpacity
                    style={[styles.removeButton, { backgroundColor: colors.status.error }]}
                    onPress={() => removeCustomField(field)}
                    testID={`${testID}-remove-field-${index}`}
                  >
                    <Text style={[styles.removeButtonText, { color: colors.text.inverse }]}>
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Format and Options */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Export Options
              </Text>
              
              {/* Format */}
              <Text style={[styles.subsectionTitle, { color: colors.text.secondary }]}>
                Format
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

              {/* Sort Options */}
              <Text style={[styles.subsectionTitle, { color: colors.text.secondary }]}>
                Sort By
              </Text>
              <View style={styles.formatOptions}>
                {(['name', 'joinDate', 'membershipType', 'lastActivity'] as const).map((sortBy) => (
                  <TouchableOpacity
                    key={sortBy}
                    style={[
                      styles.formatOption,
                      { 
                        backgroundColor: exportOptions.sortBy === sortBy 
                          ? colors.interactive.primary 
                          : colors.background.secondary,
                        borderColor: colors.border.primary 
                      }
                    ]}
                    onPress={() => updateOption('sortBy', sortBy)}
                    testID={`${testID}-sort-${sortBy}`}
                  >
                    <Text style={[
                      styles.formatOptionText,
                      { 
                        color: exportOptions.sortBy === sortBy 
                          ? colors.text.inverse 
                          : colors.text.primary 
                      }
                    ]}>
                      {sortBy === 'joinDate' ? 'Join Date' : 
                       sortBy === 'membershipType' ? 'Membership' :
                       sortBy === 'lastActivity' ? 'Last Activity' :
                       sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sort Order */}
              <View style={styles.formatOptions}>
                {(['asc', 'desc'] as const).map((order) => (
                  <TouchableOpacity
                    key={order}
                    style={[
                      styles.formatOption,
                      { 
                        backgroundColor: exportOptions.sortOrder === order 
                          ? colors.interactive.primary 
                          : colors.background.secondary,
                        borderColor: colors.border.primary 
                      }
                    ]}
                    onPress={() => updateOption('sortOrder', order)}
                    testID={`${testID}-order-${order}`}
                  >
                    <Text style={[
                      styles.formatOptionText,
                      { 
                        color: exportOptions.sortOrder === order 
                          ? colors.text.inverse 
                          : colors.text.primary 
                      }
                    ]}>
                      {order === 'asc' ? 'Ascending' : 'Descending'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Privacy Options */}
              <View style={styles.optionRow}>
                <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
                  Anonymize Sensitive Data
                </Text>
                <Switch
                  value={exportOptions.anonymizeData}
                  onValueChange={(value) => updateOption('anonymizeData', value)}
                  trackColor={{ false: colors.border.primary, true: colors.interactive.primary }}
                  thumbColor={exportOptions.anonymizeData ? colors.text.inverse : colors.text.secondary}
                  testID={`${testID}-anonymize`}
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
                  {exportJob.totalMembers && (
                    <Text style={[styles.progressText, { color: colors.text.secondary }]}>
                      Progress: {exportJob.processedMembers || 0}/{exportJob.totalMembers} members
                    </Text>
                  )}
                  <Text style={[styles.progressText, { color: colors.text.secondary }]}>
                    {exportJob.progress}% Complete
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
                  Export {getTotalMemberCount()} Members
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
    maxHeight: '95%',
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
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  optionLabelContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
  },
  memberCount: {
    fontSize: 12,
    marginTop: 2,
  },
  customFieldInput: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 44,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  customFieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  customFieldText: {
    fontSize: 14,
    flex: 1,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  formatOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
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

export default MemberExportDialog;