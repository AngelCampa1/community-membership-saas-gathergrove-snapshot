"use client";

import { useState, useEffect } from'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from"@/components/ui/dialog";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select";
import { Plus, Settings, ArrowRight } from"lucide-react";
import { useAuth } from'@/hooks/useAuth';
import memberService, { CreateMemberRequest } from'@/services/memberService';
import { MembershipTypeResponse } from'@/services/membershipTypeService';
import customFieldsService, { CustomField } from'@/services/customFieldsService';
import { CustomFieldInput } from'./CustomFieldInput';
import { logger } from'@/lib/logger';
import Link from'next/link';
import { ErrorHandler } from'@/lib/errorHandler';
import { useToast } from'@/hooks/useToast';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  membershipTypes: MembershipTypeResponse[];
  onMemberAdded: () => void;
}

export function AddMemberModal({ isOpen, onClose, membershipTypes, onMemberAdded }: AddMemberModalProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [formData, setFormData] = useState<CreateMemberRequest>({
    membershipTypeId: 0,
    fullName:'',
    email:'',
    phoneNumber:'',
    address:'',
    hasSmsConsent: false,
    customFieldValues: []
  });
  const toast = useToast();

  // Check if we have no membership types
  const hasNoMembershipTypes = membershipTypes.length === 0;

  // Fetch custom fields when modal opens
  useEffect(() => {
    if (isOpen && user?.clubId) {
      // Reset form when modal opens
      setFormData({
        membershipTypeId: 0,
        fullName:'',
        email:'',
        phoneNumber:'',
        address:'',
        hasSmsConsent: false,
        customFieldValues: []
      });

      // Fetch custom fields for this club
      const fetchCustomFields = async () => {
        try {
          const fields = await customFieldsService.getCustomFields(user.clubId);
          // Ensure fields is an array before calling map
          if (Array.isArray(fields)) {
            setCustomFields(fields);
            // Initialize custom field values with empty strings
            const initialCustomFieldValues = fields.map(field => ({
              customFieldId: field.id,
              fieldValue:''
            }));
            setFormData(prev => ({
              ...prev,
              customFieldValues: initialCustomFieldValues
            }));
          } else {
            // If fields is not an array, set empty array
            setCustomFields([]);
            setFormData(prev => ({
              ...prev,
              customFieldValues: []
            }));
          }
        } catch (error) {
          ErrorHandler.handleMemberError(error,'loading custom fields');
          logger.error('customFields','Error loading custom fields for add member modal', { error, clubId: user.clubId });
          setCustomFields([]);
          setFormData(prev => ({
            ...prev,
            customFieldValues: []
          }));
        }
      };

      fetchCustomFields();
    }
  }, [isOpen, user?.clubId]);

  const handleAdd = async () => {
    if (!user?.clubId) return;

    // Trim whitespace from all string inputs
    const trimmedData = {
      ...formData,
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phoneNumber: formData.phoneNumber?.trim(),
      address: formData.address?.trim(),
    };

    if (!trimmedData.fullName) {
      toast.error('Please enter the member\'s full name');
      return;
    }

    if (!trimmedData.email) {
      toast.error('Please enter the member\'s email address');
      return;
    }

    if (!formData.membershipTypeId) {
      toast.error('Please select a membership type');
      return;
    }

    // Validate required custom fields
    for (const field of customFields) {
      if (field.isRequired) {
        const customFieldValue = formData.customFieldValues.find(
          cfv => cfv.customFieldId === field.id
        );

        if (!customFieldValue?.fieldValue || !customFieldValue.fieldValue.trim()) {
          toast.error(`Please fill in the required field: ${field.fieldLabel}`);
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      // Use the trimmed data for the API call
      await memberService.createMember(user.clubId, trimmedData);
      toast.success('Member added successfully');
      onClose();
      onMemberAdded(); // Trigger refresh in parent component
    } catch (error: unknown) {
      const apiError = ErrorHandler.handleMemberError(error,'creating member');
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateMemberRequest, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomFieldChange = (customFieldId: number, value: string) => {
    // Store the value directly (empty strings are handled properly now)
    setFormData(prev => ({
      ...prev,
      customFieldValues: prev.customFieldValues.map(cfv =>
        cfv.customFieldId === customFieldId
          ? { ...cfv, fieldValue: value }
          : cfv
      )
    }));
  };

  const handleCancel = () => {
    setFormData({
      membershipTypeId: 0,
      fullName:'',
      email:'',
      phoneNumber:'',
      address:'',
      hasSmsConsent: false,
      customFieldValues: []
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(newOpen) => {
      if (!newOpen && !submitting) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[500px] glass border-border/50 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-emerald-500/20">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent line-clamp-2">Add New Member</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            {hasNoMembershipTypes
              ?"Before adding members, you need to create membership types to categorize them."
              :"Add a new member to your club by filling out their information below."
            }
          </DialogDescription>
        </DialogHeader>

        {hasNoMembershipTypes ? (
          // No membership types available - show message and action
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                <Settings className="h-6 w-6 text-warning" />
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-foreground">
                  No Membership Types Found
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  You need to create at least one membership type before adding members.
                  Membership types help you categorize members and set dues amounts.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/admin/members/types"
                onClick={() => onClose()}
                data-testid="link-create-membership-types"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                <Settings className="h-4 w-4" />
                Create Membership Types First
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Button
                variant="outline"
                onClick={handleCancel}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          // Normal form when membership types are available
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="text-sm font-medium">Full Name *</Label>
              <Input
                id="fullName"
                data-testid="input-fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter member's full name"
                className="glass-soft border-border/50 focus:glass transition-all duration-200 focus-ring"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
              <Input
                id="email"
                data-testid="input-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="member@example.com"
                className="glass-soft border-border/50 focus:glass transition-all duration-200 focus-ring"
              />
            </div>

            <div>
              <Label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number</Label>
              <Input
                id="phoneNumber"
                data-testid="input-phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                placeholder="(555) 123-4567"
                className="glass-soft border-border/50 focus:glass transition-all duration-200 focus-ring"
              />
            </div>

            <div>
              <Label htmlFor="address" className="text-sm font-medium">Address</Label>
              <Input
                id="address"
                data-testid="input-address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123 Main St, City, State ZIP"
                className="glass-soft border-border/50 focus:glass transition-all duration-200 focus-ring"
              />
            </div>

            <div>
              <Label htmlFor="membershipType" className="text-sm font-medium">Membership Type *</Label>
              <Select
                value={formData.membershipTypeId.toString()}
                onValueChange={(value: string) => handleInputChange('membershipTypeId', parseInt(value))}
              >
                <SelectTrigger id="membershipType" data-testid="select-membershipType" className="glass-soft border-border/50 focus:glass transition-all duration-200">
                  <SelectValue placeholder="Select membership type" />
                </SelectTrigger>
                <SelectContent>
                  {membershipTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name} - ${type.duesAmount}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Fields Section (Story 35) */}
            {customFields.length > 0 && (
              <div className="space-y-4">
                <div className="border-t border-border/50 pt-4 glass-soft rounded-lg p-4">
                  <h3 className="text-sm font-medium text-foreground mb-3 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    Custom Fields
                  </h3>
                  <div className="space-y-3">
                    {customFields.map((field) => (
                      <div key={field.id}>
                        <Label htmlFor={`custom-field-${field.id}`}>
                          {field.fieldLabel} {field.isRequired &&'*'}
                        </Label>
                        <CustomFieldInput
                          field={field}
                          value={
                            formData.customFieldValues.find(
                              cfv => cfv.customFieldId === field.id
                            )?.fieldValue || (field.fieldType ==='select' ?'__none__' :'')
                          }
                          onChange={(value) => handleCustomFieldChange(field.id, value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
              <Button variant="outline" onClick={handleCancel} data-testid="button-cancel" className="glass-soft border-border/50 hover:glass transition-all duration-200">
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={submitting}
                data-testid="button-save"
                className="bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                {submitting ?'Adding Member...' :'Save Member'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
