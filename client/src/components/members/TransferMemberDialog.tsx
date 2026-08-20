'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { locationService, type LocationResponse } from '@/lib/api/locationService';
import { memberTransferService } from '@/lib/api/memberTransferService';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';

interface TransferMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    id: number;
    fullName: string;
    email: string;
    locationId?: number;
    clubId: number;
  };
  onTransferSuccess?: () => void;
}

export default function TransferMemberDialog({
  open,
  onOpenChange,
  member,
  onTransferSuccess,
}: TransferMemberDialogProps) {
  const toast = useToast();
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [transferReason, setTransferReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);

  useEffect(() => {
    if (open) {
      loadLocations();
      setSelectedLocationId('');
      setTransferReason('');
    }
  }, [open, member.clubId]);

  const loadLocations = async () => {
    try {
      setLoadingLocations(true);
      const data = await locationService.getClubLocations(member.clubId);
      // Filter out current location and inactive locations
      const availableLocations = data.filter(
        (loc) => loc.isActive && loc.id !== member.locationId
      );
      setLocations(availableLocations);
    } catch (error) {
      logger.error('members', 'Error loading locations for transfer', { error, clubId: member.clubId, memberId: member.id });
      toast.error('Failed to load available locations');
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedLocationId || !transferReason.trim()) {
      toast.error('Please select a location and provide a reason');
      return;
    }

    try {
      setLoading(true);
      await memberTransferService.requestTransfer(member.id, {
        toLocationId: parseInt(selectedLocationId),
        transferReason: transferReason.trim(),
      });

      toast.success('Transfer request submitted successfully and is pending approval');

      onOpenChange(false);
      onTransferSuccess?.();
    } catch (error: any) {
      logger.error('members', 'Error requesting member transfer', { error, memberId: member.id, toLocationId: selectedLocationId, transferReason });
      toast.error(error.response?.data?.message || 'Failed to request transfer');
    } finally {
      setLoading(false);
    }
  };

  const selectedLocation = locations.find((loc) => loc.id === parseInt(selectedLocationId));
  const currentLocation = locations.find((loc) => loc.id === member.locationId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transfer Member to Another Location</DialogTitle>
          <DialogDescription>
            Request to transfer {member.fullName} to a different location within your club
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Member Info */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <h4 className="font-medium mb-2">Member Information</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>{' '}
                <span className="font-medium">{member.fullName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>{' '}
                <span className="font-medium">{member.email}</span>
              </div>
              {currentLocation && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Current Location:</span>{' '}
                  <span className="font-medium">{currentLocation.locationName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Destination Location */}
          <div className="space-y-2">
            <Label htmlFor="destination">Destination Location *</Label>
            {loadingLocations ? (
              <div className="text-sm text-muted-foreground">Loading locations...</div>
            ) : locations.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No other locations available for transfer. Create additional locations first.
                </AlertDescription>
              </Alert>
            ) : (
              <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{location.locationName}</span>
                        {location.city && location.state && (
                          <span className="text-xs text-muted-foreground">
                            {location.city}, {location.state}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Transfer Preview */}
          {selectedLocation && currentLocation && (
            <div className="flex items-center justify-center gap-4 p-4 rounded-lg border bg-muted/30">
              <div className="text-center">
                <div className="font-medium">{currentLocation.locationName}</div>
                <div className="text-xs text-muted-foreground">From</div>
              </div>
              <ArrowRight className="h-6 w-6 text-primary" />
              <div className="text-center">
                <div className="font-medium">{selectedLocation.locationName}</div>
                <div className="text-xs text-muted-foreground">To</div>
              </div>
            </div>
          )}

          {/* Transfer Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Transfer *</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this member should be transferred (required for approval process)..."
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground">
              {transferReason.length}/1000 characters
            </div>
          </div>

          {/* Important Notice */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> This transfer request will require approval from an
              administrator of the destination location. The member will remain at their current
              location until the transfer is approved.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={loading || !selectedLocationId || !transferReason.trim() || locations.length === 0}
          >
            {loading ? 'Requesting...' : 'Request Transfer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
