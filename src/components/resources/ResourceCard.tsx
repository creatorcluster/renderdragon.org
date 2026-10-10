import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  IconVideo,
  IconCheck,
  IconHeart,
  IconSunglasses,
} from "@tabler/icons-react";
import { Resource } from "@/types/resources";
import { cn } from "@/lib/utils";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import AudioPlayer from "@/components/AudioPlayer";
import HoverVideo from "@/components/HoverVideo";
import { getCategoryIcon, getCategoryColor } from "@/utils/resourceCategories";
import { RESOURCES_REPO_RAW_BASE } from "@/lib/resourcesRepo";

interface ResourceCardProps {
  resource: Resource;
  onClick: (resource: Resource) => void;
  onMusicLink?: (resource: Resource) => void;
}

const getPreviewUrl = (resource: Resource) => {
  if (resource.download_url) return resource.download_url;

  if (!resource.title) return "";
  const titleLowered = resource.title.toLowerCase().replace(/ /g, "%20");
  const basePath = RESOURCES_REPO_RAW_BASE;
  const creditPart = resource.credit ? `__${resource.credit.replace(/ /g, "_")}` : "";
  return `${basePath}/${resource.category}/${titleLowered}${creditPart}.${resource.filetype}`;
};

const ResourceCard = ({ resource, onClick, onMusicLink }: ResourceCardProps) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Reset image loaded state when resource changes
  useEffect(() => {
    setIsImageLoaded(false);
  }, [resource.id]);

  const { toggleFavorite, isFavorited } = useUserFavorites();
  const isFavorite = isFavorited(String(resource.id));

  const [isInView, setIsInView] = useState(false);
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [isFontLoaded, setIsFontLoaded] = useState(false);
  const [isLinkHovered, setIsLinkHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Debounce preview loading so fast scrolling doesn't fire a burst of
  // media requests for every card that briefly crosses the viewport.
  useEffect(() => {
    if (!isInView) {
      setIsPreviewReady(false);
      return;
    }
    const timer = setTimeout(() => setIsPreviewReady(true), 150);
    return () => clearTimeout(timer);
  }, [isInView]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    const card = cardRef.current;
    if (card) {
      observer.observe(card);
    }

    return () => {
      if (card) {
        observer.unobserve(card);
      }
    };
  }, []);

  useEffect(() => {
    let active = true;
    setIsFontLoaded(false);
    if (resource.category !== "fonts") {
      return () => { active = false; };
    }

    const fontUrl = resource.download_url || (resource.title
      ? `${RESOURCES_REPO_RAW_BASE}/${resource.category}/${resource.title.toLowerCase().replace(/ /g, "%20")}${resource.credit ? `__${resource.credit.replace(/ /g, "_")}` : ""}.${resource.filetype}`
      : "");
    if (!fontUrl) {
      return () => { active = false; };
    }

    const fontName = resource.title;

    const maybeLoadFont = () => {
      if (document.fonts.check(`12px "${fontName}"`)) {
        if (active) setIsFontLoaded(true);
        return;
      }
      let fontFace: FontFace;
      try {
        const safeFontName = fontName.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const safeFontUrl = encodeURI(fontUrl).replace(/"/g, '%22');
        fontFace = new FontFace(safeFontName, `url("${safeFontUrl}")`);
      } catch (error) {
        if (active) console.error(`Invalid font descriptor for "${fontName}":`, error);
        return;
      }
      fontFace.load().then((loadedFont) => {
        document.fonts.add(loadedFont);
        if (active) setIsFontLoaded(true);
      }).catch((error) => {
        if (active) console.error(`Failed to load font "${fontName}":`, error);
      });
    };

    if (isInView) {
      maybeLoadFont();
    } else {
      const timer = setTimeout(maybeLoadFont, 2000);
      return () => { active = false; clearTimeout(timer); };
    }
    return () => { active = false; };
  }, [resource.category, resource.title, resource.download_url, resource.credit, resource.filetype, isInView]);

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFavorite(String(resource.id));
  };

  const handleCopyrightClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onMusicLink?.(resource);
  };

  const renderPreview = () => {
    const previewUrl = getPreviewUrl(resource);

    switch (resource.category) {
      case "images":
      case "minecraft-icons":
        return (
          <div
            onClick={handlePreviewClick}
            className="relative aspect-video bg-muted/20 rounded-lg overflow-hidden mb-3 cursor-default"
          >
            <img
              src={previewUrl}
              alt={resource.title}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                isImageLoaded ? "opacity-100" : "opacity-0",
              )}
              onLoad={() => setIsImageLoaded(true)}
              loading="lazy"
            />
            {!isImageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/10">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        );
      case "fonts":
        return (
          <div
            onClick={handlePreviewClick}
            className="relative aspect-[4/1] bg-muted/20 rounded-lg overflow-hidden mb-3 cursor-default"
          >
            {isFontLoaded ? (
              <div
                className="absolute inset-0 flex items-center justify-center text-lg font-medium"
                style={{ fontFamily: `"${resource.title}"` }}
              >
                Aa Bb Cc
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        );
      case "music":
      case "sfx":
      case "mcsounds":
        return (
          <div
            onClick={handlePreviewClick}
            className="relative aspect-video bg-muted/5 rounded-lg overflow-hidden mb-3 cursor-default flex items-center justify-center"
          >
            <AudioPlayer
              src={previewUrl}
              isInView={isInView}
              className="w-full shadow-none border-none bg-transparent p-0"
            />
            {resource.category === "music" && onMusicLink && (
              <motion.button
                type="button"
                onClick={handleCopyrightClick}
                onMouseEnter={() => setIsLinkHovered(true)}
                onMouseLeave={() => setIsLinkHovered(false)}
                onFocus={() => setIsLinkHovered(true)}
                onBlur={() => setIsLinkHovered(false)}
                aria-label={`Copy a RenderBot copyright-check link for ${resource.title}`}
                className="absolute right-2 top-2 z-10 inline-flex h-9 items-center overflow-hidden rounded-md border border-primary/60 bg-primary text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                initial={false}
                animate={{ width: isLinkHovered ? 152 : 36 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <span className="flex h-full w-9 shrink-0 items-center justify-center">
                  <IconSunglasses className="h-4 w-4" aria-hidden="true" />
                </span>
                <AnimatePresence initial={false}>
                  {isLinkHovered && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      className="whitespace-nowrap pr-3 text-xs font-semibold"
                    >
                      Check copyright
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )}
          </div>
        );
      case "minecraft-music":
        return (
          <div
            onClick={handlePreviewClick}
            className="relative aspect-video bg-muted/5 rounded-lg overflow-hidden mb-3 cursor-default flex items-center justify-center"
          >
            <AudioPlayer
              src={previewUrl}
              isInView={isInView}
              className="w-full shadow-none border-none bg-transparent p-0"
            />
          </div>
        );
      case "animations":
        return (
          <div
            onClick={handlePreviewClick}
            className="relative aspect-video bg-muted/20 rounded-lg overflow-hidden mb-3 cursor-default"
          >
            <div className="absolute inset-0 flex items-center justify-center bg-muted/10">
              <IconVideo className="h-8 w-8 text-muted-foreground/30" />
            </div>
            {isInView && isPreviewReady && (
              <HoverVideo
                src={previewUrl}
                poster={resource.image_url}
                ariaLabel={`Preview of ${resource.title}`}
                className="absolute inset-0"
                focusable
                tapToPlay
              />
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      ref={cardRef}
      onClick={() => onClick(resource)}
      className={cn(
        "group h-full cursor-pointer rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60",
        isFavorite && "border-red-500/50",
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {renderPreview()}

      <div className="flex justify-between items-start mb-3">
        <motion.div
          className={`inline-flex items-center px-2 py-1 rounded-md text-xs ${getCategoryColor(resource.category)}`}
          whileHover={{ scale: 1.05 }}
        >
          {getCategoryIcon(resource.category)}
          <span className="ml-1 capitalize">
            {resource.category === "minecraft-icons"
              ? "Mcicons"
              : resource.category}
          </span>
          {resource.subcategory && (
            <span className="ml-1">({resource.subcategory})</span>
          )}
        </motion.div>

        <motion.button
          onClick={handleFavoriteClick}
          className={cn(
            "p-1 rounded-full transition-colors",
            isFavorite
              ? "text-red-500 hover:text-red-600"
              : "text-muted-foreground hover:text-red-500",
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={
            isFavorite
              ? {
                  scale: [1, 1.2, 1],
                  transition: { duration: 0.3 },
                }
              : undefined
          }
        >
          <IconHeart
            className="h-5 w-5"
            fill={isFavorite ? "currentColor" : "none"}
          />
        </motion.button>
      </div>

      <h3 className="text-base font-medium mb-2 group-hover:text-primary transition-colors">
        {resource.title}
      </h3>

      <div className="flex items-center justify-between">
        {resource.credit ? (
          <motion.div
            className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded-md inline-flex items-center"
            whileHover={{ scale: 1.05 }}
          >
            <span>Credit required</span>
          </motion.div>
        ) : (
          <motion.div
            className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-md inline-flex items-center"
            whileHover={{ scale: 1.05 }}
          >
            <IconCheck className="h-3 w-3 mr-1" />
            <span>No credit needed</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default React.memo(ResourceCard);
