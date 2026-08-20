"use client";

import { useState, useEffect, useCallback } from 'react';
import { Settings, Save, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ErrorHandler } from '@/lib/errorHandler';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { directorySettingsService } from '@/services/directorySettingsService';
import { DirectorySettingsResponse, AVAILABLE_DIRECTORY_FIELDS } from '@/types/directorySettings';
import { logger } from '@/lib/logger';

export default function DirectorySettingsPage() {
  const [settings, setSettings] = useState<DirectorySettingsResponse>({
    isEnabled: false,
    allowedSharableFields: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  // Get club ID from authenticated user
  const clubId = user?.clubId || 0;

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await directorySettingsService.getDirectorySettings(clubId);
      setSettings(data);
    } catch (error) {
      logger.error('members', 'Error loading directory settings', { error, clubId });
      const apiError = ErrorHandler.handleApiError(error, { context: 'loading directory settings' });
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    if (clubId > 0) {
      loadSettings();
    }
  }, [clubId, loadSettings]);

  const handleToggleEnabled = (enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      isEnabled: enabled
    }));
  };

  const handleFieldToggle = (fieldKey: string, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      allowedSharableFields: checked 
        ? [...prev.allowedSharableFields, fieldKey]
        : prev.allowedSharableFields.filter(f => f !== fieldKey)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await directorySettingsService.updateDirectorySettings(clubId, {
        isEnabled: settings.isEnabled,
        allowedSharableFields: settings.allowedSharableFields
      });

      toast.success("Directory settings updated");
    } catch (error: unknown) {
      logger.error('members', 'Error saving directory settings', { error, clubId, settings });
      const apiError = ErrorHandler.handleApiError(error, { context: 'saving directory settings' });
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Member Directory Settings</h1>
        </div>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Member Directory Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Member Directory Configuration
          </CardTitle>
          <CardDescription>
            Configure whether the member directory is available for your club and which profile fields members can optionally share.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Master Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="directory-enabled" className="text-base font-medium">
                Enable Member Directory for this Club
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow club members to view and search the member directory. Name is always shared if a member opts-in.
              </p>
            </div>
                         <Switch
               id="directory-enabled"
               data-testid="switch-directory-enabled"
               checked={settings.isEnabled}
               onCheckedChange={handleToggleEnabled}
             />
          </div>

          {/* Field Selection - Only shown when directory is enabled */}
          {settings.isEnabled && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Shareable Profile Fields</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Select which member profile fields can be optionally shared in the directory. Members will choose whether to share these fields when they opt-in.
                </p>
              </div>
              
              <div className="space-y-3">
                {Object.entries(AVAILABLE_DIRECTORY_FIELDS).map(([key, field]) => (
                                     <div key={key} className="flex items-center space-x-2">
                     <Checkbox
                       id={key}
                       data-testid={`checkbox-field-${key}`}
                       checked={settings.allowedSharableFields.includes(key)}
                       onCheckedChange={(checked) => handleFieldToggle(key, checked as boolean)}
                     />
                    <div className="space-y-1">
                      <Label htmlFor={key} className="text-sm font-medium">
                        {field.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {field.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
                       <Button 
             onClick={handleSave} 
             disabled={saving}
             data-testid="button-save-directory-settings"
             className="flex items-center gap-2"
           >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Directory Settings'}
            </Button>
          </div>

          {/* Information */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Member names are always visible in the directory when enabled</p>
            <p>• Members must individually opt-in to appear in the directory</p>
            <p>• If disabled, members cannot opt-in or view the directory</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 