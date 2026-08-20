import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { chatService } from '@/services/chatService';

export function useChatAccess() {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [isChatEnabled, setIsChatEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAccess = useCallback(async () => {
    if (!user?.clubId) {
      setLoading(false);
      return;
    }

    try {
      const accessResult = await chatService.checkChatAccess(user.clubId);
      setHasAccess(accessResult.hasAccess);
      setIsChatEnabled(accessResult.isChatEnabled);
    } catch {
      // Silently handle errors - chat feature may not be available yet
      // Don't log to console to avoid spam
      setHasAccess(false);
      setIsChatEnabled(false);
    } finally {
      setLoading(false);
    }
  }, [user?.clubId]);

  useEffect(() => {
    checkAccess();

    // Listen for chat settings updates
    const handleChatSettingsUpdate = () => {
      checkAccess();
    };

    window.addEventListener('chatSettingsUpdated', handleChatSettingsUpdate);
    
    return () => {
      window.removeEventListener('chatSettingsUpdated', handleChatSettingsUpdate);
    };
  }, [checkAccess]);

  const refresh = useCallback(async () => {
    await checkAccess();
  }, [checkAccess]);

  return {
    hasAccess,
    isChatEnabled,
    canAccessChat: hasAccess && isChatEnabled,
    loading,
    refresh
  };
} 