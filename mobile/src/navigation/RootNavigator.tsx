import React, { useRef, useEffect, useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthFlow } from '@/screens/AuthFlow';
import { EditProfileScreen } from '@/screens/EditProfileScreen';
import { MembershipCardScreen } from '@/screens/MembershipCardScreen';
import { PayDuesScreen } from '@/screens/PayDuesScreen';
import { EventDetailsScreen } from '@/screens/EventDetailsScreen';
import { DirectorySettingsScreen } from '@/screens/DirectorySettingsScreen';
import { ThemeSettingsScreen } from '@/screens/ThemeSettingsScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { RootStackParamList } from '@/types';
import { getActiveRouteName, trackScreenView } from '@/utils/navigationTracking';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  isAuthenticated: boolean;
  onLoginSuccess: () => void;
  onLogout: () => void;
}

export const RootNavigator: React.FC<RootNavigatorProps> = ({
  isAuthenticated,
  onLoginSuccess,
  onLogout,
}) => {
  const routeNameRef = useRef<string | undefined>(undefined);
  // NAV-04 fix: Properly type the navigation ref
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  // NAV-01 fix: Clear route ref when auth state changes to prevent stale tracking
  useEffect(() => {
    if (!isAuthenticated) {
      routeNameRef.current = undefined;
    }
  }, [isAuthenticated]);

  // NAV-02 fix: Handle Android hardware back button for modal screens
  const handleAndroidBackButton = useCallback(() => {
    if (Platform.OS !== 'android') return false;

    const currentRoute = routeNameRef.current;
    // Modal screens that should be closed on back press
    const modalScreens = ['EditProfile', 'PayDues', 'DirectorySettings', 'ThemeSettings'];

    if (currentRoute && modalScreens.includes(currentRoute)) {
      // Navigate back (close modal)
      if (navigationRef.current?.canGoBack()) {
        navigationRef.current.goBack();
        return true; // Prevent default back behavior
      }
    }
    return false; // Let default behavior happen (exit app or go back in stack)
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        handleAndroidBackButton
      );
      return () => backHandler.remove();
    }
  }, [handleAndroidBackButton]);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        // Track initial screen on app load
        const state = navigationRef.current?.getRootState();
        const initialRoute = getActiveRouteName(state);
        routeNameRef.current = initialRoute;
        trackScreenView(initialRoute);
      }}
      onStateChange={(state) => {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = getActiveRouteName(state);

        // Only track if the route has actually changed
        if (previousRouteName !== currentRouteName) {
          trackScreenView(currentRouteName);
        }

        // Save the current route name for next comparison
        routeNameRef.current = currentRouteName;
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" options={{ headerShown: false }}>
              {() => <MainTabNavigator onLogout={onLogout} />}
            </Stack.Screen>
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
              options={{ 
                headerShown: false,
                title: 'Edit Profile',
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="MembershipCard" 
              component={MembershipCardScreen}
              options={{ 
                headerShown: false,
                title: 'Membership Card',
              }}
            />
            <Stack.Screen 
              name="PayDues" 
              component={PayDuesScreen}
              options={{ 
                headerShown: false,
                title: 'Pay Dues',
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="EventDetails" 
              component={EventDetailsScreen}
              options={{ 
                headerShown: false,
                title: 'Event Details',
              }}
            />
            <Stack.Screen 
              name="DirectorySettings" 
              component={DirectorySettingsScreen}
              options={{ 
                headerShown: false,
                title: 'Directory Privacy Settings',
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="ThemeSettings" 
              component={ThemeSettingsScreen}
              options={{ 
                headerShown: false,
                title: 'Theme Settings',
                presentation: 'modal',
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" options={{ headerShown: false }}>
            {() => <AuthFlow onLoginSuccess={onLoginSuccess} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 