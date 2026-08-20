"use client";

import { useState, useEffect } from"react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { AlertCircle } from"lucide-react";
import { useAuth } from"@/hooks/useAuth";
import memberService, { MemberResponse } from"@/services/memberService";
import PayDues from"@/components/PayDues";
import { toast } from"sonner";

export default function MembershipPage() {
  const { user } = useAuth();
  const [memberProfile, setMemberProfile] = useState<MemberResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayDues, setShowPayDues] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setError(null);
        if (user?.clubId) {
          const profile = await memberService.getMyProfile(user.clubId);
          setMemberProfile(profile);
        }
      } catch {
        setError("Failed to load membership information.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [user?.clubId]);

  const handlePaymentSuccess = async () => {
    setShowPayDues(false);
    toast.success('Payment successful!');
    // Reload the profile to get updated dues information
    try {
      if (user?.clubId) {
        const profile = await memberService.getMyProfile(user.clubId);
        setMemberProfile(profile);
      }
    } catch {
      // Silent fail on profile refresh
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="relative mx-auto w-16 h-16 mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-success/20   rounded-full animate-pulse"></div>
                <div className="absolute inset-2 bg-gradient-to-br from-background to-muted/20 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              </div>
              <p className="text-muted-foreground font-medium">Loading membership info...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !memberProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto p-6">
          <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <div className="p-4 rounded-lg bg-gradient-to-br from-destructive/20 to-destructive/10 mb-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Unable to Load Membership Info</h2>
              <p className="text-muted-foreground text-center mb-4">
                {error ||'Membership information not found.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const duesExpired = new Date(memberProfile.duesPaidUntil ||'') < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Membership</h1>
        <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-success/20">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
              <span>Membership Dues</span>
            </CardTitle>
            <CardDescription>Manage your membership dues and payment</CardDescription>
          </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex justify-between">
              <span className="font-medium">Membership Type</span>
              <span>{memberProfile.membershipTypeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status</span>
              <span className={memberProfile.status ==='Active' ?'text-success' :'text-destructive'}>{memberProfile.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Dues Paid Until</span>
              <span>{new Date(memberProfile.duesPaidUntil ||'').toLocaleDateString()}</span>
            </div>
          </div>

          {duesExpired && (
            <div className="glass-soft bg-warning/5 border border-warning/20 text-warning rounded-lg p-4 mb-4 flex items-start gap-3 backdrop-blur-sm">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-warning/20 to-warning/20   flex-shrink-0 mt-0.5">
                <AlertCircle className="h-4 w-4 text-warning" />
              </div>
              <span className="text-sm">
                <strong className="block">Dues Payment Required</strong>
                Your dues expired on {new Date(memberProfile.duesPaidUntil ||'').toLocaleDateString()}. Pay now to maintain your membership.
              </span>
            </div>
          )}

          <Button
            className="w-full mb-2 bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
            onClick={() => setShowPayDues(true)}
            data-testid="button-pay-dues"
          >
            Pay Dues Now
          </Button>

          {showPayDues && (
            <PayDues
              memberProfile={memberProfile}
              onPaymentSuccess={handlePaymentSuccess}
              onCancel={() => setShowPayDues(false)}
            />
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
} 