import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  value, 
  onChange, 
  placeholder = 'חיפוש מוצרים...' 
}) => {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10 pl-10 h-12 rounded-full border-border bg-white shadow-sm"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange('')}
          className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default SearchBar;
