import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { IconSearch, IconX, IconMoodHappy, IconAlertTriangle } from '@tabler/icons-react';
import { MusicMood } from '@/types/music';

interface MusicMoodFilterProps {
  selectedMoods: string[];
  onMoodChange: (moods: string[]) => void;
  moodsData: MusicMood[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const MusicMoodFilter = ({ selectedMoods, onMoodChange, moodsData, isLoading = false, error = null, onRetry }: MusicMoodFilterProps) => {
  const [moodSearch, setMoodSearch] = useState('');

  const allMoods = useMemo(() => {
    const moodSet = new Set<string>();
    moodsData.forEach(item => {
      item.moods.forEach(mood => moodSet.add(mood));
    });
    return Array.from(moodSet).sort();
  }, [moodsData]);

  const filteredMoods = useMemo(() => {
    if (!moodSearch) return allMoods;
    const searchLower = moodSearch.toLowerCase();
    return allMoods.filter(mood => mood.toLowerCase().includes(searchLower));
  }, [allMoods, moodSearch]);

  const toggleMood = (mood: string) => {
    if (selectedMoods.includes(mood)) {
      onMoodChange(selectedMoods.filter(m => m !== mood));
    } else {
      onMoodChange([...selectedMoods, mood]);
    }
  };

  const clearMoods = () => {
    onMoodChange([]);
    setMoodSearch('');
  };

  // The panel used to return null whenever the master mood list came back empty,
  // so a failed /music_moods request hid the whole filter with no explanation.
  const hasMoods = allMoods.length > 0;
  const showBody = !isLoading && !error && hasMoods;

  return (
    <div className="h-full flex flex-col bg-card border border-border rounded-lg  overflow-hidden">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
          <IconMoodHappy className="h-4 w-4 text-primary" />
          Mood Filter
        </h3>
        
        <div className="relative mb-2">
          <IconSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search moods..."
            value={moodSearch}
            onChange={(e) => setMoodSearch(e.target.value)}
            className="pl-8 h-8 text-sm "
            disabled={!showBody}
          />
          {moodSearch && showBody && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
              onClick={() => setMoodSearch('')}
            >
              <IconX className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {selectedMoods.length > 0 && (
          <div className="flex items-center justify-between bg-primary/10 px-2 py-1.5 rounded border border-primary/20">
            <span className="text-xs text-primary">
              {selectedMoods.length} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-xs text-primary hover:text-primary"
              onClick={clearMoods}
            >
              Clear
            </Button>
          </div>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading && (
            <div className="space-y-2 py-1" aria-busy="true" aria-label="Loading moods">
              {Array.from({ length: 10 }).map((_, index) => (
                <Skeleton key={index} className="h-6 w-full" />
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className="text-center px-2 py-8 text-muted-foreground text-sm">
              <IconAlertTriangle className="h-5 w-5 mx-auto mb-2 text-destructive" />
              <p>{error}</p>
              {onRetry && (
                <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
                  Try again
                </Button>
              )}
            </div>
          )}

          {showBody && filteredMoods.map(mood => (
            <div
              key={mood}
              className={`
                flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer mb-1
                transition-colors duration-150
                ${selectedMoods.includes(mood) 
                  ? 'bg-primary/20 text-primary' 
                  : 'hover:bg-accent'
                }
              `}
              onClick={() => toggleMood(mood)}
            >
              <span className="text-sm capitalize">{mood}</span>
            </div>
          ))}
          
          {showBody && filteredMoods.length === 0 && moodSearch && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No moods match your search
            </div>
          )}

          {!isLoading && !error && !hasMoods && (
            <div className="text-center py-8 px-2 text-muted-foreground text-sm">
              No mood tags available yet.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MusicMoodFilter;