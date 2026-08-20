import React, { useState, useEffect, Suspense } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuth } from './src/hooks/useAuth';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import AccessibilityProvider from './src/components/AccessibilityProvider';
import PerformanceMonitor from './src/components/PerformanceMonitor';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { initializeSentry } from './src/lib/sentry';

// Initialize Sentry as early as possible
initializeSentry();

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [, setPerformanceMetrics] = useState<Record<string, unknown>>({});

  /**
   * Update authentication state when user changes
   */
  useEffect(() => {
    setIsAuthenticated(!!user?.isAuthenticated);
  }, [user]);

  /**
   * Handle performance metrics updates
   */
  const handlePerformanceMetrics = (metrics: Record<string, unknown>) => {
    setPerformanceMetrics(metrics);
    
    // Performance metrics updated (logged in PerformanceMonitor component)
    // Development logging handled by PerformanceMonitor
  };

  /**
   * Initialize web-specific optimizations
   */
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Set document title for SEO
      document.title = 'GatherGrove Mobile - Club Management Made Simple';
      
      // Add meta description if not present
      if (!document.querySelector('meta[name="description"]')) {
        const metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        metaDescription.content = 'Powerful club management platform for community organizations. Manage members, events, communications, and finances with ease.';
        document.head.appendChild(metaDescription);
      }
      
      // Remove loading screen once React has mounted
      const loadingElement = document.getElementById('initial-loading');
      if (loadingElement) {
        loadingElement.style.display = 'none';
      }
      
      // Show main content
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.style.display = 'block';
      }
      
      // Add focus management for accessibility
      // Focus management will be enhanced in future updates
      
      // Add skip link functionality
      const skipLink = document.querySelector('a[href="#main-content"]') as HTMLElement;
      if (skipLink) {
        skipLink.addEventListener('click', (e) => {
          e.preventDefault();
          const mainContent = document.getElementById('main-content');
          if (mainContent) {
            mainContent.focus();
            mainContent.scrollIntoView();
          }
        });
      }
    }
  }, []);

  /**
   * Handle successful login
   */
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  /**
   * Show loading screen while checking stored session
   */
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]} testID="screen-loading">
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor={colors.background.primary} 
        />
        <ActivityIndicator size="large" color={colors.interactive.primary} testID="loading-app" />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      {/* Performance monitoring for web */}
      <PerformanceMonitor 
        onMetricsUpdate={handlePerformanceMetrics}
        enabled={Platform.OS === 'web'}
      />
      
      <View 
        style={[styles.container, { backgroundColor: colors.background.primary }]}
        {...(Platform.OS === 'web' && {
          role: 'main',
          'aria-label': 'GatherGrove Mobile Application',
          id: 'main-content',
          tabIndex: -1,
        })}
      >
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor={colors.background.primary} 
        />
        
        <Suspense 
          fallback={
            <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
              <ActivityIndicator 
                size="large" 
                color={colors.interactive.primary} 
                testID="suspense-loading"
                {...(Platform.OS === 'web' && {
                  'aria-label': 'Loading application components',
                })}
              />
              <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
                Loading components...
              </Text>
            </View>
          }
        >
          <RootNavigator
            isAuthenticated={isAuthenticated}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
          />
        </Suspense>
      </View>
    </>
  );
};

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AccessibilityProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </AccessibilityProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default App; 
