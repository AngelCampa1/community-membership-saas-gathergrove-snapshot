import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { CameraView, BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';

import { RootStackParamList } from '@/types';
import { authService } from '@/services/authService';
import { EventService } from '@/services/eventService';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { LIGHT_THEME, SPECIAL_COLORS } from '../constants/colors';

type QRCodeScannerRouteProp = RouteProp<RootStackParamList, 'QRCodeScanner'>;

interface QRCodeData {
  type: 'event_checkin' | 'member_verification';
  eventId?: number;
  memberId?: number;
  timestamp: number;
  clubId?: number;
}

export const QRCodeScanner: React.FC = () => {
  const route = useRoute<QRCodeScannerRouteProp>();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { eventId } = route.params || {};

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [processing, setProcessing] = useState(false);

  const styles = createStyles(colors);

  // MEM-01 fix: Added isMounted check to prevent state updates on unmounted component
  useEffect(() => {
    let isMounted = true;

    const checkPermission = async () => {
      if (!permission && isMounted) {
        await requestPermission();
      }
    };

    checkPermission();

    return () => {
      isMounted = false;
    };
  }, [permission, requestPermission]);

  const handleBarCodeScanned = useCallback(async ({ data }: BarcodeScanningResult) => {
    if (scanned || processing) return;

    setScanned(true);
    setProcessing(true);

    try {
      // Provide haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Parse QR code data
      let qrData: QRCodeData;
      try {
        qrData = JSON.parse(data);
      } catch (error) {
        throw new Error('This QR code is not valid for event check-in.');
      }

      // Validate QR code format
      if (!qrData.type || !qrData.timestamp) {
        throw new Error('Invalid QR code format.');
      }

      // Check if QR code is expired (valid for 5 minutes)
      const now = Date.now();
      const qrAge = now - qrData.timestamp;
      const maxAge = 5 * 60 * 1000; // 5 minutes

      if (qrAge > maxAge) {
        throw new Error('This QR code has expired. Please generate a new one.');
      }

      // Get current user session
      const userSession = await authService.validateStoredSession();
      if (!userSession?.user?.clubId) {
        throw new Error('User session not found. Please login again.');
      }

      // Handle different QR code types
      switch (qrData.type) {
        case 'event_checkin': {
          if (!qrData.eventId) {
            throw new Error('Invalid event QR code.');
          }

          // Verify event ID matches if provided in route params
          if (eventId && qrData.eventId !== eventId) {
            throw new Error('This QR code is for a different event.');
          }

          // Verify club ID matches
          if (qrData.clubId && qrData.clubId !== userSession.user.clubId) {
            throw new Error('This QR code is for a different club.');
          }

          // Perform check-in
          const checkInResult = await EventService.checkIntoEvent(
            userSession.user.clubId,
            qrData.eventId,
            {
              code: data,
              memberId: qrData.memberId,
              eventId: qrData.eventId,
              timestamp: qrData.timestamp
            }
          );

          Alert.alert(
            'Check-in Successful',
            checkInResult.message || 'You have been successfully checked in to the event.',
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.goBack();
                },
              },
            ]
          );
          break;
        }

        case 'member_verification':
          // Handle member verification QR codes
          Alert.alert(
            'Member Verified',
            'Member verification successful.',
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.goBack();
                },
              },
            ]
          );
          break;

        default:
          throw new Error('Unsupported QR code type.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while processing the QR code.';
      
      Alert.alert(
        'Invalid QR Code',
        errorMessage,
        [
          {
            text: 'Try Again',
            onPress: () => {
              setScanned(false);
              setProcessing(false);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } finally {
      setProcessing(false);
    }
  }, [scanned, processing, eventId, navigation]);

  const toggleFlashlight = () => {
    setFlashOn(!flashOn);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} testID="permission-denied-screen">
        <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
        <View style={styles.permissionContainer}>
          <MaterialIcons name="camera-alt" size={64} color={colors.text.secondary} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionMessage}>
            To scan QR codes, please allow camera access in your device settings.
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              // Open device settings would require expo-linking
              navigation.goBack();
            }}
          >
            <Text style={styles.settingsButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={LIGHT_THEME.background.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          testID="back-button"
        >
          <MaterialIcons name="arrow-back" size={24} color={LIGHT_THEME.text.inverse} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Scan QR Code</Text>

        <TouchableOpacity
          style={styles.flashButton}
          onPress={toggleFlashlight}
          testID="flashlight-toggle"
        >
          <MaterialIcons
            name={flashOn ? "flash-off" : "flash-on"}
            size={24}
            color={LIGHT_THEME.text.inverse}
          />
        </TouchableOpacity>
      </View>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          enableTorch={flashOn}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          testID="mock-camera"
        >
          {/* Scanner overlay */}
          <View style={styles.overlay}>
            <View style={styles.scannerFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>
        </CameraView>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>
          {processing ? 'Processing...' : 'Position the QR code within the frame to scan'}
        </Text>
        <Text style={styles.instructionText}>
          Make sure the QR code is clearly visible and well-lit
        </Text>
        
        {scanned && !processing && (
          <TouchableOpacity
            style={styles.rescanButton}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.rescanButtonText}>Tap to scan again</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_THEME.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: SPECIAL_COLORS.scanner.overlay,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: LIGHT_THEME.text.inverse,
    flex: 1,
    textAlign: 'center',
  },
  flashButton: {
    padding: 8,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: SPECIAL_COLORS.scanner.frame,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructions: {
    backgroundColor: SPECIAL_COLORS.scanner.overlay,
    padding: 20,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: LIGHT_THEME.text.inverse,
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: LIGHT_THEME.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  rescanButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.interactive.primary,
    borderRadius: 8,
  },
  rescanButtonText: {
    color: LIGHT_THEME.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: 50,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  permissionMessage: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  settingsButton: {
    backgroundColor: colors.interactive.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: LIGHT_THEME.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
});