import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { memberService } from '@/services/memberService';
import { MemberProfileResponse, RootStackParamList } from '@/types';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { NavigationProp } from '@react-navigation/native';
import { AccountDeletionModal } from '@/components/AccountDeletionModal';
import { FeedbackModal } from '@/components/FeedbackModal';

interface ProfileScreenProps {
  navigation: NavigationProp<RootStackParamList>;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const [profile, setProfile] = useState<MemberProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Account deletion state
  const [showAccountDeletionModal, setShowAccountDeletionModal] = useState(false);
  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Create dynamic styles with theme colors
  const styles = createStyles(colors);

  /**
   * Fetch member profile data
   */
  const fetchProfile = useCallback(async (isRefresh = false) => {
    if (!user?.user.clubId) {
      if (!isRefresh) {
        setError('No club information available');
        setLoading(false);
      }
      return;
    }
    
    if (!isRefresh) {
      setLoading(true);
    }
    
    try {
      setError(null);
      
      // Fetch only the member profile - it includes membershipTypeName
      const profileData = await memberService.getMemberProfile(user.user.clubId);
      
      setProfile(profileData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load profile data';
      
      // Consistent error handling - always set error state for better UX
      setError(errorMessage);
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  }, [user?.user.clubId]);

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile(true);
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      });
    } catch {
      return dateString;
    }
  };

  /**
   * Get membership status display
   */
  const getMembershipStatus = (): { text: string; color: string } => {
    if (!profile) {
      return { text: 'No dues information', color: colors.text.tertiary };
    }

    // For $0 membership types, there are no dues to track
    if (profile.expectedDuesAmount === 0) {
      return { text: 'No dues required', color: colors.status.success };
    }

    if (!profile.duesPaidUntil) {
      return { text: 'No dues information', color: colors.text.tertiary };
    }

    const duesDate = new Date(profile.duesPaidUntil);
    const today = new Date();
    const daysDiff = Math.ceil((duesDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) {
      return { text: 'Dues Expired', color: colors.status.error };
    } else if (daysDiff <= 30) {
      return { text: 'Dues Expiring Soon', color: colors.status.warning };
    } else {
      return { text: 'Dues Current', color: colors.status.success };
    }
  };

  /**
   * Handle edit profile button press
   */
  const handleEditProfile = () => {
    if (profile) {
      navigation.navigate('EditProfile', { profile });
    }
  };

  /**
   * Handle logout button press
   */
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ],
      { cancelable: true }
    );
  };

  /**
   * Handle membership card button press
   */
  const handleMembershipCard = () => {
    navigation.navigate('MembershipCard');
  };

  /**
   * Handle directory settings button press
   */
  const handleDirectorySettings = () => {
    navigation.navigate('DirectorySettings');
  };

  /**
   * Handle account deletion button press
   */
  const handleAccountDeletion = () => {
    setShowAccountDeletionModal(true);
  };

  /**
   * Handle send feedback button press
   */
  const handleSendFeedback = () => {
    setShowFeedbackModal(true);
  };

  /**
   * Handle account deleted callback
   */
  const handleAccountDeleted = () => {
    logout();
  };

  /**
   * Determine if the Pay Dues button should be shown
   */
  const shouldShowPayDuesButton = (): boolean => {
    if (!profile) return false;

    // Don't show Pay Dues button for $0 membership types
    if (profile.expectedDuesAmount === 0) return false;

    // Show if dues are expired or expiring within 30 days
    if (!profile.duesPaidUntil) return true;

    const duesDate = new Date(profile.duesPaidUntil);
    const today = new Date();
    const daysDiff = Math.ceil((duesDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return daysDiff <= 30; // Show if dues expire within 30 days
  };

  /**
   * Handle navigation to payment screen
   */
  const handlePayDues = () => {
    if (!profile) return;

    navigation.navigate('PayDues', {
      membershipType: {
        id: profile.membershipTypeId,
        name: profile.membershipTypeName,
        duesAmount: profile.expectedDuesAmount,
        duesFrequency: profile.duesFrequency,
      },
      duesPaidUntil: profile.duesPaidUntil,
    });
  };

  // Load profile on component mount
  // MEM-01 fix: Added isMounted check to prevent state updates on unmounted component
  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!isMounted) return;
      await fetchProfile();
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [fetchProfile, user?.user.clubId]);

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer} testID="profile-loading">
          <ActivityIndicator size="large" color={colors.interactive.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer} testID="profile-error">
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorSubtext}>Pull down to try again</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer} testID="profile-no-data">
          <Text style={styles.errorText}>No profile data available</Text>
          <Text style={styles.errorSubtext}>Pull down to refresh</Text>
        </View>
      </SafeAreaView>
    );
  }

  const membershipStatus = getMembershipStatus();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        testID="screen-profile"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title} testID="text-profile-title">
              My Profile
            </Text>
            <Text style={styles.subtitle} testID="text-profile-subtitle">
              Membership Information
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={handleEditProfile}
            style={styles.editButton}
            testID="button-edit-profile"
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Basic Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name:</Text>
            <Text style={styles.infoValue} testID="text-profile-fullname">
              {profile.fullName}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue} testID="text-profile-email">
              {profile.email}
            </Text>
          </View>

          {profile.phoneNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue} testID="text-profile-phone">
                {profile.phoneNumber}
              </Text>
            </View>
          )}

          {profile.address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue} testID="text-profile-address">
                {profile.address}
              </Text>
            </View>
          )}
        </View>

        {/* Membership Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Membership Status</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Membership Type:</Text>
            <Text style={styles.infoValue} testID="text-profile-membership-type">
              {profile.membershipTypeName}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since:</Text>
            <Text style={styles.infoValue} testID="text-profile-join-date">
              {formatDate(profile.joinDate)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: membershipStatus.color }]} />
              <Text 
                style={[styles.statusText, { color: membershipStatus.color }]}
                testID="text-profile-membership-status"
              >
                {membershipStatus.text}
              </Text>
            </View>
          </View>

          {profile.duesPaidUntil && profile.expectedDuesAmount > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Paid Until:</Text>
              <Text style={styles.infoValue} testID="text-profile-dues-paid-until">
                {formatDate(profile.duesPaidUntil)}
              </Text>
            </View>
          )}

          {/* Pay Dues Button */}
          {shouldShowPayDuesButton() && (
            <View style={styles.payDuesContainer}>
              <TouchableOpacity
                onPress={handlePayDues}
                style={styles.payDuesButton}
                testID="button-pay-dues"
              >
                <Text style={styles.payDuesButtonText}>Pay Dues Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Additional Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Additional Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member ID:</Text>
            <Text style={styles.infoValue} testID="text-profile-member-id">
              #{profile.id}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Status:</Text>
            <Text style={styles.infoValue} testID="text-profile-account-status">
              {profile.status}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Membership Card:</Text>
            <TouchableOpacity
              onPress={handleMembershipCard}
              style={styles.membershipCardButton}
              testID="button-membership-card"
            >
              <Text style={styles.membershipCardButtonText}>View Digital Card</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Custom Fields */}
        {profile.customFields && profile.customFields.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Additional Club Information</Text>
            {profile.customFields.map((field, index) => (
              <View key={index} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{field.label}:</Text>
                <Text style={styles.infoValue} testID={`text-profile-custom-${index}`}>
                  {field.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Settings & Logout */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Settings</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Feedback:</Text>
            <TouchableOpacity
              onPress={handleSendFeedback}
              style={styles.feedbackButton}
              testID="button-send-feedback"
            >
              <Text style={styles.feedbackButtonText}>Send Feedback</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Privacy Settings:</Text>
            <TouchableOpacity
              onPress={handleDirectorySettings}
              style={styles.directorySettingsButton}
              testID="button-directory-settings"
            >
              <Text style={styles.directorySettingsButtonText}>Directory Privacy</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Management:</Text>
            <TouchableOpacity
              onPress={handleAccountDeletion}
              style={styles.accountDeletionButton}
              testID="button-account-deletion"
            >
              <Text style={styles.accountDeletionButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.logoutContainer}>
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
              testID="button-logout"
            >
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>

    {/* Account Deletion Modal */}
    <AccountDeletionModal
      visible={showAccountDeletionModal}
      onClose={() => setShowAccountDeletionModal(false)}
      onAccountDeleted={handleAccountDeleted}
    />

    {/* Feedback Modal */}
    <FeedbackModal
      visible={showFeedbackModal}
      onClose={() => setShowFeedbackModal(false)}
    />
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.status.error,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  editButton: {
    backgroundColor: colors.interactive.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    ...colors.shadow.medium,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '400',
    flex: 2,
    textAlign: 'right',
  },
  infoValueText: {
    color: colors.status.success,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  feedbackButton: {
    backgroundColor: colors.interactive.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  feedbackButtonText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  directorySettingsButton: {
    backgroundColor: colors.interactive.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  directorySettingsButtonText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  accountDeletionButton: {
    backgroundColor: colors.status.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  accountDeletionButtonText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  logoutContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
  },
  logoutButton: {
    backgroundColor: colors.status.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  membershipCardButton: {
    backgroundColor: colors.interactive.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  membershipCardButtonText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  payDuesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
  },
  payDuesButton: {
    backgroundColor: colors.status.error,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  payDuesButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
}); 
