"use client";

import { useState, useEffect } from"react";
import { useAuth } from"@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Loader2, User, Calendar, Users, Settings, Bell } from"lucide-react";
import { useRouter } from"next/navigation";
import { toast } from"sonner";

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
    <div className="min-h-screen bg-gradient-to-br from-background to-background-subtle">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-success/5 pointer-events-none" />
      <div className="container mx-auto px-4 py-8 relative">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Welcome back, {user.fullName}</h1>
        <p className="text-muted-foreground">
          Member of {user.clubName} • {user.clubTier} Tier
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 cursor-pointer group hover:scale-105 hover:shadow-xl" onClick={() => router.push("/app/profile")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors duration-200">My Profile</CardTitle>
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-success/20   group-hover:shadow-lg transition-shadow duration-200">
              <User className="h-4 w-4 text-primary group-hover:text-success transition-colors duration-200" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              View and update your profile information
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 cursor-pointer group hover:scale-105 hover:shadow-xl" onClick={() => router.push("/app/events")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors duration-200">Upcoming Events</CardTitle>
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/20   group-hover:shadow-lg transition-shadow duration-200">
              <Calendar className="h-4 w-4 text-primary group-hover:text-primary transition-colors duration-200" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              View events and manage your RSVPs
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 cursor-pointer group hover:scale-105 hover:shadow-xl" onClick={() => router.push("/app/directory")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors duration-200">Member Directory</CardTitle>
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/20   group-hover:shadow-lg transition-shadow duration-200">
              <Users className="h-4 w-4 text-secondary group-hover:text-secondary transition-colors duration-200" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Connect with other club members
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 cursor-pointer group hover:scale-105 hover:shadow-xl" onClick={() => router.push("/app/profile")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors duration-200">Settings</CardTitle>
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-muted/40 to-muted/40   group-hover:shadow-lg transition-shadow duration-200">
              <Settings className="h-4 w-4 text-muted-foreground group-hover:text-muted-foreground transition-colors duration-200" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Update your preferences and notifications
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Club Information */}
        <Card className="glass border-border/50 shadow-lg hover:glass-strong transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-success/20">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <span>Club Information</span>
            </CardTitle>
            <CardDescription>Your membership details</CardDescription>
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
              <p className="text-sm text-success">Active</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest interactions</CardDescription>
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
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Frequently used features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push("/app/profile")}
            >
              <User className="h-4 w-4 mr-2" />
              Complete Profile
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push("/app/events")}
            >
              <Calendar className="h-4 w-4 mr-2" />
              View Events
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push("/app/directory")}
            >
              <Users className="h-4 w-4 mr-2" />
              Browse Directory
            </Button>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
} 
