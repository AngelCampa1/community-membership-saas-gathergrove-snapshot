"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  Building,
  CreditCard,
  Trash2,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  accountDeletionService,
  type AccountDeletionRequest,
  type AccountDeletionValidationResponse,
  type AdminTransferTarget,
} from "@/services/accountDeletionService";
import { logger } from "@/lib/logger";

interface AdminAccountDeletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountDeleted?: () => void;
}

type Step = 'validation' | 'clubManagement' | 'confirmation' | 'processing';

interface ClubTransferInstruction {
  clubId: number;
  clubName: string;
  action: 'transfer' | 'delete';
  targetUserId?: number;
  memberCount: number;
  eventCount: number;
  hasActiveSubscription: boolean;
}

export function AdminAccountDeletionDialog({ open, onOpenChange, onAccountDeleted }: AdminAccountDeletionDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('validation');
  const [validation, setValidation] = useState<AccountDeletionValidationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [confirmDataExport, setConfirmDataExport] = useState(false);
  const [confirmUnderstanding, setConfirmUnderstanding] = useState(false);
  const [confirmClubDeletion, setConfirmClubDeletion] = useState(false);
  const [confirmationPhrase, setConfirmationPhrase] = useState('');

  // Club management states
  const [clubTransfers, setClubTransfers] = useState<ClubTransferInstruction[]>([]);
  const [availableTransferTargets, setAvailableTransferTargets] = useState<AdminTransferTarget[]>([]);

  // Processing states
  const [deletionId, setDeletionId] = useState<string | null>(null);
  const [dataExportId, setDataExportId] = useState<string | null>(null);

  useEffect(() => {
    if (open && step === 'validation') {
      validateAccountDeletion();
    }
  }, [open, step]);

  const validateAccountDeletion = async () => {
    setIsLoading(true);
    try {
      const validationData = await accountDeletionService.validateAccountDeletion();
      setValidation(validationData);

      // Initialize club transfer instructions
      if (validationData.isAdminAccount) {
        const transfers: ClubTransferInstruction[] = [];

        // Add clubs to be deleted (where user is only admin)
        validationData.adminInfo.clubsToBeDeleted.forEach(club => {
          transfers.push({
            clubId: club.clubId,
            clubName: club.clubName,
            action: 'delete',
            memberCount: club.memberCount,
            eventCount: club.eventCount,
            hasActiveSubscription: club.hasActiveSubscription
          });
        });

        // Add clubs to transfer (where user is one of multiple admins)
        validationData.adminInfo.clubsToTransfer.forEach(club => {
          transfers.push({
            clubId: club.clubId,
            clubName: club.clubName,
            action: 'transfer',
            memberCount: 0, // Not relevant for transfer
            eventCount: 0,
            hasActiveSubscription: false
          });
        });

        setClubTransfers(transfers);

        // Load transfer targets
        try {
          const targets = await accountDeletionService.getAdminTransferTargets();
          setAvailableTransferTargets(targets);
        } catch (error) {
          logger.error('admins', 'Failed to load admin transfer targets', { error });
        }
      }
    } catch (error) {
      logger.error('admins', 'Failed to validate admin account deletion', { error });
      toast.error('Unable to validate account deletion at this time');
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClubTransferChange = (clubId: number, field: 'targetUserId' | 'action', value: 'transfer' | 'delete' | number) => {
    setClubTransfers(prev => prev.map(transfer =>
      transfer.clubId === clubId
        ? { ...transfer, [field]: value }
        : transfer
    ));
  };

  const validateClubTransfers = (): boolean => {
    const errors: string[] = [];

    clubTransfers.forEach(transfer => {
      if (transfer.action === 'transfer' && !transfer.targetUserId) {
        errors.push(`Please select a transfer target for ${transfer.clubName}`);
      }
    });

    if (errors.length > 0) {
      toast.error(errors.join('\n'));
      return false;
    }

    return true;
  };

  const handleInitiateDeletion = async () => {
    if (!confirmDataExport || !confirmUnderstanding || !confirmClubDeletion || confirmationPhrase !== 'DELETE MY ACCOUNT' || !reason.trim()) {
      toast.error('Please complete all required fields');
      return;
    }

    if (!validateClubTransfers()) {
      return;
    }

    setIsLoading(true);
    try {
      const request: AccountDeletionRequest = {
        reason: reason.trim(),
        confirmationPhrase,
        passwordConfirmation: password || undefined,
        requestDataExport: confirmDataExport,
        deleteOrphanedClubs: true,
        clubTransferInstructions: clubTransfers.map(t => ({
          clubId: t.clubId,
          transferToUserId: t.action === 'transfer' ? t.targetUserId : null,
          deleteClub: t.action === 'delete',
          notes: t.action === 'delete' ? 'Only admin - deleting entire club' : 'Admin deletion transfer',
        })),
      };

      const result = await accountDeletionService.initiateAccountDeletion(request);

      setDeletionId(result.deletionRequestId);
      if (result.dataExportId) {
        setDataExportId(result.dataExportId);
      }
      setStep('processing');
      toast.success('Admin account deletion request submitted');
      onAccountDeleted?.();
    } catch (error) {
      logger.error('admins', 'Failed to initiate admin account deletion', { error, reason });
      toast.error('Failed to initiate account deletion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadExport = async () => {
    if (!dataExportId) return;

    try {
      const blob = await accountDeletionService.downloadDataExport(dataExportId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `gathergrove-data-export-${dataExportId}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('admins', 'Failed to download admin data export', { error, dataExportId });
      toast.error('Failed to download data export');
    }
  };

  const handleCancelDeletion = async () => {
    if (!deletionId) return;

    setIsLoading(true);
    try {
      await accountDeletionService.cancelAccountDeletion(deletionId);
      toast.success('Account deletion cancelled');
      onOpenChange(false);
    } catch (error) {
      logger.error('admins', 'Failed to cancel admin account deletion', { error, deletionId });
      toast.error('Failed to cancel account deletion');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('validation');
    setPassword('');
    setReason('');
    setConfirmDataExport(false);
    setConfirmUnderstanding(false);
    setConfirmClubDeletion(false);
    setConfirmationPhrase('');
    setDeletionId(null);
    setDataExportId(null);
    setValidation(null);
    setClubTransfers([]);
    setAvailableTransferTargets([]);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  if (!validation && step === 'validation') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {step === 'validation' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                Admin Account Deletion
              </DialogTitle>
              <DialogDescription>
                As an administrator, your account deletion requires additional steps to ensure club continuity.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {!validation?.canDelete && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Account deletion is currently restricted</p>
                      {validation && validation.validationErrors.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {validation.validationErrors.map((error, index) => (
                            <li key={`validation-error-${index}-${error.substring(0, 30)}`}>{error}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {validation?.isAdminAccount && (
                <>
                  {/* Admin Impact Summary */}
                  <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-lg">
                    <h4 className="font-medium text-destructive mb-4 flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Club Management Impact
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Badge variant="destructive" className="mb-2">
                          {validation.adminInfo.primaryClubsCount} Primary Clubs
                        </Badge>
                        <p className="text-sm text-destructive/80">
                          Where you are the primary administrator
                        </p>
                      </div>
                      <div>
                        <Badge variant="destructive" className="mb-2">
                          {validation.adminInfo.secondaryClubsCount} Secondary Clubs
                        </Badge>
                        <p className="text-sm text-destructive/80">
                          Where you are a secondary administrator
                        </p>
                      </div>
                    </div>

                    {validation.adminInfo.hasActiveBilling && (
                      <Alert className="mt-4">
                        <CreditCard className="h-4 w-4" />
                        <AlertDescription>
                          Active subscriptions or billing found. These will be cancelled during deletion.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="mt-4 p-3 bg-card rounded border border-destructive/20">
                      <p className="text-sm font-medium text-destructive mb-2">Extended Grace Period:</p>
                      <p className="text-sm text-destructive/80">
                        Admin accounts have a {validation.adminInfo.extendedGracePeriodDays}-day grace period
                        before deletion becomes permanent.
                      </p>
                    </div>
                  </div>

                  {/* Club Management Required */}
                  <Alert>
                    <Users className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">Club Management Required</p>
                        <p className="text-sm">
                          You must specify what happens to each club where you are an administrator.
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={() => setStep('clubManagement')}
                    className="w-full"
                    disabled={!validation.canDelete}
                  >
                    Manage Club Ownership
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </>
              )}
            </div>
          </>
        )}

        {step === 'clubManagement' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Building className="h-6 w-6" />
                Club Ownership Management
              </DialogTitle>
              <DialogDescription>
                Specify what should happen to each club where you are an administrator.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-4">
                {clubTransfers.map((transfer) => (
                  <div key={transfer.clubId} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{transfer.clubName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {transfer.action === 'delete' ?
                            `Only admin • ${transfer.memberCount} members, ${transfer.eventCount} events` :
                            'One of multiple admins'
                          }
                        </p>
                      </div>
                      {transfer.hasActiveSubscription && (
                        <Badge variant="destructive">Active Subscription</Badge>
                      )}
                    </div>

                    <div>
                      <Label>Action Required</Label>
                      <Select
                        value={transfer.action}
                        onValueChange={(value: 'transfer' | 'delete') =>
                          handleClubTransferChange(transfer.clubId, 'action', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transfer">Transfer Ownership</SelectItem>
                          {transfer.memberCount > 0 && (
                            <SelectItem value="delete">Delete Entire Club</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {transfer.action === 'transfer' && (
                      <div>
                        <Label>Transfer To</Label>
                        <Select
                          value={transfer.targetUserId?.toString() || ''}
                          onValueChange={(value) =>
                            handleClubTransferChange(transfer.clubId, 'targetUserId', parseInt(value))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select admin to transfer ownership" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTransferTargets
                              .filter(target => target.userId !== user?.userId)
                              .map(target => (
                                <SelectItem key={target.userId} value={target.userId.toString()}>
                                  {target.fullName} ({target.email})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {transfer.action === 'delete' && (
                      <Alert variant="destructive">
                        <Trash2 className="h-4 w-4" />
                        <AlertDescription>
                          This will permanently delete the entire club and all associated data.
                          This action cannot be undone.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setStep('validation')}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep('confirmation')}
                  disabled={!validateClubTransfers()}
                >
                  Continue to Deletion
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'confirmation' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                Final Confirmation
              </DialogTitle>
              <DialogDescription>
                This is the final step before your admin account deletion is scheduled. A data export
                is created automatically as part of this request.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Critical Warning:</strong> Once the grace period ends, this action is
                  permanent and cannot be undone. All admin privileges and access will be removed.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="password">Password Confirmation</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password to confirm"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="reason">Reason for deletion (optional)</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please help us understand why you're leaving..."
                    className="mt-1"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="confirmDataExport"
                      checked={confirmDataExport}
                      onCheckedChange={(checked) => setConfirmDataExport(checked === true)}
                    />
                    <div>
                      <Label htmlFor="confirmDataExport" className="text-base font-medium">
                        I understand a data export will be generated for me
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I will be able to download my admin and club data once the request is submitted
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="confirmClubDeletion"
                      checked={confirmClubDeletion}
                      onCheckedChange={(checked) => setConfirmClubDeletion(checked === true)}
                    />
                    <div>
                      <Label htmlFor="confirmClubDeletion" className="text-base font-medium">
                        I understand the impact on clubs I manage
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I understand the consequences for club ownership and management
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="confirmUnderstanding"
                      checked={confirmUnderstanding}
                      onCheckedChange={(checked) => setConfirmUnderstanding(checked === true)}
                    />
                    <div>
                      <Label htmlFor="confirmUnderstanding" className="text-base font-medium">
                        I understand this action is permanent
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I understand that admin account deletion cannot be undone after the grace period
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmationPhrase">
                    Type DELETE MY ACCOUNT to confirm
                  </Label>
                  <Input
                    id="confirmationPhrase"
                    value={confirmationPhrase}
                    onChange={(e) => setConfirmationPhrase(e.target.value)}
                    placeholder="DELETE MY ACCOUNT"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setStep('clubManagement')}>
                  Back
                </Button>
                <Button
                  onClick={handleInitiateDeletion}
                  disabled={isLoading || !confirmDataExport || !confirmClubDeletion || !confirmUnderstanding || confirmationPhrase !== 'DELETE MY ACCOUNT' || !reason.trim()}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Delete My Admin Account'
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'processing' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Clock className="h-6 w-6" />
                Admin Account Deletion Scheduled
              </DialogTitle>
              <DialogDescription>
                Your admin account deletion request has been submitted and is scheduled to process
                after the grace period. You can cancel it at any time before then.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  Your admin account is scheduled for deletion. You will receive a confirmation email
                  with the exact deletion date and instructions to cancel if you change your mind.
                  <br /><br />
                  <strong>Extended Grace Period:</strong> {validation?.adminInfo.extendedGracePeriodDays} days
                </AlertDescription>
              </Alert>

              {dataExportId && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Your data export is ready</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDownloadExport}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={handleCancelDeletion}
                  variant="outline"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Cancel Deletion'
                  )}
                </Button>
                <Button
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Done
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
