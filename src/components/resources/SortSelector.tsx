import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SortSelectorProps {
  sortOrder: string;
  onSortOrderChange: (order: string) => void;
}

const SortSelector: React.FC<SortSelectorProps> = ({ sortOrder, onSortOrderChange }) => {
  return (
    <Select value={sortOrder} onValueChange={onSortOrderChange}>
      <SelectTrigger className="h-10 w-full md:w-[180px]">
        <SelectValue placeholder="Sort By" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">Newest</SelectItem>
        <SelectItem value="popular">Popular</SelectItem>
        <SelectItem value="a-z">A-Z</SelectItem>
        <SelectItem value="z-a">Z-A</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default SortSelector;
