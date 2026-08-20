"use client";

import React from "react";
import { redirect } from "next/navigation";
import { useAuthorization, UserRole, ClubTier } from "@/hooks/useAuthorization";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  requiredTier?: ClubTier;
  requireAuth?: boolean;
  allowUnauthenticated?: boolean;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
  unauthorizedComponent?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredRoles,
  requiredTier,
  requireAuth = true,
  allowUnauthenticated = false,
  redirectTo,
  loadingComponent,
  unauthorizedComponent
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const auth = useAuthorization();

  // Show loading while authentication is being determined
  if (loading) {
    return loadingComponent || (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !user && !allowUnauthenticated) {
    if (redirectTo) {
      redirect(redirectTo);
    } else {
      redirect("/login");
    }
    return null;
  }

  // If user is authenticated, check authorization requirements
  if (user) {
    // Check role requirements
    if (requiredRole && !auth.hasRole(requiredRole)) {
      return unauthorizedComponent || (
        <div className="min-h-screen flex items-center justify-center bg-muted">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Access Denied
            </h1>
            <p className="text-muted-foreground mb-4">
                             You don&apos;t have permission to access this page. Required role: {requiredRole}
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }

    if (requiredRoles && !auth.hasAnyRole(requiredRoles)) {
      return unauthorizedComponent || (
        <div className="min-h-screen flex items-center justify-center bg-muted">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Access Denied
            </h1>
            <p className="text-muted-foreground mb-4">
                             You don&apos;t have permission to access this page. Required roles: {requiredRoles.join(", ")}
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }

    // Check tier requirements
    if (requiredTier && !auth.hasTier(requiredTier)) {
      return unauthorizedComponent || (
        <div className="min-h-screen flex items-center justify-center bg-muted">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Upgrade Required
            </h1>
            <p className="text-muted-foreground mb-4">
              This feature requires a {requiredTier} tier subscription.
            </p>
            <div className="space-y-2">
              <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-full transition-colors">
                Upgrade to {requiredTier}
              </button>
              <button
                onClick={() => window.history.back()}
                className="w-full border border-border text-foreground px-4 py-2 rounded-md hover:bg-muted transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

// Convenience components for common protection patterns
export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="Admin" {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function MemberRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="Member" {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function GrowTierRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredTier'>) {
  return (
    <ProtectedRoute requiredTier="Grow" {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function AdminOrMemberRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRoles'>) {
  return (
    <ProtectedRoute requiredRoles={["Admin", "Member"]} {...props}>
      {children}
    </ProtectedRoute>
  );
}

// Usage examples:

// Basic admin protection:
// <AdminRoute>
//   <AdminDashboard />
// </AdminRoute>

// Member with Grow tier requirement:
// <ProtectedRoute requiredRole="Member" requiredTier="Grow">
//   <MemberDirectory />
// </ProtectedRoute>

// Multiple roles allowed:
// <ProtectedRoute requiredRoles={["Admin", "Member"]}>
//   <SharedComponent />
// </ProtectedRoute>

// Custom unauthorized component:
// <ProtectedRoute 
//   requiredRole="Admin"
//   unauthorizedComponent={<CustomUnauthorized />}
// >
//   <AdminContent />
// </ProtectedRoute> 