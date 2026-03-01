import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreatorPacks } from '@/hooks/useCreatorPacks';
import { useAuth } from '@/hooks/useAuth';
import CreatorPackCard from './CreatorPackCard';
import ResourceCardSkeleton from './ResourceCardSkeleton';
import { Button } from '@/components/ui/button';
import { IconPlus, IconPackage } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

const AVAILABLE_TAGS = ['music', 'renders', 'animations', 'images', 'sfx', 'fonts', 'presets', 'all-in-one'];

const CreatorPacksTab = () => {
    const { packs, isLoading } = useCreatorPacks();
    const { user } = useAuth();
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    const filteredPacks = useMemo(() => {
        if (!selectedTag) return packs;
        return packs.filter(pack => pack.tags?.includes(selectedTag));
    }, [packs, selectedTag]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, idx) => (
                    <ResourceCardSkeleton key={`cp-skel-${idx}`} />
                ))}
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-geist font-bold">Creator Packs</h2>
                    <p className="text-sm text-muted-foreground">Community-made asset packs ready to download</p>
                </div>
                {user && (
                    <div className="flex items-center gap-2">
                        <Link to="/creator-packs/manage">
                            <Button variant="outline" className="pixel-corners font-geist">
                                Manage My Packs
                            </Button>
                        </Link>
                        <Link to="/creator-packs/new">
                            <Button className="pixel-corners bg-cow-purple hover:bg-cow-purple/90 font-geist">
                                <IconPlus size={16} className="mr-2" />
                                Upload Pack
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Tag Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    onClick={() => setSelectedTag(null)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${selectedTag === null
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted font-geist'
                        }`}
                >
                    All
                </button>
                {AVAILABLE_TAGS.map(tag => (
                    <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${selectedTag === tag
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted font-geist'
                            }`}
                    >
                        {tag}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {filteredPacks.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20 bg-muted/5 rounded-xl border border-border/50 flex flex-col items-center justify-center p-6"
                >
                    <IconPackage className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-xl font-geist mb-2 font-medium">No creator packs found</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                        {selectedTag
                            ? `No packs found with the tag "${selectedTag}". Try selecting a different tag or clear the filter.`
                            : 'Be the first to share a creator pack with the community!'}
                    </p>
                    {user && !selectedTag && (
                        <Link to="/creator-packs/new">
                            <Button className="pixel-corners bg-cow-purple hover:bg-cow-purple/90">
                                <IconPlus size={16} className="mr-2" />
                                Upload Pack
                            </Button>
                        </Link>
                    )}
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredPacks.map((pack, idx) => (
                            <motion.div
                                key={pack.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                            >
                                <CreatorPackCard pack={pack} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default CreatorPacksTab;
