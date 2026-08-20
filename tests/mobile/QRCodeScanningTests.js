import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { jest } from '@jest/globals';

// Mock expo-camera
const mockCameraRef = {
  current: {
    takePictureAsync: jest.fn(),
    pausePreview: jest.fn(),
    resumePreview: jest.fn(),
  }
};

jest.mock('expo-camera', () => ({
  Camera: {
    useCameraPermissions: () => [
      { status: 'granted', canAskAgain: true },
      () => Promise.resolve({ status: 'granted' })
    ],
    Constants: {
      Type: {
        back: 'back',
        front: 'front'
      },
      FlashMode: {
        off: 'off',
        on: 'on',
        auto: 'auto'
      }
    }
  },
  CameraView: ({ children, onBarcodeScanned, ...props }) => {
    // Mock camera component
    const MockCamera = require('react-native').View;
    return React.createElement(MockCamera, {
      ...props,
      testID: 'camera-view',
      children: [
        children,
        React.createElement(
          require('react-native').TouchableOpacity,
          {
            testID: 'mock-scan-button',
            onPress: () => {
              // Simulate QR code scan
              if (onBarcodeScanned) {
                onBarcodeScanned({
                  type: 'qr',
                  data: 'mock-qr-code-data-12345'
                });
              }
            }
          },
          React.createElement(require('react-native').Text, {}, 'Simulate Scan')
        )
      ]
    });
  }
}));

// Mock expo-av for sound effects
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(() => 
        Promise.resolve({
          sound: {
            playAsync: jest.fn(),
            unloadAsync: jest.fn(),
            setPositionAsync: jest.fn(),
            setVolumeAsync: jest.fn()
          }
        })
      )
    },
    setAudioModeAsync: jest.fn()
  }
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy'
  }
}));

// Mock React Native async storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}));

import React from 'react';
import QRCodeScannerScreen from '../../mobile/src/screens/QRCodeScannerScreen';
import { eventService } from '../../mobile/src/services/eventService';
import { authService } from '../../mobile/src/services/authService';

// Mock services
jest.mock('../../mobile/src/services/eventService');
jest.mock('../../mobile/src/services/authService');

/**
 * Mobile QR Code Scanning Tests for US-009 Advanced Event Management
 * Tests mobile-specific QR code functionality including camera integration,
 * scanning validation, offline handling, and user experience
 */
