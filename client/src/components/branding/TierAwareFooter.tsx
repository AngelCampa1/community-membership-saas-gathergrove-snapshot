'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface TierAwareFooterProps {
  className?: string;
  brandingSettings?: {
    logo?: string;
    organizationName?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  showPoweredBy?: boolean; // Override for testing
}

export function TierAwareFooter({
  className,
  brandingSettings,
  showPoweredBy
}: TierAwareFooterProps) {
  const { user } = useAuth();

  // Determine if user has Expand tier access
  // Check both clubTier (single club) and clubs array (multiple clubs)
  const hasUnlimitedAccess = React.useMemo(() => {
    // Check direct clubTier property (UserSession structure)
    if (user?.clubTier === 'Expand' || user?.clubTier === 'Unlimited') {
      return true;
    }

    // Check clubs array for any Expand tier club (test structure)
    if (Array.isArray((user as any)?.clubs)) {
      return (user as any).clubs.some((club: any) => club.tier === 'Expand' || club.tier === 'Unlimited');
    }

    return false;
  }, [user]);

  // Show "Powered by GatherGrove" unless user has Expand tier or explicitly disabled
  const shouldShowPoweredBy = showPoweredBy !== undefined ? showPoweredBy : !hasUnlimitedAccess;

  const logoSrc = brandingSettings?.logo || '/logos/horizontal-logo.png';
  const orgName = brandingSettings?.organizationName || 'GatherGrove';
  const primaryColor = brandingSettings?.primaryColor;

  return (
    <footer className={cn("w-full bg-muted/50 border-t", className)}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center">
              <Image
                src={logoSrc}
                alt={orgName}
                width={160}
                height={53}
                className="h-8 w-auto"
                onError={(e) => {
                  // Fallback to default logo on error
                  e.currentTarget.src = '/logos/horizontal-logo.png';
                }}
              />
            </div>
            <p className="text-muted-foreground max-w-md">
              {hasUnlimitedAccess && brandingSettings?.organizationName ? (
                `${orgName} - Connecting community members through shared interests and activities.`
              ) : (
                "The simple, affordable, all-in-one platform designed specifically for small hobby clubs."
              )}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/app/events" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  style={primaryColor ? { '--hover-color': primaryColor } as React.CSSProperties : {}}
                >
                  Events
                </Link>
              </li>
              <li>
                <Link 
                  href="/app/directory" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  style={primaryColor ? { '--hover-color': primaryColor } as React.CSSProperties : {}}
                >
                  Members
                </Link>
              </li>
              <li>
                <Link 
                  href="/app/profile" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  style={primaryColor ? { '--hover-color': primaryColor } as React.CSSProperties : {}}
                >
                  My Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/support" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms-of-service" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy-policy" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright and Attribution */}
        <div className="border-t mt-8 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div>
              © {new Date().getFullYear()} {orgName}. All rights reserved.
            </div>
            
            {/* Powered by GatherGrove - only shown for non-Expand tiers */}
            {shouldShowPoweredBy && (
              <div className="flex items-center gap-2" data-testid="powered-by-gathergrove">
                <span>Powered by</span>
                <Link 
                  href="https://www.gathergrove.club" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  GatherGrove
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

// Default export for backward compatibility
export { TierAwareFooter as Footer };
