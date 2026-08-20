"use client";

import { useState, useEffect } from"react";
import { useAuth } from"@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Loader2, User, Calendar, Users, Settings, Bell, Zap } from"lucide-react";
import { useRouter } from"next/navigation";
import { toast } from"sonner";
import { PaidEventsSection } from"./components/PaidEventsSection";

export default function MemberDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
        return;
      }
      
      // Ensure only members can access this page
      if (user.role !=="Member") {
        toast.error("Access denied. This page is for members only.");
        router.push("/admin/dashboard");
        return;
      }
      
      setIsLoading(false);
    }
  }, [user, loading, router]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your member dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Welcome back, {user.fullName}</h1>
          <p className="text-muted-foreground">
            Member of {user.clubName} • {user.clubTier} Tier
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass hover:glass-strong transition-all duration-300 cursor-pointer group hover:scale-105 hover:shadow-xl border-border/50" onClick={() => router.push("/app/profile")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors duration-200">My Profile</CardTitle>
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-success/20   group-hover:shadow-lg transition-all duration-300">
                <User className="h-4 w-4 text-primary group-hover:text-success transition-colors duration-300" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground group-hover:text-muted-foreground/90 transition-colors duration-200">
                View and update your profile information
              </p>
            </CardContent>
          </Card>

          <Card className="glass hover:glass-strong transition-all duration-300 cursor-pointer group hover:scale-105 hover:shadow-xl border-border/50" onClick={() => router.push("/app/events")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors duration-200">Upcoming Events</CardTitle>
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/20   group-hover:shadow-lg transition-all duration-300">
                <Calendar className="h-4 w-4 text-secondary group-hover:text-secondary transition-colors duration-300" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground group-hover:text-muted-foreground/90 transition-colors duration-200">
                View events and manage your RSVPs
              </p>
            </CardContent>
          </Card>

          <Card className="glass hover:glass-strong transition-all duration-300 cursor-pointer group hover:scale-105 hover:shadow-xl border-border/50" onClick={() => router.push("/app/directory")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors duration-200">Member Directory</CardTitle>
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/20   group-hover:shadow-lg transition-all duration-300">
                <Users className="h-4 w-4 text-primary group-hover:text-primary transition-colors duration-300" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground group-hover:text-muted-foreground/90 transition-colors duration-200">
                Connect with other club members
              </p>
            </CardContent>
          </Card>

          <Card className="glass hover:glass-strong transition-all duration-300 cursor-pointer group hover:scale-105 hover:shadow-xl border-border/50" onClick={() => router.push("/app/profile")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors duration-200">Settings</CardTitle>
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-warning/20 to-warning/20   group-hover:shadow-lg transition-all duration-300">
                <Settings className="h-4 w-4 text-warning group-hover:text-warning transition-colors duration-300" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground group-hover:text-muted-foreground/90 transition-colors duration-200">
                Update your preferences and notifications
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Paid Events Section */}
        <div className="mb-8">
          <PaidEventsSection />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Club Information */}
          <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-success/20   group-hover:shadow-lg transition-all duration-300">
                  <div className="h-3 w-3 bg-gradient-to-r from-primary to-success rounded-full animate-pulse"></div>
                </div>
                <span className="group-hover:text-primary transition-colors duration-200">Club Information</span>
              </CardTitle>
              <CardDescription className="group-hover:text-muted-foreground/90 transition-colors duration-200">Your membership details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold">{user.clubName}</p>
                <p className="text-sm text-muted-foreground">{user.clubTier} Tier</p>
              </div>
              <div>
                <p className="text-sm font-medium">Member Since</p>
                <p className="text-sm text-muted-foreground">Available after profile completion</p>
              </div>
              <div>
                <p className="text-sm font-medium">Membership Status</p>
                <div className="text-sm text-success flex items-center gap-1">
                  <div className="h-2 w-2 bg-success rounded-full"></div>
                  Active
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/20   group-hover:shadow-lg transition-all duration-300">
                  <Bell className="h-4 w-4 text-primary group-hover:text-primary transition-colors duration-300" />
                </div>
                <span className="group-hover:text-primary transition-colors duration-200">Recent Activity</span>
              </CardTitle>
              <CardDescription className="group-hover:text-muted-foreground/90 transition-colors duration-200">Your latest interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Bell className="h-4 w-4 text-primary mt-1" />
                  <div>
                    <p className="text-sm">Welcome to {user.clubName}!</p>
                    <p className="text-xs text-muted-foreground">Complete your profile to get started</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-warning/20 to-warning/20   group-hover:shadow-lg transition-all duration-300">
                  <Zap className="h-4 w-4 text-warning group-hover:text-warning transition-colors duration-300" />
                </div>
                <span className="group-hover:text-primary transition-colors duration-200">Quick Links</span>
              </CardTitle>
              <CardDescription className="group-hover:text-muted-foreground/90 transition-colors duration-200">Frequently used features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start group hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
                onClick={() => router.push("/app/profile")}
              >
                <User className="h-4 w-4 mr-2 group-hover:text-primary transition-colors duration-200" />
                Complete Profile
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start group hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
                onClick={() => router.push("/app/events")}
              >
                <Calendar className="h-4 w-4 mr-2 group-hover:text-primary transition-colors duration-200" />
                View Events
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start group hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
                onClick={() => router.push("/app/directory")}
              >
                <Users className="h-4 w-4 mr-2 group-hover:text-primary transition-colors duration-200" />
                Browse Directory
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 