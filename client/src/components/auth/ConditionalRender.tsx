"use client";

import React from "react";
import { useAuthorization, UserRole, ClubTier } from "@/hooks/useAuthorization";

interface ConditionalRenderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface RoleBasedProps extends ConditionalRenderProps {
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  requireAll?: boolean; // For multiple roles, require all or any (default: any)
}

interface TierBasedProps extends ConditionalRenderProps {
  requiredTier?: ClubTier;
  minimumTier?: ClubTier; // Unlimited > Grow
}

interface FeatureBasedProps extends ConditionalRenderProps {
  feature: 
    | "adminFeatures"
    | "memberFeatures" 
    | "growFeatures"
    | "unlimitedFeatures"
    | "memberDirectory"
    | "manageMembers"
    | "manageEvents"
    | "sendCommunications"
    | "billing"
    | "clubSettings"
    | "ownProfile"
    | "rsvpEvents";
}

// Generic conditional render component
export function ConditionalRender({ 
  children, 
  fallback = null,
  requiredRole,
  requiredRoles,
  requiredTier,
  requireAll = false
}: ConditionalRenderProps & RoleBasedProps & TierBasedProps) {
  const auth = useAuthorization();

  // Check role requirements
  if (requiredRole && !auth.hasRole(requiredRole)) {
    return <>{fallback}</>;
  }

  if (requiredRoles) {
    const hasAccess = requireAll 
      ? requiredRoles.every(role => auth.hasRole(role))
      : requiredRoles.some(role => auth.hasRole(role));
    
    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }

  // Check tier requirements
  if (requiredTier && !auth.hasTier(requiredTier)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Role-based components
export function AdminOnly({ children, fallback = null }: ConditionalRenderProps) {
  const auth = useAuthorization();
  
  if (!auth.isAdmin()) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

export function MemberOnly({ children, fallback = null }: ConditionalRenderProps) {
  const auth = useAuthorization();
  
  if (!auth.isMember()) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

export function AdminOrMember({ children, fallback = null }: ConditionalRenderProps) {
  const auth = useAuthorization();
  
  if (!auth.isAdminOrMember()) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// Tier-based components
export function SeedTierOnly({ children, fallback = null }: ConditionalRenderProps) {
  const auth = useAuthorization();

  if (!auth.hasSeedTier()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * @deprecated "Sprout" was the previous name for the "Seed" tier. Use
 * {@link SeedTierOnly} instead. Retained as a backwards-compatible alias so
 * existing call sites continue to compile during the rename migration.
 */
export const SproutTierOnly = SeedTierOnly;

export function GrowTierOnly({ children, fallback = null }: ConditionalRenderProps) {
  const auth = useAuthorization();
  
  if (!auth.hasGrowTier()) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

export function UnlimitedTierOnly({ children, fallback = null }: ConditionalRenderProps) {
  const auth = useAuthorization();
  
  if (!auth.hasUnlimitedTier()) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// Feature-based components
export function FeatureGate({ children, fallback = null, feature }: FeatureBasedProps) {
  const auth = useAuthorization();

  const hasAccess = (() => {
    switch (feature) {
      case "adminFeatures":
        return auth.canAccessAdminFeatures();
      case "memberFeatures":
        return auth.canAccessMemberFeatures();
      case "growFeatures":
        return auth.canAccessGrowFeatures();
      case "unlimitedFeatures":
        return auth.canAccessUnlimitedFeatures();
      case "memberDirectory":
        return auth.canViewMemberDirectory();
      case "manageMembers":
        return auth.canManageMembers();
      case "manageEvents":
        return auth.canManageEvents();
      case "sendCommunications":
        return auth.canSendCommunications();
      case "billing":
        return auth.canAccessBilling();
      case "clubSettings":
        return auth.canManageClubSettings();
      case "ownProfile":
        return auth.canViewOwnProfile();
      case "rsvpEvents":
        return auth.canRSVPToEvents();
      default:
        return false;
    }
  })();

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Combined role + tier components
export function AdminWithGrowTier({ children, fallback = null }: ConditionalRenderProps) {
  const auth = useAuthorization();
  
  if (!auth.isAdmin() || !auth.hasGrowTier()) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

export function MemberWithGrowTier({ children, fallback = null }: ConditionalRenderProps) {
  const auth = useAuthorization();
  
  if (!auth.isMember() || !auth.hasGrowTier()) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

export function AdminWithUnlimitedTier({ children, fallback = null }: ConditionalRenderProps) {
  const auth = useAuthorization();
  
  if (!auth.isAdmin() || !auth.hasUnlimitedTier()) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

export function MemberWithUnlimitedTier({ children, fallback = null }: ConditionalRenderProps) {
  const auth = useAuthorization();
  
  if (!auth.isMember() || !auth.hasUnlimitedTier()) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// Upgrade prompt component for tier restrictions
interface UpgradePromptProps {
  featureName: string;
  className?: string;
}

export function UpgradePrompt({ featureName, className = "" }: UpgradePromptProps) {
  return (
    <div className={`p-4 bg-primary/10 border border-primary/20 rounded-lg ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Upgrade Required
        </h3>
        <p className="text-muted-foreground mb-3">
          {featureName} is available with our premium tier subscriptions.
        </p>
        <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-full transition-colors">
          Upgrade Now
        </button>
      </div>
    </div>
  );
}

// Usage examples for common patterns:

// Basic role check:
// <AdminOnly>
//   <AdminPanel />
// </AdminOnly>

// With fallback:
// <MemberOnly fallback={<div>Access denied</div>}>
//   <MemberContent />
// </MemberOnly>

// Tier-based with upgrade prompt:
// <GrowTierOnly fallback={<UpgradePrompt featureName="Member Directory" />}>
//   <MemberDirectory />
// </GrowTierOnly>

// Feature-based:
// <FeatureGate feature="memberDirectory">
//   <MemberDirectoryComponent />
// </FeatureGate>

// Combined conditions:
// <ConditionalRender 
//   requiredRole="Admin" 
//   requiredTier="Grow"
//   fallback={<AccessDenied />}
// >
//   <AdvancedAdminFeature />
// </ConditionalRender> 