import React from 'react';
import { motion } from 'framer-motion';
import { IconExternalLink, IconUser } from '@tabler/icons-react';
import { CreatorPack } from '@/hooks/useCreatorPacks';
import { Link } from 'react-router-dom';

interface CreatorPackCardProps {
    pack: CreatorPack;
}

const CreatorPackCard = ({ pack }: CreatorPackCardProps) => {
    const authorName = pack.profiles?.display_name || pack.profiles?.username || 'Anonymous';
    const authorAvatar = pack.profiles?.avatar_url;

    return (
        <Link to={`/creator-packs/${pack.slug}`}>
            <motion.div
                className="pixel-card group cursor-pointer hover:border-primary transition-all duration-300 h-full flex flex-col overflow-hidden"
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {/* Cover Image */}
                <div className="relative aspect-video bg-muted/20 rounded-md overflow-hidden mb-3">
                    {pack.cover_image_url ? (
                        <img
                            src={pack.cover_image_url}
                            alt={pack.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                            <span className="text-4xl font-geist text-primary/50">{pack.title.charAt(0).toUpperCase()}</span>
                        </div>
                    )}
                </div>

                {/* Title */}
                <h3 className="text-xl font-geist mb-1 group-hover:text-primary transition-colors line-clamp-1">
                    {pack.title}
                </h3>

                {/* Small Description */}
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-grow">
                    {pack.small_description}
                </p>

                {/* Tags */}
                {pack.tags && pack.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {pack.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                {tag}
                            </span>
                        ))}
                        {pack.tags.length > 3 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                +{pack.tags.length - 3}
                            </span>
                        )}
                    </div>
                )}

                {/* Footer: Author + Link */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                        {authorAvatar ? (
                            <img src={authorAvatar} alt={authorName} className="w-5 h-5 rounded-full" />
                        ) : (
                            <IconUser size={16} className="text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground truncate">{authorName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-primary">
                        <IconExternalLink size={14} />
                        <span>View</span>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};

export default CreatorPackCard;
