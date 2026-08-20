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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  Download,
  Calendar,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { accountDeletionService, type AccountDeletionValidationResponse } from "@/services/accountDeletionService";
import { logger } from "@/lib/logger";

interface AccountDeletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountDeleted?: () => void;
}

export function AccountDeletionDialog({ open, onOpenChange, onAccountDeleted }: AccountDeletionDialogProps) {
  const [step, setStep] = useState<'validation' | 'confirmation' | 'processing'>('validation');
  const [validation, setValidation] = useState<AccountDeletionValidationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [confirmDataExport, setConfirmDataExport] = useState(false);
  const [confirmUnderstanding, setConfirmUnderstanding] = useState(false);
  const [confirmationPhrase, setConfirmationPhrase] = useState('');

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
    } catch (error) {
      logger.error('members', 'Failed to validate user account deletion', { error });
      toast.error('Unable to validate account deletion at this time');
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitiateDeletion = async () => {
    if (!confirmDataExport || !confirmUnderstanding || confirmationPhrase !== 'DELETE MY ACCOUNT' || !reason.trim()) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await accountDeletionService.initiateAccountDeletion({
        reason: reason.trim(),
        confirmationPhrase,
        passwordConfirmation: password || undefined,
        requestDataExport: confirmDataExport,
      });

      setDeletionId(result.deletionRequestId);
      if (result.dataExportId) {
        setDataExportId(result.dataExportId);
      }
      setStep('processing');
      toast.success('Account deletion request submitted');
      onAccountDeleted?.();
    } catch (error) {
      logger.error('members', 'Failed to initiate user account deletion', { error, reason });
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
      logger.error('members', 'Failed to download user data export', { error, dataExportId });
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
      logger.error('members', 'Failed to cancel user account deletion', { error, deletionId });
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
    setConfirmationPhrase('');
    setDeletionId(null);
    setDataExportId(null);
    setValidation(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  if (!validation && step === 'validation') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        {step === 'validation' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                Account Deletion
              </DialogTitle>
              <DialogDescription>
                Before proceeding with account deletion, please review the following important information.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Validation Errors / Restrictions */}
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

              {/* Required Actions */}
              {validation && validation.requiredActions.length > 0 && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Required actions before deletion:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {validation.requiredActions.map((action, index) => (
                          <li key={`required-action-${index}-${action.substring(0, 30)}`}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Impact Summary */}
              {validation && (
                <div className="bg-primary/10 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <div className="space-y-2">
                      <h4 className="font-medium text-primary">What deletion affects</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-primary/90">
                        <li>{validation.impactSummary.clubsToDelete} club(s) will be deleted</li>
                        <li>{validation.impactSummary.clubsToTransfer} club(s) require ownership transfer</li>
                        <li>{validation.impactSummary.memberRecordsToAnonymize} member record(s) will be anonymized</li>
                        <li>{validation.impactSummary.eventsAffected} event(s) affected</li>
                        <li>{validation.impactSummary.paymentRecordsAffected} payment record(s) affected</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {validation?.canDelete ? (
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setStep('confirmation')}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Continue to Deletion
                  </Button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <Button variant="outline" onClick={handleClose}>
                    Close
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {step === 'confirmation' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                Confirm Account Deletion
              </DialogTitle>
              <DialogDescription>
                Your account will be scheduled for deletion after a grace period. A data export is
                created automatically as part of this request.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> Once the grace period ends, this action is permanent and
                  cannot be undone. You can cancel the request at any time during the grace period.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="reason">Reason for deletion</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please help us understand why you're leaving..."
                    className="mt-1"
                  />
                </div>

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
                      I will be able to download my data once the request is submitted
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
                      I understand that account deletion cannot be undone after the grace period
                    </p>
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
                <Button variant="outline" onClick={() => setStep('validation')}>
                  Back
                </Button>
                <Button
                  onClick={handleInitiateDeletion}
                  disabled={isLoading || !confirmDataExport || !confirmUnderstanding || confirmationPhrase !== 'DELETE MY ACCOUNT' || !reason.trim()}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Delete My Account'
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
                Account Deletion Scheduled
              </DialogTitle>
              <DialogDescription>
                Your account deletion request has been submitted and is scheduled to process after the
                grace period. You can cancel it at any time before then.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  Your account is scheduled for deletion. You will receive a confirmation email with
                  the exact deletion date and instructions to cancel if you change your mind.
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
