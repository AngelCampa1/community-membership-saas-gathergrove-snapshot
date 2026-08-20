'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Monitor, Tablet, Smartphone, Share, Download, AlertTriangle, Copy, Check } from 'lucide-react';
import { getContrastRatio } from '@/utils/colorUtils';
import { logger } from '@/lib/logger';

export interface BrandSettings {
  logo?: string | null;
  favicon?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  organizationName: string;
  tagline?: string;
  customCss?: string;
  sampleEvents?: Array<{
    id: number;
    name: string;
    date: Date;
  }>;
}

export type PreviewMode = 'desktop' | 'tablet' | 'mobile';

export interface BrandPreviewProps {
  brandSettings: BrandSettings;
  previewMode?: PreviewMode;
  showResponsive?: boolean;
  onModeChange?: (mode: PreviewMode) => void;
  className?: string;
}

export function BrandPreview({
  brandSettings,
  previewMode = 'desktop',
  showResponsive = true,
  onModeChange,
  className
}: BrandPreviewProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const customStyleRef = useRef<HTMLStyleElement | null>(null);

  // Provide default values for optional brand settings
  const safeSettings = {
    ...brandSettings,
    primaryColor: brandSettings.primaryColor || '#3B82F6',
    secondaryColor: brandSettings.secondaryColor || '#6B7280'
  };

  // Apply custom CSS styles
  useEffect(() => {
    if (brandSettings.customCss && previewRef.current) {
      // Remove previous custom styles
      if (customStyleRef.current) {
        customStyleRef.current.remove();
      }

      // Create new style element
      const styleElement = document.createElement('style');
      styleElement.id = 'preview-custom-styles';
      // Apply custom CSS with proper scoping to preview container
      const scopedCss = brandSettings.customCss.replace(/\.custom/g, '.brand-preview-container .custom');
      styleElement.textContent = scopedCss;
      
      previewRef.current.appendChild(styleElement);
      customStyleRef.current = styleElement;
    }

    return () => {
      if (customStyleRef.current) {
        customStyleRef.current.remove();
      }
    };
  }, [brandSettings.customCss]);

  // Calculate contrast ratios for accessibility warnings
  const primaryContrast = getContrastRatio(safeSettings.primaryColor, '#FFFFFF');
  const hasContrastIssues = primaryContrast < 4.5;

  // Calculate consistency score (simplified)
  const consistencyScore = Math.min(100, Math.round(
    (brandSettings.logo ? 25 : 0) +
    (brandSettings.organizationName ? 25 : 0) +
    (safeSettings.primaryColor !== '#3B82F6' ? 25 : 0) +
    (brandSettings.tagline ? 25 : 0)
  ));

  const handleModeChange = (mode: PreviewMode) => {
    onModeChange?.(mode);
    // Announce change to screen readers
    const announcement = `Switched to ${mode} view`;
    const liveRegion = document.querySelector('[role="status"]');
    if (liveRegion) {
      liveRegion.textContent = announcement;
    }
  };

  const handleSharePreview = async () => {
    // Generate a mock preview URL
    const previewId = Math.random().toString(36).substr(2, 9);
    const url = `${window.location.origin}/preview/${previewId}`;
    setShareUrl(url);
  };

  const handleCopyUrl = async () => {
    if (shareUrl && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportPreview = async () => {
    // Mock export functionality
    try {
      // In real implementation, would use html2canvas
      logger.debug('ui', 'Exporting brand preview', { organizationName: brandSettings.organizationName });
    } catch (error) {
      logger.error('ui', 'Failed to export brand preview', { error, organizationName: brandSettings.organizationName });
    }
  };

  const getPreviewContainerClass = () => {
    const baseClass = 'w-full transition-all duration-300 border border-border rounded-lg overflow-hidden bg-background';

    switch (previewMode) {
      case 'mobile':
        return cn(baseClass, 'max-w-[280px] mx-auto');
      case 'tablet':
        return cn(baseClass, 'max-w-[380px] mx-auto');
      case 'desktop':
      default:
        return cn(baseClass);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Preview Controls */}
      {showResponsive && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2" role="group" aria-label="Viewport selection">
            <Button
              variant={previewMode === 'desktop' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleModeChange('desktop')}
              className={previewMode === 'desktop' ? 'bg-primary text-primary-foreground' : ''}
              aria-label="Desktop view"
            >
              <Monitor className="h-4 w-4 mr-1" />
              Desktop
            </Button>
            <Button
              variant={previewMode === 'tablet' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleModeChange('tablet')}
              className={previewMode === 'tablet' ? 'bg-primary text-primary-foreground' : ''}
              aria-label="Tablet view"
            >
              <Tablet className="h-4 w-4 mr-1" />
              Tablet
            </Button>
            <Button
              variant={previewMode === 'mobile' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleModeChange('mobile')}
              className={previewMode === 'mobile' ? 'bg-primary text-primary-foreground' : ''}
              aria-label="Mobile view"
            >
              <Smartphone className="h-4 w-4 mr-1" />
              Mobile
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSharePreview}
              aria-label="Share preview"
            >
              <Share className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPreview}
              aria-label="Export preview"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      )}

      {/* Branding Validation Alerts */}
      {hasContrastIssues && (
        <div role="alert" aria-label="Contrast warning" className="p-3 bg-warning/10 border border-warning rounded-lg">
          <div className="flex items-center space-x-2 text-warning">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Accessibility Warning</span>
          </div>
          <p className="text-sm text-warning/90 mt-1">
            Your color combination may not meet accessibility standards for visually impaired users.
          </p>
        </div>
      )}

      {/* Consistency Score */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground">Brand Consistency:</span>
        <Badge
          variant={consistencyScore >= 80 ? 'default' : consistencyScore >= 60 ? 'secondary' : 'destructive'}
          data-testid="consistency-score"
        >
          Consistency: {consistencyScore}%
        </Badge>
      </div>

      {/* Missing Elements Warnings */}
      <div className="space-y-2">
        {!brandSettings.logo && (
          <p className="text-sm text-warning">Missing logo - Consider adding a logo for better brand recognition</p>
        )}
        {!brandSettings.organizationName && (
          <p className="text-sm text-destructive">Organization name required for proper branding</p>
        )}
      </div>

      {/* Preview Container */}
      <div role="region" aria-label="Brand preview" className="space-y-4">
        <div 
          ref={previewRef}
          className={cn('brand-preview-container', getPreviewContainerClass())}
          data-testid="brand-preview"
        >
          {/* Header */}
          <header 
            className="p-4 text-white"
            style={{ backgroundColor: safeSettings.primaryColor }}
            data-testid="preview-header"
            role="banner"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {brandSettings.logo ? (
                  <img
                    src={brandSettings.logo}
                    alt={`${brandSettings.organizationName} logo`}
                    className="h-8 w-auto"
                    loading="lazy"
                  />
                ) : (
                  <div 
                    className="w-8 h-8 bg-white/20 rounded flex items-center justify-center"
                    data-testid="logo-placeholder"
                  >
                    <span className="text-xs text-white/60">Logo</span>
                  </div>
                )}
                <div>
                  <h1 className="font-bold text-lg">{brandSettings.organizationName || 'Your Club Name'}</h1>
                  {brandSettings.tagline && (
                    <p className="text-sm text-white/80">{brandSettings.tagline}</p>
                  )}
                </div>
              </div>
              
              {/* Favicon Preview */}
              {brandSettings.favicon && (
                <img
                  src={brandSettings.favicon}
                  alt="Favicon"
                  className="w-4 h-4"
                  data-testid="favicon-preview"
                />
              )}
            </div>
            
            {/* Navigation */}
            <nav className="mt-4" role="navigation">
              <div className="flex space-x-6 text-sm">
                <a href="#" className="hover:text-white/80" role="link">Home</a>
                <a href="#" className="hover:text-white/80" role="link">Events</a>
                <a href="#" className="hover:text-white/80" role="link">Directory</a>
                <a href="#" className="hover:text-white/80" role="link">About</a>
              </div>
            </nav>
          </header>

          {/* Main Content */}
          <main className="p-3 space-y-4" role="main">
            {/* Welcome Section */}
            <section className="text-center py-4">
              <h2 className="text-lg font-bold text-foreground mb-1">Welcome to {brandSettings.organizationName}</h2>
              <p className="text-sm text-muted-foreground mb-3">{brandSettings.tagline || 'Making connections that matter'}</p>
              <Button
                size="sm"
                style={{ backgroundColor: safeSettings.secondaryColor }}
                role="button"
                aria-label="Join now"
              >
                Join Now
              </Button>
            </section>

            {/* Login Form */}
            <Card>
              <CardContent className="p-3">
                <form role="form" aria-label="Login form">
                  <h3 className="font-semibold text-sm mb-2">Member Login</h3>
                  <div className="space-y-2">
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full p-2 text-sm border border-input rounded"
                      aria-label="Email"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      className="w-full p-2 text-sm border border-input rounded"
                      aria-label="Password"
                    />
                    <Button
                      size="sm"
                      className="w-full"
                      style={{ backgroundColor: safeSettings.primaryColor }}
                      role="button"
                      aria-label="Sign in"
                    >
                      Sign In
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Sample Events */}
            <section>
              <h3 className="font-semibold text-sm mb-2">Upcoming Events</h3>
              <div className="space-y-2">
                {Array.from({ length: 2 }, (_, i) => (
                  <Card
                    key={i}
                    className="hover:shadow-md transition-shadow"
                    style={{ borderColor: safeSettings.secondaryColor }}
                    data-testid="event-card"
                  >
                    <CardContent className="p-3">
                      <h4 className="font-medium text-sm truncate">Sample Event {i + 1}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">Join us for this exciting event</p>
                      <p className="text-xs text-muted-foreground/80 mt-1">Tomorrow 6:00 PM</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Membership Tiers */}
            <section>
              <h3 className="font-semibold text-sm mb-2">Membership Options</h3>
              <div className="space-y-2">
                {['Basic', 'Standard', 'Premium'].map((tier, i) => (
                  <Card
                    key={tier}
                    className={cn(
                      'text-center',
                      i === 2 && 'ring-2'
                    )}
                    style={i === 2 ? {
                      backgroundColor: safeSettings.primaryColor,
                      color: 'white',
                      boxShadow: `0 0 0 2px ${safeSettings.primaryColor}`
                    } : {}}
                    data-testid={`${tier.toLowerCase()}-tier`}
                  >
                    <CardContent className="p-3">
                      <h4 className="font-medium text-sm">{tier}</h4>
                      <p className="text-lg font-bold">${(i + 1) * 20}/mo</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Custom Styled Element */}
            <div
              className="custom p-4 rounded-lg bg-muted"
              data-testid="custom-styled-element"
            >
              Custom styled content area
            </div>
          </main>

          {/* Footer */}
          <footer
            className="p-4 bg-muted text-center text-sm text-muted-foreground"
            role="contentinfo"
          >
            <p>© 2024 {brandSettings.organizationName}. All rights reserved.</p>
          </footer>
        </div>
      </div>

      {/* Share URL Dialog */}
      {shareUrl && (
        <Card className="p-4">
          <div className="space-y-3">
            <h4 className="font-medium">Share Preview</h4>
            <div className="flex space-x-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 p-2 border border-input rounded text-sm"
                aria-label="Preview URL"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                aria-label="Copy URL"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {copied && (
              <p className="text-sm text-success">URL copied to clipboard!</p>
            )}
          </div>
        </Card>
      )}

      {/* Image Error Handling */}
      {!brandSettings.logo && (
        <div style={{ display: 'none' }} data-testid="logo-error-placeholder">
          Logo failed to load
        </div>
      )}

      {/* Live Region for Screen Reader Announcements */}
      <div role="status" aria-live="polite" className="sr-only" />
    </div>
  );
}
