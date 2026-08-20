/**
 * ResponsiveTable Component
 * 
 * A mobile-optimized table component that adapts to different screen sizes
 * and provides accessibility features for WCAG AA compliance.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getResponsiveStyle, getTouchTargetStyle, createAccessibilityLabel } from '../utils/accessibility';


export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T & string;
  title: string;
  width?: number | string;
  render?: (value: T[keyof T], item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface ResponsiveTableProps<T = Record<string, unknown>> {
  data: T[];
  columns: TableColumn<T>[];
  onRowPress?: (item: T, index: number) => void;
  onSort?: (column: keyof T & string, direction: 'asc' | 'desc') => void;
  sortColumn?: keyof T & string;
  sortDirection?: 'asc' | 'desc';
  loading?: boolean;
  emptyText?: string;
  maxHeight?: number;
  testID?: string;
  // Responsive behavior options
  stackOnSmall?: boolean; // Stack columns vertically on small screens
  hideColumnsOnSmall?: (keyof T & string)[]; // Hide specific columns on small screens
  showDetailsButton?: boolean; // Show "View Details" button instead of full row
}

export const ResponsiveTable = <T extends Record<string, unknown> = Record<string, unknown>>({
  data,
  columns,
  onRowPress,
  onSort,
  sortColumn,
  sortDirection,
  loading = false,
  emptyText = 'No data available',
  maxHeight,
  testID = 'responsive-table',
  stackOnSmall = true,
  hideColumnsOnSmall = [],
  showDetailsButton = false,
}: ResponsiveTableProps<T>): React.ReactElement => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const responsive = getResponsiveStyle();

  // Filter columns based on screen size
  const visibleColumns = responsive.isSmallScreen 
    ? columns.filter(col => !hideColumnsOnSmall.includes(col.key))
    : columns;

  const handleSort = (columnKey: string) => {
    if (!onSort) return;
    
    const newDirection = sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(columnKey, newDirection);
  };

  const renderHeader = () => (
    <View style={styles.headerRow} testID={`${testID}-header`}>
      {visibleColumns.map((column) => (
        <TouchableOpacity
          key={column.key}
          style={[
            styles.headerCell,
            { 
              width: typeof column.width === 'number' ? column.width : undefined,
              justifyContent: column.align === 'center' ? 'center' : column.align === 'right' ? 'flex-end' : 'flex-start'
            },
            column.sortable && getTouchTargetStyle(44)
          ]}
          onPress={() => column.sortable && handleSort(column.key)}
          disabled={!column.sortable}
          {...(column.sortable ? createAccessibilityLabel(
            `Sort by ${column.title}`,
            `Currently sorted ${sortColumn === column.key ? sortDirection : 'none'}`,
            'button'
          ) : {})}
        >
          <Text style={styles.headerText}>{column.title}</Text>
          {column.sortable && sortColumn === column.key && (
            <Text style={styles.sortIndicator}>
              {sortDirection === 'asc' ? '↑' : '↓'}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderRow = (item: T, index: number) => {
    if (responsive.isSmallScreen && stackOnSmall) {
      return renderStackedRow(item, index);
    }

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dataRow,
          index % 2 === 0 ? styles.evenRow : styles.oddRow
        ]}
        onPress={() => onRowPress?.(item, index)}
        disabled={!onRowPress}
        testID={`${testID}-row-${index}`}
        {...createAccessibilityLabel(
          `Row ${index + 1}`,
          onRowPress ? 'Tap to view details' : undefined,
          onRowPress ? 'button' : 'text'
        )}
      >
        {visibleColumns.map((column) => (
          <View
            key={column.key}
            style={[
              styles.dataCell,
              {
                width: typeof column.width === 'number' ? column.width : undefined,
                alignItems: column.align === 'center' ? 'center' : column.align === 'right' ? 'flex-end' : 'flex-start'
              }
            ]}
          >
            {column.render ? (
              column.render(item[column.key], item, index)
            ) : (
              <Text style={styles.cellText} numberOfLines={2}>
                {item[column.key]?.toString() || ''}
              </Text>
            )}
          </View>
        ))}
      </TouchableOpacity>
    );
  };

  const renderStackedRow = (item: T, index: number) => (
    <View
      key={index}
      style={[
        styles.stackedRow,
        index % 2 === 0 ? styles.evenRow : styles.oddRow
      ]}
      testID={`${testID}-stacked-row-${index}`}
    >
      {visibleColumns.map((column) => (
        <View key={column.key} style={styles.stackedCell}>
          <Text style={styles.stackedLabel}>{column.title}:</Text>
          {column.render ? (
            column.render(item[column.key], item, index)
          ) : (
            <Text style={styles.stackedValue}>
              {item[column.key]?.toString() || ''}
            </Text>
          )}
        </View>
      ))}
      {showDetailsButton && onRowPress && (
        <TouchableOpacity
          style={[styles.detailsButton, getTouchTargetStyle()]}
          onPress={() => onRowPress(item, index)}
          {...createAccessibilityLabel(
            'View Details',
            `View details for row ${index + 1}`,
            'button'
          )}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState} testID={`${testID}-empty`}>
      <Text style={styles.emptyText}>{emptyText}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container} testID={`${testID}-loading`}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, maxHeight ? { maxHeight } : undefined]} testID={testID}>
      <ScrollView
        horizontal={!responsive.isSmallScreen || !stackOnSmall}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.table}>
          {!stackOnSmall && renderHeader()}
          <ScrollView
            style={styles.dataContainer}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {data.length === 0 ? renderEmptyState() : data.map(renderRow)}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

interface ThemeColors {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  text: {
    primary: string;
    secondary: string;
    inverse: string;
    tertiary: string;
  };
  interactive: {
    primary: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    successBackground: string;
    warningBackground: string;
    errorBackground: string;
  };
  border: {
    primary: string;
    secondary: string;
    tertiary?: string;
    focus?: string;
  };
  shadow: {
    small: object;
    medium: object;
    large: object;
  };
}

const createStyles = (colors: ThemeColors) => {
  const responsive = getResponsiveStyle();
  
  return StyleSheet.create({
    container: {
      backgroundColor: colors.background.secondary,
      borderRadius: 8,
      overflow: 'hidden',
      ...colors.shadow.medium,
    },
    scrollContainer: {
      flexGrow: 1,
    },
    table: {
      minWidth: '100%',
    },
    headerRow: {
      flexDirection: 'row',
      backgroundColor: colors.background.tertiary,
      borderBottomWidth: 2,
      borderBottomColor: colors.border.primary,
      paddingVertical: responsive.spacing.md,
    },
    headerCell: {
      paddingHorizontal: responsive.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerText: {
      fontSize: responsive.textSize.sm,
      fontWeight: '600',
      color: colors.text.primary,
    },
    sortIndicator: {
      fontSize: responsive.textSize.sm,
      color: colors.interactive.primary,
      marginLeft: responsive.spacing.xs,
    },
    dataContainer: {
      maxHeight: 400,
    },
    dataRow: {
      flexDirection: 'row',
      paddingVertical: responsive.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.primary,
      minHeight: 44, // Accessibility touch target
    },
    evenRow: {
      backgroundColor: colors.background.secondary,
    },
    oddRow: {
      backgroundColor: colors.background.tertiary,
    },
    dataCell: {
      paddingHorizontal: responsive.spacing.sm,
      justifyContent: 'center',
    },
    cellText: {
      fontSize: responsive.textSize.sm,
      color: colors.text.secondary,
    },
    // Stacked layout styles for mobile
    stackedRow: {
      padding: responsive.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.primary,
    },
    stackedCell: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: responsive.spacing.xs,
    },
    stackedLabel: {
      fontSize: responsive.textSize.sm,
      fontWeight: '500',
      color: colors.text.primary,
      flex: 1,
    },
    stackedValue: {
      fontSize: responsive.textSize.sm,
      color: colors.text.secondary,
      flex: 2,
      textAlign: 'right',
    },
    detailsButton: {
      backgroundColor: colors.interactive.primary,
      paddingHorizontal: responsive.spacing.md,
      paddingVertical: responsive.spacing.sm,
      borderRadius: 6,
      marginTop: responsive.spacing.sm,
      alignSelf: 'flex-end',
    },
    detailsButtonText: {
      color: colors.text.inverse,
      fontSize: responsive.textSize.sm,
      fontWeight: '500',
    },
    emptyState: {
      paddingVertical: responsive.spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: responsive.textSize.base,
      color: colors.text.tertiary,
      textAlign: 'center',
    },
    loadingText: {
      fontSize: responsive.textSize.base,
      color: colors.text.secondary,
      textAlign: 'center',
      paddingVertical: responsive.spacing.xl,
    },
  });
};

export default ResponsiveTable;