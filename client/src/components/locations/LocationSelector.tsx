'use client';

import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin } from 'lucide-react';
import { locationService, type LocationResponse } from '@/lib/api/locationService';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';

interface LocationSelectorProps {
  clubId: number;
  selectedLocationId?: number;
  onLocationChange: (locationId: number) => void;
  className?: string;
}

/**
 * LocationSelector component for switching between club locations
 * Only displays for Expand tier clubs with multiple locations
 */
export default function LocationSelector({
  clubId,
  selectedLocationId,
  onLocationChange,
  className,
}: LocationSelectorProps) {
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    loadLocations();
  }, [clubId]);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await locationService.getClubLocations(clubId);
      setLocations(data.filter(loc => loc.isActive));

      // If no location is selected and we have locations, select the first one
      if (!selectedLocationId && data.length > 0) {
        onLocationChange(data[0].id);
      }
    } catch (error) {
      logger.error('members', 'Error loading locations for selector', { error, clubId });
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  // Don't show selector if there's only one location
  if (locations.length <= 1) {
    return null;
  }

  return (
    <div className={className}>
      <Select
        value={selectedLocationId?.toString()}
        onValueChange={(value) => onLocationChange(parseInt(value))}
        disabled={loading}
      >
        <SelectTrigger className="w-[250px]">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <SelectValue placeholder="Select location" />
          </div>
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
    </div>
  );
}
