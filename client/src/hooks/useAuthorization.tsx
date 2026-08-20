"use client";

import { useAuth } from "./useAuth";
import { UserSession } from "@/services/authService";

// Authorization roles
export type UserRole = "Admin" | "Member";

// Club tiers
export type ClubTier = "Seed" | "Grow" | "Expand" | "Unlimited";

// Authorization utilities hook
export function useAuthorization() {
  const { user } = useAuth();

  // Role checks
  const isAdmin = (): boolean => {
    return user?.role === "Admin";
  };

  const isMember = (): boolean => {
    return user?.role === "Member";
  };

  const isAdminOrMember = (): boolean => {
    return isAdmin() || isMember();
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  // Club tier checks
  const hasSeedTier = (): boolean => {
    return user?.clubTier === "Seed";
  };

  const hasGrowTier = (): boolean => {
    return user?.clubTier === "Grow";
  };

  const hasUnlimitedTier = (): boolean => {
    return user?.clubTier === "Expand" || user?.clubTier === "Unlimited";
  };

  const hasTier = (tier: ClubTier): boolean => {
    if (tier === "Expand" || tier === "Unlimited") {
      return hasUnlimitedTier();
    }
    return user?.clubTier === tier;
  };

  // Combined authorization checks
  const canAccessAdminFeatures = (): boolean => {
    return isAdmin();
  };

  const canAccessSeedFeatures = (): boolean => {
    return hasSeedTier() || hasGrowTier() || hasUnlimitedTier();
  };

  const canAccessMemberFeatures = (): boolean => {
    return isMember() && (hasGrowTier() || hasUnlimitedTier());
  };

  const canAccessGrowFeatures = (): boolean => {
    return hasGrowTier() || hasUnlimitedTier();
  };

  const canAccessUnlimitedFeatures = (): boolean => {
    return hasUnlimitedTier();
  };

  const canViewMemberDirectory = (): boolean => {
    return (isAdmin() || isMember()) && (hasSeedTier() || hasGrowTier() || hasUnlimitedTier());
  };

  const canManageMembers = (): boolean => {
    return isAdmin();
  };

  const canManageEvents = (): boolean => {
    return isAdmin();
  };

  const canSendCommunications = (): boolean => {
    return isAdmin();
  };

  const canAccessBilling = (): boolean => {
    return isAdmin();
  };

  const canManageClubSettings = (): boolean => {
    return isAdmin();
  };

  // Export and reporting checks
  const canExportMemberData = (): boolean => {
    return isAdmin() && (hasGrowTier() || hasUnlimitedTier());
  };

  const canExportFinancialData = (): boolean => {
    return isAdmin() && hasUnlimitedTier();
  };

  const canExportAnalyticsData = (): boolean => {
    return isAdmin() && hasUnlimitedTier();
  };

  const canExportEventData = (): boolean => {
    return isAdmin() && (hasGrowTier() || hasUnlimitedTier());
  };

  const canCreateScheduledReports = (): boolean => {
    return isAdmin() && hasUnlimitedTier();
  };

  const canAccessExportHistory = (): boolean => {
    return isAdmin() && (hasGrowTier() || hasUnlimitedTier());
  };

  const canConfigureEmailDelivery = (): boolean => {
    return isAdmin() && hasUnlimitedTier();
  };

  // Generic access check for feature/action combinations
  const checkAccess = (feature: string, action?: string): boolean => {
    switch (feature) {
      case 'unlimited':
        if (action === 'data_export') return canExportFinancialData() || canExportAnalyticsData();
        if (action === 'scheduled_reports') return canCreateScheduledReports();
        if (action === 'email_delivery') return canConfigureEmailDelivery();
        return hasUnlimitedTier() && isAdmin();
      
      case 'grow':
        if (action === 'basic_export') return canExportMemberData() || canExportEventData();
        return (hasGrowTier() || hasUnlimitedTier()) && isAdmin();
      
      case 'export':
        if (action === 'member') return canExportMemberData();
        if (action === 'financial') return canExportFinancialData();
        if (action === 'analytics') return canExportAnalyticsData();
        if (action === 'event') return canExportEventData();
        if (action === 'history') return canAccessExportHistory();
        return isAdmin();
      
      default:
        return false;
    }
  };

  // Member-specific checks
  const canViewOwnProfile = (): boolean => {
    return isAdminOrMember();
  };

  const canRSVPToEvents = (): boolean => {
    return isMember() && (hasSeedTier() || hasGrowTier() || hasUnlimitedTier());
  };

  // User information getters
  const getCurrentUser = (): UserSession | null => {
    return user;
  };

  const getUserRole = (): UserRole | null => {
    return user?.role as UserRole || null;
  };

  const getClubTier = (): ClubTier | null => {
    return user?.clubTier as ClubTier || null;
  };

  const getClubInfo = () => {
    if (!user) return null;
    return {
      id: user.clubId,
      name: user.clubName,
      tier: user.clubTier
    };
  };

  return {
    // Role checks
    isAdmin,
    isMember,
    isAdminOrMember,
    hasRole,
    hasAnyRole,

    // Tier checks
    hasSeedTier,
    hasGrowTier,
    hasUnlimitedTier,
    hasTier,

    // Feature access checks
    canAccessAdminFeatures,
    canAccessSeedFeatures,
    canAccessMemberFeatures,
    canAccessGrowFeatures,
    canAccessUnlimitedFeatures,
    canViewMemberDirectory,
    canManageMembers,
    canManageEvents,
    canSendCommunications,
    canAccessBilling,
    canManageClubSettings,
    canExportMemberData,
    canExportFinancialData,
    canExportAnalyticsData,
    canExportEventData,
    canCreateScheduledReports,
    canAccessExportHistory,
    canConfigureEmailDelivery,
    checkAccess,
    canViewOwnProfile,
    canRSVPToEvents,

    // Data access
    getCurrentUser,
    getUserRole,
    getClubTier,
    getClubInfo,

    // Computed properties
    user: user, // Add user for backward compatibility
    isAuthenticated: !!user,
    userRole: user?.role as UserRole || null,
    clubTier: user?.clubTier as ClubTier || null,
    loading: false, // Add loading for backward compatibility
  };
} 
