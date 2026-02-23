import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconChevronRight, IconChevronDown, IconFolder, IconFolderOpen, IconSearch, IconVolume, IconX } from '@tabler/icons-react';

interface McSoundsBrowserProps {
  subcategories: string[];
  selectedSubcategory: string | null;
  onSubcategoryChange: (subcategory: string | null) => void;
  resourceCount?: Record<string, number>;
}

interface CategoryNode {
  name: string;
  fullPath: string;
  children: CategoryNode[];
  isLeaf: boolean;
  count?: number;
}

const formatCategoryName = (name: string): string => {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

const buildCategoryTree = (subcategories: string[], resourceCount?: Record<string, number>): CategoryNode[] => {
  const root: CategoryNode = { name: '', fullPath: '', children: [], isLeaf: false };
  
  subcategories.forEach(sub => {
    const parts = sub.split('/');
    let current = root;
    let path = '';
    
    parts.forEach((part, index) => {
      path = path ? `${path}/${part}` : part;
      let child = current.children.find(c => c.name === part);
      
      if (!child) {
        child = {
          name: part,
          fullPath: path,
          children: [],
          isLeaf: index === parts.length - 1,
          count: index === parts.length - 1 ? resourceCount?.[sub] : undefined,
        };
        current.children.push(child);
      }
      
      current = child;
    });
  });
  
  const sortChildren = (node: CategoryNode) => {
    node.children.sort((a, b) => {
      if (a.isLeaf !== b.isLeaf) return a.isLeaf ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(sortChildren);
  };
  
  root.children.forEach(sortChildren);
  
  return root.children;
};

const CategoryItem = ({ 
  node, 
  level, 
  selectedPath,
  expandedPaths,
  onToggle,
  onSelect,
}: { 
  node: CategoryNode; 
  level: number;
  selectedPath: string | null;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (path: string | null) => void;
}) => {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedPaths.has(node.fullPath);
  const isSelected = selectedPath === node.fullPath;
  const paddingLeft = level * 16 + 8;
  
  const handleClick = useCallback(() => {
    if (hasChildren) {
      onToggle(node.fullPath);
    } else {
      onSelect(node.fullPath);
    }
  }, [hasChildren, node.fullPath, onToggle, onSelect]);
  
  const handleSelectClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.fullPath);
  }, [node.fullPath, onSelect]);
  
  return (
    <div className="select-none">
      <motion.div
        className={`
          flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer
          transition-colors duration-150 group
          ${isSelected 
            ? 'bg-cow-purple/20 text-cow-purple' 
            : 'hover:bg-accent/50'
          }
        `}
        style={{ paddingLeft }}
        onClick={handleClick}
        whileHover={{ x: 2 }}
        transition={{ duration: 0.15 }}
      >
        {hasChildren ? (
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <IconChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </motion.div>
        ) : (
          <div className="w-3.5 flex-shrink-0" />
        )}
        
        <div className="flex-shrink-0">
          {hasChildren ? (
            isExpanded ? (
              <IconFolderOpen className="h-4 w-4 text-yellow-500" />
            ) : (
              <IconFolder className="h-4 w-4 text-yellow-500/80" />
            )
          ) : (
            <IconFolder className="h-4 w-4 text-yellow-500/80" />
          )}
        </div>
        
        <span className="text-sm truncate flex-grow">{formatCategoryName(node.name)}</span>
        
        {node.count !== undefined && (
          <span className="text-xs text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
            {node.count}
          </span>
        )}
        
        {hasChildren && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleSelectClick}
          >
            <IconVolume className="h-3 w-3" />
          </Button>
        )}
      </motion.div>
      
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {node.children.map(child => (
              <CategoryItem
                key={child.fullPath}
                node={child}
                level={level + 1}
                selectedPath={selectedPath}
                expandedPaths={expandedPaths}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const McSoundsBrowser = ({
  subcategories,
  selectedSubcategory,
  onSubcategoryChange,
  resourceCount,
}: McSoundsBrowserProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    if (selectedSubcategory) {
      const parts = selectedSubcategory.split('/');
      const paths = new Set<string>();
      let path = '';
      parts.slice(0, -1).forEach(part => {
        path = path ? `${path}/${part}` : part;
        paths.add(path);
      });
      return paths;
    }
    return new Set();
  });
  
  const categoryTree = useMemo(() => 
    buildCategoryTree(subcategories, resourceCount),
    [subcategories, resourceCount]
  );
  
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return categoryTree;
    
    const query = searchQuery.toLowerCase();
    
    const filterNodes = (nodes: CategoryNode[]): CategoryNode[] => {
      return nodes.reduce<CategoryNode[]>((acc, node) => {
        const nameMatches = node.name.toLowerCase().includes(query);
        const filteredChildren = filterNodes(node.children);
        
        if (nameMatches || filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren,
          });
        }
        
        return acc;
      }, []);
    };
    
    return filterNodes(categoryTree);
  }, [categoryTree, searchQuery]);
  
  const handleToggle = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);
  
  const handleSelect = useCallback((path: string | null) => {
    onSubcategoryChange(path);
  }, [onSubcategoryChange]);
  
  const handleClearSelection = useCallback(() => {
    onSubcategoryChange(null);
  }, [onSubcategoryChange]);
  
  const expandAll = useCallback(() => {
    const getAllPaths = (nodes: CategoryNode[]): string[] => {
      return nodes.flatMap(node => 
        node.children.length > 0 
          ? [node.fullPath, ...getAllPaths(node.children)]
          : []
      );
    };
    setExpandedPaths(new Set(getAllPaths(categoryTree)));
  }, [categoryTree]);
  
  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set());
  }, []);
  
  const totalResources = useMemo(() => {
    return subcategories.reduce((sum, sub) => sum + (resourceCount?.[sub] || 0), 0);
  }, [subcategories, resourceCount]);
  
  return (
    <div className="h-full flex flex-col bg-card/50 border border-border rounded-lg pixel-corners overflow-hidden">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-vt323 text-muted-foreground mb-2 flex items-center gap-2">
          <IconVolume className="h-4 w-4 text-cow-purple" />
          MC Sounds Browser
        </h3>
        
        <div className="relative mb-2">
          <IconSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm pixel-input"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchQuery('')}
            >
              <IconX className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 h-7 text-xs"
            onClick={expandAll}
          >
            Expand
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 h-7 text-xs"
            onClick={collapseAll}
          >
            Collapse
          </Button>
        </div>
      </div>
      
      {selectedSubcategory && (
        <div className="px-3 py-2 bg-cow-purple/10 border-b border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground truncate flex-1">
            Selected: {formatCategoryName(selectedSubcategory.split('/').pop() || '')}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={handleClearSelection}
          >
            Clear
          </Button>
        </div>
      )}
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          <motion.div
            className={`
              flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer mb-1
              transition-colors duration-150
              ${!selectedSubcategory 
                ? 'bg-cow-purple/20 text-cow-purple' 
                : 'hover:bg-accent/50'
              }
            `}
            onClick={() => handleSelect(null)}
            whileHover={{ x: 2 }}
          >
            <div className="w-3.5" />
            <IconFolderOpen className="h-4 w-4 text-cow-purple" />
            <span className="text-sm font-medium">All Sounds</span>
            <span className="text-xs text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded ml-auto">
              {subcategories.length} categories
            </span>
          </motion.div>
          
          {filteredTree.map(node => (
            <CategoryItem
              key={node.fullPath}
              node={node}
              level={0}
              selectedPath={selectedSubcategory}
              expandedPaths={expandedPaths}
              onToggle={handleToggle}
              onSelect={handleSelect}
            />
          ))}
          
          {filteredTree.length === 0 && searchQuery && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No categories match your search
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default McSoundsBrowser;
