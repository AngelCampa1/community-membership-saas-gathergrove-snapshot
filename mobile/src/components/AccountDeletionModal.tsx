import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { accountDeletionService, type AccountDeletionValidationResponse } from '@/services/accountDeletionService';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { logger } from '../utils/logger';

interface AccountDeletionModalProps {
  visible: boolean;
  onClose: () => void;
  onAccountDeleted?: () => void;
}

type Step = 'validation' | 'export' | 'confirmation' | 'processing';

export const AccountDeletionModal: React.FC<AccountDeletionModalProps> = ({
  visible,
  onClose,
  onAccountDeleted,
}) => {
  const { colors } = useTheme();
  const [step, setStep] = useState<Step>('validation');
  const [validation, setValidation] = useState<AccountDeletionValidationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [confirmDataExport, setConfirmDataExport] = useState(false);
  const [confirmUnderstanding, setConfirmUnderstanding] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');

  // Processing states
  const [deletionId, setDeletionId] = useState<string | null>(null);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  // MEM-14 fix: Track mounted state to prevent state updates on unmounted component
  const isMountedRef = useRef(true);

  // MEM-14 fix: Reset mounted state when modal visibility changes
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, [visible]);

  // MEM-14 fix: Wrap in useCallback and add isMounted checks
  const validateAccountDeletion = useCallback(async () => {
    if (!isMountedRef.current) return;
    setIsLoading(true);
    try {
      const validationData = await accountDeletionService.validateAccountDeletion();
      if (!isMountedRef.current) return;
      setValidation(validationData);
    } catch (error) {
      if (!isMountedRef.current) return;
      logger.error('auth', 'Failed to validate account deletion', error);
      Alert.alert('Error', 'Unable to validate account deletion at this time');
      onClose();
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [onClose]);

  useEffect(() => {
    if (visible && step === 'validation') {
      validateAccountDeletion();
    }
  }, [visible, step, validateAccountDeletion]);

  const handleRequestDataExport = async () => {
    setIsLoading(true);
    try {
      const result = await accountDeletionService.requestDataExport({
        format: exportFormat,
        includeMedia: false
      });
      setExportUrl(result.downloadUrl);
      Alert.alert('Success', 'Data export requested successfully');
    } catch (error) {
      logger.error('auth', 'Failed to request data export', error, { exportFormat });
      Alert.alert('Error', 'Failed to request data export');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitiateDeletion = async () => {
    if (!confirmDataExport || !confirmUnderstanding || !reason.trim()) {
      Alert.alert('Error', 'Please complete all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await accountDeletionService.initiateAccountDeletion({
        reason: reason.trim(),
        confirmDataExport,
        confirmUnderstanding,
        password: password || undefined
      });

      setDeletionId(result.deletionId);
      setStep('processing');
      Alert.alert('Success', 'Account deletion request submitted');
    } catch (error) {
      logger.error('auth', 'Failed to initiate account deletion', error, { reason: reason.trim() });
      Alert.alert('Error', 'Failed to initiate account deletion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDeletion = async () => {
    if (!deletionId) return;

    setIsLoading(true);
    try {
      await accountDeletionService.confirmAccountDeletion(deletionId);
      Alert.alert('Success', 'Account deletion confirmed');
      onAccountDeleted?.();
      onClose();
    } catch (error) {
      logger.error('auth', 'Failed to confirm account deletion', error, { deletionId });
      Alert.alert('Error', 'Failed to confirm account deletion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!deletionId) return;

    setIsLoading(true);
    try {
      await accountDeletionService.cancelAccountDeletion();
      Alert.alert('Success', 'Account deletion cancelled');
      onClose();
    } catch (error) {
      logger.error('auth', 'Failed to cancel account deletion', error, { deletionId });
      Alert.alert('Error', 'Failed to cancel account deletion');
    } finally{
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('validation');
    setPassword('');
    setReason('');
    setConfirmDataExport(false);
    setConfirmUnderstanding(false);
    setExportFormat('json');
    setDeletionId(null);
    setExportUrl(null);
    setValidation(null);
  };

  const handleClose = () => {
    if (step === 'processing' && deletionId) {
      return; // Don't allow closing while processing
    }
    resetForm();
    onClose();
  };

  const styles = createStyles(colors);

  if (!validation && step === 'validation') {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.status.error} />
            <Text style={styles.loadingText}>Validating account...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Account Deletion</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {step === 'validation' && (
            <>
              {!validation?.canDelete && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorTitle}>Account deletion is currently restricted</Text>
                  {validation?.restrictions.length > 0 && (
                    <View style={styles.restrictionsList}>
                      {validation.restrictions.map((restriction, index) => (
                        <Text key={index} style={styles.restrictionItem}>• {restriction}</Text>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {validation?.pendingObligations.length > 0 && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningTitle}>Pending obligations:</Text>
                  {validation.pendingObligations.map((obligation, index) => (
                    <Text key={index} style={styles.obligationItem}>• {obligation}</Text>
                  ))}
                </View>
              )}

              {validation && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoTitle}>Data Retention Policy</Text>
                  <Text style={styles.infoText}>
                    Your data will be retained for {validation.dataRetentionDays} days after deletion
                    for legal and compliance purposes, then permanently removed.
                  </Text>
                </View>
              )}

              {validation?.alternativeOptions.length > 0 && (
                <View style={styles.alternativeBox}>
                  <Text style={styles.alternativeTitle}>Alternative Options</Text>
                  {validation.alternativeOptions.map((option, index) => (
                    <Text key={index} style={styles.alternativeItem}>• {option}</Text>
                  ))}
                </View>
              )}

              {validation?.canDelete ? (
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleClose}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.continueButton]}
                    onPress={() => setStep('export')}
                  >
                    <Text style={styles.continueButtonText}>Continue to Data Export</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleClose}
                  >
                    <Text style={styles.cancelButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {step === 'export' && (
            <>
              <Text style={styles.sectionTitle}>Export Your Data</Text>
              <Text style={styles.sectionDescription}>
                Before deleting your account, we recommend exporting your data for your records.
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Export Format</Text>
                <View style={styles.radioGroup}>
                  {(['json', 'csv', 'pdf'] as const).map((format) => (
                    <TouchableOpacity
                      key={format}
                      style={[
                        styles.radioButton,
                        exportFormat === format && styles.radioButtonSelected
                      ]}
                      onPress={() => setExportFormat(format)}
                    >
                      <View style={[
                        styles.radioDot,
                        exportFormat === format && styles.radioDotSelected
                      ]} />
                      <Text style={[
                        styles.radioText,
                        exportFormat === format && styles.radioTextSelected
                      ]}>
                        {format.toUpperCase()} {format === 'json' && '(Recommended)'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {exportUrl && (
                <View style={styles.successBox}>
                  <Text style={styles.successText}>Your data export is ready for download</Text>
                  <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={() => {/* Handle download */}}
                  >
                    <Text style={styles.downloadButtonText}>Download Export</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setStep('validation')}
                >
                  <Text style={styles.cancelButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.exportButton]}
                  onPress={handleRequestDataExport}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.text.inverse} />
                  ) : (
                    <Text style={styles.exportButtonText}>Request Export</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.dangerButton]}
                  onPress={() => setStep('confirmation')}
                  disabled={!confirmDataExport}
                >
                  <Text style={styles.dangerButtonText}>Continue to Deletion</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'confirmation' && (
            <>
              <Text style={styles.warningTitle}>Confirm Account Deletion</Text>
              <Text style={styles.warningDescription}>
                This action cannot be undone. Please confirm your decision below.
              </Text>

              <View style={styles.dangerBox}>
                <Text style={styles.dangerBoxText}>
                  Warning: This action is permanent and cannot be undone.
                  Once your account is deleted, all your data will be permanently removed after the retention period.
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Reason for deletion (optional)</Text>
                <TextInput
                  style={styles.textArea}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Please help us understand why you're leaving..."
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.checkboxGroup}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setConfirmDataExport(!confirmDataExport)}
                >
                  <View style={[styles.checkboxSquare, confirmDataExport && styles.checkboxSquareSelected]}>
                    {confirmDataExport && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxText}>
                    I have exported my data or understand it will be lost
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setConfirmUnderstanding(!confirmUnderstanding)}
                >
                  <View style={[styles.checkboxSquare, confirmUnderstanding && styles.checkboxSquareSelected]}>
                    {confirmUnderstanding && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxText}>
                    I understand this action is permanent
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setStep('export')}
                >
                  <Text style={styles.cancelButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.dangerButton]}
                  onPress={handleInitiateDeletion}
                  disabled={isLoading || !confirmDataExport || !confirmUnderstanding}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.text.inverse} />
                  ) : (
                    <Text style={styles.dangerButtonText}>Delete My Account</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'processing' && (
            <>
              <Text style={styles.sectionTitle}>Account Deletion in Progress</Text>
              <Text style={styles.sectionDescription}>
                Your account deletion request has been submitted and is being processed.
              </Text>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Your account is scheduled for deletion. You will receive a confirmation email
                  with the exact deletion date and instructions to cancel if you change your mind.
                </Text>
              </View>

              {exportUrl && (
                <View style={styles.successBox}>
                  <Text style={styles.successText}>Your data export is ready</Text>
                  <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={() => {/* Handle download */}}
                  >
                    <Text style={styles.downloadButtonText}>Download</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancelDeletion}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.text.primary} />
                  ) : (
                    <Text style={styles.cancelButtonText}>Cancel Deletion</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.dangerButton]}
                  onPress={handleConfirmDeletion}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.text.inverse} />
                  ) : (
                    <Text style={styles.dangerButtonText}>Confirm Deletion Now</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text.secondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: colors.status.error + '20',
    borderLeftWidth: 4,
    borderLeftColor: colors.status.error,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.status.error,
    marginBottom: 10,
  },
  restrictionsList: {
    marginLeft: 10,
  },
  restrictionItem: {
    fontSize: 14,
    color: colors.status.error,
    marginBottom: 5,
  },
  warningBox: {
    backgroundColor: colors.status.warning + '20',
    borderLeftWidth: 4,
    borderLeftColor: colors.status.warning,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.status.warning,
    marginBottom: 10,
  },
  warningDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 15,
  },
  obligationItem: {
    fontSize: 14,
    color: colors.status.warning,
    marginBottom: 5,
  },
  infoBox: {
    backgroundColor: colors.status.info + '20',
    borderLeftWidth: 4,
    borderLeftColor: colors.status.info,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.status.info,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: colors.status.info,
  },
  alternativeBox: {
    backgroundColor: colors.status.warning + '20',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  alternativeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.status.warning,
    marginBottom: 10,
  },
  alternativeItem: {
    fontSize: 14,
    color: colors.status.warning,
    marginBottom: 5,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 10,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  radioGroup: {
    gap: 10,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: 8,
    marginBottom: 10,
  },
  radioButtonSelected: {
    borderColor: colors.interactive.primary,
    backgroundColor: colors.interactive.primary + '10',
  },
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.primary,
    marginRight: 12,
  },
  radioDotSelected: {
    backgroundColor: colors.interactive.primary,
    borderColor: colors.interactive.primary,
  },
  radioText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  radioTextSelected: {
    color: colors.interactive.primary,
    fontWeight: '600',
  },
  checkboxGroup: {
    marginBottom: 20,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.border.primary,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSquareSelected: {
    backgroundColor: colors.interactive.primary,
    borderColor: colors.interactive.primary,
  },
  checkmark: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  dangerBox: {
    backgroundColor: colors.status.error + '20',
    borderLeftWidth: 4,
    borderLeftColor: colors.status.error,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  dangerBoxText: {
    fontSize: 14,
    color: colors.status.error,
  },
  successBox: {
    backgroundColor: colors.status.success + '20',
    borderLeftWidth: 4,
    borderLeftColor: colors.status.success,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  successText: {
    fontSize: 14,
    color: colors.status.success,
    marginBottom: 10,
  },
  downloadButton: {
    backgroundColor: colors.status.success,
    padding: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  downloadButtonText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  cancelButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: colors.interactive.primary,
  },
  continueButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  exportButton: {
    backgroundColor: colors.status.info,
  },
  exportButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: colors.status.error,
  },
  dangerButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
});