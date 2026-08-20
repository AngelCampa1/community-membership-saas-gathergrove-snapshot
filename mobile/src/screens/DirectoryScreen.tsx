import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ListRenderItem,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Fix TypeScript Icon component typing
interface IconProps {
  name: string;
  size: number;
  color: string;
  style?: object;
}
const IconComponent = Icon as unknown as React.ComponentType<IconProps>;

import { DirectoryService } from '@/services/directoryService';
import { DirectoryMember, PaginatedDirectoryMembersResponse } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, useThemedStyles, ThemeColors } from '../contexts/ThemeContext';
import { getTouchTargetStyle, createAccessibilityLabel, getResponsiveStyle } from '../utils/accessibility';

export const DirectoryScreen: React.FC = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<DirectoryMember[]>([]);
  const [directoryData, setDirectoryData] = useState<PaginatedDirectoryMembersResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Search query for API calls - only triggered on enter or clear
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  /**
   * Load directory data from API
   */
  const loadDirectory = useCallback(
    async (page: number = 1, search: string = '', isRefresh: boolean = false) => {
      if (!user?.user?.clubId) {
        setError('User club information not available');
        setLoading(false);
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        setError(null);

        if (!user.user?.clubId) {
          throw new Error('Club information not available');
        }

        const response = await DirectoryService.getMemberDirectory(user.user.clubId, {
          search: search.trim(),
          page,
          pageSize: 25,
        });

        setDirectoryData(response);

        if (page === 1) {
          // First page or new search - replace all data
          setMembers(response.members);
        } else {
          // Additional page - append to existing data
          setMembers(prev => [...prev, ...response.members]);
        }

        setCurrentPage(page);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load directory';
        setError(errorMessage);

        // Show user-friendly error alert for specific cases
        if (errorMessage.includes('privacy settings') || errorMessage.includes('not available')) {
          Alert.alert(
            'Directory Not Available',
            'The member directory is not available. This could be because:\n\n• The directory has been disabled by your club admin\n• You have not opted in to directory viewing\n\nYou can check your privacy settings in your profile.',
            [{ text: 'OK' }]
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [user?.user?.clubId]
  );

  // Load directory on mount and when search changes
  // MEM-01 fix: Added isMounted check to prevent state updates on unmounted component
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!isMounted) return;
      await loadDirectory(1, debouncedSearchQuery);
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [loadDirectory, debouncedSearchQuery]);

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = useCallback(async () => {
    setCurrentPage(1);
    await loadDirectory(1, debouncedSearchQuery, true);
  }, [loadDirectory, debouncedSearchQuery]);

  /**
   * Handle search input changes (only updates the input value)
   */
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  /**
   * Handle search submission (when user presses Enter)
   */
  const handleSearchSubmit = useCallback(() => {
    setDebouncedSearchQuery(searchQuery);
    setCurrentPage(1); // Reset to first page on search
  }, [searchQuery]);

  /**
   * Clear search
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setCurrentPage(1);
  }, []);

  /**
   * Load more members (pagination)
   */
  const loadMore = useCallback(async () => {
    if (
      !directoryData ||
      loadingMore ||
      currentPage >= directoryData.totalPages ||
      error
    ) {
      return;
    }

    const nextPage = currentPage + 1;
    await loadDirectory(nextPage, debouncedSearchQuery);
  }, [loadDirectory, debouncedSearchQuery, directoryData, loadingMore, currentPage, error]);

  /**
   * Format member info for display
   */
  const getMemberInfo = useCallback((member: DirectoryMember): string[] => {
    const info: string[] = [];
    
    if (member.email) {
      info.push(`📧 ${member.email}`);
    }
    
    if (member.phoneNumber) {
      info.push(`📞 ${member.phoneNumber}`);
    }
    
    if (member.membershipTypeName) {
      info.push(`👥 ${member.membershipTypeName}`);
    }

    return info;
  }, []);

  /**
   * Render individual member item
   */
  const renderMemberItem: ListRenderItem<DirectoryMember> = useCallback(
    ({ item: member }) => {
      const memberInfo = getMemberInfo(member);

      return (
        <View 
          style={styles.memberCard} 
          testID={`member-item-${member.id}`}
          {...createAccessibilityLabel(
            `${member.fullName}, member since ${new Date(member.joinDate).toLocaleDateString()}`,
            `Contact information for ${member.fullName}`,
            'button'
          )}
        >
          <View style={styles.memberHeader}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberInitial} testID={`member-initial-${member.id}`}>
                {member.fullName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.memberDetails}>
              <Text style={styles.memberName} testID={`member-name-${member.id}`}>
                {member.fullName}
              </Text>
              <Text style={styles.memberJoinDate} testID={`member-join-date-${member.id}`}>
                Member since {new Date(member.joinDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
          
          {memberInfo.length > 0 && (
            <View style={styles.memberInfo} testID={`member-info-${member.id}`}>
              {memberInfo.map((info, index) => (
                <Text key={index} style={styles.memberInfoText} testID={`member-info-text-${member.id}-${index}`}>
                  {info}
                </Text>
              ))}
            </View>
          )}
        </View>
      );
    },
    [getMemberInfo, styles.memberCard, styles.memberHeader, styles.memberAvatar, styles.memberInitial, styles.memberDetails, styles.memberName, styles.memberJoinDate, styles.memberInfo, styles.memberInfoText]
  );

  /**
   * Render list footer (load more indicator)
   */
  const renderListFooter = useMemo(() => {
    if (loadingMore) {
      return (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color={colors.interactive.primary} />
          <Text style={styles.loadingMoreText}>Loading more members...</Text>
        </View>
      );
    }

    if (directoryData && currentPage >= directoryData.totalPages && members.length > 0) {
      return (
        <View style={styles.endOfList}>
          <Text style={styles.endOfListText}>
            Showing all {directoryData.totalCount} members
          </Text>
        </View>
      );
    }

    return null;
  }, [loadingMore, directoryData, currentPage, members.length, colors.interactive.primary, styles.loadingMore, styles.loadingMoreText, styles.endOfList, styles.endOfListText]);

  /**
   * Render empty state
   */
  const renderEmptyState = useMemo(() => {
    if (loading) return null;

    const isSearching = debouncedSearchQuery.trim().length > 0;

    return (
      <View style={styles.emptyState} testID="directory-empty-state">
        <IconComponent
          name={isSearching ? 'search-off' : 'people-outline'}
          size={64}
          color={colors.text.tertiary}
        />
        <Text style={styles.emptyStateTitle} testID="empty-state-title">
          {isSearching ? 'No members found' : 'No members in directory'}
        </Text>
        <Text style={styles.emptyStateText} testID="empty-state-text">
          {isSearching
            ? `No members match "${debouncedSearchQuery}"`
            : 'No members have opted into the directory yet.'}
        </Text>
        {isSearching && (
          <TouchableOpacity 
            style={[styles.clearSearchButton, getTouchTargetStyle()]} 
            onPress={clearSearch}
            {...createAccessibilityLabel(
              'Clear search',
              'Clear the search and show all members',
              'button'
            )}
          >
            <Text style={styles.clearSearchButtonText}>Clear search</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [loading, debouncedSearchQuery, clearSearch, colors.text.tertiary, styles.emptyState, styles.emptyStateTitle, styles.emptyStateText, styles.clearSearchButton, styles.clearSearchButtonText]);

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.interactive.primary} />
        <Text style={styles.loadingText}>Loading directory...</Text>
      </View>
    );
  }

  // Error state (when not recoverable)
  if (error && !members.length && !loading) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]} testID="directory-error-container">
        <IconComponent name="error-outline" size={64} color={colors.status.error} />
        <Text style={styles.errorTitle} testID="directory-error-title">Directory Not Available</Text>
        <Text style={styles.errorText} testID="directory-error-message">{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, getTouchTargetStyle()]}
          onPress={() => loadDirectory(1, debouncedSearchQuery)}
          testID="directory-retry-button"
          {...createAccessibilityLabel(
            'Try Again',
            'Retry loading the member directory',
            'button'
          )}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search Header */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <IconComponent name="search" size={20} color={colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members by name..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
            testID="directory-search-input"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <>
              <TouchableOpacity 
                onPress={handleSearchSubmit} 
                style={[styles.searchButton, getTouchTargetStyle()]} 
                testID="search-submit-button"
                {...createAccessibilityLabel(
                  'Submit search',
                  'Search for members with the entered text',
                  'button'
                )}
              >
                <IconComponent name="search" size={20} color={colors.interactive.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={clearSearch} 
                style={[styles.clearButton, getTouchTargetStyle()]} 
                testID="clear-search-button"
                {...createAccessibilityLabel(
                  'Clear search',
                  'Clear the search text and show all members',
                  'button'
                )}
              >
                <IconComponent name="clear" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Directory Stats */}
      {directoryData && !loading && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {(() => {
              const count = directoryData?.totalCount ?? members.length ?? 0;
              if (debouncedSearchQuery.trim()) {
                return count === 0 ? "No members found" : `${count} members found`;
              } else {
                return `${count} members in directory`;
              }
            })()}
          </Text>
        </View>
      )}

      {/* Members List */}
      <FlatList
        data={members}
        renderItem={renderMemberItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContainer,
          members.length === 0 ? styles.listContainerEmpty : undefined,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.interactive.primary]}
            tintColor={colors.interactive.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        testID="directory-member-list"
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.status.error,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.interactive.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: responsive.containerPadding,
    paddingVertical: responsive.spacing.md,
  },
  searchInputContainer: {
    flexDirection: responsive.isSmallScreen ? 'column' : 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
    paddingHorizontal: responsive.spacing.md,
    paddingVertical: responsive.spacing.sm,
    minHeight: 48, // Accessibility touch target
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: responsive.textSize.base,
    color: colors.text.primary,
    paddingVertical: responsive.spacing.xs,
    minWidth: responsive.isSmallScreen ? '100%' : 'auto',
  },
  searchButton: {
    padding: responsive.spacing.xs,
    marginRight: responsive.spacing.xs,
    minWidth: 44, // Accessibility touch target
    minHeight: 44,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    padding: responsive.spacing.xs,
    minWidth: 44, // Accessibility touch target
    minHeight: 44,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: responsive.containerPadding,
    paddingVertical: responsive.spacing.sm,
  },
  statsText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  listContainer: {
    padding: responsive.containerPadding,
  },
  listContainerEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  memberCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: responsive.spacing.md,
    marginBottom: responsive.spacing.md,
    ...colors.shadow.md,
    // Improved touch target for mobile
    minHeight: 80,
  },
  memberHeader: {
    flexDirection: responsive.isSmallScreen ? 'column' : 'row',
    alignItems: responsive.isSmallScreen ? 'flex-start' : 'center',
    marginBottom: responsive.spacing.sm,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.interactive.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  memberDetails: {
    flex: 1,
    marginLeft: responsive.isSmallScreen ? 0 : responsive.spacing.md,
    marginTop: responsive.isSmallScreen ? responsive.spacing.sm : 0,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  memberJoinDate: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  memberInfo: {
    paddingLeft: 60,
  },
  memberInfoText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
  clearSearchButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: 6,
  },
  clearSearchButtonText: {
    fontSize: 14,
    color: colors.interactive.primary,
    fontWeight: '500',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.text.secondary,
  },
  endOfList: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  endOfListText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  });
};