"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { logger } from "@/lib/logger";
import { billingService } from "@/services/billingService";

// Route definitions as specified in the user story
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register", 
  "/forgot-password",
  "/reset-password",
  "/privacy-policy",
  "/terms-of-service",
  "/support",
  "/accept-invite",
  "/activate-account",
  "/rsvp-confirm"
];



// Admin-only routes (using route groups but no prefix)
const ADMIN_ROUTES = [
  "/admin/dashboard",
  "/admin/members", 
  "/admin/events",
  "/admin/communications",
  "/admin/dues",
  "/admin/billing",
  "/admin/settings",
  "/admin/onboarding"  // Admin onboarding is optional
];

// Member-only routes (prefixed with /app/)
const MEMBER_ROUTES = [
  "/app"
];


interface RouteProtectionProps {
  children: React.ReactNode;
}

export function RouteProtection({ children }: RouteProtectionProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't do anything while auth is loading
    if (loading) return;

    // Route protection logic as specified in user story
    const isPublicRoute = PUBLIC_ROUTES.some(route => 
      route === "/" ? pathname === "/" : pathname?.startsWith(route)
    );
    const isAdminRoute = ADMIN_ROUTES.some(route => pathname?.startsWith(route));
    const isMemberRoute = MEMBER_ROUTES.some(route => pathname?.startsWith(route));
    const isAuthPage = [
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/activate-account",
      "/accept-invite"
    ].some(route => pathname?.startsWith(route));

    // Scenario 1: Unauthenticated User on Protected Route
    if (!user && !isPublicRoute) {
      if (process.env.NODE_ENV !== 'test') {
        logger.info('ui', 'Redirecting unauthenticated user to login', { from: pathname, to: '/login' });
      }
      router.push("/login");
      return;
    }

    // Scenarios 2 & 3: Authenticated User on Public Route (redirect to dashboard)
    if (user && isPublicRoute && !pathname?.startsWith("/support") && !isAuthPage) {
      const dashboardRoute = user.role === "Admin" ? "/admin/dashboard" : "/app/dashboard";
      if (process.env.NODE_ENV !== 'test') {
        logger.info('ui', 'Redirecting authenticated user from public route to dashboard', { role: user.role, from: pathname, to: dashboardRoute });
      }
      router.push(dashboardRoute);
      return;
    }

    // Scenario 4: Member on Admin Route
    if (user && user.role === "Member" && isAdminRoute) {
      if (process.env.NODE_ENV !== 'test') {
        logger.info('ui', 'Redirecting member from admin route to member dashboard', { from: pathname, to: '/app/dashboard' });
      }
      router.push("/app/dashboard");
      return;
    }

    // Reverse scenario: Admin on Member Route (redirect to admin dashboard)
    if (user && user.role === "Admin" && isMemberRoute) {
      if (process.env.NODE_ENV !== 'test') {
        logger.info('ui', 'Redirecting admin from member route to admin dashboard', { from: pathname, to: '/admin/dashboard' });
      }
      router.push("/admin/dashboard");
      return;
    }

    // Handle legacy routes - redirect to new structure
    if (user && !isPublicRoute) {
      // Redirect legacy member routes
      const legacyMemberRoutes = [
        "/member-profile", "/member-directory"
      ];
      
      const matchingLegacyMemberRoute = legacyMemberRoutes.find(route => pathname?.startsWith(route));
      if (matchingLegacyMemberRoute && user.role === "Member") {
        const newRoute = pathname?.replace("/member-", "/app/");
        if (process.env.NODE_ENV !== 'test') {
          logger.info('ui', 'Redirecting member from legacy route to new route', { from: pathname, to: newRoute });
        }
        if (newRoute) router.push(newRoute);
        return;
      }
    }

    if (user?.role === "Admin" && isAdminRoute && !pathname?.startsWith("/admin/billing")) {
      let cancelled = false;

      billingService.getBillingStatus()
        .then(status => {
          if (cancelled) return;
          if (status.accountLocked || status.canAccessApp === false) {
            if (process.env.NODE_ENV !== 'test') {
              logger.info('ui', 'Redirecting locked admin account to billing', { from: pathname, to: '/admin/billing' });
            }
            router.push("/admin/billing?reason=trial-ended");
          }
        })
        .catch(error => {
          if (process.env.NODE_ENV !== 'test') {
            logger.warn('ui', 'Unable to check billing status for route protection', { error });
          }
        });

      return () => {
        cancelled = true;
      };
    }
  }, [pathname, user, loading, router]);

  // Show loading indicator while authentication is being checked
  // Set generic title during loading to prevent leaking protected page titles
  if (loading) {
    return (
      <>
        <title>GatherGrove</title>
        {pathname?.startsWith("/admin/") ? (
          <AdminLoadingSkeleton />
        ) : (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}

function AdminLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 to-background-subtle/50">
      {/* Sidebar skeleton */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-card border-r border-border">
        <div className="p-6">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="px-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted/50 animate-pulse rounded-md" />
          ))}
        </div>
      </div>
      {/* Content skeleton */}
      <div className="lg:pl-64">
        <div className="p-8 space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-card animate-pulse rounded-xl border border-border" />
            ))}
          </div>
          <div className="h-64 bg-card animate-pulse rounded-xl border border-border" />
        </div>
      </div>
    </div>
  );
}
