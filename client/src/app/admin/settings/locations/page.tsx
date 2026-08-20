'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin, Settings, Trash2, Loader2 } from 'lucide-react';
import { locationService, type LocationResponse } from '@/lib/api/locationService';
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

export default function LocationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    locationName: '',
    locationCode: '',
    address: '',
    city: '',
    state: '',
    country: '',
    timezone: 'UTC',
    contactEmail: '',
    contactPhone: '',
  });

  useEffect(() => {
    if (user?.clubId) {
      loadLocations();
    }
  }, [user?.clubId]);

  const loadLocations = async () => {
    if (!user?.clubId) return;

    try {
      setLoading(true);
      const data = await locationService.getClubLocations(user.clubId);
      setLocations(data);
    } catch (error) {
      logger.error('locations', 'Error loading club locations', { error, clubId: user.clubId });
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLocation = async () => {
    if (!user?.clubId || isCreating) return;

    try {
      setIsCreating(true);
      await locationService.createLocation(user.clubId, formData);
      toast.success('Location created successfully');
      setCreateDialogOpen(false);
      setFormData({
        locationName: '',
        locationCode: '',
        address: '',
        city: '',
        state: '',
        country: '',
        timezone: 'UTC',
        contactEmail: '',
        contactPhone: '',
      });
      loadLocations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create location');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeactivateLocation = async (locationId: number, locationName: string) => {
    if (!confirm(`Are you sure you want to deactivate "${locationName}"?`)) {
      return;
    }

    try {
      await locationService.deactivateLocation(locationId);
      toast.success('Location deactivated successfully');
      loadLocations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to deactivate location');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading locations...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Locations & Chapters</h1>
          <p className="text-muted-foreground mt-2">
            Manage multiple locations for your club
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {locations.map((location) => (
          <Card key={location.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>{location.locationName}</CardTitle>
                    <CardDescription className="mt-1">
                      Code: {location.locationCode}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={location.isActive ? 'default' : 'secondary'}>
                  {location.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {location.city && location.state && (
                  <div className="text-sm text-muted-foreground">
                    📍 {location.city}, {location.state}
                    {location.country && `, ${location.country}`}
                  </div>
                )}

                {location.contactEmail && (
                  <div className="text-sm">
                    📧 {location.contactEmail}
                  </div>
                )}

                {location.contactPhone && (
                  <div className="text-sm">
                    📞 {location.contactPhone}
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/admin/locations/${location.id}`)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Manage
                  </Button>
                  {location.locationCode !== 'MAIN' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeactivateLocation(location.id, location.locationName)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {locations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No locations yet</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Create your first location to start managing multiple chapters
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Location</DialogTitle>
            <DialogDescription>
              Add a new location or chapter to your club
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locationName">Location Name *</Label>
                <Input
                  id="locationName"
                  placeholder="Downtown Chapter"
                  value={formData.locationName}
                  onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationCode">Location Code *</Label>
                <Input
                  id="locationCode"
                  placeholder="DT"
                  value={formData.locationCode}
                  onChange={(e) => setFormData({ ...formData, locationCode: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Main St"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="New York"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="NY"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="USA"
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
                  placeholder="location@club.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                placeholder="America/New_York"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateLocation}
              disabled={isCreating || !formData.locationName || !formData.locationCode}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Location'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
