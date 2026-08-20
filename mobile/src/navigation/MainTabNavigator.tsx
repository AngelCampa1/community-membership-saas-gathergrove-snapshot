import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { EventsScreen } from '@/screens/EventsScreen';
import { DirectoryScreen } from '@/screens/DirectoryScreen';
import { ChatScreen } from '@/screens/ChatScreen';
import { MainTabParamList } from '@/types';
import { useTheme } from '../contexts/ThemeContext';
import { FeedbackFAB } from '../components/FeedbackFAB';
import { FeedbackModal } from '../components/FeedbackModal';

// Fix TypeScript Icon component typing for navigation
interface IconProps {
  name: string;
  size: number;
  color: string;
}

const IconComponent = Icon as unknown as React.ComponentType<IconProps>;

const Tab = createBottomTabNavigator<MainTabParamList>();

interface MainTabNavigatorProps {
  onLogout: () => void;
}

export const MainTabNavigator: React.FC<MainTabNavigatorProps> = ({ onLogout }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  return (
    <View style={styles.container}>
      <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: string;

          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Events') {
            iconName = 'event';
          } else if (route.name === 'Directory') {
            iconName = 'people';
          } else if (route.name === 'Chat') {
            iconName = 'chat';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else {
            iconName = 'help';
          }

          return <IconComponent name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.interactive.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.background.secondary,
          borderTopWidth: 1,
          borderTopColor: colors.border.primary,
          paddingTop: 4,
          paddingBottom: insets.bottom + 4,
          height: 60 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: colors.background.secondary,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: colors.text.primary,
        },
        headerTintColor: colors.text.primary,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        options={{
          title: 'Dashboard',
          tabBarTestID: 'tab-dashboard',
          headerShown: false,
        }}
      >
        {() => <DashboardScreen onLogout={onLogout} />}
      </Tab.Screen>
      
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          title: 'Events',
          tabBarTestID: 'tab-events',
          headerShown: false,
        }}
      />
      
      <Tab.Screen
        name="Directory"
        component={DirectoryScreen}
        options={{
          title: 'Directory',
          tabBarTestID: 'tab-directory',
          headerShown: false,
        }}
      />
      
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: 'Chat',
          tabBarTestID: 'tab-chat',
          headerShown: false,
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'My Profile',
          tabBarTestID: 'tab-profile',
          headerShown: false,
        }}
      />
    </Tab.Navigator>

      {/* Feedback FAB */}
      <FeedbackFAB
        onPress={() => setShowFeedbackModal(true)}
        visible={!showFeedbackModal}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 