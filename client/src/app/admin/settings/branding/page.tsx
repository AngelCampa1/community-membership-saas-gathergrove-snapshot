'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { ArrowLeft, Save, Loader2, CheckCircle, AlertTriangle, Crown } from 'lucide-react';
import { LogoUploader, LogoData } from '@/components/branding/LogoUploader';
import { ColorSchemePicker } from '@/components/branding/ColorSchemePicker';
import { BrandPreview } from '@/components/branding/BrandPreview';
import { brandingService, BrandSettings, SaveBrandSettingsRequest } from '@/services/brandingService';
import { themeService } from '@/services/themeService';
import { isValidHexColor } from '@/utils/colorUtils';
import { logger } from '@/lib/logger';
import { useAuth } from '@/hooks/useAuth';

interface ValidationErrors {
  primaryColor?: string;
  secondaryColor?: string;
  customClubName?: string;
  logo?: string;
  favicon?: string;
  general?: string;
}

export default function BrandingSettingsPage() {
  const { user, loading: isLoading } = useAuth();
  const isAuthenticated = !!user;
  
  // State
  const [brandSettings, setBrandSettings] = useState<BrandSettings>({
    clubId: 1,
    primaryColor: '#4a9a72',
    secondaryColor: '#4a5a52',
    hideGatherGroveBranding: false,
    customClubName: 'Test Club',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [pendingFavicon, setPendingFavicon] = useState<File | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load initial branding settings.
  // Depend on the club id (a primitive), NOT the whole `user` object — otherwise
  // any re-render that produces a new user reference would re-run this effect and
  // clobber the admin's unsaved edits by reloading saved settings over them.
  const clubId = user?.clubId;
  useEffect(() => {
    const loadBrandingSettings = async () => {
      if (clubId) {
        try {
          setLoadError(null);
          const settings = await brandingService.getBrandSettings(clubId);
          if (settings) {
            setBrandSettings(settings);
          }
        } catch (error) {
          logger.error('ui', 'Failed to load branding settings', { error, clubId });
          // Defaults remain in state, but the user must know these are NOT their
          // saved settings — otherwise a save here would silently overwrite them.
          setLoadError(
            "We couldn't load your saved branding settings. The values shown below are defaults — refresh before saving to avoid overwriting your existing branding."
          );
        }
      }
      setIsInitialLoading(false);
    };

    if (isAuthenticated && clubId) {
      loadBrandingSettings();
    } else {
      setIsInitialLoading(false);
    }
  }, [isAuthenticated, clubId]);

  // Validation functions
  const validateColorFormat = (color: string, field: 'primaryColor' | 'secondaryColor') => {
    if (!isValidHexColor(color)) {
      setErrors(prev => ({ ...prev, [field]: 'Invalid color format. Use hex format (e.g., #3B82F6)' }));
      return false;
    }
    setErrors(prev => ({ ...prev, [field]: undefined }));
    return true;
  };

  const validateFileSize = (file: File) => {
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, logo: 'File size must be less than 2MB' }));
      return false;
    }
    return true;
  };

  const validateFileType = (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, logo: 'Only image files are allowed (JPG, PNG, SVG)' }));
      return false;
    }
    return true;
  };

  // Event handlers
  const handleColorChange = (colors: { primary: string; secondary: string }) => {
    setBrandSettings(prev => ({
      ...prev,
      primaryColor: colors.primary,
      secondaryColor: colors.secondary
    }));
    
    // Clear any previous errors
    setErrors(prev => ({ 
      ...prev, 
      primaryColor: undefined, 
      secondaryColor: undefined 
    }));
  };

  const handleLogoChange = (logoData: LogoData | null) => {
    if (logoData) {
      if (validateFileSize(logoData.file) && validateFileType(logoData.file)) {
        setPendingLogo(logoData.file);
        setBrandSettings(prev => ({ ...prev, logo: logoData.preview }));
        setErrors(prev => ({ ...prev, logo: undefined }));
      }
    } else {
      setPendingLogo(null);
      setBrandSettings(prev => ({ ...prev, logo: undefined }));
    }
  };

  const handleInputChange = (field: keyof BrandSettings, value: string) => {
    setBrandSettings(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleError = (error: string) => {
    setErrors(prev => ({ ...prev, general: error }));
  };

  const handleSave = async () => {
    // Validation
    const newErrors: ValidationErrors = {};

    if (brandSettings?.primaryColor && !validateColorFormat(brandSettings.primaryColor, 'primaryColor')) {
      newErrors.primaryColor = 'Invalid color format';
    }

    if (brandSettings?.secondaryColor && !validateColorFormat(brandSettings.secondaryColor, 'secondaryColor')) {
      newErrors.secondaryColor = 'Invalid color format';
    }

    if (!brandSettings?.customClubName?.trim()) {
      newErrors.customClubName = 'Club name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!user?.clubId) {
      setErrors({ general: 'No club found' });
      return;
    }

    setIsSaving(true);
    setErrors({});

    // Save branding settings request data
    const saveData: SaveBrandSettingsRequest = {
      primaryColor: brandSettings?.primaryColor,
      secondaryColor: brandSettings?.secondaryColor,
      customClubName: brandSettings?.customClubName,
      fontFamily: brandSettings?.fontFamily,
      customCSS: brandSettings?.customCSS,
      hideGatherGroveBranding: brandSettings?.hideGatherGroveBranding,
      customFooterText: brandSettings?.customFooterText
    };

    try {
      // Upload files first if needed
      if (pendingLogo) {
        await brandingService.uploadLogo(user.clubId, pendingLogo);
      }

      if (pendingFavicon) {
        await brandingService.uploadFavicon(user.clubId, pendingFavicon);
      }

      // Save branding settings
      await brandingService.saveBrandSettings(user.clubId, saveData);

      // Apply theme changes
      if (brandSettings) {
        themeService.applyTheme(brandSettings);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('ui', 'Failed to save branding settings', { error, clubId: user.clubId, saveData });
      setErrors({ general: errorMessage || 'Failed to save branding settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Loading states
  if (isLoading || isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading branding settings...</p>
        </div>
      </div>
    );
  }

  // Authentication check
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto" />
            <h2 className="text-xl font-semibold">Authentication Required</h2>
            <p className="text-muted-foreground">Please log in to access branding settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tier check
  const currentTier = user?.clubTier || 'Basic';
  const hasUnlimitedAccess = currentTier === 'Expand' || currentTier === 'Unlimited';

  if (!hasUnlimitedAccess) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="text-center p-8">
          <CardContent className="space-y-6">
            <Crown className="h-16 w-16 text-warning mx-auto" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Upgrade to Expand</h2>
              <p className="text-muted-foreground">
                White-label branding is available exclusively for Expand tier members.
                Customize your club's visual identity with logos, colors, and themes.
              </p>
            </div>
            <div className="space-y-3">
              <Button className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-8 py-2">
                Upgrade Now
              </Button>
              <p className="text-sm text-muted-foreground/70">
                Create a unique brand experience for your club
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/settings"
            className="inline-flex items-center text-sm text-primary hover:text-primary/80"
            role="link"
            aria-label="Back to settings"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Settings
          </Link>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            White-Label Branding
          </h1>
          <p className="text-muted-foreground">
            Customize your club's visual identity with logos, colors, and custom styling.
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {loadError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {saveSuccess && (
        <Alert className="border-success/20 bg-success/10">
          <CheckCircle className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            Branding settings saved successfully!
          </AlertDescription>
        </Alert>
      )}
      
      {errors.general && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Logo & Branding Section */}
          <Card role="region" aria-label="Logo & Branding">
            <CardHeader>
              <CardTitle>Logo & Branding</CardTitle>
              <CardDescription>
                Upload your organization's logo and favicon
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Organization Logo</Label>
                <LogoUploader
                  onLogoChange={handleLogoChange}
                  onError={handleError}
                  currentLogo={brandSettings?.logoUrl}
                />
                {errors.logo && (
                  <p className="text-sm text-destructive mt-2">{errors.logo}</p>
                )}
                <p className="text-xs text-muted-foreground/70">
                  Upload a high-quality logo in JPG, PNG, or SVG format. Maximum size: 5MB.
                </p>
              </div>

              {/* Favicon Upload */}
              <div className="space-y-2">
                <Label>Favicon</Label>
                <div className="flex items-center space-x-4">
                  {brandSettings?.faviconUrl && (
                    <div className="w-8 h-8 bg-muted rounded border flex items-center justify-center">
                      <Image
                        src={brandSettings.faviconUrl}
                        alt="Current favicon"
                        className="w-6 h-6"
                        width={24}
                        height={24}
                      />
                    </div>
                  )}
                  <div>
                    <Input
                      type="file"
                      accept=".ico,.png,.jpg,.jpeg,.svg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size <= 2 * 1024 * 1024) { // 2MB limit for favicon
                            setPendingFavicon(file);
                            setErrors(prev => ({ ...prev, favicon: undefined }));
                          } else {
                            setErrors(prev => ({ ...prev, favicon: 'Favicon must be less than 2MB' }));
                          }
                        }
                      }}
                      className="max-w-sm"
                    />
                  </div>
                </div>
                {errors.favicon && (
                  <p className="text-sm text-destructive">{errors.favicon}</p>
                )}
                <p className="text-xs text-muted-foreground/70">
                  Upload a favicon file in ICO, PNG, JPG, or SVG format. Maximum size: 2MB.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Color Scheme Section */}
          <Card role="region" aria-label="Color Scheme">
            <CardHeader>
              <CardTitle>Color Scheme</CardTitle>
              <CardDescription>
                Choose your primary and secondary brand colors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ColorSchemePicker
                primaryColor={brandSettings?.primaryColor || '#4a9a72'}
                secondaryColor={brandSettings?.secondaryColor || '#4a5a52'}
                onColorChange={handleColorChange}
                onError={handleError}
                showPreview
                showPalette
                advancedMode
              />
              {(errors.primaryColor || errors.secondaryColor) && (
                <div className="mt-2 space-y-1">
                  {errors.primaryColor && (
                    <p className="text-sm text-destructive">{errors.primaryColor}</p>
                  )}
                  {errors.secondaryColor && (
                    <p className="text-sm text-destructive">{errors.secondaryColor}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organization Details */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Customize your organization's identity and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-club-name">Custom Club Name *</Label>
                <Input
                  id="custom-club-name"
                  value={brandSettings?.customClubName || ''}
                  onChange={(e) => handleInputChange('customClubName', e.target.value)}
                  placeholder="Enter your custom club name"
                  className={cn(errors.customClubName && 'border-destructive')}
                  aria-describedby={errors.customClubName ? 'club-name-error' : undefined}
                />
                {errors.customClubName && (
                  <p id="club-name-error" className="text-sm text-destructive">{errors.customClubName}</p>
                )}
                <p className="text-xs text-muted-foreground/70">
                  This will override your default club name throughout the application
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-family">Font Family (Optional)</Label>
                <Input
                  id="font-family"
                  value={brandSettings?.fontFamily || ''}
                  onChange={(e) => handleInputChange('fontFamily', e.target.value)}
                  placeholder="Arial, Helvetica, sans-serif"
                />
                <p className="text-xs text-muted-foreground/70">
                  Choose a web-safe font or Google Fonts family name
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-footer">Custom Footer Text (Optional)</Label>
                <Textarea
                  id="custom-footer"
                  value={brandSettings?.customFooterText || ''}
                  onChange={(e) => handleInputChange('customFooterText', e.target.value)}
                  placeholder="© 2024 Your Organization. All rights reserved."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground/70">
                  Custom text to display in the footer of your club pages
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-css">Custom CSS (Optional)</Label>
                <Textarea
                  id="custom-css"
                  value={brandSettings?.customCSS || ''}
                  onChange={(e) => handleInputChange('customCSS', e.target.value)}
                  placeholder=".custom { color: red; }"
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground/70">
                  Advanced: Add custom CSS to further customize your branding
                </p>
              </div>
            </CardContent>
          </Card>

          {/* White Label Options */}
          <Card>
            <CardHeader>
              <CardTitle>White Label Options</CardTitle>
              <CardDescription>
                Remove GatherGrove branding for a complete white-label experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hide-powered-by"
                  checked={brandSettings?.hideGatherGroveBranding || false}
                  onChange={(e) => setBrandSettings(prev => ({ ...prev, hideGatherGroveBranding: e.target.checked }))}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <Label htmlFor="hide-powered-by">
                  Hide "Powered by GatherGrove" branding
                </Label>
              </div>
              <p className="text-xs text-muted-foreground/70">
                Remove GatherGrove references from your club pages for a complete white-label experience
              </p>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="min-w-32"
              aria-label="Save changes"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                See how your branding will look across different devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BrandPreview
                brandSettings={{
                  organizationName: brandSettings?.customClubName || 'Your Organization',
                  primaryColor: brandSettings?.primaryColor,
                  secondaryColor: brandSettings?.secondaryColor,
                  logo: brandSettings?.logoUrl,
                  favicon: brandSettings?.faviconUrl,
                  customCss: brandSettings?.customCSS,
                  tagline: undefined
                }}
                showResponsive
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
