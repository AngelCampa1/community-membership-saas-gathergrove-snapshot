import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types';
import { useThemedStyles } from '../contexts/ThemeContext';
import type { ThemeColors } from '../contexts/ThemeContext';

type ThemeSettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'ThemeSettings'>;

export const ThemeSettingsScreen: React.FC<ThemeSettingsScreenProps> = ({ navigation }) => {
  const styles = useThemedStyles(createStyles);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            testID="theme-settings-back-button"
          >
            <Ionicons name="arrow-back" size={24} color={styles.backIcon.color} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Appearance</Text>
            <Text style={styles.headerSubtitle}>GatherGrove uses the light theme.</Text>
          </View>
        </View>

        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Ionicons name="sunny" size={32} color={styles.previewIcon.color} />
            <View style={styles.previewInfo}>
              <Text style={styles.previewTitle}>Current Appearance</Text>
              <Text style={styles.previewSubtitle}>Light theme</Text>
            </View>
          </View>
          <Text style={styles.previewDescription}>
            The mobile app uses one consistent light appearance across all screens.
          </Text>
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
  content: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backIcon: {
    color: colors.text.primary,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  previewCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewIcon: {
    color: colors.interactive.primary,
  },
  previewInfo: {
    marginLeft: 16,
    flex: 1,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  previewDescription: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
});

export default ThemeSettingsScreen;
