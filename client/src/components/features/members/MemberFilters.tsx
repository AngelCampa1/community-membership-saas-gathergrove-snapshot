"use client";

import { memo, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Search, Filter } from 'lucide-react';

interface MemberFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedMembershipType: string;
  onMembershipTypeChange: (value: string) => void;
  selectedDuesStatus: string;
  onDuesStatusChange: (value: string) => void;
  selectedSmsConsent: string;
  onSmsConsentChange: (value: string) => void;
  joinDateFrom: string;
  onJoinDateFromChange: (value: string) => void;
  joinDateTo: string;
  onJoinDateToChange: (value: string) => void;
  membershipTypes: Array<{ id: number; name: string }>;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const MemberFilters = memo<MemberFiltersProps>(({
  searchTerm,
  onSearchChange,
  selectedMembershipType,
  onMembershipTypeChange,
  selectedDuesStatus,
  onDuesStatusChange,
  joinDateFrom,
  onJoinDateFromChange,
  joinDateTo,
  onJoinDateToChange,
  membershipTypes,
  onClearFilters,
  hasActiveFilters,
}) => {
  const duesStatusOptions = useMemo(() => [
    { value: 'Current', label: 'Current' },
    { value: 'Overdue', label: 'Overdue' },
    { value: 'Upcoming', label: 'Upcoming' },
    { value: 'Unpaid', label: 'Unpaid' },
    { value: 'Partial', label: 'Partial Payment' },
  ], []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);

  const handleJoinDateFromChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onJoinDateFromChange(e.target.value);
  }, [onJoinDateFromChange]);

  const handleJoinDateToChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onJoinDateToChange(e.target.value);
  }, [onJoinDateToChange]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="ml-auto"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Search Members</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Membership Type</label>
            <Select value={selectedMembershipType} onValueChange={onMembershipTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {membershipTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Dues Status</label>
            <Select value={selectedDuesStatus} onValueChange={onDuesStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {duesStatusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Join Date From</label>
            <Input
              type="date"
              value={joinDateFrom}
              onChange={handleJoinDateFromChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Join Date To</label>
            <Input
              type="date"
              value={joinDateTo}
              onChange={handleJoinDateToChange}
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {searchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {searchTerm}
                <X className="h-3 w-3 cursor-pointer" onClick={() => onSearchChange('')} />
              </Badge>
            )}
            {selectedMembershipType !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Type: {membershipTypes.find(t => t.id.toString() === selectedMembershipType)?.name}
                <X className="h-3 w-3 cursor-pointer" onClick={() => onMembershipTypeChange('all')} />
              </Badge>
            )}
            {selectedDuesStatus !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Status: {duesStatusOptions.find(s => s.value === selectedDuesStatus)?.label}
                <X className="h-3 w-3 cursor-pointer" onClick={() => onDuesStatusChange('all')} />
              </Badge>
            )}
            {joinDateFrom && (
              <Badge variant="secondary" className="flex items-center gap-1">
                From: {joinDateFrom}
                <X className="h-3 w-3 cursor-pointer" onClick={() => onJoinDateFromChange('')} />
              </Badge>
            )}
            {joinDateTo && (
              <Badge variant="secondary" className="flex items-center gap-1">
                To: {joinDateTo}
                <X className="h-3 w-3 cursor-pointer" onClick={() => onJoinDateToChange('')} />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

MemberFilters.displayName = 'MemberFilters';

export default MemberFilters;
