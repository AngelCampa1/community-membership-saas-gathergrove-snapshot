"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import communicationService, { MembershipTypeResponse } from "@/services/communicationService";
import { logger } from "@/lib/logger";

// Use the imported MembershipTypeResponse interface

interface MemberTypeSelectorProps {
  selectedMemberTypeIds: number[];
  onSelectionChange: (memberTypeIds: number[]) => void;
  onRecipientCountChange?: (count: number, allSelected: boolean) => void;
  disabled?: boolean;
}

export default function MemberTypeSelector({
  selectedMemberTypeIds,
  onSelectionChange,
  onRecipientCountChange,
  disabled = false
}: MemberTypeSelectorProps) {
  const { user, loading: authLoading } = useAuth();
  const [membershipTypes, setMembershipTypes] = useState<MembershipTypeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allMembersSelected, setAllMembersSelected] = useState(false);

  // Fetch membership types from API
  useEffect(() => {
    const fetchMembershipTypes = async () => {
      // Wait for auth to finish loading before checking club info
      if (authLoading) {
        return;
      }

      if (!user?.clubId) {
        setError("Club information not available");
        setIsLoading(false);
        return;
      }

      try {
        const data = await communicationService.getMembershipTypes(user.clubId);
        setMembershipTypes(data.filter(mt => mt.isActive)); // Only show active membership types
      } catch (err) {
        logger.error('communications', 'Error fetching membership types', { error: err, clubId: user.clubId });
        setError("Failed to load membership types");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembershipTypes();
  }, [user?.clubId, authLoading]);

  // Calculate total member count
  const totalMemberCount = membershipTypes.reduce((sum, mt) => sum + mt.memberCount, 0);

  // Calculate selected member count
  const selectedMemberCount = membershipTypes
    .filter(mt => selectedMemberTypeIds.includes(mt.id))
    .reduce((sum, mt) => sum + mt.memberCount, 0);

  // Notify parent of recipient count changes
  useEffect(() => {
    if (onRecipientCountChange && membershipTypes.length > 0) {
      if (allMembersSelected) {
        onRecipientCountChange(totalMemberCount, true);
      } else if (selectedMemberTypeIds.length > 0) {
        onRecipientCountChange(selectedMemberCount, false);
      } else {
        onRecipientCountChange(totalMemberCount, true); // Default to all when nothing selected
      }
    }
  }, [onRecipientCountChange, membershipTypes, allMembersSelected, selectedMemberTypeIds, totalMemberCount, selectedMemberCount]);

  // Handle toggle for "All Members" option
  const handleAllMembersToggle = (checked: boolean) => {
    setAllMembersSelected(checked);
    if (checked) {
      onSelectionChange([]); // Empty array means "all members"
    } else {
      onSelectionChange([]); // Clear selection when unchecking "All Members"
    }
  };

  // Handle toggle for individual membership types
  const handleMembershipTypeToggle = (memberTypeId: number, checked: boolean) => {
    setAllMembersSelected(false); // Unselect "All Members" when selecting specific types

    if (checked) {
      onSelectionChange([...selectedMemberTypeIds, memberTypeId]);
    } else {
      onSelectionChange(selectedMemberTypeIds.filter(id => id !== memberTypeId));
    }
  };

  // Check if all specific membership types are selected
  const allSpecificTypesSelected = membershipTypes.length > 0 &&
    selectedMemberTypeIds.length === membershipTypes.length;

  if (isLoading || authLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Member Targeting</CardTitle>
          <CardDescription>
            Select which membership types to send this communication to
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            Loading membership types...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Member Targeting</CardTitle>
          <CardDescription>
            Select which membership types to send this communication to
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (membershipTypes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Member Targeting</CardTitle>
          <CardDescription>
            Select which membership types to send this communication to
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            No membership types configured for this club
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Member Targeting
        </CardTitle>
        <CardDescription>
          Select which membership types to send this communication to
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* "All Members" option */}
        <div className="flex items-center space-x-2 p-3 rounded-lg border bg-primary/10">
          <Checkbox
            id="all-members"
            checked={allMembersSelected}
            onCheckedChange={handleAllMembersToggle}
            disabled={disabled}
          />
          <div className="flex-1">
            <Label
              htmlFor="all-members"
              className="font-medium cursor-pointer"
            >
              All Members
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">
                Send to all {totalMemberCount} active members
              </span>
              {allMembersSelected && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Selected
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Membership type options */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">
            Or select specific membership types:
          </Label>
          {membershipTypes.map((membershipType) => (
            <div
              key={membershipType.id}
              className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={`membership-type-${membershipType.id}`}
                checked={selectedMemberTypeIds.includes(membershipType.id)}
                onCheckedChange={(checked) =>
                  handleMembershipTypeToggle(membershipType.id, checked as boolean)
                }
                disabled={disabled || allMembersSelected}
              />
              <div className="flex-1">
                <Label
                  htmlFor={`membership-type-${membershipType.id}`}
                  className="font-medium cursor-pointer"
                >
                  {membershipType.name}
                </Label>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-muted-foreground">
                    {membershipType.memberCount.toLocaleString()} members
                  </span>
                  {membershipType.description && (
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {membershipType.description}
                    </span>
                  )}
                </div>
              </div>
              {selectedMemberTypeIds.includes(membershipType.id) && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Selected
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* Selection summary */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Recipients:
            </span>
            <span className="text-sm">
              {allMembersSelected ? (
                <span className="text-primary font-medium">
                  All {totalMemberCount} members
                </span>
              ) : selectedMemberTypeIds.length > 0 ? (
                <span className="text-success font-medium">
                  {selectedMemberCount} members ({selectedMemberTypeIds.length} membership types)
                </span>
              ) : (
                <span className="text-muted-foreground">
                  No membership types selected
                </span>
              )}
            </span>
          </div>
          {allSpecificTypesSelected && membershipTypes.length > 1 && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAllMembersToggle(true)}
                className="text-xs"
                disabled={disabled}
              >
                Select "All Members" instead
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}