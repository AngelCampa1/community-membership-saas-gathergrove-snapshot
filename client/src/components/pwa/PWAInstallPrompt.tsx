/**
 * PERFECT PWA INSTALL PROMPT COMPONENT
 * Provides beautiful, accessible PWA installation interface
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Smartphone, Download, Zap, Wifi, Bell } from 'lucide-react';
import { pwaManager } from '@/lib/pwa';
import { logger } from '@/lib/logger';

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  autoShow?: boolean;
  className?: string;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  onInstall,
  onDismiss,
  autoShow = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installationStatus, setInstallationStatus] = useState<'not-supported' | 'available' | 'installed'>('not-supported');
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check PWA installation status
    const status = pwaManager.getInstallationStatus();
    const standalone = pwaManager.isStandalone();
    
    setInstallationStatus(status);
    setIsStandalone(standalone);
    setCanInstall(pwaManager.canInstall());
    
    // Show prompt if conditions are met
    if (autoShow && status === 'available' && !standalone) {
      // Delay showing to avoid disrupting user flow
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [autoShow]);

  const handleInstall = async () => {
    if (!canInstall) return;
    
    setIsInstalling(true);
    
    try {
      const result = await pwaManager.promptInstall();
      
      if (result?.outcome === 'accepted') {
        setIsVisible(false);
        onInstall?.();
      }
    } catch (error) {
      logger.error('pwa', 'PWA installation failed from install prompt', { error });
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();

    // BUG FIX: Add SSR check before sessionStorage access
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa-install-dismissed', 'true');
    }
  };

  // Don't render if already installed or not supported
  if (isStandalone || installationStatus === 'installed' || installationStatus === 'not-supported') {
    return null;
  }

  // BUG FIX: Add SSR check before sessionStorage access in render path
  if (typeof window !== 'undefined' && sessionStorage.getItem('pwa-install-dismissed') === 'true') {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${className}`}>
      <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-gradient-to-br from-background to-muted/30">
        <CardHeader className="relative pb-4">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-8 w-8 p-0"
            onClick={handleDismiss}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-success flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Install GatherGrove</CardTitle>
              <Badge variant="secondary" className="mt-1">
                PWA Available
              </Badge>
            </div>
          </div>

          <CardDescription className="text-muted-foreground">
            Get the full app experience with offline access and native features
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Features */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wifi className="h-4 w-4 text-primary" />
              </div>
              <span>Works offline - manage your club anywhere</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-secondary" />
              </div>
              <span>Faster loading and better performance</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                <Bell className="h-4 w-4 text-success" />
              </div>
              <span>Push notifications for important updates</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 bg-success hover:bg-success/90"
            >
              {isInstalling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Install App
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleDismiss}
              className="px-6"
            >
              Later
            </Button>
          </div>

          {/* Install Steps */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">How to install:</p>
            <ul className="space-y-1 ml-2">
              <li>• Click "Install App" above</li>
              <li>• Confirm installation in your browser</li>
              <li>• Find GatherGrove on your home screen</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Default export for compatibility
export default PWAInstallPrompt;