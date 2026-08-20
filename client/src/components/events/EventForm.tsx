"use client";

import { useState, useEffect } from"react";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import { Textarea } from"@/components/ui/textarea";
import { Checkbox } from"@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from"@/components/ui/dialog";
import { Calendar, Clock, MapPin, FileText, Mail, Bell, Users, DollarSign } from"lucide-react";
import { CreateEventRequest, UpdateEventRequest, EventResponse } from"@/types/event";
import { useClubTier } from"@/hooks/useClubTier";
import { logger } from"@/lib/logger";

interface EventFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (eventData: CreateEventRequest | UpdateEventRequest) => Promise<void>;
  event?: EventResponse;
  isEditing?: boolean;
  isLoading?: boolean;
}

export function EventForm({ 
  open, 
  onClose, 
  onSubmit, 
  event, 
  isEditing = false, 
  isLoading = false 
}: EventFormProps) {
  const { canSendInvitations } = useClubTier() || { canSendInvitations: false };
  const [formData, setFormData] = useState<CreateEventRequest>({
    name:"",
    eventDateTime:"",
    location:"",
    description:"",
    sendInvitations: false,
    invitationMethods: [],
    memberPrice: null,
    nonMemberPrice: null,
    isFree: false,
  });

  // Separate state for date and time inputs for better UX
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when the event prop changes or dialog opens
  useEffect(() => {
    if (open && event && isEditing) {
      // Pre-populate form with existing event data for editing
      const { date, time } = splitDateTimeForInputs(event.eventDateTime);
      setFormData({
        name: event.name ||"",
        eventDateTime: event.eventDateTime ? formatDateTimeForInput(event.eventDateTime) :"",
        location: event.location ||"",
        description: event.description ||"",
        sendInvitations: false, // Default to false for existing events
        invitationMethods: [],
        memberPrice: event.memberPrice || null,
        nonMemberPrice: event.nonMemberPrice || null,
        isFree: event.isFree || false,
      });
      setDateValue(date);
      setTimeValue(time);
    } else if (open && !event) {
      // Clear form for creating new event
      setFormData({
        name:"",
        eventDateTime:"",
        location:"",
        description:"",
        sendInvitations: false,
        invitationMethods: [],
        memberPrice: null,
        nonMemberPrice: null,
        isFree: false,
      });
      setDateValue("");
      setTimeValue("");
    }
    
    // Clear errors when dialog opens
    if (open) {
      setErrors({});
    }
  }, [open, event, isEditing]);

  // Split datetime string into separate date and time values for inputs
  function splitDateTimeForInputs(dateTimeString: string): { date: string; time: string } {
    if (!dateTimeString) return { date:"", time:"" };
    
    // Parse as local time to preserve user's intended time zone
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2,'0');
    const day = String(date.getDate()).padStart(2,'0');
    const hours = String(date.getHours()).padStart(2,'0');
    const minutes = String(date.getMinutes()).padStart(2,'0');
    
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`
    };
  }

  // Format datetime string for HTML input (YYYY-MM-DDTHH:MM)
  function formatDateTimeForInput(dateTimeString: string): string {
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2,'0');
    const day = String(date.getDate()).padStart(2,'0');
    const hours = String(date.getHours()).padStart(2,'0');
    const minutes = String(date.getMinutes()).padStart(2,'0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Combine date and time inputs into datetime string
  function combineDateTimeInputs(date: string, time: string): string {
    if (!date || !time) return"";
    return `${date}T${time}`;
  }

  // Convert from HTML input format to ISO string (preserving local time)
  function formatDateTimeForSubmit(inputValue: string): string {
    // Parse the datetime-local format and create local date
    // Input format:"2030-12-25T15:30"
    if (!inputValue) return"";
    
    // Split the input to get date and time parts
    const [datePart, timePart] = inputValue.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    
    // Create date as local time to preserve user's intended time
    const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return localDate.toISOString();
  }

  const handleInputChange = (field: keyof CreateEventRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]:"" }));
    }
  };

  const handleDateChange = (value: string) => {
    setDateValue(value);
    const combinedDateTime = combineDateTimeInputs(value, timeValue);
    setFormData(prev => ({ ...prev, eventDateTime: combinedDateTime }));

    // Real-time validation for past dates
    if (value && timeValue) {
      const [year, month, day] = value.split('-').map(Number);
      const [hours, minutes] = timeValue.split(':').map(Number);
      const eventDate = new Date(year, month - 1, day, hours, minutes);
      const now = new Date();

      if (eventDate <= now) {
        setErrors(prev => ({ ...prev, eventDateTime:"Event must be in the future" }));
      } else if (errors.eventDateTime) {
        setErrors(prev => ({ ...prev, eventDateTime:"" }));
      }
    } else if (errors.eventDateTime) {
      setErrors(prev => ({ ...prev, eventDateTime:"" }));
    }
  };

  const handleTimeChange = (value: string) => {
    setTimeValue(value);
    const combinedDateTime = combineDateTimeInputs(dateValue, value);
    setFormData(prev => ({ ...prev, eventDateTime: combinedDateTime }));

    // Real-time validation for past times
    if (dateValue && value) {
      const [year, month, day] = dateValue.split('-').map(Number);
      const [hours, minutes] = value.split(':').map(Number);
      const eventDate = new Date(year, month - 1, day, hours, minutes);
      const now = new Date();

      if (eventDate <= now) {
        setErrors(prev => ({ ...prev, eventDateTime:"Event must be in the future" }));
      } else if (errors.eventDateTime) {
        setErrors(prev => ({ ...prev, eventDateTime:"" }));
      }
    } else if (errors.eventDateTime) {
      setErrors(prev => ({ ...prev, eventDateTime:"" }));
    }
  };

  const handleSendInvitationsChange = (checked: boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      sendInvitations: checked,
      invitationMethods: checked ? [] : []
    }));
  };

  const handleInvitationMethodChange = (method:'email' |'push', checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      invitationMethods: checked 
        ? [...(prev.invitationMethods || []), method]
        : (prev.invitationMethods || []).filter(m => m !== method)
    }));
  };

  const handlePriceChange = (field:'memberPrice' |'nonMemberPrice', value: string) => {
    const numericValue = value ==='' ? null : parseFloat(value);
    setFormData(prev => ({ ...prev, [field]: numericValue }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]:"" }));
    }
  };

  const handleIsFreeChange = (checked: boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      isFree: checked,
      // Clear prices when event is marked as free
      memberPrice: checked ? null : prev.memberPrice,
      nonMemberPrice: checked ? null : prev.nonMemberPrice
    }));
    // Clear price errors when marking as free
    if (checked && (errors.memberPrice || errors.nonMemberPrice)) {
      setErrors(prev => ({ 
        ...prev, 
        memberPrice:"", 
        nonMemberPrice:"" 
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name ="Event name is required";
    }

    if (!dateValue || !timeValue) {
      newErrors.eventDateTime ="Date and time are required";
    } else {
      // Create date from separate inputs avoiding timezone issues
      const [year, month, day] = dateValue.split('-').map(Number);
      const [hours, minutes] = timeValue.split(':').map(Number);
      const eventDate = new Date(year, month - 1, day, hours, minutes);
      const now = new Date();
      
      if (eventDate <= now) {
        newErrors.eventDateTime ="Event must be in the future";
      }
    }

    if (!formData.location.trim()) {
      newErrors.location ="Location is required";
    }

    if (!formData.description.trim()) {
      newErrors.description ="Description is required";
    }

    // Validate pricing
    if (!formData.isFree) {
      if (formData.memberPrice !== null && formData.memberPrice !== undefined && formData.memberPrice < 0) {
        newErrors.memberPrice ="Member price cannot be negative";
      }
      if (formData.nonMemberPrice !== null && formData.nonMemberPrice !== undefined && formData.nonMemberPrice < 0) {
        newErrors.nonMemberPrice ="Non-member price cannot be negative";
      }
      if (formData.memberPrice !== null && formData.memberPrice !== undefined && formData.memberPrice > 10000) {
        newErrors.memberPrice ="Price cannot exceed $10,000";
      }
      if (formData.nonMemberPrice !== null && formData.nonMemberPrice !== undefined && formData.nonMemberPrice > 10000) {
        newErrors.nonMemberPrice ="Price cannot exceed $10,000";
      }
      if (formData.memberPrice !== null && formData.memberPrice !== undefined && 
          formData.nonMemberPrice !== null && formData.nonMemberPrice !== undefined && 
          formData.memberPrice > formData.nonMemberPrice) {
        newErrors.memberPrice ="Member price cannot be greater than non-member price";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name:"",
      eventDateTime:"",
      location:"",
      description:"",
      sendInvitations: false,
      invitationMethods: [],
      memberPrice: null,
      nonMemberPrice: null,
      isFree: false,
    });
    setDateValue("");
    setTimeValue("");
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const submitData = {
        ...formData,
        eventDateTime: formatDateTimeForSubmit(formData.eventDateTime),
      };

      await onSubmit(submitData);
      // Reset form before closing to avoid state updates on unmounted component
      resetForm();
      onClose();
    } catch (error) {
      logger.error('events','Failed to save event', { error, eventName: formData.name, isEditing, eventDateTime: formData.eventDateTime });
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setErrors({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen && !isLoading) {
        handleClose();
      }
    }}>
      <DialogContent className="sm:max-w-[600px] glass border-border/50 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-emerald-500/20">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              {isEditing ?"Edit Event" :"Create New Event"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            {isEditing ?"Update the event details and save your changes" :"Fill out the form below to create a new event for your club"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 font-medium text-foreground">
              <FileText className="h-4 w-4 text-primary" />
              Event Name
            </Label>
            <Input
              id="name"
              data-testid="input-name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter event name"
              className={`glass-soft border-border/50 focus:glass transition-all duration-200 ${errors.name ?"border-destructive" :""}`}
            />
            {errors.name && (
              <p className="text-sm text-destructive font-medium" data-testid="error-name">{errors.name}</p>
            )}
          </div>

          {/* Date & Time - Improved UX with separate inputs */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-medium text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Date & Time
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventDate" className="text-sm font-medium text-muted-foreground">
                  Event Date
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary/60" />
                  <Input
                    id="eventDate"
                    data-testid="input-eventDate"
                    type="date"
                    value={dateValue}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className={`pl-10 glass-soft border-border/50 focus:glass transition-all duration-200 ${errors.eventDateTime ?"border-destructive" :""}`}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventTime" className="text-sm font-medium text-muted-foreground">
                  Event Time
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary/60" />
                  <Input
                    id="eventTime"
                    data-testid="input-eventTime"
                    type="time"
                    value={timeValue}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className={`pl-10 glass-soft border-border/50 focus:glass transition-all duration-200 ${errors.eventDateTime ?"border-destructive" :""}`}
                  />
                </div>
              </div>
            </div>
            {errors.eventDateTime && (
              <p className="text-sm text-destructive font-medium" data-testid="error-eventDateTime">{errors.eventDateTime}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2 font-medium text-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              Location
            </Label>
            <Input
              id="location"
              data-testid="input-location"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="Enter event location"
              className={`glass-soft border-border/50 focus:glass transition-all duration-200 ${errors.location ?"border-destructive" :""}`}
            />
            {errors.location && (
              <p className="text-sm text-destructive font-medium" data-testid="error-location">{errors.location}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2 font-medium text-foreground">
              <FileText className="h-4 w-4 text-primary" />
              Description
            </Label>
            <Textarea
              id="description"
              data-testid="textarea-description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter event description..."
              rows={4}
              className={`glass-soft border-border/50 focus:glass transition-all duration-200 resize-none ${errors.description ?"border-destructive" :""}`}
            />
            {errors.description && (
              <p className="text-sm text-destructive font-medium" data-testid="error-description">{errors.description}</p>
            )}
          </div>

          {/* Pricing */}
          <div className="space-y-4 p-4 glass-soft border border-border/50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-emerald-500/20">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <Label className="text-base font-medium text-foreground">Event Pricing</Label>
            </div>
            
            <div className="space-y-4">
              {/* Free Event Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFree"
                  data-testid="checkbox-isFree"
                  checked={formData.isFree}
                  onCheckedChange={handleIsFreeChange}
                />
                <Label htmlFor="isFree" className="text-sm font-medium">
                  This is a free event
                </Label>
              </div>

              {/* Price Fields - Only show when not free */}
              {!formData.isFree && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="memberPrice" className="text-sm font-medium text-muted-foreground">
                      Member Price ($)
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary/60" />
                      <Input
                        id="memberPrice"
                        data-testid="input-memberPrice"
                        type="number"
                        min="0"
                        max="10000"
                        step="0.01"
                        value={formData.memberPrice?.toString() ||""}
                        onChange={(e) => handlePriceChange("memberPrice", e.target.value)}
                        placeholder="0.00"
                        className={`pl-10 glass-soft border-border/50 focus:glass transition-all duration-200 ${errors.memberPrice ?"border-destructive" :""}`}
                      />
                    </div>
                    {errors.memberPrice && (
                      <p className="text-sm text-destructive font-medium" data-testid="error-memberPrice">{errors.memberPrice}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nonMemberPrice" className="text-sm font-medium text-muted-foreground">
                      Non-Member Price ($)
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary/60" />
                      <Input
                        id="nonMemberPrice"
                        data-testid="input-nonMemberPrice"
                        type="number"
                        min="0"
                        max="10000"
                        step="0.01"
                        value={formData.nonMemberPrice?.toString() ||""}
                        onChange={(e) => handlePriceChange("nonMemberPrice", e.target.value)}
                        placeholder="0.00"
                        className={`pl-10 glass-soft border-border/50 focus:glass transition-all duration-200 ${errors.nonMemberPrice ?"border-destructive" :""}`}
                      />
                    </div>
                    {errors.nonMemberPrice && (
                      <p className="text-sm text-destructive font-medium" data-testid="error-nonMemberPrice">{errors.nonMemberPrice}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Helper text */}
              <div className="text-xs text-muted-foreground">
                {formData.isFree ? ("Free events don't require pricing information"
                ) : ("Member price should be less than or equal to non-member price. Maximum price is $10,000."
                )}
              </div>
            </div>
          </div>

          {/* Invitation Options (Only for Grow tier) */}
          {canSendInvitations && (
            <div className="space-y-4 p-4 glass-soft border border-border/50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-emerald-500/20">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <Label className="text-base font-medium text-foreground">Member Invitations</Label>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendInvitations"
                    checked={formData.sendInvitations}
                    onCheckedChange={handleSendInvitationsChange}
                  />
                  <Label htmlFor="sendInvitations">
                    Send invitations to all club members
                  </Label>
                </div>

                {formData.sendInvitations && (
                  <div className="ml-6 space-y-2">
                    <Label className="text-sm font-medium">Invitation Methods:</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="emailInvite"
                          checked={formData.invitationMethods?.includes('email')}
                          onCheckedChange={(checked) => handleInvitationMethodChange('email', checked as boolean)}
                        />
                        <Label htmlFor="emailInvite" className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4" />
                          Email notifications
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="pushInvite"
                          checked={formData.invitationMethods?.includes('push')}
                          onCheckedChange={(checked) => handleInvitationMethodChange('push', checked as boolean)}
                        />
                        <Label htmlFor="pushInvite" className="flex items-center gap-2 text-sm">
                          <Bell className="h-4 w-4" />
                          App push notifications
                        </Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-3">
            <Button type="button" variant="outline" onClick={handleClose} className="glass-soft border-border/50 hover:glass transition-all duration-200">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:opacity-95 disabled:opacity-50"
            >
              {isLoading ?"Saving..." : isEditing ?"Update Event" :"Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 