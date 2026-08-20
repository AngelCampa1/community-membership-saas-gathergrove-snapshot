import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '@/hooks/useAuth';
import { memberService } from '@/services/memberService';
import { UpdateMemberRequest, RootStackParamList } from '@/types';
import { useTheme, useThemedStyles, ThemeColors } from '../contexts/ThemeContext';
import { ErrorDisplay, useErrorHandler } from '@/components/ErrorDisplay';

type EditProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { profile: initialProfile } = route.params;
  
  const [formData, setFormData] = useState({
    fullName: initialProfile.fullName,
    email: initialProfile.email,
    phoneNumber: initialProfile.phoneNumber || '',
    address: initialProfile.address || '',
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const { error: apiError, handleError, clearError } = useErrorHandler();

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length > 100) {
      newErrors.fullName = 'Full name cannot exceed 100 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (formData.email.length > 255) {
      newErrors.email = 'Email cannot exceed 255 characters';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Phone number validation (optional)
    if (formData.phoneNumber && formData.phoneNumber.length > 20) {
      newErrors.phoneNumber = 'Phone number cannot exceed 20 characters';
    }

    // Address validation (optional)
    if (formData.address && formData.address.length > 500) {
      newErrors.address = 'Address cannot exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle input changes
   */
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  /**
   * Handle save button press
   */
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user?.user.clubId) {
      Alert.alert('Error', 'No club information available');
      return;
    }

    setLoading(true);

    try {
      const updateRequest: UpdateMemberRequest = {
        membershipTypeId: initialProfile.membershipTypeId,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        address: formData.address.trim() || undefined,
        hasSmsConsent: false,
        customFieldValues: initialProfile.customFields?.map(cf => ({
          customFieldId: cf.id,
          fieldValue: cf.value,
        })) || [],
      };

      await memberService.updateMemberProfile(
        user.user.clubId,
        updateRequest
      );

      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      handleError(error, 'profile_update');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle cancel button press
   */
  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} testID="screen-edit-profile">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleCancel}
          style={styles.cancelButton}
          testID="button-cancel"
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>Edit Profile</Text>
        
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          disabled={loading}
          testID="button-save"
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.text.inverse} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} testID="scroll-edit-profile">
        {/* API Error Display */}
        {apiError && (
          <ErrorDisplay
            error={apiError}
            context="profile_update"
            onRetry={clearError}
            testID="error-profile-update"
          />
        )}

        {/* Personal Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={[styles.input, errors.fullName ? styles.inputError : null]}
              value={formData.fullName}
              onChangeText={(value) => handleInputChange('fullName', value)}
              placeholder="Enter your full name"
              placeholderTextColor={colors.text.tertiary}
              testID="input-fullName"
            />
            {errors.fullName && (
              <Text style={styles.errorText} testID="error-fullName">
                {errors.fullName}
              </Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address *</Text>
            <TextInput
              style={[styles.input, errors.email ? styles.inputError : null]}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="Enter your email address"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              testID="input-email"
            />
            {errors.email && (
              <Text style={styles.errorText} testID="error-email">
                {errors.email}
              </Text>
            )}
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={[styles.input, errors.phoneNumber ? styles.inputError : null]}
              value={formData.phoneNumber}
              onChangeText={(value) => handleInputChange('phoneNumber', value)}
              placeholder="Enter your phone number"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="phone-pad"
              testID="input-phoneNumber"
            />
            {errors.phoneNumber && (
              <Text style={styles.errorText} testID="error-phoneNumber">
                {errors.phoneNumber}
              </Text>
            )}
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.address ? styles.inputError : null]}
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              placeholder="Enter your address"
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              testID="input-address"
            />
            {errors.address && (
              <Text style={styles.errorText} testID="error-address">
                {errors.address}
              </Text>
            )}
          </View>

          {/* Note about email */}
          <View style={styles.noteContainer}>
            <Text style={styles.noteText}>
              * Email address is your login credential. Changes to email may require re-authentication.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.secondary,
    ...colors.shadow.small,
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  saveButton: {
    backgroundColor: colors.interactive.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    color: colors.text.inverse,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    ...colors.shadow.small,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.secondary,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
  },
  inputError: {
    borderColor: colors.status.error,
  },
  textArea: {
    height: 80,
  },
  errorText: {
    fontSize: 12,
    color: colors.status.error,
    marginTop: 4,
  },
  noteContainer: {
    backgroundColor: colors.background.tertiary,
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  noteText: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 16,
  },
}); 
