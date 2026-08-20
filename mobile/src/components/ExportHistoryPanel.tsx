import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  TextInput,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ErrorDisplay, useErrorHandler } from './ErrorDisplay';

// Types
interface ExportHistoryItem {
  id: string;
  fileName: string;
  type: 'financial' | 'member' | 'activity' | 'scheduled';
  format: 'pdf' | 'excel' | 'csv';
  createdAt: Date;
  expiresAt: Date;
  fileSize: number;
  downloadUrl: string;
  downloadCount: number;
  parameters: Record<string, unknown>;
  user: {
    id: string;
    name: string;
  };
  status: 'available' | 'expired' | 'deleted';
}

interface ExportHistoryPanelProps {
  testID?: string;
  maxItems?: number;
  showExpiredItems?: boolean;
  allowReDownload?: boolean;
  onItemSelected?: (item: ExportHistoryItem) => void;
}

// Mock service
const mockExportHistoryService = {
  getHistory: async (limit?: number, includeExpired?: boolean): Promise<ExportHistoryItem[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const baseItems: ExportHistoryItem[] = [
          {
            id: '1',
            fileName: 'financial-report-september-2024.xlsx',
            type: 'financial',
            format: 'excel',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
            fileSize: 3.2 * 1024 * 1024, // 3.2 MB
            downloadUrl: 'https://example.com/exports/financial-report-september-2024.xlsx',
            downloadCount: 3,
            parameters: {
              dateRange: { start: '2024-09-01', end: '2024-09-30' },
              includeTransactions: true,
              includeDonations: true,
              format: 'excel'
            },
            user: { id: '1', name: 'Admin User' },
            status: 'available'
          },
          {
            id: '2',
            fileName: 'member-export-premium-2024.csv',
            type: 'member',
            format: 'csv',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
            fileSize: 1.8 * 1024 * 1024, // 1.8 MB
            downloadUrl: 'https://example.com/exports/member-export-premium-2024.csv',
            downloadCount: 1,
            parameters: {
              membershipTypes: ['premium'],
              includePersonalInfo: true,
              includeContactInfo: true,
              format: 'csv'
            },
            user: { id: '2', name: 'HR Manager' },
            status: 'available'
          },
          {
            id: '3',
            fileName: 'activity-summary-august-2024.pdf',
            type: 'activity',
            format: 'pdf',
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
            expiresAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Expired 3 days ago
            fileSize: 890 * 1024, // 890 KB
            downloadUrl: 'https://example.com/exports/activity-summary-august-2024.pdf',
            downloadCount: 5,
            parameters: {
              dateRange: { start: '2024-08-01', end: '2024-08-31' },
              groupBy: 'category',
              includeSummary: true
            },
            user: { id: '1', name: 'Admin User' },
            status: 'expired'
          },
          {
            id: '4',
            fileName: 'weekly-membership-report.xlsx',
            type: 'scheduled',
            format: 'excel',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
            expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
            fileSize: 2.1 * 1024 * 1024, // 2.1 MB
            downloadUrl: 'https://example.com/exports/weekly-membership-report.xlsx',
            downloadCount: 0,
            parameters: {
              reportType: 'weekly_summary',
              automaticGeneration: true
            },
            user: { id: 'system', name: 'System Scheduler' },
            status: 'available'
          },
          {
            id: '5',
            fileName: 'member-backup-july-2024.csv',
            type: 'member',
            format: 'csv',
            createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
            expiresAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Expired 15 days ago
            fileSize: 4.7 * 1024 * 1024, // 4.7 MB
            downloadUrl: '',
            downloadCount: 8,
            parameters: {
              fullBackup: true,
              includeAllData: true
            },
            user: { id: '1', name: 'Admin User' },
            status: 'deleted'
          }
        ];

        let filteredItems = includeExpired ? baseItems : baseItems.filter(item => item.status === 'available');
        if (limit) {
          filteredItems = filteredItems.slice(0, limit);
        }

        resolve(filteredItems);
      }, 500);
    });
  },
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reDownload: async (_itemId: string, downloadUrl: string): Promise<void> => {
    // Note: itemId reserved for future logging/analytics
    // In real app, this would handle file re-download
    await Linking.openURL(downloadUrl);
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteItem: async (_itemId: string): Promise<void> => {
    // Note: itemId parameter reserved for future API call implementation
    // Mock API call - in real app would call actual API
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  },
  
  extendExpiry: async (itemId: string, days: number): Promise<ExportHistoryItem> => {
    // Mock extending expiry - in real app would call actual API
    // Mock response
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: itemId,
          fileName: 'updated-file.xlsx',
          type: 'financial',
          format: 'excel',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
          fileSize: 1024 * 1024,
          downloadUrl: 'https://example.com/updated',
          downloadCount: 0,
          parameters: {},
          user: { id: '1', name: 'Admin User' },
          status: 'available'
        });
      }, 1000);
    });
  }
};

