'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/useToast';
import { Camera, QrCode, CheckCircle, XCircle, AlertTriangle, Flashlight, RotateCcw, Smartphone, Settings } from 'lucide-react';
import { eventService } from '@/services/eventService';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface QRScanResult {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
}

interface ScanSession {
  id: string;
  eventId: number;
  startTime: Date;
  scansCount: number;
  successCount: number;
  errorCount: number;
  lastScan?: Date;
}

interface EventQRCodeScannerProps {
  eventId: number;
  clubId: number;
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: (result: any) => void;
  className?: string;
}

interface CameraState {
  isActive: boolean;
  hasPermission: boolean;
  error: string | null;
  isLoading: boolean;
  flashlightOn: boolean;
  facingMode: 'environment' | 'user';
}

export function EventQRCodeScanner({ 
  eventId, 
  clubId, 
  isOpen, 
  onClose, 
  onScanSuccess,
  className 
}: EventQRCodeScannerProps) {
  const [cameraState, setCameraState] = useState<CameraState>({
    isActive: false,
    hasPermission: false,
    error: null,
    isLoading: false,
    flashlightOn: false,
    facingMode: 'environment',
  });
  const [scanResults, setScanResults] = useState<QRScanResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanSession, setScanSession] = useState<ScanSession | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [cooldownActive, setCooldownActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const toast = useToast();

  // Initialize scan session when scanner opens
  useEffect(() => {
    if (isOpen && !scanSession) {
      const newSession: ScanSession = {
        id: `scan-${Date.now()}`,
        eventId,
        startTime: new Date(),
        scansCount: 0,
        successCount: 0,
        errorCount: 0,
      };
      setScanSession(newSession);
    }
  }, [isOpen, eventId, scanSession]);

  // Request camera permission and start stream
  const requestCameraPermission = useCallback(async () => {
    try {
      setCameraState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraState.facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraState(prev => ({ 
          ...prev, 
          hasPermission: true, 
          isActive: true, 
          isLoading: false 
        }));
      }
    } catch (error) {
      logger.error('events', 'Camera permission denied for QR scanner', { error, eventId, facingMode: cameraState.facingMode });
      setCameraState(prev => ({
        ...prev,
        error: 'Camera access denied. Please enable camera permissions.',
        isLoading: false
      }));
      toast.error('Please enable camera permissions to scan QR codes');
    }
  }, [cameraState.facingMode, toast]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setCameraState(prev => ({ ...prev, isActive: false }));
  }, []);

  // Toggle flashlight
  const toggleFlashlight = useCallback(async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && 'torch' in track.getCapabilities()) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !cameraState.flashlightOn } as any]
          });
          setCameraState(prev => ({ ...prev, flashlightOn: !prev.flashlightOn }));
        } catch (error) {
          logger.error('events', 'Failed to toggle flashlight on QR scanner', { error, eventId, flashlightOn: cameraState.flashlightOn });
          toast.error('Unable to control flashlight on this device');
        }
      }
    }
  }, [cameraState.flashlightOn, toast]);

  // Switch camera (front/back)
  const switchCamera = useCallback(() => {
    const newFacingMode = cameraState.facingMode === 'environment' ? 'user' : 'environment';
    setCameraState(prev => ({ ...prev, facingMode: newFacingMode }));
    stopCamera();
    setTimeout(() => {
      setCameraState(prev => ({ ...prev, facingMode: newFacingMode }));
      requestCameraPermission();
    }, 100);
  }, [cameraState.facingMode, stopCamera, requestCameraPermission]);

  // Process QR code scan
  const processQRScan = useCallback(async (qrData: string) => {
    if (isProcessing || cooldownActive || qrData === lastScannedCode) {
      return;
    }

    setIsProcessing(true);
    setCooldownActive(true);
    setLastScannedCode(qrData);

    // Set cooldown to prevent duplicate scans
    setTimeout(() => {
      setCooldownActive(false);
      setLastScannedCode(null);
    }, 2000);

    try {
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
      } catch {
        // If not JSON, treat as raw string
        parsedData = { data: qrData, type: 'raw' };
      }

      // Validate QR code with backend
      const validation = await eventService.validateQRCheckIn(eventId, parsedData);

      const result: QRScanResult = {
        type: validation.valid ? 'success' : 'error',
        title: validation.valid ? 'Valid QR Code' : 'Invalid QR Code',
        message: validation.message || (validation.valid ? 'QR code scanned successfully' : 'Invalid QR code'),
        data: validation.attendee,
        timestamp: new Date(),
      };

      setScanResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results

      // Update scan session
      setScanSession(prev => prev ? {
        ...prev,
        scansCount: prev.scansCount + 1,
        successCount: prev.successCount + (validation.valid ? 1 : 0),
        errorCount: prev.errorCount + (validation.valid ? 0 : 1),
        lastScan: new Date(),
      } : null);

      if (validation.valid) {
        // Process successful scan (e.g., check-in, registration)
        if ((validation as any).action) {
          await eventService.processQRAction(eventId, (validation as any).action, (validation as any).data);
        }
        
        toast.success(result.message);

        onScanSuccess?.((validation as any).data);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      logger.error('events', 'QR code scan processing failed', { error, eventId, qrData: qrData.substring(0, 100) });
      const errorResult: QRScanResult = {
        type: 'error',
        title: 'Scan Error',
        message: 'Failed to process QR code. Please try again.',
        timestamp: new Date(),
      };
      setScanResults(prev => [errorResult, ...prev.slice(0, 9)]);

      toast.error('Failed to process QR code');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, cooldownActive, lastScannedCode, eventId, onScanSuccess, toast]);

  // QR code detection using canvas
  const detectQRCode = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !cameraState.isActive) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // In a real implementation, you would use a QR code detection library like jsQR
    // For now, we'll simulate QR detection
    try {
      // Simulate QR detection - in reality, use jsQR or similar library
      // const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      // const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
      
      // Mock QR detection for testing
      if (Math.random() < 0.01) { // 1% chance of detecting a mock QR code
        const mockQRData = JSON.stringify({
          type: 'event_checkin',
          eventId: eventId,
          clubId: clubId,
          memberId: Math.floor(Math.random() * 1000),
          timestamp: Date.now(),
        });
        await processQRScan(mockQRData);
      }
    } catch (error) {
      logger.error('events', 'QR code detection error', { error, eventId });
    }
  }, [cameraState.isActive, eventId, clubId, processQRScan]);

  // Start QR detection loop
  useEffect(() => {
    if (cameraState.isActive && isOpen) {
      scanIntervalRef.current = setInterval(detectQRCode, 100); // Check every 100ms
    } else if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [cameraState.isActive, isOpen, detectQRCode]);

  // Handle dialog open/close
  useEffect(() => {
    if (isOpen && !cameraState.hasPermission) {
      requestCameraPermission();
    } else if (!isOpen) {
      stopCamera();
      setScanResults([]);
      setScanSession(null);
      setLastScannedCode(null);
      setCooldownActive(false);
    }
  }, [isOpen, cameraState.hasPermission, requestCameraPermission, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const getScanResultIcon = (type: QRScanResult['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <QrCode className="h-4 w-4 text-primary" />;
    }
  };

  const scanSuccessRate = scanSession && scanSession.scansCount > 0 
    ? Math.round((scanSession.successCount / scanSession.scansCount) * 100)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn('max-w-4xl h-[90vh] flex flex-col', className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          {/* Camera Section */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="flex-1">
              <CardContent className="p-4 h-full">
                {cameraState.error ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <Camera className="h-16 w-16 text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-medium">Camera Access Required</h3>
                      <p className="text-muted-foreground">{cameraState.error}</p>
                    </div>
                    <Button onClick={requestCameraPermission} data-testid="request-camera-permission">
                      <Camera className="mr-2 h-4 w-4" />
                      Enable Camera
                    </Button>
                  </div>
                ) : cameraState.isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4" />
                    <p className="text-muted-foreground">Initializing camera...</p>
                  </div>
                ) : (
                  <div className="relative h-full">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover rounded-lg"
                      data-testid="camera-video"
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    
                    {/* Scanning overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative">
                        <div className="w-64 h-64 border-2 border-primary rounded-lg">
                          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary" />
                          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary" />
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary" />
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary" />
                        </div>
                        {isProcessing && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                            <div className="bg-white rounded-lg p-4 flex items-center gap-2">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                              <span className="text-sm font-medium">Processing...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Camera controls */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={toggleFlashlight}
                        data-testid="toggle-flashlight"
                        className="bg-black/50 text-white hover:bg-black/70"
                      >
                        <Flashlight className={cn('h-4 w-4', cameraState.flashlightOn && 'text-warning')} />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={switchCamera}
                        data-testid="switch-camera"
                        className="bg-black/50 text-white hover:bg-black/70"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Scan status */}
                    {cooldownActive && (
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                        <Badge variant="secondary" className="bg-black/50 text-white">
                          Cooldown Active
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Session Stats */}
            {scanSession && (
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{scanSession.scansCount}</p>
                      <p className="text-sm text-muted-foreground">Total Scans</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-success">{scanSession.successCount}</p>
                      <p className="text-sm text-muted-foreground">Successful</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-destructive">{scanSession.errorCount}</p>
                      <p className="text-sm text-muted-foreground">Errors</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{scanSuccessRate}%</p>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                    </div>
                  </div>
                  <Progress value={scanSuccessRate} className="mt-2" />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-4 flex flex-col">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg">Scan Results</CardTitle>
                <CardDescription>Recent QR code scan attempts</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3 overflow-y-auto max-h-96" data-testid="scan-results">
                {scanResults.length === 0 ? (
                  <div className="text-center py-8">
                    <QrCode className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No scans yet</p>
                    <p className="text-sm text-muted-foreground">Point camera at QR code to scan</p>
                  </div>
                ) : (
                  scanResults.map((result, index) => (
                    <div
                      key={`scan-${index}-${result.timestamp.getTime()}`}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border"
                      data-testid={`scan-result-${index}`}
                    >
                      {getScanResultIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{result.title}</p>
                        <p className="text-xs text-muted-foreground">{result.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {result.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instructions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <span>Hold device steady</span>
                </div>
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-muted-foreground" />
                  <span>Center QR code in frame</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flashlight className="h-4 w-4 text-muted-foreground" />
                  <span>Use flashlight in low light</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Switch cameras if needed</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} data-testid="close-scanner">
            Close Scanner
          </Button>
          {cameraState.isActive && (
            <Button onClick={stopCamera} variant="secondary" data-testid="stop-camera">
              Stop Camera
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
