"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  CreditCard,
  Menu,
  X,
  LogOut,
  Settings,
  ChevronDown,
  User,
  Activity,
  MessageCircle,
  Download
} from "lucide-react";
import { FeedbackDialog } from "@/components/shared/FeedbackDialog";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useChatAccess } from "@/hooks/useChatAccess";
import { ErrorHandler } from "@/lib/errorHandler";
import { useToast } from "@/hooks/useToast";
import { logger } from "@/lib/logger";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Base admin navigation items (always shown)
const baseAdminNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/admin/members", icon: Users },
  { name: "Events", href: "/admin/events", icon: Calendar },
  { name: "Communications", href: "/admin/communications", icon: MessageSquare },
  { name: "Dues & Payments", href: "/admin/dues", icon: CreditCard },
  { name: "Billing", href: "/admin/billing", icon: CreditCard },
  { name: "Exports", href: "/admin/exports", icon: Download },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

// Base member navigation items (always shown)
const baseMemberNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { name: "Events", href: "/app/events", icon: Calendar },
  { name: "Community", href: "/app/chat", icon: MessageSquare },
  { name: "Member Directory", href: "/app/directory", icon: Users },
  { name: "Membership", href: "/app/membership", icon: CreditCard },
  { name: "My Profile", href: "/app/profile", icon: User },
];

export function Sidebar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { canAccessChat: chatAccess } = useChatAccess();
  // Both members and admins can access chat if enabled
  const canAccessChat = chatAccess;
  const userMenuRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Create member navigation with conditional chat link
  const memberNavigation = useMemo(() => {
    // Start with the new baseMemberNavigation order
    const navigation = [...baseMemberNavigation];
    // Remove Community if chat is not enabled
    if (!canAccessChat) {
      const idx = navigation.findIndex(item => item.href === "/app/chat");
      if (idx !== -1) navigation.splice(idx, 1);
    }
    return navigation;
  }, [canAccessChat]);

  // Create admin navigation with conditional chat link and engagement tab
  const adminNavigation = useMemo(() => {
    const navigation = [...baseAdminNavigation];

    // Add Engagement tab for Expand tier users only
    if (user?.clubTier === 'Expand' || user?.clubTier === 'Unlimited') {
      // Insert after Members
      const membersIndex = navigation.findIndex(item => item.href === "/admin/members");
      navigation.splice(membersIndex + 1, 0, {
        name: "Engagement",
        href: "/admin/engagement",
        icon: Activity
      });
    }

    // Add community chat link if user has access and it's enabled
    if (canAccessChat) {
      // Insert chat after communications but before dues
      const duesIndex = navigation.findIndex(item => item.href === "/admin/dues");
      navigation.splice(duesIndex, 0, {
        name: "Community Chat",
        href: "/admin/chat",
        icon: MessageSquare
      });
    }

    return navigation;
  }, [canAccessChat, user?.clubTier]);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [userMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Successfully logged out");
    } catch (error) {
      logger.error('ui', 'Logout error in sidebar', { error });
      const apiError = ErrorHandler.handleAuthError(error, 'logging out');
      ErrorHandler.showErrorToast(apiError);
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Get navigation based on user role
  const navigation = user?.role === "Member" ? memberNavigation : adminNavigation;
  const dashboardHref = user?.role === "Member" ? "/app/dashboard" : "/admin/dashboard";

  return (
    <>
      {/* Mobile menu button - Only visible on mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href={dashboardHref} prefetch={false} className="flex items-center">
            <div className="text-xl font-bold text-primary">GatherGrove</div>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Always visible on desktop, slide-in on mobile */}
      <aside className={cn(
        // Base styles - fixed positioning for both mobile and desktop
        "fixed top-0 left-0 z-50 h-screen w-64",
        // Enhanced background with glassmorphism
        "glass border-r border-border/50 backdrop-blur-xl",
        // Mobile: transform and transition
        "transform transition-transform duration-300 ease-in-out",
        // Mobile visibility based on menu state, desktop always visible
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header/Logo section */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-border/50 flex-shrink-0">
            <Link
              href={dashboardHref}
              prefetch={false}
              className="flex items-center space-x-3 group transition-all duration-200 hover:scale-105"
              onClick={closeMobileMenu}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:rotate-3">
                <Image
                  src="/logos/logo-1024x1024.png"
                  alt="GatherGrove"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
              </div>
               <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-primary group-hover:to-emerald-600 transition-all duration-200">GatherGrove</span>
            </Link>
            
            {/* Close button - Only visible on mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={closeMobileMenu}
              className="lg:hidden"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-2">
              {navigation.map((item) => {
                // Check for exact match OR if current path starts with the nav item path
                // This keeps parent nav items active when on sub-pages (e.g., /admin/members/types)
                const isActive = pathname === item.href || 
                  (item.href !== "/" && pathname?.startsWith(item.href + "/"));
                const Icon = item.icon;
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      prefetch={false}
                      onClick={closeMobileMenu}
                      className={cn(
                        // Base styles
                        "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group",
                        // Active styles with enhanced gradient and shadow
                        isActive
                          ? "bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                          : "text-foreground/80 hover:bg-gradient-to-r hover:from-primary/5 hover:to-emerald-600/5 hover:text-foreground hover:shadow-md hover:-translate-y-0.5"
                      )}
                    >
                      <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Feedback Button */}
          <div className="px-4 pb-2">
            <button
              onClick={() => setFeedbackOpen(true)}
              className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-foreground/80 hover:bg-gradient-to-r hover:from-primary/5 hover:to-emerald-600/5 hover:text-foreground hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <MessageCircle className="mr-3 h-5 w-5 flex-shrink-0" />
              <span>Send Feedback</span>
            </button>
          </div>

          {/* User Profile Section */}
          <div className="border-t border-border/50 p-4 flex-shrink-0">
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center px-3 py-2 text-left rounded-lg glass-soft hover:glass transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                aria-haspopup="true"
                type="button"
              >
                <div className="flex items-center flex-1 min-w-0">
                  {/* User Avatar */}
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                  
                  {/* User Info */}
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user?.fullName || "Loading..."}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.clubName || "Club"}
                    </p>
                  </div>
                </div>
                
                {/* Dropdown Arrow */}
                <ChevronDown className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0",
                  userMenuOpen && "rotate-180"
                )} />
              </button>

              {/* User Menu Dropdown */}
              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 glass-strong border border-border/50 rounded-lg shadow-2xl backdrop-blur-xl py-1 z-10 animate-in slide-in-from-bottom-2 duration-200">
                  <Link
                    href={user?.role === "Member" ? "/app/profile" : "/admin/settings"}
                    prefetch={false}
                    onClick={() => {
                      setUserMenuOpen(false);
                      closeMobileMenu();
                    }}
                    className="flex items-center px-4 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    {user?.role === "Member" ? "My Profile" : "Account Settings"}
                  </Link>
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm text-foreground/80">Theme</span>
                    <ThemeToggle />
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setUserMenuOpen(false);
                      closeMobileMenu();
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Feedback Dialog */}
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
} 
