import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconSearch, IconX, IconMoodHappy } from '@tabler/icons-react';
import { MusicMood } from '@/types/music';

interface MusicMoodFilterProps {
  selectedMoods: string[];
  onMoodChange: (moods: string[]) => void;
  moodsData: MusicMood[];
}

const MusicMoodFilter = ({ selectedMoods, onMoodChange, moodsData }: MusicMoodFilterProps) => {
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

  if (allMoods.length === 0) return null;

  return (
    <div className="h-full flex flex-col bg-card/50 border border-border rounded-lg pixel-corners overflow-hidden">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-vt323 text-muted-foreground mb-2 flex items-center gap-2">
          <IconMoodHappy className="h-4 w-4 text-cow-purple" />
          Mood Filter
        </h3>
        
        <div className="relative mb-2">
          <IconSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search moods..."
            value={moodSearch}
            onChange={(e) => setMoodSearch(e.target.value)}
            className="pl-8 h-8 text-sm pixel-input"
          />
          {moodSearch && (
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
          <div className="flex items-center justify-between bg-cow-purple/10 px-2 py-1.5 rounded border border-cow-purple/20">
            <span className="text-xs text-cow-purple">
              {selectedMoods.length} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-xs text-cow-purple hover:text-cow-purple"
              onClick={clearMoods}
            >
              Clear
            </Button>
          </div>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredMoods.map(mood => (
            <div
              key={mood}
              className={`
                flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer mb-1
                transition-colors duration-150
                ${selectedMoods.includes(mood) 
                  ? 'bg-cow-purple/20 text-cow-purple' 
                  : 'hover:bg-accent/50'
                }
              `}
              onClick={() => toggleMood(mood)}
            >
              <span className="text-sm capitalize">{mood}</span>
            </div>
          ))}
          
          {filteredMoods.length === 0 && moodSearch && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No moods match your search
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MusicMoodFilter;