import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconFilter, IconMusic, IconFileMusic, IconPhoto, IconVideo, IconFileText, IconX, IconSearch } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

type ResourceFiltersProps = {
  searchQuery: string;
  selectedCategory: string;
  selectedSubcategory: string;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onCategoryChange: (category: string) => void;
  onSubcategoryChange: (subcategory: string) => void;
  sortOrder: string;
  onSortOrderChange: (order: string) => void;
  isMobile: boolean;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  availableSubcategories: string[];
  fontPreviewText?: string;
  onFontPreviewTextChange?: (text: string) => void;
};

const groupMcsoundsSubcategories = (subcategories: string[]): { parent: string; label: string; value: string }[] => {
  const result: { parent: string; label: string; value: string }[] = [];

  const formatLabel = (sub: string): string => {
    return sub.split('/').map(part =>
      part.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    ).join(' > ');
  };

  subcategories.sort().forEach(sub => {
    const parts = sub.split('/');
    result.push({
      parent: parts.length > 1 ? parts[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '',
      label: formatLabel(sub),
      value: sub,
    });
  });

  return result;
};

const ResourceFilters = ({
  searchQuery,
  selectedCategory,
  selectedSubcategory,
  onSearch,
  onClearSearch,
  onSearchSubmit,
  onCategoryChange,
  onSubcategoryChange,
  onSortOrderChange,
  isMobile,
  inputRef,
  availableSubcategories,
  fontPreviewText,
  onFontPreviewTextChange,
}: ResourceFiltersProps) => {
  return (
    <div className={`mb-8 flex gap-4 ${isMobile ? 'flex-row items-center' : 'flex-col'}`}>
      <div className="relative flex-grow">
        <form onSubmit={(e) => onSearchSubmit(e)} className="relative w-full">
          <Input
            ref={inputRef}
            placeholder="Search resources..."
            value={searchQuery}
            onChange={onSearch}
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="pixel-input w-full pr-10"
          />

          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
              onClick={onClearSearch}
            >
              <IconX className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}

          <Button type="submit" className="sr-only">Search</Button>
        </form>

        {selectedCategory === 'fonts' && onFontPreviewTextChange && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            className="relative w-full lg:w-1/2"
          >
            <Input
              placeholder="Type to preview fonts..."
              value={fontPreviewText}
              onChange={(e) => onFontPreviewTextChange(e.target.value)}
              className="pixel-input w-full font-geist"
              maxLength={40}
            />
          </motion.div>
        )}
      </div>

      {isMobile ? (
        <MobileFilters
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          availableSubcategories={availableSubcategories}
          onCategoryChange={onCategoryChange}
          onSubcategoryChange={onSubcategoryChange}
        />
      ) : (
        <DesktopFilters
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          availableSubcategories={availableSubcategories}
          onCategoryChange={onCategoryChange}
          onSubcategoryChange={onSubcategoryChange}
        />
      )}
    </div>
  );
};

