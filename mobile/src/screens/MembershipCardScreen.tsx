import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { membershipCardService, MembershipCardResponse } from '@/services/membershipCardService';
import { useTheme, useThemedStyles, ThemeColors } from '../contexts/ThemeContext';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { RootStackParamList } from '@/types';

type MembershipCardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MembershipCard'>;

interface MembershipCardScreenProps {
  navigation: MembershipCardNavigationProp;
}

export const MembershipCardScreen: React.FC<MembershipCardScreenProps> = ({ navigation }) => {
  const [cardData, setCardData] = useState<MembershipCardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();

  /**
   * Fetch membership card data
   */
  const fetchCardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await membershipCardService.getMembershipCard();
      setCardData(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to load your membership card. Please check your connection and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
   * Get membership status based on expiry date
   */
  const getMembershipStatus = (): { text: string; color: string } => {
    if (!cardData?.membershipExpiresAt) {
      return { text: 'Unknown', color: colors.text.secondary };
    }

    const expiryDate = new Date(cardData.membershipExpiresAt);
    const today = new Date();
    const daysDiff = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) {
      return { text: 'Expired', color: colors.status.error };
    } else if (daysDiff <= 30) {
      return { text: 'Expiring Soon', color: colors.status.warning };
    } else {
      return { text: 'Active', color: colors.status.success };
    }
  };

  /**
   * Handle retry button press
   */
  const handleRetry = () => {
    fetchCardData();
  };

  /**
   * Handle pull to refresh
   */
  const onRefresh = useCallback(() => {
    fetchCardData(true);
  }, [fetchCardData]);

  /**
   * Handle back button press
   */
  const handleBack = () => {
    navigation.goBack();
  };

  // Load card data on mount
  // MEM-01 fix: Added isMounted check to prevent state updates on unmounted component
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!isMounted) return;
      await fetchCardData();
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [fetchCardData]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]} testID="membership-card-loading">
        <ActivityIndicator size="large" color={colors.interactive.primary} />
        <Text style={styles.loadingText}>Loading membership card...</Text>
      </View>
    );
  }

  if (error || !cardData) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]} testID="membership-card-error">
        <ErrorDisplay
          error={error || 'Membership card data not available'}
          context="membership_card"
          onRetry={handleRetry}
          testID="error-membership-card"
        />
        <TouchableOpacity onPress={handleBack} style={styles.backButton} testID="button-back">
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const membershipStatus = getMembershipStatus();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="screen-membership-card">
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.interactive.primary]}
            tintColor={colors.interactive.primary}
          />
        }
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButtonHeader} testID="button-back-header">
              <Text style={styles.backButtonHeaderText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Digital Membership Card</Text>
          </View>

        {/* Membership Card */}
        <View style={styles.card}>
          {/* Member Name */}
          <Text style={styles.memberName} testID="text-member-name">
            {cardData.fullName}
          </Text>

          {/* Membership Type */}
          <Text style={styles.membershipType} testID="text-membership-type">
            {cardData.membershipTypeName}
          </Text>

          {/* Status */}
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: membershipStatus.color }]} />
            <Text style={[styles.statusText, { color: membershipStatus.color }]} testID="text-membership-status">
              {membershipStatus.text}
            </Text>
          </View>

          {/* Expiry Date */}
          <Text style={styles.expiryDate} testID="text-expiry-date">
            Valid until: {formatDate(cardData.membershipExpiresAt)}
          </Text>

          {/* QR Code */}
          <View style={styles.qrContainer} testID="container-qr-code">
            <QRCode
              value={cardData.qrCodeData}
              size={150}
              backgroundColor={colors.background.primary}
              color={colors.text.primary}
            />
          </View>

          {/* QR Code Label */}
          <Text style={styles.qrLabel}>Show this QR code for membership verification</Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How to Use</Text>
          <Text style={styles.instructionsText}>
            • Present this card at events for easy check-in{'\n'}
            • Show the QR code to receive member discounts{'\n'}
            • Screenshot this card for offline access{'\n'}
            • Card data is automatically updated when you open the app
          </Text>
        </View>
      </View>
      </ScrollView>
    </View>
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
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.status.error,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: colors.interactive.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: colors.text.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButtonHeader: {
    marginRight: 16,
  },
  backButtonHeaderText: {
    fontSize: 16,
    color: colors.interactive.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    ...colors.shadow.medium,
    borderWidth: 1,
    borderColor: colors.border.primary,
    alignItems: 'center',
  },
  memberName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  membershipType: {
    fontSize: 20,
    color: colors.interactive.primary,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  expiryDate: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  qrContainer: {
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    marginBottom: 16,
  },
  qrLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  instructionsContainer: {
    backgroundColor: colors.status.infoBackground,
    borderRadius: 12,
    padding: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.status.info,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.status.info,
    lineHeight: 20,
  },
}); 