"use client";

import { useQuery } from "@tanstack/react-query";
import { billingService } from "@/services/billingService";
import { useAuth } from "@/hooks/useAuth";

export function useClubTier() {
  const { user } = useAuth();

  const {
    data: billingStatus,
    isLoading: loading,
    error,
    refetch: refresh,
  } = useQuery({
    queryKey: ["billing-status", user?.clubId],
    queryFn: () => billingService.getBillingStatus(),
    enabled: !!user?.clubId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  const isSeedTier = billingStatus?.currentTier === "Seed";
  const isGrowTier = billingStatus?.currentTier === "Grow";
  const isUnlimitedTier =
    billingStatus?.currentTier === "Expand" || billingStatus?.currentTier === "Unlimited";

  // Communication features - available on Grow and Expand tiers
  const canSendInvitations = isGrowTier || isUnlimitedTier;
  const canSendPushNotifications = isGrowTier || isUnlimitedTier; // Seed excluded

  // Advanced template features - top tier only
  const canUseAdvancedTemplates = isUnlimitedTier;

  // Template limits by tier
  const templateLimits = {
    grow: { email: 10 },
    unlimited: { email: 999 }
  };

  return {
    billingStatus,
    loading,
    error: error ? "Failed to load club tier information" : null,
    isSeedTier,
    isGrowTier,
    isUnlimitedTier,
    canSendInvitations,
    canSendPushNotifications,
    canUseAdvancedTemplates,
    templateLimits,
    refresh,
  };
}
