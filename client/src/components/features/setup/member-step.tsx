"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorHandler } from '@/lib/errorHandler';
import memberService, { CreateMemberRequest } from '@/services/memberService';
import { logger } from '@/lib/logger';
import { MembershipTypeResponse } from '@/services/membershipTypeService';
import { useAuth } from '@/hooks/useAuth';

interface MemberStepProps {
  clubId: number;
  membershipType: MembershipTypeResponse;
  onComplete: () => void;
  onBack: () => void;
}

export function MemberStep({ clubId, membershipType, onComplete, onBack }: MemberStepProps) {
  const { completeOnboarding } = useAuth();
  const [formData, setFormData] = useState<CreateMemberRequest>({
    membershipTypeId: membershipType.id,
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    hasSmsConsent: false,
    customFieldValues: []
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error('Please enter the member\'s name');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Please enter the member\'s email');
      return;
    }

    setIsLoading(true);

    try {
      // Create the member
      await memberService.createMember(clubId, formData);

      // Complete onboarding
      await completeOnboarding();

      toast.success('Member added successfully! Onboarding complete.');
      onComplete();
    } catch (error: unknown) {
      logger.error('members', 'Failed to create member during onboarding', { error, clubId, formData });
      const apiError = ErrorHandler.handleMemberError(error, 'creating member');
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateMemberRequest, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center">
          <UserPlus className="w-8 h-8 text-secondary-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Add Your First Member</h2>
        <p className="text-muted-foreground">
          Add the first member to your <span className="font-medium">{membershipType.name}</span> membership type
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="Enter member's full name"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="member@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Input
                id="address"
                placeholder="123 Main St, City, State ZIP"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>

            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Membership Details:</p>
                <p>Type: {membershipType.name}</p>
                <p>Dues: ${membershipType.duesAmount} ({membershipType.duesFrequency})</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onBack}>
                Back
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Adding Member...' : 'Add Member & Complete Setup'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
