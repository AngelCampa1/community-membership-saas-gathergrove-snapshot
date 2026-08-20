import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { logger } from '../utils/logger';
import apiClient from '@/services/apiClient';
import * as Haptics from 'expo-haptics';
import { SPECIAL_COLORS } from '../constants/colors';

// Get device info for feedback
function getDeviceInfo() {
  const { width, height } = Dimensions.get('window');
  return {
    appVersion: '0.1.0', // From package.json
    osVersion: `${Platform.OS} ${Platform.Version}`,
    deviceModel: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device',
    screenResolution: `${Math.round(width)}x${Math.round(height)}`,
  };
}

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

interface FeedbackFormData {
  rating: number;
  subject: string;
  message: string;
  name: string;
  email: string;
}

const SUBJECT_OPTIONS = [
  'Feature Request',
  'Bug Report',
  'General Feedback',
  'Usability Issue',
  'Performance Issue',
  'Other',
];

const initialFormData: FeedbackFormData = {
  rating: 0,
  subject: '',
  message: '',
  name: '',
  email: '',
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onClose,
}) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FeedbackFormData>(initialFormData);

  const styles = createStyles(colors);

  // Pre-fill user info if logged in
  useEffect(() => {
    if (user?.user) {
      setFormData((prev) => ({
        ...prev,
        name: user.user.fullName || '',
        email: user.user.email || '',
      }));
    }
  }, [user]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setFormData({
        ...initialFormData,
        name: user?.user?.fullName || '',
        email: user?.user?.email || '',
      });
    }
  }, [visible, user]);

  const triggerHaptic = async (type: 'light' | 'medium' | 'success' | 'error') => {
    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    } catch {
      // Haptics not available on all devices
    }
  };

  const handleStarPress = async (star: number) => {
    await triggerHaptic('light');
    setFormData((prev) => ({ ...prev, rating: star }));
  };

  const handleSubjectSelect = async (subject: string) => {
    await triggerHaptic('light');
    setFormData((prev) => ({ ...prev, subject }));
  };

  const handleSubmit = async () => {
    if (formData.rating === 0) {
      await triggerHaptic('error');
      Alert.alert('Missing Rating', 'Please select a rating');
      return;
    }

    if (!formData.subject.trim()) {
      await triggerHaptic('error');
      Alert.alert('Missing Subject', 'Please select a subject');
      return;
    }

    if (formData.message.trim().length < 10) {
      await triggerHaptic('error');
      Alert.alert(
        'Message Too Short',
        'Please provide more detail in your message (at least 10 characters)'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const deviceInfo = getDeviceInfo();
      await apiClient.post('/feedback', {
        rating: formData.rating,
        subject: formData.subject,
        message: formData.message,
        name: formData.name || undefined,
        email: formData.email || undefined,
        platform: 'mobile',
        ...deviceInfo,
      });

      await triggerHaptic('success');
      Alert.alert('Success', 'Thank you for your feedback!', [
        { text: 'OK', onPress: onClose },
      ]);
    } catch (error) {
      logger.error('ui', 'Failed to submit feedback', error);
      await triggerHaptic('error');
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = () => (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => handleStarPress(star)}
          style={styles.starButton}
          activeOpacity={0.7}
          accessibilityLabel={`Rate ${star} out of 5 stars`}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.starText,
              star <= formData.rating
                ? styles.starFilled
                : styles.starEmpty,
            ]}
          >
            ★
          </Text>
        </TouchableOpacity>
      ))}
      {formData.rating > 0 && (
        <Text style={styles.ratingText}>{formData.rating}/5</Text>
      )}
    </View>
  );

  const SubjectChips = () => (
    <View style={styles.chipsContainer}>
      {SUBJECT_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option}
          onPress={() => handleSubjectSelect(option)}
          style={[
            styles.chip,
            formData.subject === option && styles.chipSelected,
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.chipText,
              formData.subject === option && styles.chipTextSelected,
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Send Feedback</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            disabled={isSubmitting}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.description}>
            Help us improve GatherGrove by sharing your thoughts, reporting
            issues, or requesting features.
          </Text>

          {/* Rating */}
          <View style={styles.section}>
            <Text style={styles.label}>How would you rate your experience? *</Text>
            <StarRating />
          </View>

          {/* Subject */}
          <View style={styles.section}>
            <Text style={styles.label}>Subject *</Text>
            <SubjectChips />
          </View>

          {/* Message */}
          <View style={styles.section}>
            <Text style={styles.label}>Your Feedback *</Text>
            <TextInput
              style={styles.textArea}
              value={formData.message}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, message: text }))
              }
              placeholder="Tell us what you think, describe an issue, or suggest an improvement..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              testID="feedback-message-input"
            />
          </View>

          {/* Optional contact info for guests */}
          {!user && (
            <>
              <View style={styles.section}>
                <Text style={styles.label}>Name (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, name: text }))
                  }
                  placeholder="Your name"
                  placeholderTextColor={colors.text.tertiary}
                  testID="feedback-name-input"
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Email (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, email: text }))
                  }
                  placeholder="your@email.com"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  testID="feedback-email-input"
                />
                <Text style={styles.helperText}>
                  Provide your email if you would like us to follow up with you.
                </Text>
              </View>
            </>
          )}

          {/* Show pre-filled info for logged-in users */}
          {user && (
            <View style={styles.userInfoBox}>
              <Text style={styles.userInfoText}>
                Submitting as: {formData.name} ({formData.email})
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.text.inverse} />
              ) : (
                <Text style={styles.submitButtonText}>Send Feedback</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Bottom padding for keyboard */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      fontSize: 20,
      color: colors.text.primary,
      lineHeight: 22,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    description: {
      fontSize: 14,
      color: colors.text.secondary,
      marginBottom: 24,
      lineHeight: 20,
    },
    section: {
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 12,
    },
    starContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    starButton: {
      padding: 4,
    },
    starText: {
      fontSize: 36,
    },
    starFilled: {
      color: SPECIAL_COLORS.star,
    },
    starEmpty: {
      color: colors.border.primary,
    },
    ratingText: {
      marginLeft: 12,
      fontSize: 14,
      color: colors.text.secondary,
    },
    chipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border.primary,
      backgroundColor: colors.background.secondary,
    },
    chipSelected: {
      borderColor: colors.interactive.primary,
      backgroundColor: colors.interactive.primary + '20',
    },
    chipText: {
      fontSize: 14,
      color: colors.text.primary,
    },
    chipTextSelected: {
      color: colors.interactive.primary,
      fontWeight: '600',
    },
    textArea: {
      borderWidth: 1,
      borderColor: colors.border.primary,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text.primary,
      backgroundColor: colors.background.secondary,
      minHeight: 120,
      textAlignVertical: 'top',
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border.primary,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text.primary,
      backgroundColor: colors.background.secondary,
    },
    helperText: {
      fontSize: 12,
      color: colors.text.tertiary,
      marginTop: 8,
    },
    userInfoBox: {
      backgroundColor: colors.background.secondary,
      padding: 12,
      borderRadius: 8,
      marginBottom: 24,
    },
    userInfoText: {
      fontSize: 14,
      color: colors.text.secondary,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
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
    submitButton: {
      backgroundColor: colors.interactive.primary,
    },
    submitButtonText: {
      color: colors.text.inverse,
      fontSize: 16,
      fontWeight: '600',
    },
  });
