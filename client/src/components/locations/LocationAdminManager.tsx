'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Shield, Users } from 'lucide-react';
import {
  locationPermissionsService,
  type LocationAdminResponse,
  LocationPermissionLevel,
} from '@/lib/api/locationPermissionsService';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LocationAdminManagerProps {
  locationId: number;
  locationName: string;
}

export default function LocationAdminManager({ locationId, locationName }: LocationAdminManagerProps) {
  const toast = useToast();
  const [admins, setAdmins] = useState<LocationAdminResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [permissionLevel, setPermissionLevel] = useState<string>(LocationPermissionLevel.LocationAdmin.toString());
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, [locationId]);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await locationPermissionsService.getLocationAdmins(locationId);
      setAdmins(data.sort((a, b) => a.permissionLevel - b.permissionLevel));
    } catch (error) {
      logger.error('admins', 'Error loading location admins', { error, locationId, locationName });
      toast.error('Failed to load location admins');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAdmin = async () => {
    if (!userId.trim()) {
      toast.error('Please enter a user ID');
      return;
    }

    try {
      setAssigning(true);
      await locationPermissionsService.assignLocationAdmin(locationId, {
        userId: parseInt(userId),
        permissionLevel: parseInt(permissionLevel) as LocationPermissionLevel,
      });

      toast.success('Location admin assigned successfully');

      setAssignDialogOpen(false);
      setUserId('');
      setPermissionLevel(LocationPermissionLevel.LocationAdmin.toString());
      loadAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign admin');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAdmin = async (admin: LocationAdminResponse) => {
    if (!confirm(`Remove ${admin.userFullName} as ${admin.permissionLevelName} of this location?`)) {
      return;
    }

    try {
      await locationPermissionsService.removeLocationAdmin(locationId, admin.userId);
      toast.success(`${admin.userFullName} has been removed from this location`);
      loadAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove admin');
    }
  };

  const getPermissionBadgeVariant = (level: LocationPermissionLevel) => {
    switch (level) {
      case LocationPermissionLevel.SuperAdmin:
        return 'default';
      case LocationPermissionLevel.RegionalManager:
        return 'default';
      case LocationPermissionLevel.LocationAdmin:
        return 'secondary';
      case LocationPermissionLevel.LocationModerator:
        return 'secondary';
      case LocationPermissionLevel.Staff:
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getPermissionDescription = (level: LocationPermissionLevel): string => {
    switch (level) {
      case LocationPermissionLevel.SuperAdmin:
        return 'Full access to all locations and settings';
      case LocationPermissionLevel.RegionalManager:
        return 'Manage multiple assigned locations';
      case LocationPermissionLevel.LocationAdmin:
        return 'Full admin access to this location';
      case LocationPermissionLevel.LocationModerator:
        return 'Limited admin access, cannot modify admins';
      case LocationPermissionLevel.Staff:
        return 'Basic access, view only';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Loading admins...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Location Administrators
              </CardTitle>
              <CardDescription className="mt-2">
                Manage admin permissions for {locationName}
              </CardDescription>
            </div>
            <Button onClick={() => setAssignDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Assign Admin
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No location admins assigned yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{admin.userFullName}</h4>
                        <Badge variant={getPermissionBadgeVariant(admin.permissionLevel)}>
                          {admin.permissionLevelName}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{admin.userEmail}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getPermissionDescription(admin.permissionLevel)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm text-muted-foreground">
                      <div>Assigned {new Date(admin.assignedAt).toLocaleDateString()}</div>
                      {admin.assignedByName && <div className="text-xs">by {admin.assignedByName}</div>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAdmin(admin)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permission Hierarchy Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Hierarchy</CardTitle>
          <CardDescription>Understanding the permission levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                level: LocationPermissionLevel.SuperAdmin,
                name: 'Super Admin',
                description: 'Full access to all locations and all settings. Can create/delete locations and assign any permission level.',
              },
              {
                level: LocationPermissionLevel.RegionalManager,
                name: 'Regional Manager',
                description: 'Can manage multiple assigned locations. Can assign LocationAdmin, LocationModerator, and Staff.',
              },
              {
                level: LocationPermissionLevel.LocationAdmin,
                name: 'Location Admin',
                description: 'Full admin access to one location. Can manage members, events, and assign LocationModerator and Staff.',
              },
              {
                level: LocationPermissionLevel.LocationModerator,
                name: 'Location Moderator',
                description: 'Limited admin access. Can manage day-to-day operations but cannot modify admin permissions.',
              },
              {
                level: LocationPermissionLevel.Staff,
                name: 'Staff',
                description: 'Basic access. Can view location data but has limited modification permissions.',
              },
            ].map((item) => (
              <div key={item.level} className="flex items-start gap-3 p-3 rounded-lg border">
                <Badge variant={getPermissionBadgeVariant(item.level)} className="mt-1">
                  {item.name}
                </Badge>
                <p className="text-sm text-muted-foreground flex-1">{item.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assign Admin Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Location Admin</DialogTitle>
            <DialogDescription>
              Assign a user as an administrator for {locationName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID *</Label>
              <Input
                id="userId"
                type="number"
                placeholder="Enter user ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                You can find the user ID in the user management section
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="permissionLevel">Permission Level *</Label>
              <Select value={permissionLevel} onValueChange={setPermissionLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={LocationPermissionLevel.SuperAdmin.toString()}>
                    Super Admin
                  </SelectItem>
                  <SelectItem value={LocationPermissionLevel.RegionalManager.toString()}>
                    Regional Manager
                  </SelectItem>
                  <SelectItem value={LocationPermissionLevel.LocationAdmin.toString()}>
                    Location Admin
                  </SelectItem>
                  <SelectItem value={LocationPermissionLevel.LocationModerator.toString()}>
                    Location Moderator
                  </SelectItem>
                  <SelectItem value={LocationPermissionLevel.Staff.toString()}>
                    Staff
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {getPermissionDescription(parseInt(permissionLevel) as LocationPermissionLevel)}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)} disabled={assigning}>
              Cancel
            </Button>
            <Button onClick={handleAssignAdmin} disabled={assigning || !userId.trim()}>
              {assigning ? 'Assigning...' : 'Assign Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