export const ExportHistoryPanel: React.FC<ExportHistoryPanelProps> = ({
  testID = 'export-history-panel',
  maxItems = 50,
  showExpiredItems = true,
  allowReDownload = true,
  onItemSelected,
}) => {
  const { colors } = useTheme();
  const { error, handleError, clearError } = useErrorHandler();
  
  const [items, setItems] = useState<ExportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExportHistoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'financial' | 'member' | 'activity' | 'scheduled'>('all');
  // const [showExpiredModal, setShowExpiredModal] = useState(false); // Reserved for future use
  
  const filteredItems = React.useMemo(() => {
    let filtered = items;
    
    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.fileName.toLowerCase().includes(query) ||
        item.user.name.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [items, filterType, searchQuery]);

  const loadHistory = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setRefreshing(isRefresh);
      
      const data = await mockExportHistoryService.getHistory(maxItems, showExpiredItems);
      setItems(data);
      clearError();
    } catch (err) {
      handleError(err, 'Loading export history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [maxItems, showExpiredItems, handleError, clearError]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleItemPress = useCallback((item: ExportHistoryItem) => {
    setSelectedItem(item);
    onItemSelected?.(item);
  }, [onItemSelected]);

  const handleDownload = useCallback(async (item: ExportHistoryItem) => {
    if (!item.downloadUrl) {
      Alert.alert('Download Unavailable', 'This file is no longer available for download.');
      return;
    }

    if (item.status === 'expired') {
      Alert.alert('File Expired', 'This export has expired. You may need to generate a new export.');
      return;
    }

    try {
      await mockExportHistoryService.reDownload(item.id, item.downloadUrl);
      // Update download count
      setItems(prev => prev.map(i => 
        i.id === item.id 
          ? { ...i, downloadCount: i.downloadCount + 1 }
          : i
      ));
    } catch (err) {
      handleError(err, 'Downloading export file');
    }
  }, [handleError]);

  const handleDeleteItem = useCallback((item: ExportHistoryItem) => {
    Alert.alert(
      'Delete Export',
      `Are you sure you want to delete "${item.fileName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await mockExportHistoryService.deleteItem(item.id);
              setItems(prev => prev.filter(i => i.id !== item.id));
              Alert.alert('Success', 'Export has been deleted from history.');
            } catch (err) {
              handleError(err, 'Deleting export item');
            }
          }
        }
      ]
    );
  }, [handleError]);

  const handleExtendExpiry = useCallback(async (item: ExportHistoryItem, days: number) => {
    try {
      const updatedItem = await mockExportHistoryService.extendExpiry(item.id, days);
      setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));
      Alert.alert('Success', `Expiry extended by ${days} days.`);
    } catch (err) {
      handleError(err, 'Extending file expiry');
    }
  }, [handleError]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getDaysUntilExpiry = (expiresAt: Date): number => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (item: ExportHistoryItem) => {
    switch (item.status) {
      case 'available': {
        const daysLeft = getDaysUntilExpiry(item.expiresAt);
        if (daysLeft <= 1) return colors.status.error;
        if (daysLeft <= 7) return colors.status.warning;
        return colors.status.success;
      }
      case 'expired':
        return colors.text.secondary;
      case 'deleted':
        return colors.status.error;
      default:
        return colors.text.secondary;
    }
  };

  const getTypeIcon = (type: ExportHistoryItem['type']) => {
    switch (type) {
      case 'financial':
        return '💰';
      case 'member':
        return '👥';
      case 'activity':
        return '📊';
      case 'scheduled':
        return '⏰';
      default:
        return '📄';
    }
  };

  const renderItemActions = (item: ExportHistoryItem) => {
    const actions = [];

    if (item.status === 'available' && item.downloadUrl && allowReDownload) {
      actions.push(
        <TouchableOpacity
          key="download"
          style={[styles.actionButton, { backgroundColor: colors.status.success }]}
          onPress={() => handleDownload(item)}
          testID={`${testID}-download-${item.id}`}
        >
          <Text style={[styles.actionButtonText, { color: colors.text.inverse }]}>
            Download
          </Text>
        </TouchableOpacity>
      );
    }

    if (item.status === 'available' && getDaysUntilExpiry(item.expiresAt) <= 7) {
      actions.push(
        <TouchableOpacity
          key="extend"
          style={[styles.actionButton, { backgroundColor: colors.status.warning }]}
          onPress={() => Alert.alert('Extend Expiry', 'Choose extension period:', [
            { text: 'Cancel', style: 'cancel' },
            { text: '7 days', onPress: () => handleExtendExpiry(item, 7) },
            { text: '30 days', onPress: () => handleExtendExpiry(item, 30) }
          ])}
          testID={`${testID}-extend-${item.id}`}
        >
          <Text style={[styles.actionButtonText, { color: colors.text.inverse }]}>
            Extend
          </Text>
        </TouchableOpacity>
      );
    }

    actions.push(
      <TouchableOpacity
        key="delete"
        style={[styles.actionButton, { backgroundColor: colors.status.error }]}
        onPress={() => handleDeleteItem(item)}
        testID={`${testID}-delete-${item.id}`}
      >
        <Text style={[styles.actionButtonText, { color: colors.text.inverse }]}>
          Delete
        </Text>
      </TouchableOpacity>
    );

    return actions;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]} testID={testID}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text.primary }]}>
            Loading export history...
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
          Export History
        </Text>
        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: colors.interactive.primary }]}
          onPress={() => loadHistory(true)}
          testID={`${testID}-refresh`}
        >
          <Text style={[styles.refreshButtonText, { color: colors.text.inverse }]}>
            Refresh
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: colors.background.secondary, 
            color: colors.text.primary,
            borderColor: colors.border.primary 
          }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search exports..."
          placeholderTextColor={colors.text.secondary}
          testID={`${testID}-search`}
        />
        
        <ScrollView horizontal style={styles.filterScrollView} showsHorizontalScrollIndicator={false}>
          {(['all', 'financial', 'member', 'activity', 'scheduled'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterButton,
                {
                  backgroundColor: filterType === type ? colors.interactive.primary : colors.background.secondary,
                  borderColor: colors.border.primary
                }
              ]}
              onPress={() => setFilterType(type)}
              testID={`${testID}-filter-${type}`}
            >
              <Text style={[
                styles.filterButtonText,
                {
                  color: filterType === type ? colors.text.inverse : colors.text.primary
                }
              ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadHistory(true)}
            tintColor={colors.interactive.primary}
            colors={[colors.interactive.primary]}
          />
        }
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              {searchQuery || filterType !== 'all' 
                ? 'No exports match your search criteria.'
                : 'No export history found. Complete an export to see it here.'
              }
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.itemCard,
                { 
                  backgroundColor: colors.background.secondary,
                  borderColor: selectedItem?.id === item.id ? colors.interactive.primary : colors.border.primary,
                  borderWidth: selectedItem?.id === item.id ? 2 : 1,
                  opacity: item.status === 'deleted' ? 0.6 : 1
                }
              ]}
              onPress={() => handleItemPress(item)}
              testID={`${testID}-item-${item.id}`}
            >
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <View style={styles.itemTitleRow}>
                    <Text style={styles.typeIcon}>
                      {getTypeIcon(item.type)}
                    </Text>
                    <Text style={[styles.itemFileName, { color: colors.text.primary }]} numberOfLines={1}>
                      {item.fileName}
                    </Text>
                  </View>
                  <View style={styles.itemMeta}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item) }]}>
                      <Text style={[styles.statusText, { color: colors.text.inverse }]}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.formatText, { color: colors.text.secondary }]}>
                      {item.format.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.itemDetails}>
                <Text style={[styles.detailText, { color: colors.text.secondary }]}>
                  Created: {item.createdAt.toLocaleDateString()}
                </Text>
                <Text style={[styles.detailText, { color: colors.text.secondary }]}>
                  Size: {formatFileSize(item.fileSize)}
                </Text>
                <Text style={[styles.detailText, { color: colors.text.secondary }]}>
                  Downloads: {item.downloadCount}
                </Text>
                <Text style={[styles.detailText, { color: colors.text.secondary }]}>
                  By: {item.user.name}
                </Text>
                
                {item.status === 'available' && (
                  <Text style={[styles.expiryText, { color: getStatusColor(item) }]}>
                    {getDaysUntilExpiry(item.expiresAt) <= 0 
                      ? 'Expires today' 
                      : `Expires in ${getDaysUntilExpiry(item.expiresAt)} days`
                    }
                  </Text>
                )}
                
                {item.status === 'expired' && (
                  <Text style={[styles.expiredText, { color: colors.status.error }]}>
                    Expired {Math.abs(getDaysUntilExpiry(item.expiresAt))} days ago
                  </Text>
                )}
                
                {item.status === 'deleted' && (
                  <Text style={[styles.deletedText, { color: colors.status.error }]}>
                    File deleted - no longer available
                  </Text>
                )}
              </View>

              <View style={styles.itemActions}>
                {renderItemActions(item)}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  refreshButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchSection: {
    padding: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  filterScrollView: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  itemCard: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemHeader: {
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  itemFileName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  formatText: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemDetails: {
    marginBottom: 16,
  },
  detailText: {
    fontSize: 12,
    marginBottom: 2,
  },
  expiryText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  expiredText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  deletedText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ExportHistoryPanel;