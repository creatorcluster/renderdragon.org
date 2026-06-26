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
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import AudioPlayer from "@/components/AudioPlayer";
import { getCategoryIcon, getCategoryColor } from "@/utils/resourceCategories";

interface ResourceCardProps {
  resource: Resource;
  onClick: (resource: Resource) => void;
}

const ResourceCard = ({ resource, onClick }: ResourceCardProps) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAuth();

  // Reset image loaded state when resource changes
  useEffect(() => {
    setIsImageLoaded(false);
  }, [resource.id]);

  const { toggleFavorite, isFavorited } = useUserFavorites();
  const isFavorite = isFavorited(String(resource.id));

  const getPreviewUrl = (resource: Resource) => {
    if (resource.download_url) return resource.download_url;

    // Fallback
    if (!resource.title) return "";
    const titleLowered = resource.title.toLowerCase().replace(/ /g, "%20");
    const basePath =
      "https://raw.githubusercontent.com/Yxmura/resources_renderdragon/main";
    const creditPart = resource.credit
      ? `__${resource.credit.replace(/ /g, "_")}`
      : "";
    return `${basePath}/${resource.category}/${titleLowered}${creditPart}.${resource.filetype}`;
  };

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

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isInView || resource.category !== "fonts" || !resource.download_url) {
      return;
    }

    const fontUrl = resource.download_url;
    const fontName = resource.title;

    // Check if font is already loaded
    if (document.fonts.check(`1em "${fontName}"`)) {
      setIsFontLoaded(true);
      return;
    }

    const font = new FontFace(fontName, `url(${fontUrl})`);
    font
      .load()
      .then((loadedFont) => {
        document.fonts.add(loadedFont);
        setIsFontLoaded(true);
      })
      .catch((err) => {
        console.error(`Failed to load font "${fontName}":`, err);
      });
  }, [resource.id, resource.download_url, isInView]);

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      toast.error("Sign in to save favorites");
      return;
    }
    toggleFavorite(String(resource.id));
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
                style={{ fontFamily: resource.title }}
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
      case "sfx":
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
        return isHovered ? (
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
        ) : (
          <div className="relative aspect-video bg-muted/10 rounded-md overflow-hidden mb-3 cursor-default flex items-center justify-center text-muted-foreground text-xs">
            <div className="flex items-center gap-2">
              <IconVideo className="h-5 w-5" />
              <span>Hover to play</span>
            </div>
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
        className="text-xl font-vt323 mb-2 group-hover:text-primary transition-colors"
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
