/**
 * PWA Install Prompt Component
 * Provides user-friendly install prompts and update notifications
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { pwaService } from '../services/pwaService';
import { LIGHT_THEME, SEMANTIC_COLORS } from '../constants/colors';

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  showUpdatePrompt?: boolean;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  onInstall,
  onDismiss,
  showUpdatePrompt = true,
}) => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [capabilities, setCapabilities] = useState(pwaService.getCapabilities());
  const [slideAnim] = useState(new Animated.Value(-100));

  const animateIn = useCallback(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [slideAnim]);

  const animateOut = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Listen for PWA events
    const handleInstallAvailable = () => {
      setShowInstallPrompt(true);
      animateIn();
    };

    const handleInstallCompleted = () => {
      setShowInstallPrompt(false);
      setIsInstalling(false);
      onInstall?.();
      animateOut();
    };

    const handleUpdateAvailable = () => {
      if (showUpdatePrompt) {
        setShowUpdate(true);
        animateIn();
      }
    };

    const handleUpdateApplied = () => {
      setShowUpdate(false);
      setIsUpdating(false);
      animateOut();
    };

    pwaService.on('install-available', handleInstallAvailable);
    pwaService.on('install-completed', handleInstallCompleted);
    pwaService.on('update-available', handleUpdateAvailable);
    pwaService.on('update-applied', handleUpdateApplied);

    // Update capabilities periodically
    const interval = setInterval(() => {
      setCapabilities(pwaService.getCapabilities());
    }, 5000);

    // Check initial state
    setCapabilities(pwaService.getCapabilities());

    return () => {
      clearInterval(interval);
      pwaService.off('install-available');
      pwaService.off('install-completed');
      pwaService.off('update-available');
      pwaService.off('update-applied');
    };
  }, [showUpdatePrompt, onInstall, animateIn, animateOut]);


  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const result = await pwaService.showInstallPrompt();
      
      if (result?.outcome === 'accepted') {
        // Installation accepted - hide the prompt
        setShowInstallPrompt(false);
        setIsInstalling(false);
      } else if (result?.outcome === 'dismissed') {
        setShowInstallPrompt(false);
        setIsInstalling(false);
        onDismiss?.();
        animateOut();
      }
    } catch (error) {
      setIsInstalling(false);
      Alert.alert(
        'Installation Failed',
        'Unable to install the app. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      await pwaService.applyUpdate();
    } catch (error) {
      setIsUpdating(false);
      Alert.alert(
        'Update Failed',
        'Unable to apply the update. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setShowUpdate(false);
    onDismiss?.();
    animateOut();
  };

  const renderInstallPrompt = () => (
    <View style={styles.promptContent}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>📱</Text>
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.title}>Install GatherGrove</Text>
        <Text style={styles.subtitle}>
          Get the full app experience with offline access and faster loading
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.dismissButton]}
          onPress={handleDismiss}
          disabled={isInstalling}
        >
          <Text style={styles.dismissText}>Not Now</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.installButton]}
          onPress={handleInstall}
          disabled={isInstalling}
        >
          <Text style={styles.installText}>
            {isInstalling ? 'Installing...' : 'Install'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsTitle}>Benefits:</Text>
        <Text style={styles.benefit}>• Works offline</Text>
        <Text style={styles.benefit}>• Faster loading</Text>
        <Text style={styles.benefit}>• App-like experience</Text>
        <Text style={styles.benefit}>• Push notifications</Text>
      </View>
    </View>
  );

  const renderUpdatePrompt = () => (
    <View style={styles.promptContent}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🔄</Text>
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.title}>Update Available</Text>
        <Text style={styles.subtitle}>
          A new version of GatherGrove is ready with improvements and bug fixes
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.dismissButton]}
          onPress={handleDismiss}
          disabled={isUpdating}
        >
          <Text style={styles.dismissText}>Later</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.updateButton]}
          onPress={handleUpdate}
          disabled={isUpdating}
        >
          <Text style={styles.updateText}>
            {isUpdating ? 'Updating...' : 'Update Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderManualInstall = () => (
    <View style={styles.manualInstallContainer}>
      <Text style={styles.manualInstallTitle}>Install GatherGrove</Text>
      <Text style={styles.manualInstallText}>
        {pwaService.getInstallInstructions()}
      </Text>
    </View>
  );

  // Don't show on native platforms
  if (Platform.OS !== 'web') {
    return null;
  }

  // Show manual install instructions if not installable via prompt
  if (capabilities && !capabilities.isInstallable && !capabilities.isInstalled && !showUpdate) {
    return renderManualInstall();
  }

  const showPrompt = showInstallPrompt || showUpdate;

  return (
    <Modal
      visible={showPrompt}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.promptContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {showUpdate ? renderUpdatePrompt() : renderInstallPrompt()}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: LIGHT_THEME.background.overlay,
    justifyContent: 'flex-end',
  },

  promptContainer: {
    backgroundColor: LIGHT_THEME.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    elevation: 10,
    shadowColor: LIGHT_THEME.shadow.lg.shadowColor,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  
  promptContent: {
    padding: 24,
  },
  
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  
  icon: {
    fontSize: 48,
  },
  
  textContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: LIGHT_THEME.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 16,
    color: LIGHT_THEME.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  
  dismissButton: {
    backgroundColor: LIGHT_THEME.background.tertiary,
    borderWidth: 1,
    borderColor: LIGHT_THEME.border.primary,
  },

  installButton: {
    backgroundColor: LIGHT_THEME.interactive.primary,
  },

  updateButton: {
    backgroundColor: LIGHT_THEME.status.success,
  },
  
  dismissText: {
    fontSize: 16,
    fontWeight: '600',
    color: LIGHT_THEME.text.tertiary,
  },

  installText: {
    fontSize: 16,
    fontWeight: '600',
    color: LIGHT_THEME.text.inverse,
  },

  updateText: {
    fontSize: 16,
    fontWeight: '600',
    color: LIGHT_THEME.text.inverse,
  },
  
  benefitsContainer: {
    backgroundColor: LIGHT_THEME.background.secondary,
    borderRadius: 12,
    padding: 16,
  },

  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: LIGHT_THEME.interactive.primary,
    marginBottom: 8,
  },

  benefit: {
    fontSize: 14,
    color: LIGHT_THEME.text.tertiary,
    marginBottom: 4,
  },
  
  manualInstallContainer: {
    backgroundColor: LIGHT_THEME.status.infoBackground,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: LIGHT_THEME.status.infoBorder,
  },

  manualInstallTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: SEMANTIC_COLORS.info[500],
    marginBottom: 8,
  },

  manualInstallText: {
    fontSize: 14,
    color: SEMANTIC_COLORS.info[500],
    lineHeight: 20,
  },
});

export default PWAInstallPrompt;