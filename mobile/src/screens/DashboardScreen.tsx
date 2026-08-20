import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, useThemedStyles, ThemeColors } from '../contexts/ThemeContext';
import { RootStackParamList, MainTabParamList, MemberProfileResponse } from '@/types';
import { memberService } from '@/services/memberService';
import { membershipTypeService, MembershipTypeResponse } from '@/services/membershipTypeService';
import { getTouchTargetStyle, createAccessibilityLabel, getResponsiveStyle } from '../utils/accessibility';

// Fix TypeScript Icon component typing with proper props interface
interface IconProps {
  name: string;
  size: number;
  color: string;
}
const IconComponent = Icon as unknown as React.ComponentType<IconProps>;

// Navigation type for DashboardScreen
type DashboardNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Dashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface DashboardScreenProps {
  onLogout: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onLogout }) => {
  const { user, logout, loading } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<DashboardNavigationProp>();
  const insets = useSafeAreaInsets();
  
  const [memberProfile, setMemberProfile] = useState<MemberProfileResponse | null>(null);
  const [membershipType, setMembershipType] = useState<MembershipTypeResponse | null>(null);

  /**
   * Fetch member profile and membership type data
   * MEM-01 fix: Added isMounted check to prevent state updates on unmounted component
   */
  useEffect(() => {
    let isMounted = true;

    const fetchMemberData = async () => {
      if (!user?.user?.clubId) return;

      // Admin users don't have member profiles, skip fetching for them
      if (user.user.role === 'Admin') {
        return;
      }

      try {
        const profile = await memberService.getMemberProfile(user.user.clubId);
        if (!isMounted) return;
        setMemberProfile(profile);

        // Get membership types to find the current one
        if (profile.membershipTypeId) {
          const membershipTypes = await membershipTypeService.getMembershipTypes(user.user.clubId);
          if (!isMounted) return;
          const currentMembershipType = membershipTypes.find(mt => mt.id === profile.membershipTypeId);
          setMembershipType(currentMembershipType || null);
        }
      } catch (error) {
        // SILENT-04 fix: Log profile fetch errors in development
        if (__DEV__) {
          console.warn('[Dashboard] Failed to fetch member profile:', error instanceof Error ? error.message : error);
        }
      }
    };

    fetchMemberData();

    return () => {
      isMounted = false;
    };
  }, [user?.user?.clubId, user?.user?.role]);

  /**
   * Handle logout with confirmation
   */
  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              onLogout();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  /**
   * Navigation handlers for quick action buttons
   */
  const handleEventsPress = () => {
    navigation.navigate('Events');
  };

  const handleDirectoryPress = () => {
    navigation.navigate('Directory');
  };

  const handleChatPress = () => {
    navigation.navigate('Chat');
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  /**
   * Navigation handlers for quick link buttons
   */
  const handleMembershipCardPress = () => {
    // Admin users don't have member profiles or membership cards
    if (user?.user?.role === 'Admin') {
      Alert.alert('Not Available', 'Membership card is not available for admin users.');
      return;
    }
    navigation.navigate('MembershipCard');
  };

  const handlePayDuesPress = () => {
    if (!user) {
      Alert.alert('Error', 'Unable to load user information. Please try again.');
      return;
    }
    
    // Admin users don't have member profiles or dues
    if (user.user.role === 'Admin') {
      Alert.alert('Not Available', 'Dues payment is not available for admin users.');
      return;
    }
    
    if (!membershipType) {
      Alert.alert('Error', 'Unable to load membership information. Please try again.');
      return;
    }

    // Validate membership type has all required fields
    if (!membershipType.id || !membershipType.name || 
        typeof membershipType.duesAmount !== 'number' || 
        !membershipType.duesFrequency) {
      Alert.alert('Error', 'Membership information is incomplete. Please contact your club admin.');
      return;
    }
    
    // Navigate to PayDues screen with validated member data
    navigation.navigate('PayDues', {
      membershipType: {
        id: membershipType.id,
        name: membershipType.name,
        duesAmount: membershipType.duesAmount,
        duesFrequency: membershipType.duesFrequency,
      },
      duesPaidUntil: memberProfile?.duesPaidUntil,
    });
  };

  const handleThemeSettingsPress = () => {
    navigation.navigate('ThemeSettings');
  };

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText} testID="text-no-user">
          No user data available
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} testID="screen-dashboard">
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.welcomeText} testID="text-welcome">
              Welcome back!
            </Text>
            <Text style={styles.nameText} testID="text-user-name">
              {user.user.fullName}
            </Text>
            <Text style={styles.clubInfo} testID="text-club-info">
              {user.user.role === 'Admin' ? 'Admin of' : 'Member of'} {user.user.clubName || `Club ${user.user.clubId}`}
            </Text>
          </View>

        {/* Quick Actions Grid */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={[styles.actionCard, getTouchTargetStyle()]} 
              testID="action-events" 
              onPress={handleEventsPress}
              {...createAccessibilityLabel(
                'Events',
                'View upcoming events and club activities',
                'button'
              )}
            >
              <View style={styles.actionIconContainer}>
                <IconComponent name="event" size={24} color={colors.interactive.primary} />
              </View>
              <Text style={styles.actionTitle}>Events</Text>
              <Text style={styles.actionDescription}>View upcoming events</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionCard, getTouchTargetStyle()]} 
              testID="action-directory" 
              onPress={handleDirectoryPress}
              {...createAccessibilityLabel(
                'Member Directory',
                'Browse and connect with club members',
                'button'
              )}
            >
              <View style={styles.actionIconContainer}>
                <IconComponent name="people" size={24} color={colors.interactive.primary} />
              </View>
              <Text style={styles.actionTitle}>Directory</Text>
              <Text style={styles.actionDescription}>Connect with members</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionCard, getTouchTargetStyle()]} 
              testID="action-chat" 
              onPress={handleChatPress}
              {...createAccessibilityLabel(
                'Community Chat',
                'Join community discussions and conversations',
                'button'
              )}
            >
              <View style={styles.actionIconContainer}>
                <IconComponent name="chat" size={24} color={colors.interactive.primary} />
              </View>
              <Text style={styles.actionTitle}>Chat</Text>
              <Text style={styles.actionDescription}>Community discussions</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionCard, getTouchTargetStyle()]} 
              testID="action-profile" 
              onPress={handleProfilePress}
              {...createAccessibilityLabel(
                'My Profile',
                'View and update your personal information',
                'button'
              )}
            >
              <View style={styles.actionIconContainer}>
                <IconComponent name="person" size={24} color={colors.interactive.primary} />
              </View>
              <Text style={styles.actionTitle}>My Profile</Text>
              <Text style={styles.actionDescription}>Update your info</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Membership Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Membership Status</Text>
          
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Status</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusValue}>Active</Text>
              </View>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Membership Type</Text>
              <Text style={styles.statusValue}>{user.user.clubTier}</Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Member ID</Text>
              <Text style={styles.statusValue}>{user.user.userId}</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Club ID</Text>
              <Text style={styles.statusValue}>{user.user.clubId}</Text>
            </View>
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Links</Text>
          
          <TouchableOpacity 
            style={[styles.quickLinkButton, getTouchTargetStyle()]} 
            testID="quick-link-membership-card" 
            onPress={handleMembershipCardPress}
            {...createAccessibilityLabel(
              'Digital Membership Card',
              'View your digital membership card and QR code',
              'button'
            )}
          >
            <IconComponent name="credit-card" size={20} color={colors.interactive.primary} />
            <Text style={styles.quickLinkText}>Digital Membership Card</Text>
            <IconComponent name="chevron-right" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>

          {/* Only show Pay Dues button for membership types with dues > $0 */}
          {membershipType && membershipType.duesAmount > 0 && (
            <TouchableOpacity 
              style={[styles.quickLinkButton, getTouchTargetStyle()]} 
              testID="quick-link-pay-dues" 
              onPress={handlePayDuesPress}
              {...createAccessibilityLabel(
                'Pay Dues',
                'Pay your membership dues online',
                'button'
              )}
            >
              <IconComponent name="payment" size={20} color={colors.interactive.primary} />
              <Text style={styles.quickLinkText}>Pay Dues</Text>
              <IconComponent name="chevron-right" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.quickLinkButton, getTouchTargetStyle()]} 
            testID="quick-link-theme-settings" 
            onPress={handleThemeSettingsPress}
            {...createAccessibilityLabel(
              'Theme Settings',
              'Change app theme and appearance preferences',
              'button'
            )}
          >
            <IconComponent name="palette" size={20} color={colors.interactive.primary} />
            <Text style={styles.quickLinkText}>Theme Settings</Text>
            <IconComponent name="chevron-right" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loading}
          testID="button-logout"
        >
          <Text style={styles.logoutButtonText}>
            {loading ? 'Signing Out...' : 'Sign Out'}
          </Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => {
  const responsive = getResponsiveStyle();
  
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: responsive.containerPadding,
    paddingVertical: responsive.spacing.lg,
  },
  header: {
    marginBottom: 32,
    paddingTop: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  nameText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  clubInfo: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: responsive.spacing.md,
    width: responsive.isSmallScreen ? '100%' : '48%',
    marginBottom: responsive.spacing.md,
    alignItems: 'center',
    ...colors.shadow.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    // Focus indicator support (comment only - focusable not a valid ViewStyle property)
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.status.successBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: responsive.spacing.lg,
    marginBottom: responsive.spacing.lg,
    ...colors.shadow.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusItem: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: colors.status.successBackground,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  quickLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: responsive.spacing.md,
    paddingHorizontal: responsive.spacing.sm,
    borderRadius: 8,
    minHeight: 48, // Accessibility touch target
    // Focus indicator support (comment only - focusable not a valid ViewStyle property)
  },
  quickLinkText: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: colors.status.error,
    borderRadius: 12,
    paddingVertical: responsive.spacing.md,
    paddingHorizontal: responsive.spacing.lg,
    alignItems: 'center',
    marginTop: responsive.spacing.sm,
    minHeight: 48, // Accessibility touch target
    ...colors.shadow.md,
  },
  logoutButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: colors.status.error,
    textAlign: 'center',
    fontWeight: '500',
  },
  });
}; 