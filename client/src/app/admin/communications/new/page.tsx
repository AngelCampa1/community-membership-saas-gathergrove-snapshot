"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, Send, Users, AlertTriangle, CheckCircle, Smartphone } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import communicationService from "@/services/communicationService";
import { ErrorHandler } from "@/lib/errorHandler";
import { logger } from "@/lib/logger";
import MemberTypeSelector from "@/components/communications/MemberTypeSelector";

interface EmailUsageStats {
  clubTier: string;
  emailsSentThisMonth: number; // Admin communications only (excludes system emails)
  monthlyEmailLimit: number | null; // Limit for admin communications
  activeMemberCount: number;
  wouldExceedLimit: boolean;
  remainingEmails: number | null;
  currentMonth: string;
}

interface SendEmailResponse {
  success: boolean;
  message: string;
  recipientCount: number;
  communicationLogId?: number;
}

interface PushNotificationUsageStats {
  clubTier: string;
  membersWithDeviceTokens: number;
  totalActiveMembers: number;
  totalDeviceTokens: number;
  isGrowTier: boolean;
  isAzureConfigured: boolean;
  currentMonth: string;
}

interface SendPushNotificationResponse {
  success: boolean;
  message: string;
  deviceCount: number;
  userCount: number;
  totalActiveMembers: number;
  communicationLogId?: number;
}

interface FormData {
  subject: string;
  body: string;
  message: string;
  selectedTemplate: string;
  templateVariables: { [key: string]: string };
  pushTitle: string;
  pushMessage: string;
  selectedMemberTypeIds: number[];
}

interface FormErrors {
  subject?: string;
  body?: string;
  message?: string;
  selectedTemplate?: string;
  templateVariables?: string;
  pushTitle?: string;
  pushMessage?: string;
  general?: string;
}

type CommunicationTab = 'email' | 'push';

function NewCommunicationPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const requestedTab = searchParams?.get('tab');
  const initialTab: CommunicationTab = requestedTab === 'push' ? 'push' : 'email';
  const [activeTab, setActiveTab] = useState<CommunicationTab>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [emailStats, setEmailStats] = useState<EmailUsageStats | null>(null);
  const [pushStats, setPushStats] = useState<PushNotificationUsageStats | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [sendResult, setSendResult] = useState<SendEmailResponse | SendPushNotificationResponse | null>(null);
  const [recipientCount, setRecipientCount] = useState<number>(0);

  const [formData, setFormData] = useState<FormData>({
    subject: '',
    body: '',
    message: '',
    selectedTemplate: '',
    templateVariables: {},
    pushTitle: '',
    pushMessage: '',
    selectedMemberTypeIds: []
  });
  
  const [errors, setErrors] = useState<FormErrors>({});

  const fetchEmailStats = useCallback(async () => {
    if (!user?.clubId) {
      logger.error('communications', 'User club ID not available for email stats');
      setIsLoadingStats(false);
      return;
    }
    
    try {
      const emailStats = await communicationService.getEmailUsageStats(user.clubId);
      
      // Transform the response to match the expected interface
      setEmailStats({
        clubTier: emailStats.subscriptionTier,
        emailsSentThisMonth: emailStats.emailsSentThisMonth,
        monthlyEmailLimit: emailStats.monthlyEmailLimit,
        activeMemberCount: 0,
        wouldExceedLimit: false, // This might need to be calculated
        remainingEmails: emailStats.monthlyEmailLimit ? emailStats.monthlyEmailLimit - emailStats.emailsSentThisMonth : null,
        currentMonth: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });
    } catch (error) {
      logger.error('communications', 'Error fetching email stats', { error, clubId: user?.clubId });
      // Set default email stats even on error
      setEmailStats({
        clubTier: user?.clubTier || 'Grow',
        emailsSentThisMonth: 0,
        monthlyEmailLimit: 500,
        activeMemberCount: 0,
        wouldExceedLimit: false,
        remainingEmails: 500,
        currentMonth: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });
    } finally {
      setIsLoadingStats(false);
    }
  }, [user?.clubId, user?.clubTier]);

  const fetchPushStats = useCallback(async () => {
    if (!user?.clubId) {
      logger.error('communications', 'User club ID not available for push stats');
      return;
    }
    
    try {
      const stats = await communicationService.getPushNotificationUsageStats(user.clubId);
      setPushStats(stats);
    } catch (error) {
      logger.error('communications', 'Error fetching push notification stats', { error, clubId: user.clubId });
    }
  }, [user?.clubId]);

  useEffect(() => {
    fetchEmailStats();
    if (user?.clubTier === 'Grow') {
      fetchPushStats();
    }
  }, [user, fetchEmailStats, fetchPushStats]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (activeTab === 'email') {
      if (!formData.subject.trim()) {
        newErrors.subject = 'Subject is required';
      } else if (formData.subject.length > 500) {
        newErrors.subject = 'Subject cannot exceed 500 characters';
      }
      
      if (!formData.body.trim()) {
        newErrors.body = 'Email body is required';
      } else if (formData.body.length > 10000) {
        newErrors.body = 'Body cannot exceed 10,000 characters';
      }
    } else if (activeTab === 'push') {
      if (!formData.pushTitle.trim()) {
        newErrors.pushTitle = 'Title is required';
      } else if (formData.pushTitle.length > 100) {
        newErrors.pushTitle = 'Title cannot exceed 100 characters';
      }
      
      if (!formData.pushMessage.trim()) {
        newErrors.pushMessage = 'Message is required';
      } else if (formData.pushMessage.length > 300) {
        newErrors.pushMessage = 'Message cannot exceed 300 characters';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof FormErrors]: undefined }));
    }
  };

  const handleTabSwitch = (newTab: CommunicationTab) => {
    setActiveTab(newTab);
    // Clear all errors and success messages when switching tabs to prevent persistence
    setErrors({});
    setSendResult(null);
    
    // Fetch push stats if switching to push tab and user is on Grow tier
    if (newTab === 'push' && user?.clubTier === 'Grow' && !pushStats) {
      fetchPushStats();
    }
  };

  const handlePreviewAndSend = () => {
    if (!validateForm()) {
      return;
    }
    
    if (activeTab === 'email' && emailStats?.wouldExceedLimit) {
      setErrors({ general: 'Sending this email would exceed your monthly limit. Please upgrade to Grow or wait until next month.' });
      return;
    }
    
    if (activeTab === 'push' && !pushStats?.isGrowTier) {
      setErrors({ general: 'Push notifications are only available for clubs on the Grow tier. Please upgrade your subscription.' });
      return;
    }
    
    if (activeTab === 'push' && !pushStats?.isAzureConfigured) {
      setErrors({ general: 'Push notifications are not currently configured. Please contact support@gathergrove.club to set up Azure Notification Hubs.' });
      return;
    }
    
    setShowConfirmation(true);
  };

  const handleMemberTypeSelectionChange = (memberTypeIds: number[]) => {
    setFormData(prev => ({ ...prev, selectedMemberTypeIds: memberTypeIds }));
  };

  const handleRecipientCountChange = (count: number) => {
    setRecipientCount(count);
  };

  const handleConfirmSend = async () => {
    if (!user?.clubId) {
      setErrors({ general: 'User club information not available. Please refresh the page.' });
      return;
    }
    
    setIsLoading(true);
    setShowConfirmation(false);
    
    try {
      let result: SendEmailResponse | SendPushNotificationResponse;
      
      if (activeTab === 'email') {
        result = await communicationService.sendBulkEmail(user.clubId, {
          subject: formData.subject,
          body: formData.body,
          isHtml: false,
          memberTypeIds: formData.selectedMemberTypeIds.length > 0 ? formData.selectedMemberTypeIds : undefined
        });
      } else if (activeTab === 'push') {
        result = await communicationService.sendPushNotification(user.clubId, {
          title: formData.pushTitle,
          body: formData.pushMessage,
          memberTypeIds: formData.selectedMemberTypeIds.length > 0 ? formData.selectedMemberTypeIds : undefined
        });
      } else {
        throw new Error('Invalid communication type');
      }
      
      setSendResult(result);
      
      if (result.success) {
        // Refresh stats after successful send
        if (activeTab === 'email') {
          await fetchEmailStats();
        } else if (activeTab === 'push') {
          await fetchPushStats();
        }
        
        // Clear form
        setFormData({
          subject: '',
          body: '',
          message: '',
          selectedTemplate: '',
          templateVariables: {},
          pushTitle: '',
          pushMessage: '',
          selectedMemberTypeIds: []
        });
      } else {
        setErrors({ general: result.message });
      }
    } catch (error) {
      if (activeTab === 'push') {
        const apiError = ErrorHandler.handlePushNotificationError(error);
        setErrors({ general: apiError.message });
      } else {
        const errorMessage = 'sending the email';
        logger.error('communications', `Error ${errorMessage}`, {
          error,
          activeTab,
          clubId: user?.clubId
        });
        setErrors({ general: `An error occurred while ${errorMessage}. Please try again.` });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderUsageDisplay = () => {
    if (isLoadingStats) {
      return <div className="text-sm text-muted-foreground">Loading usage information...</div>;
    }
    
    if (!emailStats) {
      return null;
    }
    
    if (emailStats.clubTier === 'Grow' || emailStats.monthlyEmailLimit === null) {
      return (
        <div className="flex items-center gap-2 text-sm text-success">
          <CheckCircle className="h-4 w-4" />
          <span>Grow tier. No admin email cap</span>
        </div>
      );
    }
    
    const usagePercentage = (emailStats.emailsSentThisMonth / emailStats.monthlyEmailLimit) * 100;
    const isNearLimit = usagePercentage >= 80;
    
    return (
      <div className="space-y-2">
        <div className={`flex items-center gap-2 text-sm ${isNearLimit ? 'text-warning' : 'text-muted-foreground'}`}>
          <Mail className="h-4 w-4" />
          <span>
            Admin communications this month: {emailStats.emailsSentThisMonth} / {emailStats.monthlyEmailLimit}
          </span>
        </div>

        {emailStats.wouldExceedLimit && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>
              Sending to all members ({emailStats.activeMemberCount} recipients) would exceed your admin communication limit
            </span>
          </div>
        )}

        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full ${isNearLimit ? 'bg-warning' : 'bg-primary'}`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  const renderPushUsageDisplay = () => {
    if (isLoadingStats) {
      return <div className="text-sm text-muted-foreground">Loading push notification information...</div>;
    }
    
    if (!pushStats) {
      return null;
    }
    
    if (!pushStats.isGrowTier) {
      return (
        <div className="flex items-center gap-2 text-sm text-warning">
          <AlertTriangle className="h-4 w-4" />
          <span>Push notifications are only available for clubs on the Grow tier</span>
        </div>
      );
    }

    if (!pushStats.isAzureConfigured) {
      return (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span>Azure Notification Hubs is not configured. Contact support@gathergrove.club to enable push notifications.</span>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-success">
          <CheckCircle className="h-4 w-4" />
          <span>Push notifications are available</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Smartphone className="h-4 w-4" />
          <span>
            Members with devices: {pushStats.membersWithDeviceTokens} / {pushStats.totalActiveMembers}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            Total device tokens: {pushStats.totalDeviceTokens}
          </span>
        </div>

        {pushStats.membersWithDeviceTokens === 0 && (
          <div className="flex items-center gap-2 text-sm text-warning">
            <AlertTriangle className="h-4 w-4" />
            <span>
              No members have registered devices. Members need to install the mobile app to receive push notifications.
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/communications" className="flex items-center gap-2 text-primary hover:underline mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Communications
          </Link>
          <h1 className="text-3xl font-bold text-foreground">
            Send Communication
          </h1>
          <p className="text-muted-foreground mt-2">
            Compose and send messages to all your club members
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6 border-b border-border">
          <button
            onClick={() => handleTabSwitch('email')}
            className={`px-4 py-2 font-medium text-sm border-b-2 ${
              activeTab === 'email'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Mail className="h-4 w-4 inline mr-2" />
            Email
          </button>
          <button
            onClick={() => handleTabSwitch('push')}
            className={`px-4 py-2 font-medium text-sm border-b-2 ${
              activeTab === 'push'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Smartphone className="h-4 w-4 inline mr-2" />
            Push {user?.clubTier !== 'Grow' ? '(Grow tier)' : ''}
          </button>
        </div>

        {/* Success Result */}
        {sendResult?.success && (
          <Card className="mb-6 border-success/50 bg-success/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-success">
                <CheckCircle className="h-5 w-5" />
                {activeTab === 'email' ? 'Email' : 'Push Notification'} Sent Successfully!
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Your {activeTab === 'email' ? 'email' : 'push notification'} has been delivered to {activeTab === 'push' && 'userCount' in sendResult ? sendResult.userCount : 'recipientCount' in sendResult ? sendResult.recipientCount : 0} {activeTab === 'email' ? 'active members' : 'users'}.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Email Composer */}
        {activeTab === 'email' && (
          <div className="space-y-6">
            {/* Usage Display */}
            <Card>
              <CardContent className="pt-6">
                {renderUsageDisplay()}
              </CardContent>
            </Card>

            {/* Member Type Targeting */}
            <MemberTypeSelector
              selectedMemberTypeIds={formData.selectedMemberTypeIds}
              onSelectionChange={handleMemberTypeSelectionChange}
              onRecipientCountChange={handleRecipientCountChange}
              disabled={isLoading}
            />

            {/* Composer Form */}
            <Card>
              <CardHeader>
                <CardTitle>Compose Email</CardTitle>
                <CardDescription>
                  Write your message to all club members. You can include announcements, newsletters, or updates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Enter email subject..."
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    className={errors.subject ? 'border-destructive' : ''}
                    maxLength={500}
                  />
                  {errors.subject && (
                    <p className="text-sm text-destructive">{errors.subject}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.subject.length} / 500 characters
                  </p>
                </div>

                {/* Body */}
                <div className="space-y-2">
                  <Label htmlFor="body">Message</Label>
                  <Textarea
                    id="body"
                    placeholder="Write your message here..."
                    value={formData.body}
                    onChange={(e) => handleInputChange('body', e.target.value)}
                    className={`min-h-[200px] ${errors.body ? 'border-destructive' : ''}`}
                    maxLength={10000}
                  />
                  {errors.body && (
                    <p className="text-sm text-destructive">{errors.body}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.body.length} / 10,000 characters
                  </p>
                </div>

                {/* General Error */}
                {errors.general && (
                  <Alert className="border-destructive/50 bg-destructive/10">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-destructive">
                      {errors.general}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handlePreviewAndSend}
                    disabled={isLoading || !formData.subject.trim() || !formData.body.trim()}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Review & Send
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/admin/communications">Cancel</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Push Notification Composer */}
        {activeTab === 'push' && (
          <div className="space-y-6">
            {/* Push Usage Display */}
            <Card>
              <CardContent className="pt-6">
                {renderPushUsageDisplay()}
              </CardContent>
            </Card>

            {/* Member Type Targeting */}
            <MemberTypeSelector
              selectedMemberTypeIds={formData.selectedMemberTypeIds}
              onSelectionChange={handleMemberTypeSelectionChange}
              onRecipientCountChange={handleRecipientCountChange}
              disabled={isLoading}
            />

            {/* Composer Form */}
            <Card>
              <CardHeader>
                <CardTitle>Compose Push Notification</CardTitle>
                <CardDescription>
                  Send instant notifications to members who have the mobile app installed. Keep titles short and messages concise for best results.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="push-title">Title</Label>
                  <Input
                    id="push-title"
                    placeholder="Enter notification title..."
                    value={formData.pushTitle}
                    onChange={(e) => handleInputChange('pushTitle', e.target.value)}
                    className={errors.pushTitle ? 'border-destructive' : ''}
                    maxLength={100}
                  />
                  {errors.pushTitle && (
                    <p className="text-sm text-destructive">{errors.pushTitle}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.pushTitle.length} / 100 characters
                  </p>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="push-message">Message</Label>
                  <Textarea
                    id="push-message"
                    placeholder="Write your notification message here..."
                    value={formData.pushMessage}
                    onChange={(e) => handleInputChange('pushMessage', e.target.value)}
                    className={`min-h-[100px] ${errors.pushMessage ? 'border-destructive' : ''}`}
                    maxLength={300}
                  />
                  {errors.pushMessage && (
                    <p className="text-sm text-destructive">{errors.pushMessage}</p>
                  )}
                  <p className={`text-xs ${formData.pushMessage.length > 250 ? 'text-warning' : 'text-muted-foreground'}`}>
                    {formData.pushMessage.length} / 300 characters
                    {formData.pushMessage.length > 250 && ' (approaching limit)'}
                  </p>
                </div>

                {/* General Error */}
                {errors.general && (
                  <Alert className="border-destructive/50 bg-destructive/10">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-destructive">
                      {errors.general}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handlePreviewAndSend}
                    disabled={isLoading || !formData.pushTitle.trim() || !formData.pushMessage.trim()}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Review & Send
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/admin/communications">Cancel</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Confirm {activeTab === 'email' ? 'Email' : 'Push Notification'} Send</CardTitle>
                <CardDescription>
                  Are you sure you want to send this {activeTab === 'email' ? 'email to all active members' : 'push notification to members with registered devices'}?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  {activeTab === 'email' ? (
                    <>
                      <div><strong>Subject:</strong> {formData.subject}</div>
                      <div><strong>Recipients:</strong> {recipientCount || emailStats?.activeMemberCount || 0} active members</div>
                      <div className="text-sm text-muted-foreground">
                        <strong>Preview:</strong>
                      </div>
                      <div className="text-sm bg-background p-3 rounded border max-h-32 overflow-y-auto">
                        {formData.body.substring(0, 200)}
                        {formData.body.length > 200 && '...'}
                      </div>
                    </>
                  ) : (
                    <>
                      <div><strong>Recipients:</strong> {pushStats?.membersWithDeviceTokens} members with registered devices</div>
                      <div className="text-sm text-muted-foreground">
                        <strong>Title:</strong>
                      </div>
                      <div className="text-sm bg-background p-3 rounded border mb-2">
                        {formData.pushTitle}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <strong>Message:</strong>
                      </div>
                      <div className="text-sm bg-background p-3 rounded border">
                        {formData.pushMessage}
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={handleConfirmSend}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {isLoading ? 'Sending...' : `Send ${activeTab === 'email' ? 'Email' : 'Push Notification'}`}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowConfirmation(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading communications...</div>
      </div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function NewCommunicationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewCommunicationPageContent />
    </Suspense>
  );
} 