const MobileFilters = ({
  selectedCategory,
  selectedSubcategory,
  availableSubcategories,
  onCategoryChange,
  onSubcategoryChange,
}: {
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  availableSubcategories: string[];
  onCategoryChange: (category: string | null) => void;
  onSubcategoryChange: (subcategory: string | null) => void;
}) => {
  const groupedMcsoundsSubcategories = useMemo(() =>
    selectedCategory === 'mcsounds' ? groupMcsoundsSubcategories(availableSubcategories) : [],
    [availableSubcategories, selectedCategory]
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" className="pixel-corners">
          <IconFilter className="h-4 w-4" />
          <span className="sr-only">Filter</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] pixel-corners">
        <div className="h-full py-4 space-y-4">
          <h3 className="text-lg font-vt323 mb-2">
            Filter by Category
          </h3>
          <div className="flex flex-col gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              onClick={() => onCategoryChange(null)}
              className="justify-start pixel-corners"
            >
              All
            </Button>
            <Button
              variant={selectedCategory === 'music' ? 'default' : 'outline'}
              onClick={() => onCategoryChange('music')}
              className="justify-start pixel-corners"
            >
              <IconMusic className="h-4 w-4 mr-2" />
              Music
            </Button>
            <Button
              variant={selectedCategory === 'sfx' ? 'default' : 'outline'}
              onClick={() => onCategoryChange('sfx')}
              className="justify-start pixel-corners"
            >
              <IconFileMusic className="h-4 w-4 mr-2" />
              SFX
            </Button>
            <Button
              variant={selectedCategory === 'images' ? 'default' : 'outline'}
              onClick={() => onCategoryChange('images')}
              className="justify-start pixel-corners"
            >
              <IconPhoto className="h-4 w-4 mr-2" />
              Images
            </Button>
            <Button
              variant={selectedCategory === 'animations' ? 'default' : 'outline'}
              onClick={() => onCategoryChange('animations')}
              className="justify-start pixel-corners"
            >
              <IconVideo className="h-4 w-4 mr-2" />
              Animations
            </Button>
            <Button
              variant={selectedCategory === 'fonts' ? 'default' : 'outline'}
              onClick={() => onCategoryChange('fonts')}
              className="justify-start pixel-corners"
            >
              <IconFileText className="h-4 w-4 mr-2" />
              Fonts
            </Button>
            <Button
              variant={selectedCategory === 'presets' ? 'default' : 'outline'}
              onClick={() => onCategoryChange('presets')}
              className="justify-start pixel-corners"
            >
              <IconFileText className="h-4 w-4 mr-2" />
              Presets
            </Button>
            <Button
              variant={selectedCategory === 'minecraft-icons' ? 'default' : 'outline'}
              onClick={() => onCategoryChange('minecraft-icons')}
              className="justify-start pixel-corners"
            >
              <img src="/assets/mci_icon.png" className="h-4 w-4 mr-2" alt="MCI" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              Minecraft Icons
            </Button>
            <Button
              variant={selectedCategory === 'mcsounds' ? 'default' : 'outline'}
              onClick={() => onCategoryChange('mcsounds')}
              className="justify-start pixel-corners"
            >
              MC Sounds
            </Button>


            {selectedCategory === 'presets' && (
              <div className="mt-2 ml-2">
                <Select
                  value={selectedSubcategory || "all"}
                  onValueChange={(value) => onSubcategoryChange(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select preset type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Presets</SelectItem>
                    <SelectItem value="davinci">Davinci Resolve</SelectItem>
                    <SelectItem value="adobe">Premiere Pro & AE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedCategory === 'mcsounds' && groupedMcsoundsSubcategories.length > 0 && (
              <div className="mt-2 ml-2">
                <Select
                  value={selectedSubcategory || "all"}
                  onValueChange={(value) => onSubcategoryChange(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select sound category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">All Sounds</SelectItem>
                    {groupedMcsoundsSubcategories.map(item => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const DesktopFilters = ({
  selectedCategory,
  selectedSubcategory,
  availableSubcategories,
  onCategoryChange,
  onSubcategoryChange,
}: {
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  availableSubcategories: string[];
  onCategoryChange: (category: string | null) => void;
  onSubcategoryChange: (subcategory: string | null) => void;
}) => {
  const groupedMcsoundsSubcategories = useMemo(() =>
    selectedCategory === 'mcsounds' ? groupMcsoundsSubcategories(availableSubcategories) : [],
    [availableSubcategories, selectedCategory]
  );

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedCategory === null ? 'default' : 'outline'}
        size="sm"
        onClick={() => onCategoryChange(null)}
        className="h-10 pixel-corners"
      >
        All
      </Button>
      <Button
        variant={selectedCategory === 'music' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onCategoryChange('music')}
        className="h-10 pixel-corners"
      >
        Music
      </Button>
      <Button
        variant={selectedCategory === 'sfx' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onCategoryChange('sfx')}
        className="h-10 pixel-corners"
      >
        SFX
      </Button>
      <Button
        variant={selectedCategory === 'images' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onCategoryChange('images')}
        className="h-10 pixel-corners"
      >
        Images
      </Button>
      <Button
        variant={selectedCategory === 'animations' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onCategoryChange('animations')}
        className="h-10 pixel-corners"
      >
        Animations
      </Button>
      <Button
        variant={selectedCategory === 'fonts' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onCategoryChange('fonts')}
        className="h-10 pixel-corners"
      >
        Fonts
      </Button>
      <Button
        variant={selectedCategory === 'presets' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onCategoryChange('presets')}
        className="h-10 pixel-corners"
      >
        Presets
      </Button>
      <Button
        variant={selectedCategory === 'minecraft-icons' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onCategoryChange('minecraft-icons')}
        className="h-10 pixel-corners"
      >
        Minecraft Icons
      </Button>
      <Button
        variant={selectedCategory === 'mcsounds' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onCategoryChange('mcsounds')}
        className="h-10 pixel-corners"
      >
        MC Sounds
      </Button>



      {selectedCategory === 'presets' && (
        <Select
          value={selectedSubcategory || "all"}
          onValueChange={(value) => onSubcategoryChange(value === "all" ? null : value)}
        >
          <SelectTrigger className="h-10 w-[180px] pixel-corners">
            <SelectValue placeholder="Select preset type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Presets</SelectItem>
            <SelectItem value="davinci">Davinci Resolve</SelectItem>
            <SelectItem value="adobe">Adobe Products</SelectItem>
          </SelectContent>
        </Select>
      )}

      {selectedCategory === 'mcsounds' && groupedMcsoundsSubcategories.length > 0 && (
        <Select
          value={selectedSubcategory || "all"}
          onValueChange={(value) => onSubcategoryChange(value === "all" ? null : value)}
        >
          <SelectTrigger className="h-10 w-[200px] pixel-corners">
            <SelectValue placeholder="Select sound category" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="all">All Sounds</SelectItem>
            {groupedMcsoundsSubcategories.map(item => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default ResourceFilters;