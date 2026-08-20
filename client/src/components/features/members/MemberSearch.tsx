import React, { memo } from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useDebounce } from '@/hooks/useDebounce';

interface MemberSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
}

export const MemberSearch = memo<MemberSearchProps>(({ 
  searchTerm, 
  onSearchChange, 
  placeholder = "Search members..." 
}) => {
  // Debounce the search term to avoid excessive API calls
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  React.useEffect(() => {
    // Only trigger search when debounced value changes
    if (debouncedSearch !== searchTerm) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch, onSearchChange, searchTerm]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
});

MemberSearch.displayName = 'MemberSearch';