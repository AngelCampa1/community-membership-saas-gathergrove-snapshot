"use client";

import { useState, useEffect, useCallback } from'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from"@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from"@/components/ui/alert-dialog";
import { CreditCard, Plus, DollarSign, TrendingUp, Users, ExternalLink, CheckCircle, Clock } from"lucide-react";
import { toast } from'sonner';
import { useAuth } from'@/hooks/useAuth';
import { logger } from'@/lib/logger';
import memberService, { MemberResponse } from'@/services/memberService';
import { MembershipTypeResponse } from'@/services/membershipTypeService';
import { useMembershipTypes } from'@/hooks/useMembers';
import { stripeConnectService, StripeConnectStatusResponse } from'@/services/stripeConnectService';
import { RecordPaymentModal } from'@/components/features/members/RecordPaymentModal';
import { PaymentHistoryModal } from'@/components/features/payments/PaymentHistoryModal';
import { ErrorHandler } from'@/lib/errorHandler';
import { paymentService, ClubPaymentResponse } from'@/services/paymentService';

interface DuesStats {
  totalCollectedThisYear: number;
  paidMembers: number;
  totalMembers: number;
  outstandingDues: number;
}

export default function DuesPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberResponse[]>([]);
  
  // Use React Query hook for membership types
  const { data: membershipTypes = [], isLoading: membershipTypesLoading, error: membershipTypesError } = useMembershipTypes(user?.clubId);
  const [stripeStatus, setStripeStatus] = useState<StripeConnectStatusResponse | null>(null);
  const [stats, setStats] = useState<DuesStats>({
    totalCollectedThisYear: 0,
    paidMembers: 0,
    totalMembers: 0,
    outstandingDues: 0
  });
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberResponse | null>(null);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.clubId) return;

    try {
      setLoading(true);
      const [membersData, paymentsData, stripeStatusData] = await Promise.all([
        memberService.getMembers(user.clubId).catch(() => []),
        paymentService.getClubPayments(user.clubId).catch(() => []),
        stripeConnectService.getConnectStatus().catch(() => ({ isConnected: false }))
      ]);

      // Add defensive checks and fallbacks
      const safeMembers = Array.isArray(membersData) ? membersData : [];
      const safePayments = Array.isArray(paymentsData) ? paymentsData : [];
      const safeStripeStatus = stripeStatusData || { isConnected: false };

      setMembers(safeMembers);
      setStripeStatus(safeStripeStatus);
      calculateStats(safeMembers, membershipTypes, safePayments);
    } catch (error) {
      const apiError = ErrorHandler.handleMemberError(error,'loading dues data');
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setLoading(false);
    }
  }, [user?.clubId, membershipTypes]);

  useEffect(() => {
    // Check if we're returning from Stripe Connect
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const refresh = urlParams.get('refresh');
    const status = urlParams.get('status');

    if (connected ==='true' && status ==='platform_setup_required') {
      toast.info('Payment system is being configured. Please try again later.', {
        duration: 5000
      });
      // Remove query params from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (connected ==='true') {
      toast.success('Stripe account connected successfully! Your account is now ready to accept payments.');
      // Remove query params from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Reload data to refresh Stripe status
      if (user?.clubId) {
        loadData();
      }
    } else if (refresh ==='true') {
      toast.info('Please complete the Stripe onboarding process to enable payment collection.');
      // Remove query params from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (user?.clubId && !connected) {
      loadData();
    }
  }, [user, loadData]);

  // Handle membership types error
  useEffect(() => {
    if (membershipTypesError) {
      ErrorHandler.showErrorToast(membershipTypesError,'Unable to load membership types. Some features may not work properly.');
    }
  }, [membershipTypesError]);

  const calculateStats = (membersData: MemberResponse[], membershipTypesData: MembershipTypeResponse[], paymentsData: ClubPaymentResponse[]) => {
    const now = new Date();
    
    let totalCollectedThisYear = 0;
    let paidMembers = 0;
    let outstandingDues = 0;
    let membersWithDues = 0;

    // Add defensive checks for arrays
    if (!Array.isArray(membersData) || !Array.isArray(membershipTypesData)) {
      logger.warn('dues','Invalid data arrays provided for stats calculation', {
        hasMembersData: !!membersData,
        hasMembershipTypesData: !!membershipTypesData
      });
      return;
    }

    // Calculate total collected from actual payments (like dashboard does)
    if (Array.isArray(paymentsData)) {
      totalCollectedThisYear = paymentsData.reduce((sum, payment) => sum + payment.amount, 0);
    }

    membersData.forEach(member => {
      const membershipType = membershipTypesData.find(type => type.id === member.membershipTypeId);
      const duesAmount = membershipType?.duesAmount || 0;

      // Skip members with $0 membership types
      if (duesAmount === 0) {
        return;
      }

      // Count members with dues
      membersWithDues++;

      // Check if member has paid dues (dues paid until date is in the future)
      const duesPaidUntil = member.duesPaidUntil ? new Date(member.duesPaidUntil) : null;
      const isPaid = duesPaidUntil && duesPaidUntil > now;

      if (isPaid) {
        paidMembers++;
      } else {
        outstandingDues += duesAmount;
      }
    });

    setStats({
      totalCollectedThisYear,
      paidMembers,
      totalMembers: membersWithDues,
      outstandingDues
    });
  };

  const handleConnectStripe = async () => {
    try {
      setIsConnecting(true);

      logger.debug('dues','Attempting to connect to Stripe', { clubId: user?.clubId });

      const response = await stripeConnectService.getConnectLink();

      logger.debug('dues','Stripe Connect response received', {
        hasOnboardingUrl: !!response.onboardingUrl
      });

      // Redirect to Stripe Connect onboarding
      window.location.assign(response.onboardingUrl);
    } catch (error) {
      logger.error('dues','Error connecting to Stripe', { error, clubId: user?.clubId });
      
      const axiosError = error as { response?: { status: number; data?: { isConnectSetupRequired?: boolean; setupUrl?: string; error?: string; isRetryable?: boolean; actionRequired?: string } } };
      
      // Check if this is a Stripe Connect setup error
      if (axiosError.response?.status === 503 && axiosError.response?.data?.isConnectSetupRequired) {
        const setupUrl = axiosError.response.data.setupUrl;
        const message = axiosError.response.data.error;
        
        toast.error(message, {
          duration: 10000,
          action: {
            label:'Setup Stripe Connect',
            onClick: () => window.open(setupUrl,'_blank')
          }
        });
      } else if (axiosError.response?.status === 400) {
        const errorData = axiosError.response?.data;
        
        // Check if this is a platform profile setup requirement
        if (errorData?.actionRequired ==='platform_profile_setup' && errorData?.setupUrl) {
          toast.error(errorData.error ||'Platform profile setup required', {
            duration: 10000,
            action: {
              label:'Complete Setup',
              onClick: () => window.open(errorData.setupUrl,'_blank')
            }
          });
        } else if (errorData?.isRetryable) {
          toast.error(errorData.error ||'Failed to create payment account. Please try again.');
        } else {
          toast.error(errorData?.error ||'Failed to connect to Stripe');
        }
      } else {
        const apiError = ErrorHandler.handleApiError(error, { 
          context:'generating Stripe Connect link',
          customMessages: {
            401:'Authentication required. Please log in again.',
            404:'Club not found. Please contact support@gathergrove.club.',
            503:'Payment service unavailable. Please contact support@gathergrove.club.'
          }
        });
        ErrorHandler.showErrorToast(apiError);
      }
      setIsConnecting(false);
    }
  };

  const handleDisconnectStripe = async () => {
    try {
      setIsDisconnecting(true);
      await stripeConnectService.disconnect();
      
      toast.success("Stripe account disconnected successfully");
      
      // Reload status
      await loadData();
    } catch (error) {
      logger.error('dues','Error disconnecting Stripe', { error, clubId: user?.clubId });
      const apiError = ErrorHandler.handleApiError(error, { context:'disconnecting Stripe account' });
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const openRecordPaymentModal = (member?: MemberResponse) => {
    setSelectedMember(member || null);
    setIsRecordPaymentModalOpen(true);
  };

  const closeRecordPaymentModal = () => {
    setSelectedMember(null);
    setIsRecordPaymentModalOpen(false);
  };

  const handlePaymentRecorded = () => {
    loadData(); // Refresh all data after payment is recorded
  };

  const openPaymentHistoryModal = (member: MemberResponse) => {
    setSelectedMember(member);
    setIsPaymentHistoryModalOpen(true);
  };

  const closePaymentHistoryModal = () => {
    setSelectedMember(null);
    setIsPaymentHistoryModalOpen(false);
  };

  const handlePaymentUpdated = () => {
    loadData(); // Refresh all data after payment is updated/deleted
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style:'currency',
      currency:'USD'
    }).format(amount);
  };

  const getDuesStatus = (member: MemberResponse) => {
    const now = new Date();
    const duesPaidUntil = member.duesPaidUntil ? new Date(member.duesPaidUntil) : null;
    
    if (!duesPaidUntil) {
      return { status:'Unpaid', color:'destructive' as const };
    }
    
    if (duesPaidUntil > now) {
      return { 
        status: `Paid until ${duesPaidUntil.toLocaleDateString()}`, 
        color:'default' as const 
      };
    }
    
    return { status:'Expired', color:'secondary' as const };
  };

  if (loading || membershipTypesLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <div className="text-muted-foreground">Loading dues information...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto glass border border-border/50 rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Dues & Payments
            </h1>
            <p className="text-muted-foreground mt-2">
              Track membership dues and manage payments
            </p>
          </div>
          <Button className="flex items-center gap-2 bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:opacity-95" onClick={() => openRecordPaymentModal()}>
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass border-border/50 hover:glass-strong hover:opacity-95 hover:shadow-xl transition-all duration-200 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors duration-200">Total Collected</CardTitle>
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-success/20 to-success/20   group-hover:shadow-lg transition-shadow duration-200">
                <DollarSign className="h-4 w-4 text-success group-hover:text-success/80 transition-colors duration-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalCollectedThisYear)}</div>
              <p className="text-xs text-muted-foreground">
                This year
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50 hover:glass-strong hover:opacity-95 hover:shadow-xl transition-all duration-200 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors duration-200">Paid Members</CardTitle>
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-success/20   group-hover:shadow-lg transition-shadow duration-200">
                <Users className="h-4 w-4 text-primary group-hover:text-success transition-colors duration-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.paidMembers}</div>
              <p className="text-xs text-muted-foreground">
                of {stats.totalMembers} members
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50 hover:glass-strong hover:opacity-95 hover:shadow-xl transition-all duration-200 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors duration-200">Outstanding</CardTitle>
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-warning/20 to-destructive/20   group-hover:shadow-lg transition-shadow duration-200">
                <TrendingUp className="h-4 w-4 text-warning group-hover:text-destructive transition-colors duration-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.outstandingDues)}</div>
              <p className="text-xs text-muted-foreground">
                Dues pending
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50 hover:glass-strong hover:opacity-95 hover:shadow-xl transition-all duration-200 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors duration-200">Collection Rate</CardTitle>
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/20   group-hover:shadow-lg transition-shadow duration-200">
                <TrendingUp className="h-4 w-4 text-primary group-hover:text-primary/80 transition-colors duration-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalMembers > 0 ? Math.round((stats.paidMembers / stats.totalMembers) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Paid members
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="glass border-border/50 shadow-lg hover:glass-strong transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-success/20">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <span>Online Payments</span>
              </CardTitle>
              <CardDescription>
                Accept credit card payments from members via Stripe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Stripe Integration</p>
                  {stripeStatus?.isConnected ? (
                    <Badge variant="default" className="bg-success/20 text-success-foreground">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not Connected</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {stripeStatus?.isConnected ? (
                    <>
                      <Button variant="outline" size="sm" onClick={handleConnectStripe} disabled={isConnecting}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Manage Account
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isDisconnecting}
                          >
                            {isDisconnecting ?'Disconnecting...' :'Disconnect'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Disconnect Stripe Account</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to disconnect your Stripe account? This will disable online payment collection.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDisconnectStripe}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Disconnect
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  ) : (
                    <Button variant="outline" onClick={handleConnectStripe} disabled={isConnecting}>
                      {isConnecting ?'Connecting...' :'Connect Stripe'}
                    </Button>
                  )}
                </div>
              </div>
              {stripeStatus?.isConnected && (
                <div className="mt-4 space-y-2">
                  <div className="p-3 bg-success/10  rounded-lg">
                    <p className="text-sm text-success-foreground">
                      ✓ Ready to accept online payments from members
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Manual Tracking
              </CardTitle>
              <CardDescription>
                Record cash and check payments manually
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Record Payments</p>
                  <Badge variant="default">Available</Badge>
                </div>
                <Button variant="outline" onClick={() => openRecordPaymentModal()}>
                  Record Payment
                </Button>
              </div>
              <div className="mt-4 p-3 bg-primary/10  rounded-lg">
                <p className="text-sm text-primary-foreground">
                  Track cash and check payments to keep dues up to date
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Members Dues Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Member Dues Status
            </CardTitle>
            <CardDescription>
              View current dues status for all members
            </CardDescription>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No members found. Add members to track their dues.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table - Hidden on mobile */}
                <div className="hidden lg:block">
                <div className="glass border border-border/50 rounded-lg overflow-hidden shadow-lg">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-muted/60 to-muted/40 backdrop-blur-md border-b border-border/50">
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="font-semibold text-foreground px-4 py-4">Member Name</TableHead>
                        <TableHead className="font-semibold text-foreground px-4 py-4">Membership Type</TableHead>
                        <TableHead className="font-semibold text-foreground px-4 py-4">Dues Amount</TableHead>
                        <TableHead className="font-semibold text-foreground px-4 py-4">Status</TableHead>
                        <TableHead className="text-right font-semibold text-foreground px-4 py-4">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {members
                      .filter((member) => {
                        // Filter out members with $0 membership types
                        const membershipType = Array.isArray(membershipTypes) ? 
                          membershipTypes.find(type => type.id === member.membershipTypeId) : 
                          undefined;
                        return membershipType && membershipType.duesAmount > 0;
                      })
                      .map((member) => {
                      const membershipType = Array.isArray(membershipTypes) ? 
                        membershipTypes.find(type => type.id === member.membershipTypeId) : 
                        undefined;
                      const duesStatus = getDuesStatus(member);
                      
                      return (
                        <TableRow key={member.id} className="hover:bg-primary/5 transition-all duration-200 border-border/30">
                          <TableCell className="font-medium px-4 py-3">{member.fullName}</TableCell>
                          <TableCell className="px-4 py-3">{membershipType?.name ||'Unknown'}</TableCell>
                          <TableCell className="px-4 py-3 font-medium">{formatCurrency(membershipType?.duesAmount || 0)}</TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge variant={duesStatus.color} className="glass-soft border-border/30 shadow-sm">
                              {duesStatus.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right px-4 py-3">
                            <div className="flex gap-2 justify-end">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => openPaymentHistoryModal(member)}
                                title="View payment history"
                                className="glass-soft border-border/50 hover:glass transition-all duration-200"
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                History
                              </Button>
                              {membershipType && membershipType.duesAmount > 0 && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => openRecordPaymentModal(member)}
                                  className="glass-soft border-border/50 hover:glass transition-all duration-200"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Record Payment
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Card Layout - Visible on mobile/tablet */}
              <div className="lg:hidden space-y-3">
                {members
                  .filter((member) => {
                    // Filter out members with $0 membership types
                    const membershipType = Array.isArray(membershipTypes) ? 
                      membershipTypes.find(type => type.id === member.membershipTypeId) : 
                      undefined;
                    return membershipType && membershipType.duesAmount > 0;
                  })
                  .map((member) => {
                  const membershipType = Array.isArray(membershipTypes) ? 
                    membershipTypes.find(type => type.id === member.membershipTypeId) : 
                    undefined;
                  const duesStatus = getDuesStatus(member);
                  
                  return (
                    <div key={member.id} className="p-4 rounded-lg border glass-soft hover:glass transition-all duration-200">
                      {/* Top row: Name and Amount */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-foreground">{member.fullName}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{membershipType?.name ||'Unknown'}</p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-xl font-bold text-foreground">{formatCurrency(membershipType?.duesAmount || 0)}</div>
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="mb-4">
                        <Badge variant={duesStatus.color} className="glass-soft border-border/30 shadow-sm">
                          {duesStatus.status}
                        </Badge>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => openPaymentHistoryModal(member)}
                          className="glass-soft border border-border/50 hover:glass transition-all duration-200 flex-1"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          History
                        </Button>
                        {membershipType && membershipType.duesAmount > 0 && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openRecordPaymentModal(member)}
                            className="glass-soft border-border/50 hover:glass hover:bg-primary/5 transition-all duration-200 flex-1"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Record Payment
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Record Payment Modal */}
        <RecordPaymentModal
          member={selectedMember}
          isOpen={isRecordPaymentModalOpen}
          onClose={closeRecordPaymentModal}
          onPaymentRecorded={handlePaymentRecorded}
          membershipTypes={membershipTypes}
          members={members}
        />

        {/* Payment History Modal */}
        <PaymentHistoryModal
          member={selectedMember}
          isOpen={isPaymentHistoryModalOpen}
          onClose={closePaymentHistoryModal}
          onPaymentUpdated={handlePaymentUpdated}
        />
      </div>
    </div>
  );
} 