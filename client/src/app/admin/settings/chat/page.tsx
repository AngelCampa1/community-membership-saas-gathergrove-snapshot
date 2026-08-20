"use client";

import { useState, useEffect, useCallback } from 'react';
import { Settings, Save, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ErrorHandler } from '@/lib/errorHandler';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { chatSettingsService } from '@/services/chatSettingsService';
import { ChatSettingsResponse } from '@/types/chatSettings';
import { logger } from '@/lib/logger';

export default function ChatSettingsPage() {
  const [settings, setSettings] = useState<ChatSettingsResponse>({
    isChatEnabled: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  // Get club ID from authenticated user
  const clubId = user?.clubId || 0;

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await chatSettingsService.getChatSettings(clubId);
      setSettings(data);
    } catch (error) {
      logger.error('chat', 'Error loading chat settings', { error, clubId });
      const apiError = ErrorHandler.handleApiError(error, { context: 'loading chat settings' });
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
    // Check if user has Grow tier before allowing chat to be enabled
    if (enabled && user?.clubTier !== 'Grow') {
      toast.error("Community chat is only available for Grow tier subscribers. Please upgrade your plan to access this feature.");
      return;
    }
    
    setSettings(prev => ({
      ...prev,
      isChatEnabled: enabled
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Additional validation before saving
      if (settings.isChatEnabled && user?.clubTier !== 'Grow') {
        toast.error("Community chat is only available for Grow tier subscribers. Please upgrade your plan to access this feature.");
        return;
      }
      
      await chatSettingsService.updateChatSettings(clubId, {
        isChatEnabled: settings.isChatEnabled
      });

      toast.success("Chat settings updated");

      // Notify that chat settings have been updated so sidebar can refresh
      window.dispatchEvent(new CustomEvent('chatSettingsUpdated'));
    } catch (error: unknown) {
      logger.error('chat', 'Error saving chat settings', { error, clubId, settings });
      const apiError = ErrorHandler.handleApiError(error, { context: 'saving chat settings' });
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
        <h1 className="text-2xl font-bold">Community Chat Settings</h1>
      </div>
      <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Community Chat Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Club Group Chat Configuration
          </CardTitle>
          <CardDescription>
            Configure whether the club group chat feature is available for your members.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Master Toggle */}
          <div className={`flex items-center justify-between p-4 border rounded-lg ${user?.clubTier !== 'Grow' ? 'opacity-60 bg-muted/20' : ''}`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="chat-enabled" className="text-base font-medium">
                  Enable Club Group Chat
                </Label>
                {user?.clubTier !== 'Grow' && (
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
                    Grow Plan Required
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {user?.clubTier !== 'Grow' 
                  ? 'Community chat is only available for Grow tier subscribers. Upgrade your plan to access this feature.'
                  : 'Allow club members to participate in a real-time group chat for club communication.'
                }
              </p>
            </div>
            <Switch
              id="chat-enabled"
              data-testid="switch-chat-enabled"
              checked={settings.isChatEnabled}
              onCheckedChange={handleToggleEnabled}
              disabled={user?.clubTier !== 'Grow'}
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={handleSave} 
              disabled={saving || (settings.isChatEnabled && user?.clubTier !== 'Grow')}
              data-testid="button-save-chat-settings"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Chat Settings'}
            </Button>
          </div>

          {/* Information */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Only club members can participate in the group chat</p>
            <p>• All chat messages are visible to all club members</p>
            <p>• Admins can enable or disable this feature at any time</p>
            {settings.isChatEnabled && (
              <p className="text-success">
                • Chat is currently enabled for your club members
              </p>
            )}
            {!settings.isChatEnabled && (
              <p className="text-muted-foreground">
                • Chat is currently disabled - members cannot access group chat
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 