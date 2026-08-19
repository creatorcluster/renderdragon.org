import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  IconVideo,
  IconCheck,
  IconHeart,
} from "@tabler/icons-react";
import { Resource } from "@/types/resources";
import { cn } from "@/lib/utils";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import AudioPlayer from "@/components/AudioPlayer";
import { getCategoryIcon, getCategoryColor } from "@/utils/resourceCategories";

interface ResourceCardProps {
  resource: Resource;
  onClick: (resource: Resource) => void;
  onCheckCopyright?: (resource: Resource) => void;
}

const getPreviewUrl = (resource: Resource) => {
  if (resource.download_url) return resource.download_url;

  if (!resource.title) return "";
  const titleLowered = resource.title.toLowerCase().replace(/ /g, "%20");
  const basePath = "https://raw.githubusercontent.com/Yxmura/resources_renderdragon/main";
  const creditPart = resource.credit ? `__${resource.credit.replace(/ /g, "_")}` : "";
  return `${basePath}/${resource.category}/${titleLowered}${creditPart}.${resource.filetype}`;
};

const ResourceCard = ({ resource, onClick, onCheckCopyright }: ResourceCardProps) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Reset image loaded state when resource changes
  useEffect(() => {
    setIsImageLoaded(false);
  }, [resource.id]);

  const { toggleFavorite, isFavorited } = useUserFavorites();
  const isFavorite = isFavorited(String(resource.id));

  const [isInView, setIsInView] = useState(false);
  const [isFontLoaded, setIsFontLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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
      ? `https://raw.githubusercontent.com/Yxmura/resources_renderdragon/main/${resource.category}/${resource.title.toLowerCase().replace(/ /g, "%20")}${resource.credit ? `__${resource.credit.replace(/ /g, "_")}` : ""}.${resource.filetype}`
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
    onCheckCopyright?.(resource);
  };

  const renderPreview = () => {
    const previewUrl = getPreviewUrl(resource);

    switch (resource.category) {
      case "images":
      case "minecraft-icons":
        return (
          <div
            onClick={handlePreviewClick}
            className="relative aspect-video bg-muted/20 rounded-md overflow-hidden mb-3 cursor-default"
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
            className="relative aspect-[4/1] bg-muted/20 rounded-md overflow-hidden mb-3 cursor-default"
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
                <div className="w-5 h-5 border-2 border-cow-purple border-t-transparent rounded-full animate-spin" />
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
            className="relative aspect-video bg-muted/5 rounded-md overflow-hidden mb-3 cursor-default flex items-center justify-center"
          >
            <AudioPlayer
              src={previewUrl}
              isInView={isInView}
              className="w-full shadow-none border-none bg-transparent p-0"
            />
          </div>
        );
      case "minecraft-music":
        return (
          <div
            onClick={handlePreviewClick}
            className="relative aspect-video bg-muted/5 rounded-md overflow-hidden mb-3 cursor-default flex items-center justify-center"
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
            className="relative aspect-video bg-muted/20 rounded-md overflow-hidden mb-3 cursor-default"
          >
            {isInView ? (
              <video
                src={previewUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/10">
                <IconVideo className="h-8 w-8 text-muted-foreground/30" />
              </div>
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
        "pixel-card group cursor-pointer hover:border-primary transition-all duration-300 h-full",
        isFavorite && "border-red-500/50",
      )}
      whileHover={{ y: -5 }}
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
              : "text-gray-400 hover:text-red-500",
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

      <motion.h3
        className="text-lg font-geist-mono mb-2 group-hover:text-primary transition-colors"
        whileHover={{ x: 5 }}
        transition={{ duration: 0.2 }}
      >
        {resource.title}
      </motion.h3>

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
