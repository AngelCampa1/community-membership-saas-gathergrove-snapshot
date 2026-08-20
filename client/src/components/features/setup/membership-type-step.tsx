"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorHandler } from '@/lib/errorHandler';
import membershipTypeService, { CreateMembershipTypeRequest, MembershipTypeResponse } from '@/services/membershipTypeService';
import { logger } from '@/lib/logger';
import { DUES_FREQUENCY_OPTIONS } from '@/constants/duesFrequency';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MembershipTypeStepProps {
  clubId: number;
  onNext: (membershipType: MembershipTypeResponse) => void;
  onBack: () => void;
}

export function MembershipTypeStep({ clubId, onNext, onBack }: MembershipTypeStepProps) {
  const [formData, setFormData] = useState<CreateMembershipTypeRequest>({
    name: '',
    description: '',
    duesAmount: 0,
    duesFrequency: 'Monthly'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a membership type name');
      return;
    }

    if (formData.duesAmount < 0) {
      toast.error('Dues amount cannot be negative');
      return;
    }

    setIsLoading(true);
    
    try {
      const membershipType = await membershipTypeService.createMembershipType(clubId, formData);
      toast.success('Membership type created successfully!');
      onNext(membershipType);
    } catch (error: unknown) {
      logger.error('members', 'Failed to create membership type during onboarding', { error, clubId, formData });
      const apiError = ErrorHandler.handleMemberError(error, 'creating membership type');
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateMembershipTypeRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Users className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Create Your First Membership Type</h2>
        <p className="text-muted-foreground">
          Define the different types of memberships for your club (e.g., Individual, Family, Student)
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Membership Type Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Individual, Family, Student"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Brief description of this membership type"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duesAmount">Dues Amount ($)</Label>
                <Input
                  id="duesAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.duesAmount || ''}
                  onChange={(e) => handleInputChange('duesAmount', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duesFrequency">Dues Frequency</Label>
                <Select
                  value={formData.duesFrequency}
                  onValueChange={(value) => handleInputChange('duesFrequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {DUES_FREQUENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          {option.description && (
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onBack}>
                Back
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Creating...' : 'Create Membership Type'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 