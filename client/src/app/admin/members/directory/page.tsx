"use client";

import { useState, useEffect, useCallback } from'react';
import { Save, Users } from'lucide-react';
import { useAuth } from'@/hooks/useAuth';
import { toast } from'sonner';
import { ErrorHandler } from'@/lib/errorHandler';
import { logger } from'@/lib/logger';
import { Button } from'@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from'@/components/ui/card';
import { Switch } from'@/components/ui/switch';
import { Checkbox } from'@/components/ui/checkbox';
import { Label } from'@/components/ui/label';
import { directorySettingsService } from'@/services/directorySettingsService';
import { DirectorySettingsResponse, AVAILABLE_DIRECTORY_FIELDS } from'@/types/directorySettings';

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
      logger.error('admins','Error loading directory settings', { error, clubId });
      const apiError = ErrorHandler.handleApiError(error, { context:'loading directory settings' });
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
      logger.error('admins','Error saving directory settings', { error, clubId, settings });
      const apiError = ErrorHandler.handleApiError(error, { context:'saving directory settings' });
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading directory settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass border-border/50 shadow-lg hover:glass-strong transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-success/20">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <span>Member Directory Configuration</span>
          </CardTitle>
          <CardDescription>
            Configure whether the member directory is available for your club and which profile fields members can optionally share.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Master Toggle */}
          <div className="flex items-center justify-between p-4 glass-soft border-border/40 rounded-lg hover:glass transition-all duration-200">
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
              {saving ?'Saving...' :'Save Directory Settings'}
            </Button>
          </div>

          {/* Information */}
          <div className="mt-6 p-4 glass-soft bg-gradient-to-r from-primary/5 to-primary/10   rounded-lg border border-primary/30">
            <h4 className="font-medium text-foreground mb-2">
              How the Member Directory Works
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Members can opt-in to be listed in the directory from their profile settings</li>
              <li>• Member names are always visible when they opt-in</li>
              <li>• Members choose which additional fields to share from those you allow above</li>
              <li>• Only members who have opted-in will be visible to other members</li>
              <li>• Members can update their privacy settings at any time</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 