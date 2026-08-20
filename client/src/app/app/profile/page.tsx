"use client";

import { useState, useEffect, useCallback } from"react";
import { useAuth } from"@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import { Checkbox } from"@/components/ui/checkbox";
import { Switch } from"@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from"@/components/ui/tabs";
import { Loader2, User, Phone, ArrowLeft, Save, Shield, Eye, EyeOff, AlertTriangle } from"lucide-react";
import { useRouter } from"next/navigation";
import { toast } from"sonner";
import { ErrorHandler } from"@/lib/errorHandler";
import { logger } from"@/lib/logger";
import { MemberDirectoryService } from"@/services/memberDirectoryService";
import memberService, { MemberResponse, UpdateMemberRequest } from"@/services/memberService";

import {
  MemberDirectorySettingsResponse,
  UpdateMemberDirectorySettingsRequest,
  AVAILABLE_MEMBER_DIRECTORY_FIELDS
} from"@/types/memberDirectorySettings";
import { AccountDeletionDialog } from"@/components/account/AccountDeletionDialog";

export default function MemberProfile() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [memberProfile, setMemberProfile] = useState<MemberResponse | null>(null);

  const [profileData, setProfileData] = useState<UpdateMemberRequest>({
    membershipTypeId: 0,
    fullName:'',
    email:'',
    phoneNumber:'',
    address:'',
    hasSmsConsent: false,
    customFieldValues: []
  });
  
  // Directory settings state
  const [directorySettings, setDirectorySettings] = useState<MemberDirectorySettingsResponse>({
    clubDirectoryEnabled: false,
    adminAllowedSharableFields: [],
    isListed: false,
    visibleFields: []
  });
  const [isLoadingDirectorySettings, setIsLoadingDirectorySettings] = useState(true);
  const [isSavingDirectorySettings, setIsSavingDirectorySettings] = useState(false);

  // Account deletion state
  const [showAccountDeletionDialog, setShowAccountDeletionDialog] = useState(false);

  // Load member profile data
  const loadMemberProfile = useCallback(async () => {
    if (!user?.clubId) return;
    
    try {
      const profile = await memberService.getMyProfile(user.clubId);
      setMemberProfile(profile);
      setProfileData({
        membershipTypeId: profile.membershipTypeId,
        fullName: profile.fullName,
        email: profile.email,
        phoneNumber: profile.phoneNumber ||"",
        address: profile.address ||"",
        hasSmsConsent: profile.hasSmsConsent,
        customFieldValues: profile.customFieldValues.map(cfv => ({
          customFieldId: cfv.customFieldId,
          fieldValue: cfv.fieldValue
        }))
      });

      // Membership type information is already included in the profile response
    } catch (error) {
      logger.error('members','Failed to load member profile', { error, memberId: user?.userId, clubId: user?.clubId });
      const apiError = ErrorHandler.handleMemberError(error,'loading profile information');
      ErrorHandler.showErrorToast(apiError);
    }
  }, [user?.clubId]);

  // Load directory settings data
  const loadDirectorySettings = useCallback(async () => {
    try {
      const settings = await MemberDirectoryService.getDirectorySettings();
      setDirectorySettings(settings);
    } catch (error) {
      logger.error('members','Failed to load directory settings', { error, memberId: user?.userId, clubId: user?.clubId });
      const apiError = ErrorHandler.handleApiError(error, { context:'loading privacy settings' });
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setIsLoadingDirectorySettings(false);
    }
  }, []);

  // Handle directory settings changes
  const handleDirectoryToggle = (checked: boolean) => {
    setDirectorySettings(prev => ({
      ...prev,
      isListed: checked
    }));
  };

  const handleFieldVisibilityChange = (fieldKey: string, visible: boolean) => {
    setDirectorySettings(prev => ({
      ...prev,
      visibleFields: visible 
        ? [...prev.visibleFields, fieldKey]
        : prev.visibleFields.filter(f => f !== fieldKey)
    }));
  };

  const handleSaveDirectorySettings = async () => {
    setIsSavingDirectorySettings(true);
    try {
      const request: UpdateMemberDirectorySettingsRequest = {
        isListed: directorySettings.isListed,
        visibleFields: directorySettings.visibleFields
      };

      const updatedSettings = await MemberDirectoryService.updateDirectorySettings(request);
      setDirectorySettings(updatedSettings);
      toast.success("Directory settings updated successfully!");
    } catch (error) {
      logger.error('members','Error saving directory settings', { error, memberId: user?.userId, clubId: user?.clubId });
      const apiError = ErrorHandler.handleApiError(error, { context:'updating directory settings' });
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setIsSavingDirectorySettings(false);
    }
  };

  const handleAccountDeleted = () => {
    toast.success("Account deleted successfully");
    router.push('/login');
  };

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
      
      // Load member profile and directory settings
      Promise.all([
        loadMemberProfile(),
        loadDirectorySettings()
      ]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [user, loading, router, loadMemberProfile, loadDirectorySettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.clubId || !memberProfile) return;
    
    setIsSaving(true);
    
    try {
      const request: UpdateMemberRequest = {
        membershipTypeId: profileData.membershipTypeId,
        fullName: profileData.fullName,
        email: profileData.email,
        phoneNumber: profileData.phoneNumber || undefined,
        address: profileData.address || undefined,
        hasSmsConsent: profileData.hasSmsConsent,
        customFieldValues: profileData.customFieldValues.map(cfv => ({
          customFieldId: cfv.customFieldId,
          fieldValue: cfv.fieldValue
        }))
      };

      const updatedProfile = await memberService.updateMyProfile(user.clubId, request);
      setMemberProfile(updatedProfile);
      
      toast.success("Profile updated successfully!");
    } catch (error) {
      logger.error('members','Error saving profile', { error, memberId: user?.userId, clubId: user?.clubId });
      const apiError = ErrorHandler.handleMemberError(error,'updating profile');
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user || !memberProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/app/member-dashboard")}
            className="mb-4 interactive-lift hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information and settings
          </p>
        </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50 backdrop-blur-sm border border-border/30 p-1 grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="data-[state=active]:bg-card/90 data-[state=active]:backdrop-blur-lg data-[state=active]:shadow-sm transition-all duration-200">Profile Information</TabsTrigger>
          <TabsTrigger value="privacy" className="data-[state=active]:bg-card/90 data-[state=active]:backdrop-blur-lg data-[state=active]:shadow-sm transition-all duration-200">Privacy Settings</TabsTrigger>
          <TabsTrigger value="account" className="data-[state=active]:bg-card/90 data-[state=active]:backdrop-blur-lg data-[state=active]:shadow-sm transition-all duration-200 text-destructive">Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Information */}
        <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-success/20">
                <User className="h-5 w-5 text-primary" />
              </div>
              <span>Personal Information</span>
            </CardTitle>
            <CardDescription>
              Your basic profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                value={profileData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                disabled={isSaving}
                data-testid="input-fullName"
                className="glass-soft border-border/50 focus:glass transition-all duration-200 focus-ring"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={profileData.email}
                onChange={handleInputChange}
                placeholder="Enter your email address"
                disabled={isSaving}
                data-testid="input-email"
                className="glass-soft border-border/50 focus:glass transition-all duration-200 focus-ring"
              />
              <p className="text-xs text-muted-foreground">
                This is your login email and cannot be changed by members. Contact an admin if you need to update this.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/20">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <span>Contact Information</span>
            </CardTitle>
            <CardDescription>
              Ways to reach you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={profileData.phoneNumber}
                onChange={handleInputChange}
                placeholder="(555) 123-4567"
                disabled={isSaving}
                data-testid="input-phoneNumber"
                className="glass-soft border-border/50 focus:glass transition-all duration-200 focus-ring"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={profileData.address}
                onChange={handleInputChange}
                placeholder="Your mailing address"
                disabled={isSaving}
                data-testid="input-address"
                className="glass-soft border-border/50 focus:glass transition-all duration-200 focus-ring"
              />
            </div>
          </CardContent>
        </Card>

        {/* Membership Information (Read-only) */}
        <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-success/20 to-success/20">
                <Shield className="h-5 w-5 text-success" />
              </div>
              <span>Membership Information</span>
            </CardTitle>
            <CardDescription>
              Your club membership details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Club</Label>
                <p className="text-sm text-muted-foreground">{user.clubName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Tier</Label>
                <p className="text-sm text-muted-foreground">{user.clubTier}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <p className="text-sm text-success">{memberProfile.status}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Member Since</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(memberProfile.joinDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Membership Type</Label>
                <p className="text-sm text-muted-foreground">{memberProfile.membershipTypeName}</p>
              </div>
              {memberProfile.duesPaidUntil && (
                <div>
                  <Label className="text-sm font-medium">Dues Paid Until</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(memberProfile.duesPaidUntil).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

            {/* Save Button */}
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push("/app/member-dashboard")}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} data-testid="button-save">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="privacy">
          <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-warning/20 to-warning/20">
                  <Shield className="h-5 w-5 text-warning" />
                </div>
                <span>Directory Privacy Settings</span>
              </CardTitle>
              <CardDescription>
                Control how your information appears in the member directory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingDirectorySettings ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading directory settings...</span>
                </div>
              ) : !directorySettings.clubDirectoryEnabled ? (
                <div className="text-center py-8">
                  <EyeOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Directory Disabled</h3>
                  <p className="text-muted-foreground">
                    The member directory is currently disabled for your club.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">List me in the club directory</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow other members to see your profile in the directory. Your name will be visible by default.
                        </p>
                      </div>
                      <Switch
                        checked={directorySettings.isListed}
                        onCheckedChange={handleDirectoryToggle}
                        disabled={isSavingDirectorySettings}
                        data-testid="switch-directoryListing"
                      />
                    </div>
                  </div>

                  {directorySettings.isListed && directorySettings.adminAllowedSharableFields.length > 0 && (
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <Label className="text-base">Share profile fields</Label>
                        <p className="text-sm text-muted-foreground">
                          Choose which contact information you want to share with other members
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        {directorySettings.adminAllowedSharableFields.map((fieldKey) => {
                          const field = AVAILABLE_MEMBER_DIRECTORY_FIELDS[fieldKey as keyof typeof AVAILABLE_MEMBER_DIRECTORY_FIELDS];
                          if (!field) return null;
                          
                          const isVisible = directorySettings.visibleFields.includes(fieldKey);
                          
                          return (
                            <div key={fieldKey} className="flex items-center space-x-3">
                              <Checkbox
                                id={`field-${fieldKey}`}
                                checked={isVisible}
                                onCheckedChange={(checked) => 
                                  handleFieldVisibilityChange(fieldKey, checked as boolean)
                                }
                                disabled={isSavingDirectorySettings}
                              />
                              <div className="space-y-1 leading-none">
                                <Label 
                                  htmlFor={`field-${fieldKey}`}
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {field.label}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {field.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t">
                    <Button 
                      onClick={handleSaveDirectorySettings}
                      disabled={isSavingDirectorySettings}
                    >
                      {isSavingDirectorySettings ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Save Privacy Settings
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <div className="space-y-6">
            {/* Account Management */}
            <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-destructive/20 to-destructive/20">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <span>Account Management</span>
                </CardTitle>
                <CardDescription>
                  Manage your account settings and data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-destructive bg-destructive/5 rounded">
                    <h4 className="font-medium text-destructive mb-2">
                      Account Deletion
                    </h4>
                    <p className="text-sm text-destructive/90 mb-4">
                      If you wish to delete your account, you can request permanent deletion. This action cannot be undone
                      and will remove all your data from our systems after a grace period.
                    </p>
                    <div className="space-y-2 text-xs text-destructive/80">
                      <p>• All personal information will be permanently deleted</p>
                      <p>• Club membership and participation history will be removed</p>
                      <p>• You will lose access to all club features and services</p>
                      <p>• Data may be retained for legal compliance for a period of time</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => setShowAccountDeletionDialog(true)}
                    variant="outline"
                    className="border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/50"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Delete My Account
                  </Button>
                </div>

                {/* Account Information */}
                <div className="pt-6 border-t space-y-4">
                  <h4 className="font-medium">Account Information</h4>
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
                      <Label className="text-xs text-muted-foreground">Club Tier</Label>
                      <p>{user?.clubTier}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Member Since</Label>
                      <p>{memberProfile ? new Date(memberProfile.joinDate).toLocaleDateString() :'Loading...'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Account Deletion Dialog */}
      <AccountDeletionDialog
        open={showAccountDeletionDialog}
        onOpenChange={setShowAccountDeletionDialog}
        onAccountDeleted={handleAccountDeleted}
      />
      </div>
    </div>
  );
}
