'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ValidationService } from '@/lib/validationService';
import { useFieldValidation } from '@/hooks/useFormValidation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';

interface InviteAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (email: string) => Promise<void>;
}

export function InviteAdminModal({ open, onOpenChange, onSubmit }: InviteAdminModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { validateFormAndShow } = useFieldValidation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use ValidationService for validation
    const validationResult = validateFormAndShow(
      { email }, 
      ValidationService.schemas.adminInvite
    );
    
    if (!validationResult.isValid) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(email.trim());
      setEmail(''); // Clear the form
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      if (!newOpen) {
        setEmail(''); // Clear form when closing
      }
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite New Administrator
          </DialogTitle>
          <DialogDescription>
            Send an invitation to someone to become an administrator of your club. 
            They&apos;ll receive an email with instructions to accept the invitation.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                data-testid="invite-email-input"
              />
              <p className="text-sm text-muted-foreground">
                The invitation will be valid for 72 hours.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              data-testid="send-invitation-button"
            >
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 