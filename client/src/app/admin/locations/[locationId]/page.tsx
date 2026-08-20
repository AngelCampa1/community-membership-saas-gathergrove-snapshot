'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  MapPin,
  Pencil,
  Palette,
  ArrowRightLeft,
  Mail,
  Phone,
  Globe,
} from 'lucide-react';
import {
  locationService,
  type LocationResponse,
  type UpdateLocationRequest,
} from '@/lib/api/locationService';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
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

type EditFormState = {
  locationName: string;
  locationCode: string;
  address: string;
  city: string;
  state: string;
  country: string;
  timezone: string;
  contactEmail: string;
  contactPhone: string;
};

const toFormState = (location: LocationResponse): EditFormState => ({
  locationName: location.locationName,
  locationCode: location.locationCode,
  address: location.address ?? '',
  city: location.city ?? '',
  state: location.state ?? '',
  country: location.country ?? '',
  timezone: location.timezone ?? '',
  contactEmail: location.contactEmail ?? '',
  contactPhone: location.contactPhone ?? '',
});

export default function LocationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();

  const locationId = params?.locationId ? parseInt(params.locationId as string, 10) : null;

  const [location, setLocation] = useState<LocationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<EditFormState>({
    locationName: '',
    locationCode: '',
    address: '',
    city: '',
    state: '',
    country: '',
    timezone: '',
    contactEmail: '',
    contactPhone: '',
  });

  const loadLocation = useCallback(async () => {
    if (!locationId || Number.isNaN(locationId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setNotFound(false);
      const data = await locationService.getLocation(locationId);
      setLocation(data);
      setFormData(toFormState(data));
    } catch (error) {
      logger.error('locations', 'Error loading location', { error, locationId });
      setNotFound(true);
      toast.error('Failed to load location');
    } finally {
      setLoading(false);
    }
  }, [locationId, toast]);

  useEffect(() => {
    loadLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  const handleSave = async () => {
    if (!locationId || Number.isNaN(locationId)) return;
    if (!formData.locationName.trim() || !formData.locationCode.trim()) return;

    const payload: UpdateLocationRequest = {
      locationName: formData.locationName.trim(),
      locationCode: formData.locationCode.trim(),
      address: formData.address.trim() || undefined,
      city: formData.city.trim() || undefined,
      state: formData.state.trim() || undefined,
      country: formData.country.trim() || undefined,
      timezone: formData.timezone.trim() || undefined,
      contactEmail: formData.contactEmail.trim() || undefined,
      contactPhone: formData.contactPhone.trim() || undefined,
    };

    try {
      setSaving(true);
      const updated = await locationService.updateLocation(locationId, payload);
      setLocation(updated);
      setFormData(toFormState(updated));
      toast.success('Location updated successfully');
      setEditOpen(false);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update location';
      logger.error('locations', 'Error updating location', { error, locationId });
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="location-loading">
        <div className="text-muted-foreground">Loading location...</div>
      </div>
    );
  }

  if (notFound || !location) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/settings/locations')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Locations
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Location not found</h3>
            <p className="text-muted-foreground text-center">
              This location does not exist or you do not have access to it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/admin/settings/locations')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Locations
      </Button>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{location.locationName}</h1>
            <p className="text-muted-foreground mt-1">Code: {location.locationCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={location.isActive ? 'default' : 'secondary'}>
            {location.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Location Details</CardTitle>
          <CardDescription>Address and contact information</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Address</dt>
              <dd className="text-sm">{location.address || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Location</dt>
              <dd className="text-sm">
                {[location.city, location.state, location.country].filter(Boolean).join(', ') || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                <Mail className="inline h-3.5 w-3.5 mr-1" />
                Contact Email
              </dt>
              <dd className="text-sm">{location.contactEmail || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                <Phone className="inline h-3.5 w-3.5 mr-1" />
                Contact Phone
              </dt>
              <dd className="text-sm">{location.contactPhone || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                <Globe className="inline h-3.5 w-3.5 mr-1" />
                Timezone
              </dt>
              <dd className="text-sm">{location.timezone || '—'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>Branding</CardTitle>
            </div>
            <CardDescription>Customize this location&apos;s logo, colors, and theme</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/admin/locations/${location.id}/branding`)}
            >
              Manage Branding
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              <CardTitle>Member Transfers</CardTitle>
            </div>
            <CardDescription>Review and approve member transfer requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/admin/locations/${location.id}/transfers`)}
            >
              Manage Transfers
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>Update this location&apos;s details</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locationName">Location Name *</Label>
                <Input
                  id="locationName"
                  value={formData.locationName}
                  onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationCode">Location Code *</Label>
                <Input
                  id="locationCode"
                  value={formData.locationCode}
                  onChange={(e) =>
                    setFormData({ ...formData, locationCode: e.target.value.toUpperCase() })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              loadingText="Saving..."
              disabled={!formData.locationName.trim() || !formData.locationCode.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
