/**
 * PERFECT PWA STATUS COMPONENT
 * Shows connection status, update availability, and PWA installation status
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  RefreshCw, 
  Smartphone, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { pwaManager } from '@/lib/pwa';
import { logger } from '@/lib/logger';

interface PWAStatusProps {
  showInstallButton?: boolean;
  compact?: boolean;
  className?: string;
}

export const PWAStatus: React.FC<PWAStatusProps> = ({
  showInstallButton = true,
  compact = false,
  className = ''
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Initialize status
    setIsOnline(pwaManager.getOnlineStatus());
    setCanInstall(pwaManager.canInstall());
    setIsStandalone(pwaManager.isStandalone());

    // Subscribe to online status changes
    const unsubscribe = pwaManager.onlineStatusSubscribe((online) => {
      setIsOnline(online);
      if (online) {
        setLastSyncTime(new Date());
      }
    });

    // Check for service worker updates
    const checkForUpdates = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            if (registration.waiting) {
              setHasUpdate(true);
            }
          });
        });
      }
    };

    checkForUpdates();
    const updateInterval = setInterval(checkForUpdates, 60000); // Check every minute

    return () => {
      unsubscribe();
      clearInterval(updateInterval);
    };
  }, []);

  const handleInstall = async () => {
    try {
      await pwaManager.promptInstall();
    } catch (error) {
      logger.error('pwa', 'PWA installation failed', { error });
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await pwaManager.activateServiceWorker();
    } catch (error) {
      logger.error('pwa', 'PWA update failed', { error });
    } finally {
      setIsUpdating(false);
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Connection Status */}
        <Badge 
          variant={isOnline ? "default" : "destructive"}
          className="flex items-center gap-1"
        >
          {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {isOnline ? 'Online' : 'Offline'}
        </Badge>

        {/* Update Available */}
        {hasUpdate && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleUpdate}
            disabled={isUpdating}
            className="h-6 px-2 text-xs"
          >
            {isUpdating ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <Download className="h-3 w-3 mr-1" />
                Update
              </>
            )}
          </Button>
        )}

        {/* Install Button */}
        {showInstallButton && canInstall && !isStandalone && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleInstall}
            className="h-6 px-2 text-xs"
          >
            <Smartphone className="h-3 w-3 mr-1" />
            Install
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">App Status</h3>
            <Badge variant={isStandalone ? "default" : "secondary"}>
              {isStandalone ? 'Installed' : 'Web Version'}
            </Badge>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-3">
              {isOnline ? (
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <Wifi className="h-5 w-5 text-success" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <WifiOff className="h-5 w-5 text-destructive" />
                </div>
              )}

              <div>
                <p className="font-medium">
                  {isOnline ? 'Connected' : 'Offline Mode'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isOnline
                    ? 'All features available'
                    : 'Limited functionality - changes will sync when online'
                  }
                </p>
                {lastSyncTime && (
                  <p className="text-xs text-muted-foreground/80">
                    Last sync: {lastSyncTime.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            <Badge variant={isOnline ? "default" : "destructive"}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>

          {/* Update Status */}
          {hasUpdate && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <p className="font-medium">Update Available</p>
                  <p className="text-sm text-muted-foreground">
                    A new version of GatherGrove is ready to install
                  </p>
                </div>
              </div>

              <Button
                onClick={handleUpdate}
                disabled={isUpdating}
                size="sm"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Update Now
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Installation Status */}
          {!isStandalone && canInstall && showInstallButton && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-success/5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-success" />
                </div>

                <div>
                  <p className="font-medium">Install as App</p>
                  <p className="text-sm text-muted-foreground">
                    Get offline access and native experience
                  </p>
                </div>
              </div>

              <Button
                onClick={handleInstall}
                size="sm"
                className="bg-success hover:bg-success/90"
              >
                <Download className="h-4 w-4 mr-2" />
                Install
              </Button>
            </div>
          )}

          {/* PWA Features Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                {isOnline ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <Clock className="h-4 w-4 text-warning" />
                )}
                <span className="text-sm font-medium">Background Sync</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isOnline ? 'Active' : 'Queued for sync'}
              </p>
            </div>

            <div className="p-3 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">Offline Storage</span>
              </div>
              <p className="text-xs text-muted-foreground">Ready</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Named export already present above
export default PWAStatus;