import React from 'react';
import { LoginActivityFilter } from '../../../types/loginActivity';
import { Select } from '../../ui/select';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
  filter: LoginActivityFilter;
  onFilterChange: (filter: LoginActivityFilter) => void;
  onClearFilters: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  memberCount: number;
  filteredCount: number;
}

export default function MemberActivityFilters({
  filter,
  onFilterChange,
  onClearFilters,
  searchTerm,
  onSearchChange,
  memberCount,
  filteredCount
}: Props) {
  const hasActiveFilters = Boolean(
    filter.activityLevel && filter.activityLevel !== 'All' ||
    filter.daysSinceLastLogin ||
    filter.isAtRisk !== undefined ||
    filter.platform && filter.platform !== 'all' ||
    searchTerm
  );

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FunnelIcon className="h-5 w-5 text-muted-foreground mr-2" />
          <h3 className="text-sm font-medium text-foreground">Filter Members</h3>
          <span className="ml-2 text-sm text-muted-foreground">
            ({filteredCount} of {memberCount} members)
          </span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Search Members
          </label>
          <Input
            type="text"
            placeholder="Name or email..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Activity Level */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Activity Level
          </label>
          <Select
            value={filter.activityLevel || 'All'}
            onValueChange={(value: string) => 
              onFilterChange({ 
                ...filter, 
                activityLevel: value === 'All' ? undefined : value as LoginActivityFilter['activityLevel'] 
              })
            }
          >
            <option value="All">All Levels</option>
            <option value="HighlyActive">Highly Active</option>
            <option value="Moderate">Moderate</option>
            <option value="LowActivity">Low Activity</option>
            <option value="Inactive">Inactive</option>
          </Select>
        </div>

        {/* Days Since Last Login */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Inactive For
          </label>
          <Select
            value={filter.daysSinceLastLogin?.toString() || ''}
            onValueChange={(value: string) => 
              onFilterChange({ 
                ...filter, 
                daysSinceLastLogin: value ? Number(value) : undefined 
              })
            }
          >
            <option value="">Any Duration</option>
            <option value="7">7+ days</option>
            <option value="14">14+ days</option>
            <option value="30">30+ days</option>
            <option value="60">60+ days</option>
            <option value="90">90+ days</option>
          </Select>
        </div>

        {/* At Risk Status */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Risk Status
          </label>
          <Select
            value={
              filter.isAtRisk === undefined ? 'all' : 
              filter.isAtRisk ? 'at-risk' : 'not-at-risk'
            }
            onValueChange={(value: string) => 
              onFilterChange({ 
                ...filter, 
                isAtRisk: value === 'all' ? undefined : value === 'at-risk' 
              })
            }
          >
            <option value="all">All Members</option>
            <option value="at-risk">At Risk Only</option>
            <option value="not-at-risk">Not At Risk</option>
          </Select>
        </div>

        {/* Platform */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Platform Used
          </label>
          <Select
            value={filter.platform || 'all'}
            onValueChange={(value: string) => 
              onFilterChange({ 
                ...filter, 
                platform: value === 'all' ? undefined : value as LoginActivityFilter['platform'] 
              })
            }
          >
            <option value="all">All Platforms</option>
            <option value="web">Web Only</option>
            <option value="mobile">Mobile Only</option>
          </Select>
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
        <span className="text-xs font-medium text-foreground mr-2">Quick Filters:</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange({ ...filter, isAtRisk: true })}
          className={`text-xs ${filter.isAtRisk ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground'}`}
        >
          At Risk Members
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange({ ...filter, activityLevel: 'HighlyActive' })}
          className={`text-xs ${filter.activityLevel === 'HighlyActive' ? 'bg-success/10 text-success' : 'text-muted-foreground'}`}
        >
          Highly Active
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange({ ...filter, daysSinceLastLogin: 30 })}
          className={`text-xs ${filter.daysSinceLastLogin === 30 ? 'bg-warning/10 text-warning' : 'text-muted-foreground'}`}
        >
          30+ Days Inactive
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange({ ...filter, activityLevel: 'Inactive' })}
          className={`text-xs ${filter.activityLevel === 'Inactive' ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
        >
          Never Logged In
        </Button>
      </div>
    </div>
  );
}