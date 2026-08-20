"use client";

import React, { useState } from"react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import { User, Lock, Eye, EyeOff, ArrowLeft, AlertTriangle } from"lucide-react";
import { useAuth } from"@/hooks/useAuth";
import { profileService, UpdateProfileRequest, ChangePasswordRequest } from"@/services/profileService";
import { toast } from"sonner";
import Link from"next/link";
import { ErrorHandler } from"@/lib/errorHandler";
import { AdminAccountDeletionDialog } from"@/components/admin/AdminAccountDeletionDialog";

export default function ProfileSettingsPage() {
  const { user, refreshSession } = useAuth();
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName ||"",
  });
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState<{ [key: string]: string }>({});
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword:"",
    newPassword:"",
    confirmPassword:"",
  });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Account deletion state
  const [showAccountDeletionDialog, setShowAccountDeletionDialog] = useState(false);

  // Profile form handlers
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    // Clear errors when user starts typing
    if (profileErrors[name]) {
      setProfileErrors(prev => ({ ...prev, [name]:"" }));
    }
  };

  const validateProfileForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!profileData.fullName.trim()) {
      errors.fullName ="Full name is required";
    } else if (profileData.fullName.length > 100) {
      errors.fullName ="Full name cannot exceed 100 characters";
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }

    setIsProfileLoading(true);

    try {
      const request: UpdateProfileRequest = {
        fullName: profileData.fullName.trim(),
      };

      const response = await profileService.updateProfile(request);
      
      // Refresh user session to get updated data
      await refreshSession();
      
      toast.success(response.message);
    } catch (error: unknown) {
      const apiError = ErrorHandler.handleAuthError(error,'updating profile');
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleProfileCancel = () => {
    setProfileData({
      fullName: user?.fullName ||"",
    });
    setProfileErrors({});
  };

  // Password form handlers
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    // Clear errors when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]:"" }));
    }
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 12) {
      return"Password must be at least 12 characters with uppercase, lowercase, number, and special character";
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return"Password must be at least 12 characters with uppercase, lowercase, number, and special character";
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return"Password must be at least 12 characters with uppercase, lowercase, number, and special character";
    }
    if (!/(?=.*\d)/.test(password)) {
      return"Password must be at least 12 characters with uppercase, lowercase, number, and special character";
    }
    if (!/(?=.*[^\da-zA-Z])/.test(password)) {
      return"Password must be at least 12 characters with uppercase, lowercase, number, and special character";
    }
    return null;
  };

  const validatePasswordForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword ="Current password is required";
    }

    if (!passwordData.newPassword) {
      errors.newPassword ="New password is required";
    } else {
      const passwordValidation = validatePassword(passwordData.newPassword);
      if (passwordValidation) {
        errors.newPassword = passwordValidation;
      }
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword ="Please confirm your password";
    } else if (passwordData.newPassword && passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword ="Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    setIsPasswordLoading(true);

    try {
      const request: ChangePasswordRequest = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      };

      const response = await profileService.changePassword(request);
      
      // Clear password form
      setPasswordData({
        currentPassword:"",
        newPassword:"",
        confirmPassword:"",
      });
      setPasswordErrors({});
      
      toast.success(response.message);
    } catch (error: unknown) {
      const apiError = ErrorHandler.handleAuthError(error,'changing password');
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handlePasswordCancel = () => {
    setPasswordData({
      currentPassword:"",
      newPassword:"",
      confirmPassword:"",
    });
    setPasswordErrors({});
  };

  const handleAccountDeleted = () => {
    toast.success("Admin account deleted successfully");
    window.location.href ="/login";
  };

  return (
    <div className="min-h-screen" data-testid="section-profile-settings">
      <div className="max-w-4xl mx-auto glass border border-border/50 rounded-2xl shadow-lg p-8">
        {/* Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/settings">
            <Button variant="ghost" size="sm" className="glass-soft hover:glass transition-all duration-200">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Account Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your profile information and account preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Information */}
          <Card data-testid="card-profile-information" className="glass border-border/50 shadow-lg hover:glass-strong transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-emerald-500/20">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription>
                Update your personal information and contact details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4" data-testid="form-profile">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input 
                      id="fullName"
                      name="fullName"
                      data-testid="input-fullName"
                      value={profileData.fullName}
                      onChange={handleProfileChange}
                      placeholder="Enter your full name"
                      disabled={isProfileLoading}
                      className="glass-soft border-border/50 focus:glass transition-all duration-200"
                    />
                    {profileErrors.fullName && (
                      <p className="text-sm text-destructive" data-testid="error-fullName">
                        {profileErrors.fullName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email"
                      data-testid="input-email"
                      type="email" 
                      value={user?.email ||""} 
                      placeholder="Enter your email"
                      disabled
                      title="Email cannot be changed. Contact support@gathergrove.club if you need to update your email."
                      className="glass-soft border-border/50 opacity-75"
                    />
                    <p className="text-sm text-muted-foreground">
                      Email cannot be changed. Contact support@gathergrove.club if needed.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clubName">Club Name</Label>
                  <Input 
                    id="clubName"
                    data-testid="input-clubName"
                    value={user?.clubName ||""} 
                    placeholder="Enter your club name"
                    disabled
                    title="Club name cannot be changed from this page. Contact support@gathergrove.club if you need to update your club name."
                    className="glass-soft border-border/50 opacity-75"
                  />
                  <p className="text-sm text-muted-foreground">
                    Club name cannot be changed from this page. Contact support@gathergrove.club if needed.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={isProfileLoading}
                    data-testid="button-save-profile"
                    className="bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:opacity-95 disabled:opacity-50"
                  >
                    {isProfileLoading ?"Saving..." :"Save Changes"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleProfileCancel}
                    disabled={isProfileLoading}
                    data-testid="button-cancel-profile"
                    className="glass-soft border-border/50 hover:glass transition-all duration-200"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card data-testid="card-change-password" className="glass border-border/50 shadow-lg hover:glass-strong transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-warning/20 to-destructive/20">
                  <Lock className="h-5 w-5 text-warning" />
                </div>
                <span>Change Password</span>
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4" data-testid="form-password">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input 
                      id="currentPassword"
                      name="currentPassword"
                      data-testid="input-currentPassword"
                      type={showCurrentPassword ?"text" :"password"}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter your current password"
                      disabled={isPasswordLoading}
                      className="glass-soft border-border/50 focus:glass transition-all duration-200 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      aria-label={showCurrentPassword ?"Hide current password" :"Show current password"}
                      data-testid="button-toggle-current-password"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showCurrentPassword ?"Hide" :"Show"} current password
                      </span>
                    </Button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-sm text-destructive" data-testid="error-currentPassword">
                      {passwordErrors.currentPassword}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input 
                        id="newPassword"
                        name="newPassword"
                        data-testid="input-newPassword"
                        type={showNewPassword ?"text" :"password"}
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter your new password"
                        disabled={isPasswordLoading}
                        className="glass-soft border-border/50 focus:glass transition-all duration-200 pr-12"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label={showNewPassword ?"Hide new password" :"Show new password"}
                        data-testid="button-toggle-new-password"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showNewPassword ?"Hide" :"Show"} new password
                        </span>
                      </Button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="text-sm text-destructive" data-testid="error-newPassword">
                        {passwordErrors.newPassword}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Must be at least 8 characters with uppercase, lowercase, number, and special character.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input 
                        id="confirmPassword"
                        name="confirmPassword"
                        data-testid="input-confirmPassword"
                        type={showConfirmPassword ?"text" :"password"}
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirm your new password"
                        disabled={isPasswordLoading}
                        className="glass-soft border-border/50 focus:glass transition-all duration-200 pr-12"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ?"Hide confirm password" :"Show confirm password"}
                        data-testid="button-toggle-confirm-password"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showConfirmPassword ?"Hide" :"Show"} confirm password
                        </span>
                      </Button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="text-sm text-destructive" data-testid="error-confirmPassword">
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={isPasswordLoading}
                    data-testid="button-change-password"
                    className="bg-gradient-to-r from-destructive to-destructive/90 hover:from-destructive/90 hover:to-destructive text-destructive-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:opacity-95 disabled:opacity-50"
                  >
                    {isPasswordLoading ?"Updating..." :"Update Password"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handlePasswordCancel}
                    disabled={isPasswordLoading}
                    data-testid="button-cancel-password"
                    className="glass-soft border-border/50 hover:glass transition-all duration-200"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Account Management */}
          <Card data-testid="card-account-management" className="glass border-border/50 shadow-lg hover:glass-strong transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-destructive/20 to-warning/20">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <span>Account Management</span>
              </CardTitle>
              <CardDescription>
                Manage your admin account settings and access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border-l-4 border-destructive bg-destructive/5  rounded">
                <h4 className="font-medium text-destructive  mb-2">
                  Admin Account Deletion
                </h4>
                <p className="text-sm text-destructive/80  mb-4">
                  As an administrator, account deletion requires careful management of club ownership and data.
                  This action cannot be undone and will permanently remove all your admin privileges.
                </p>
                <div className="space-y-2 text-xs text-destructive">
                  <p>• Club ownership must be transferred or clubs will be deleted</p>
                  <p>• All admin privileges and access will be permanently removed</p>
                  <p>• Extended 30-day grace period for admin accounts</p>
                  <p>• Active subscriptions will be cancelled</p>
                  <p>• Data will be retained for legal compliance</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-warning/10  rounded border border-warning/30">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-warning-foreground">
                        Before proceeding with deletion:
                      </p>
                      <ul className="text-xs text-warning-foreground/80  space-y-1">
                        <li>• Ensure club ownership is properly transferred</li>
                        <li>• Download all important data and records</li>
                        <li>• Cancel any active subscriptions if needed</li>
                        <li>• Inform other administrators of the change</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setShowAccountDeletionDialog(true)}
                  variant="outline"
                  className="border-destructive/50 text-destructive hover:bg-destructive/5 hover:border-destructive hover:text-destructive     w-full"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Delete Admin Account
                </Button>
              </div>

              {/* Account Details */}
              <div className="pt-6 border-t space-y-4">
                <h4 className="font-medium">Account Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Account ID</Label>
                    <p className="font-mono">{user?.userId}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Account Type</Label>
                    <p>{user?.role}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Club Name</Label>
                    <p>{user?.clubName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Account Status</Label>
                    <p className="text-success">Active</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Admin Account Deletion Dialog */}
      <AdminAccountDeletionDialog
        open={showAccountDeletionDialog}
        onOpenChange={setShowAccountDeletionDialog}
        onAccountDeleted={handleAccountDeleted}
      />
      </div>
    </div>
  );
} 