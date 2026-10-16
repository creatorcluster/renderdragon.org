import React from 'react';
import { motion } from 'framer-motion';
import { IconArrowUpRight, IconUser } from '@tabler/icons-react';
import { CreatorPack } from '@/hooks/useCreatorPacks';
import { Link } from 'react-router-dom';

interface CreatorPackCardProps {
    pack: CreatorPack;
}

const CreatorPackCard = ({ pack }: CreatorPackCardProps) => {
    const authorName = pack.profiles?.display_name || pack.profiles?.username || 'Anonymous';
    const authorAvatar = pack.profiles?.avatar_url;
    const visibleTags = (pack.tags ?? []).slice(0, 3);
    const extraTags = (pack.tags?.length ?? 0) - visibleTags.length;

    return (
        <Link
            to={`/creator-packs/${pack.slug}`}
            className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
            <motion.article
                className="group relative flex h-full flex-col overflow-hidden border border-border bg-card transition-colors duration-200 hover:border-primary/60"
                whileHover={{ y: -4 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {/* Cover — full bleed */}
                <div className="relative aspect-video overflow-hidden bg-muted">
                    {pack.cover_image_url ? (
                        <img
                            src={pack.cover_image_url}
                            alt={pack.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/25 to-primary/5">
                            <span className="font-heading text-5xl text-primary/50">
                                {pack.title.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="space-y-1">
                        <h3 className="font-heading text-lg font-semibold leading-snug line-clamp-1 transition-colors group-hover:text-primary">
                            {pack.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {pack.small_description}
                        </p>
                    </div>

                    {visibleTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {visibleTags.map((tag) => (
                                <span
                                    key={tag}
                                    className="border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                                >
                                    {tag}
                                </span>
                            ))}
                            {extraTags > 0 && (
                                <span className="border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                    +{extraTags}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                        <div className="flex min-w-0 items-center gap-2">
                            {authorAvatar ? (
                                <img
                                    src={authorAvatar}
                                    alt={authorName}
                                    className="h-6 w-6 flex-shrink-0 rounded-full object-cover"
                                />
                            ) : (
                                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                                    <IconUser size={13} className="text-muted-foreground" />
                                </span>
                            )}
                            <span className="truncate text-xs text-muted-foreground">{authorName}</span>
                        </div>
                        <span className="flex flex-shrink-0 items-center gap-1 text-xs font-medium text-primary">
                            View
                            <IconArrowUpRight size={14} />
                        </span>
                    </div>
                </div>
            </motion.article>
        </Link>
    );
};

export default CreatorPackCard;
