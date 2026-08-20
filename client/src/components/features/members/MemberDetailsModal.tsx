"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Save, X, User, Mail, Phone, MapPin, Calendar, Shield, DollarSign, Plus } from "lucide-react";
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import memberService, { MemberResponse, UpdateMemberRequest } from '@/services/memberService';
import { MembershipTypeResponse } from '@/services/membershipTypeService';
import { RecordPaymentModal } from './RecordPaymentModal';
import { logger } from '@/lib/logger';
import customFieldsService, { CustomField } from '@/services/customFieldsService';
import { CustomFieldInput, formatCustomFieldValue } from './CustomFieldInput';
import { ErrorHandler } from '@/lib/errorHandler';

interface MemberDetailsModalProps {
  member: MemberResponse | null;
  isOpen: boolean;
  onClose: () => void;
  membershipTypes: MembershipTypeResponse[];
  onMemberUpdated: () => void;
}

export function MemberDetailsModal({
  member,
  isOpen,
  onClose,
  membershipTypes,
  onMemberUpdated
}: MemberDetailsModalProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [formData, setFormData] = useState<UpdateMemberRequest>({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    membershipTypeId: 0,
    hasSmsConsent: false,
    customFieldValues: []
  });

  // Reset state when member changes or modal opens/closes
  useEffect(() => {
    if (member && isOpen && user?.clubId) {
      // Set basic form data immediately - don't wait for custom fields
      setFormData({
        fullName: member.fullName,
        email: member.email,
        phoneNumber: member.phoneNumber || '',
        address: member.address || '',
        membershipTypeId: member.membershipTypeId,
        hasSmsConsent: member.hasSmsConsent,
        customFieldValues: []
      });

      // Fetch custom fields for this club and update form data with custom field values
      const fetchCustomFields = async () => {
        try {
          const fields = await customFieldsService.getCustomFields(user.clubId);
          // Ensure fields is an array before calling map
          if (Array.isArray(fields)) {
            setCustomFields(fields);

            // Initialize custom field values - create entry for each field
            const customFieldValues = fields.map(field => {
              // Check if member already has a value for this field
              const existingValue = member.customFieldValues?.find(cfv => cfv.customFieldId === field.id);
              return {
                customFieldId: field.id,
                fieldValue: existingValue?.fieldValue || ''
              };
            });

            // Update form data with custom field values
            setFormData(prev => ({
              ...prev,
              customFieldValues
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
          logger.error('customFields', 'Failed to fetch custom fields for member details', { error, clubId: user.clubId, memberId: member.id });
          setCustomFields([]);
          // Keep the existing form data, just ensure customFieldValues is empty
          setFormData(prev => ({
            ...prev,
            customFieldValues: []
          }));
        }
      };

      setIsEditing(false);
      setShowPaymentModal(false); // Reset payment modal state
      fetchCustomFields();
    }
  }, [member, isOpen, user?.clubId]);

  const handleInputChange = (field: keyof UpdateMemberRequest, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!member || !user?.clubId) return;

    try {
      setSubmitting(true);
      await memberService.updateMember(user.clubId, member.id, formData);
      toast.success('Member updated successfully');
      setIsEditing(false);
      onMemberUpdated(); // Refresh the member list
    } catch (error: unknown) {
      const apiError = ErrorHandler.handleMemberError(error, 'updating member');
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (member) {
      // Reset form data to original member data with proper custom field initialization
      const customFieldValues = Array.isArray(customFields) ? customFields.map(field => {
        const existingValue = member.customFieldValues?.find(cfv => cfv.customFieldId === field.id);
        return {
          customFieldId: field.id,
          fieldValue: existingValue?.fieldValue || ''
        };
      }) : [];

      setFormData({
        fullName: member.fullName,
        email: member.email,
        phoneNumber: member.phoneNumber || '',
        address: member.address || '',
        membershipTypeId: member.membershipTypeId,
        hasSmsConsent: member.hasSmsConsent,
        customFieldValues
      });
    }
    setIsEditing(false);
  };

  const handleCustomFieldChange = (customFieldId: number, value: string) => {
    // Store the value directly (empty strings are handled properly now)
    const fieldValue = value;

    setFormData(prev => ({
      ...prev,
      customFieldValues: prev.customFieldValues.map(cfv =>
        cfv.customFieldId === customFieldId
          ? { ...cfv, fieldValue }
          : cfv
      )
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDuesStatus = () => {
    if (!member?.duesPaidUntil) {
      // Check for partial payments
      if (member?.hasPartialPayments && member?.outstandingBalance) {
        return {
          status: `Partial Payment: $${member.totalPaidCurrentPeriod.toFixed(2)} paid, $${member.outstandingBalance.toFixed(2)} remaining`,
          isPaid: false
        };
      }
      return { status: 'Unpaid', isPaid: false };
    }

    const paidUntilDate = new Date(member.duesPaidUntil);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

    if (paidUntilDate >= today) {
      return { status: `Paid until: ${formatDate(member.duesPaidUntil)}`, isPaid: true };
    } else {
      return { status: 'Expired', isPaid: false };
    }
  };

  const handlePaymentRecorded = () => {
    onMemberUpdated(); // Refresh the member data to show updated dues status
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto glass-strong border-border/50 backdrop-blur-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {isEditing ? 'Edit Member Details' : 'Member Details'}
            </span>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 mr-8"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update member information and manage their account details.'
              : 'View member information, dues status, and account details.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isEditing ? (
            <>
              {/* Edit Mode - Form Fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-fullName">Full Name *</Label>
                  <Input
                    id="edit-fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter member's full name"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-email">Email Address *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="member@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-phoneNumber">Phone Number</Label>
                  <Input
                    id="edit-phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-address">Address</Label>
                  <Input
                    id="edit-address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Main St, City, State ZIP"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-membershipType">Membership Type *</Label>
                  <Select
                    value={formData.membershipTypeId.toString()}
                    onValueChange={(value: string) => handleInputChange('membershipTypeId', parseInt(value))}
                  >
                    <SelectTrigger>
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
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-medium text-foreground mb-3">
                        Custom Fields
                      </h3>
                      <div className="space-y-3">
                        {customFields.map((field) => (
                          <div key={field.id}>
                            <Label htmlFor={`edit-custom-field-${field.id}`}>
                              {field.fieldLabel}
                            </Label>
                            <CustomFieldInput
                              field={field}
                              value={
                                formData.customFieldValues.find(
                                  cfv => cfv.customFieldId === field.id
                                )?.fieldValue || ''
                              }
                              onChange={(value) => handleCustomFieldChange(field.id, value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Edit Mode - Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!formData.fullName || !formData.email || !formData.membershipTypeId || submitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {submitting ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* View Mode - Display Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      Full Name
                    </div>
                    <div className="font-medium">{member.fullName}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </div>
                    <div className="font-medium">{member.email}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </div>
                    <div className="font-medium">{member.phoneNumber || '—'}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      Address
                    </div>
                    <div className="font-medium">{member.address || '—'}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      Membership Type
                    </div>
                    <div className="font-medium">{member.membershipTypeName}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Join Date
                    </div>
                    <div className="font-medium">{formatDate(member.joinDate)}</div>
                  </div>
                </div>

                {/* Custom Fields Section (Story 35) */}
                {member.customFieldValues && member.customFieldValues.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-foreground mb-3">
                      Custom Fields
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {member.customFieldValues.map((customFieldValue) => {
                        const field = customFields.find(f => f.id === customFieldValue.customFieldId);
                        return (
                          <div key={customFieldValue.id} className="space-y-2">
                            <div className="text-sm text-muted-foreground">
                              {customFieldValue.fieldLabel}
                            </div>
                            <div className="font-medium">
                              {field ? formatCustomFieldValue(field, customFieldValue.fieldValue || '') : (customFieldValue.fieldValue || '—')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Dues Status Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        Dues Status
                      </div>
                      <div className="font-medium">
                        {getDuesStatus().status}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPaymentModal(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Record Payment
                    </Button>
                  </div>
                </div>

                {/* Member Status Information */}
                <div className="border-t pt-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full text-sm bg-success/10 text-success border border-success/20">
                      {member.status}
                    </span>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="text-sm text-muted-foreground space-y-1 border-t pt-4">
                  <div>Created: {formatDate(member.createdAt)}</div>
                  <div>Last Updated: {formatDate(member.updatedAt)}</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Record Payment Modal */}
        <RecordPaymentModal
          member={member}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentRecorded={handlePaymentRecorded}
          membershipTypes={membershipTypes}
        />
      </DialogContent>
    </Dialog>
  );
}
