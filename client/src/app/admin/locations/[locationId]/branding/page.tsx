'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Image, Type, Save } from 'lucide-react';
import {
  locationBrandingService,
} from '@/lib/api/locationBrandingService';
import { locationService, type LocationResponse } from '@/lib/api/locationService';
import { useToast } from '@/hooks/useToast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logger } from '@/lib/logger';

export default function LocationBrandingPage() {
  const params = useParams();
  const toast = useToast();
  const [location, setLocation] = useState<LocationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    customLogoUrl: '',
    customNameOverride: '',
    primaryColor: '#4a9a72',
    secondaryColor: '#4a5a52',
    accentColor: '#6b7d75',
  });

  // Parse locationId after hooks are initialized
  const locationId = params?.locationId ? parseInt(params.locationId as string) : null;

  useEffect(() => {
    if (locationId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  const loadData = async () => {
    if (!locationId) return;

    try {
      setLoading(true);
      const [locationData] = await Promise.all([
        locationService.getLocation(locationId),
        loadBranding(),
      ]);
      setLocation(locationData);
    } catch (error) {
      logger.error('locations', 'Error loading location branding data', { error, locationId });
    } finally {
      setLoading(false);
    }
  };

  const loadBranding = async () => {
    if (!locationId) return null;

    try {
      const data = await locationBrandingService.getLocationBranding(locationId);

      // Parse the color scheme when present; tolerate malformed JSON by falling
      // back to whatever colors are already in state.
      let colors: { primary?: string; secondary?: string; accent?: string } = {};
      if (data.colorScheme) {
        try {
          colors = JSON.parse(data.colorScheme);
        } catch {
          colors = {};
        }
      }

      // Always apply logo/name (they are independent of the color scheme) and use
      // a functional update so we merge against the latest state, never a stale
      // closure capture.
      setFormData((prev) => ({
        ...prev,
        customLogoUrl: data.customLogoUrl || '',
        customNameOverride: data.customNameOverride || '',
        primaryColor: colors.primary || prev.primaryColor,
        secondaryColor: colors.secondary || prev.secondaryColor,
        accentColor: colors.accent || prev.accentColor,
      }));

      return data;
    } catch (error: any) {
      // Branding might not exist yet, that's okay
      if (error.response?.status !== 404) {
        logger.error('locations', 'Error loading location branding', { error, locationId });
      }
      return null;
    }
  };

  const handleSave = async () => {
    if (!locationId) return;

    try {
      setSaving(true);

      const colorScheme = JSON.stringify({
        primary: formData.primaryColor,
        secondary: formData.secondaryColor,
        accent: formData.accentColor,
      });

      await locationBrandingService.updateLocationBranding(locationId, {
        customLogoUrl: formData.customLogoUrl || undefined,
        customNameOverride: formData.customNameOverride || undefined,
        colorScheme,
      });

      toast.success('Location branding has been saved successfully');

      loadBranding();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update branding');
    } finally {
      setSaving(false);
    }
  };

  // Handle invalid location ID - after all hooks
  if (!locationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Invalid location ID</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading branding settings...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Location Branding</h1>
        <p className="text-muted-foreground mt-2">
          Customize the appearance for {location?.locationName}
        </p>
      </div>

      <Alert>
        <Palette className="h-4 w-4" />
        <AlertDescription>
          Location-specific branding allows each location to have its own visual identity while
          maintaining the club's core branding.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Branding Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Logo & Name
              </CardTitle>
              <CardDescription>Customize the location's logo and display name</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Custom Logo URL</Label>
                <Input
                  id="logoUrl"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.customLogoUrl}
                  onChange={(e) => setFormData({ ...formData, customLogoUrl: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Enter a URL to a custom logo image for this location
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customName">Custom Display Name</Label>
                <Input
                  id="customName"
                  placeholder={location?.locationName}
                  value={formData.customNameOverride}
                  onChange={(e) => setFormData({ ...formData, customNameOverride: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Override the location name for public-facing pages (optional)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Scheme
              </CardTitle>
              <CardDescription>Define the color palette for this location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accentColor">Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="accentColor"
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Branding'}
          </Button>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Preview
              </CardTitle>
              <CardDescription>See how your branding will look</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Preview */}
              {formData.customLogoUrl && (
                <div className="space-y-2">
                  <Label>Logo Preview</Label>
                  <div className="border rounded-lg p-4 bg-muted/50 flex items-center justify-center min-h-[120px]">
                    <img
                      src={formData.customLogoUrl}
                      alt="Location Logo"
                      className="max-h-24 max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Name Preview */}
              <div className="space-y-2">
                <Label>Display Name</Label>
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h3 className="text-2xl font-bold">
                    {formData.customNameOverride || location?.locationName || 'Location Name'}
                  </h3>
                </div>
              </div>

              {/* Color Preview */}
              <div className="space-y-2">
                <Label>Color Palette</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div
                      className="w-full h-16 rounded-lg border"
                      style={{ backgroundColor: formData.primaryColor }}
                    />
                    <p className="text-xs text-center text-muted-foreground">Primary</p>
                  </div>
                  <div className="space-y-2">
                    <div
                      className="w-full h-16 rounded-lg border"
                      style={{ backgroundColor: formData.secondaryColor }}
                    />
                    <p className="text-xs text-center text-muted-foreground">Secondary</p>
                  </div>
                  <div className="space-y-2">
                    <div
                      className="w-full h-16 rounded-lg border"
                      style={{ backgroundColor: formData.accentColor }}
                    />
                    <p className="text-xs text-center text-muted-foreground">Accent</p>
                  </div>
                </div>
              </div>

              {/* Sample Card with Colors */}
              <div className="space-y-2">
                <Label>Sample Component</Label>
                <div className="border rounded-lg overflow-hidden">
                  <div
                    className="h-3"
                    style={{ backgroundColor: formData.primaryColor }}
                  />
                  <div className="p-4 space-y-3">
                    <h4 className="font-semibold">Sample Card Title</h4>
                    <p className="text-sm text-muted-foreground">
                      This is how components will look with your color scheme.
                    </p>
                    <Button
                      size="sm"
                      style={{ backgroundColor: formData.primaryColor }}
                    >
                      Action Button
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