describe('QRCodeScanningTests - Mobile QR Code Functionality', () => {
  let mockNavigation;
  let mockRoute;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock navigation
    mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn()
    };

    // Mock route with event data
    mockRoute = {
      params: {
        eventId: 123,
        eventName: 'Test Event',
        requiresRegistration: true
      }
    };

    // Mock auth service
    authService.getCurrentUser.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    });

    // Mock successful QR validation by default
    eventService.validateQRCode.mockResolvedValue({
      isValid: true,
      attendanceMarked: true,
      checkInTime: new Date().toISOString(),
      message: 'Successfully checked in!'
    });

    // Mock Alert.alert
    jest.spyOn(Alert, 'alert');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Camera Permission Handling', () => {
    test('should request camera permission on component mount', async () => {
      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByTestId('camera-view')).toBeTruthy();
      });
    });

    test('should show permission denied message when camera access is denied', async () => {
      // Mock denied permission
      const { Camera } = require('expo-camera');
      Camera.useCameraPermissions = jest.fn(() => [
        { status: 'denied', canAskAgain: false },
        () => Promise.resolve({ status: 'denied' })
      ]);

      const { getByText } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText(/camera permission/i)).toBeTruthy();
      });
    });

    test('should provide option to open settings when permission is permanently denied', async () => {
      const { Camera } = require('expo-camera');
      Camera.useCameraPermissions = jest.fn(() => [
        { status: 'denied', canAskAgain: false },
        () => Promise.resolve({ status: 'denied' })
      ]);

      const { getByText } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const settingsButton = getByText(/open settings/i);
        expect(settingsButton).toBeTruthy();
      });
    });
  });

  describe('QR Code Scanning Functionality', () => {
    test('should successfully scan and validate QR code', async () => {
      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      const scanButton = getByTestId('mock-scan-button');
      
      await act(async () => {
        fireEvent.press(scanButton);
      });

      await waitFor(() => {
        expect(eventService.validateQRCode).toHaveBeenCalledWith(
          123, // eventId
          'mock-qr-code-data-12345',
          1 // userId
        );
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Successfully checked in!',
        expect.any(Array)
      );
    });

    test('should handle invalid QR code gracefully', async () => {
      eventService.validateQRCode.mockResolvedValue({
        isValid: false,
        attendanceMarked: false,
        errorMessage: 'Invalid QR code for this event'
      });

      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      const scanButton = getByTestId('mock-scan-button');
      
      await act(async () => {
        fireEvent.press(scanButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Invalid QR Code',
          'Invalid QR code for this event',
          expect.any(Array)
        );
      });
    });

    test('should prevent duplicate scans within short timeframe', async () => {
      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      const scanButton = getByTestId('mock-scan-button');
      
      // First scan
      await act(async () => {
        fireEvent.press(scanButton);
      });

      // Immediate second scan (should be ignored)
      await act(async () => {
        fireEvent.press(scanButton);
      });

      // Should only call validation once
      expect(eventService.validateQRCode).toHaveBeenCalledTimes(1);
    });

    test('should handle already checked-in user scenario', async () => {
      eventService.validateQRCode.mockResolvedValue({
        isValid: false,
        attendanceMarked: false,
        errorMessage: 'You have already checked in to this event'
      });

      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      const scanButton = getByTestId('mock-scan-button');
      
      await act(async () => {
        fireEvent.press(scanButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Already Checked In',
          'You have already checked in to this event',
          expect.any(Array)
        );
      });
    });

    test('should handle expired QR code', async () => {
      eventService.validateQRCode.mockResolvedValue({
        isValid: false,
        attendanceMarked: false,
        errorMessage: 'QR code has expired'
      });

      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      const scanButton = getByTestId('mock-scan-button');
      
      await act(async () => {
        fireEvent.press(scanButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Expired QR Code',
          'QR code has expired',
          expect.any(Array)
        );
      });
    });
  });

  describe('User Experience Features', () => {
    test('should provide visual feedback during scanning', async () => {
      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Should show scanning overlay/indicator
      expect(getByTestId('scanning-overlay')).toBeTruthy();
      expect(getByTestId('scan-area-indicator')).toBeTruthy();
    });

    test('should show scanning instructions to user', async () => {
      const { getByText } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText(/align qr code/i)).toBeTruthy();
      expect(getByText(/hold steady/i)).toBeTruthy();
    });

    test('should toggle flashlight when flash button is pressed', async () => {
      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      const flashButton = getByTestId('flash-toggle-button');
      
      await act(async () => {
        fireEvent.press(flashButton);
      });

      // Flash should be enabled
      expect(getByTestId('flash-on-icon')).toBeTruthy();

      await act(async () => {
        fireEvent.press(flashButton);
      });

      // Flash should be disabled
      expect(getByTestId('flash-off-icon')).toBeTruthy();
    });

    test('should provide haptic feedback on successful scan', async () => {
      const { impactAsync } = require('expo-haptics');
      
      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      const scanButton = getByTestId('mock-scan-button');
      
      await act(async () => {
        fireEvent.press(scanButton);
      });

      await waitFor(() => {
        expect(impactAsync).toHaveBeenCalledWith('medium');
      });
    });

    test('should play sound effect on successful scan', async () => {
      const { Audio } = require('expo-av');
      
      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      const scanButton = getByTestId('mock-scan-button');
      
      await act(async () => {
        fireEvent.press(scanButton);
      });

      await waitFor(() => {
        expect(Audio.Sound.createAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Offline Handling', () => {
    test('should cache scan attempts when offline', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      
      // Mock network error
      eventService.validateQRCode.mockRejectedValue(new Error('Network request failed'));

      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      const scanButton = getByTestId('mock-scan-button');
      
      await act(async () => {
        fireEvent.press(scanButton);
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'offline_scan_attempts',
          expect.stringContaining('mock-qr-code-data-12345')
        );
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Offline Mode',
        'Scan saved. Will sync when connection is restored.',
        expect.any(Array)
      );
    });

    test('should sync cached scans when connection is restored', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      
      // Mock cached scan data
      const cachedScans = JSON.stringify([
        {
          eventId: 123,
          qrCodeData: 'cached-qr-code-123',
          userId: 1,
          timestamp: new Date().toISOString()
        }
      ]);
      
      AsyncStorage.getItem.mockResolvedValue(cachedScans);

      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Simulate connection restored
      await act(async () => {
        // Trigger sync (this would normally happen on app foreground or network change)
        const component = getByTestId('qr-scanner-screen');
        fireEvent(component, 'onAppStateChange', { nextAppState: 'active' });
      });

      await waitFor(() => {
        expect(eventService.validateQRCode).toHaveBeenCalledWith(
          123,
          'cached-qr-code-123',
          1
        );
      });

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('offline_scan_attempts');
    });

    test('should show offline indicator when network is unavailable', async () => {
      // Mock network state
      jest.mock('@react-native-netinfo/netinfo', () => ({
        useNetInfo: () => ({
          isConnected: false,
          isInternetReachable: false
        })
      }));

      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByTestId('offline-indicator')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('should handle camera initialization errors', async () => {
      const { Camera } = require('expo-camera');
      Camera.useCameraPermissions = jest.fn(() => {
        throw new Error('Camera initialization failed');
      });

      const { getByText } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText(/camera error/i)).toBeTruthy();
      });
    });

    test('should handle QR validation service errors gracefully', async () => {
      eventService.validateQRCode.mockRejectedValue(new Error('Service unavailable'));

      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      const scanButton = getByTestId('mock-scan-button');
      
      await act(async () => {
        fireEvent.press(scanButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Unable to validate QR code. Please try again.',
          expect.any(Array)
        );
      });
    });

    test('should handle malformed QR code data', async () => {
      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Simulate scanning malformed QR code
      const cameraView = getByTestId('camera-view');
      
      await act(async () => {
        fireEvent(cameraView, 'onBarcodeScanned', {
          type: 'qr',
          data: 'invalid-qr-format'
        });
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Invalid QR Code',
          'This QR code is not valid for event check-in.',
          expect.any(Array)
        );
      });
    });
  });

  describe('Security Features', () => {
    test('should validate QR code format before sending to server', async () => {
      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Simulate scanning QR code with suspicious content
      const cameraView = getByTestId('camera-view');
      
      await act(async () => {
        fireEvent(cameraView, 'onBarcodeScanned', {
          type: 'qr',
          data: '<script>alert("xss")</script>'
        });
      });

      // Should not call validation service for suspicious content
      expect(eventService.validateQRCode).not.toHaveBeenCalled();
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Invalid QR Code',
        'This QR code is not valid for event check-in.',
        expect.any(Array)
      );
    });

    test('should include device information in validation request', async () => {
      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      const scanButton = getByTestId('mock-scan-button');
      
      await act(async () => {
        fireEvent.press(scanButton);
      });

      await waitFor(() => {
        expect(eventService.validateQRCode).toHaveBeenCalledWith(
          123,
          'mock-qr-code-data-12345',
          1,
          expect.objectContaining({
            deviceInfo: expect.any(Object),
            timestamp: expect.any(String),
            location: expect.any(Object)
          })
        );
      });
    });

    test('should prevent rapid successive scans (rate limiting)', async () => {
      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      const scanButton = getByTestId('mock-scan-button');
      
      // Rapidly fire multiple scan events
      await act(async () => {
        fireEvent.press(scanButton);
        fireEvent.press(scanButton);
        fireEvent.press(scanButton);
      });

      // Should only process one scan
      expect(eventService.validateQRCode).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    test('should provide accessibility labels for screen readers', async () => {
      const { getByLabelText } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByLabelText(/camera viewfinder/i)).toBeTruthy();
      expect(getByLabelText(/toggle flashlight/i)).toBeTruthy();
      expect(getByLabelText(/close scanner/i)).toBeTruthy();
    });

    test('should support alternative input methods for users with disabilities', async () => {
      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Should provide manual entry option
      expect(getByTestId('manual-entry-button')).toBeTruthy();
    });

    test('should provide voice announcements for scan results', async () => {
      // Mock expo-speech
      const Speech = {
        speak: jest.fn()
      };
      jest.doMock('expo-speech', () => Speech);

      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      const scanButton = getByTestId('mock-scan-button');
      
      await act(async () => {
        fireEvent.press(scanButton);
      });

      await waitFor(() => {
        expect(Speech.speak).toHaveBeenCalledWith(
          'Successfully checked in to Test Event'
        );
      });
    });
  });

  describe('Performance Optimization', () => {
    test('should pause camera when app goes to background', async () => {
      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      const component = getByTestId('qr-scanner-screen');
      
      await act(async () => {
        fireEvent(component, 'onAppStateChange', { nextAppState: 'background' });
      });

      expect(mockCameraRef.current.pausePreview).toHaveBeenCalled();
    });

    test('should resume camera when app returns to foreground', async () => {
      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      const component = getByTestId('qr-scanner-screen');
      
      // First go to background
      await act(async () => {
        fireEvent(component, 'onAppStateChange', { nextAppState: 'background' });
      });

      // Then return to foreground
      await act(async () => {
        fireEvent(component, 'onAppStateChange', { nextAppState: 'active' });
      });

      expect(mockCameraRef.current.resumePreview).toHaveBeenCalled();
    });

    test('should cleanup resources on component unmount', async () => {
      const { unmount } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      unmount();

      // Should cleanup camera, audio, and other resources
      expect(mockNavigation.removeListener).toHaveBeenCalled();
    });
  });

  describe('Integration with Event Management', () => {
    test('should navigate to event details after successful check-in', async () => {
      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      const scanButton = getByTestId('mock-scan-button');
      
      await act(async () => {
        fireEvent.press(scanButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Success',
          'Successfully checked in!',
          expect.arrayContaining([
            expect.objectContaining({
              text: 'View Event',
              onPress: expect.any(Function)
            })
          ])
        );
      });
    });

    test('should handle events that require pre-registration', async () => {
      eventService.validateQRCode.mockResolvedValue({
        isValid: false,
        attendanceMarked: false,
        errorMessage: 'You must RSVP before checking in to this event'
      });

      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      const scanButton = getByTestId('mock-scan-button');
      
      await act(async () => {
        fireEvent.press(scanButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Registration Required',
          'You must RSVP before checking in to this event',
          expect.arrayContaining([
            expect.objectContaining({
              text: 'RSVP Now',
              onPress: expect.any(Function)
            })
          ])
        );
      });
    });

    test('should update local event data after successful check-in', async () => {
      const { getByTestId } = render(
        <QRCodeScannerScreen navigation={mockNavigation} route={mockRoute} />
      );

      const scanButton = getByTestId('mock-scan-button');
      
      await act(async () => {
        fireEvent.press(scanButton);
      });

      await waitFor(() => {
        // Should update local cache with attendance status
        expect(eventService.updateLocalEventAttendance).toHaveBeenCalledWith(
          123,
          1,
          true
        );
      });
    });
  });
});