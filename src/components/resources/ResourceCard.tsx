import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  IconMusic,
  IconPhoto,
  IconVideo,
  IconFileText,
  IconFileMusic,
  IconCheck,
  IconHeart,
  IconBoxModel,
} from "@tabler/icons-react";
import { getResourceUrl, Resource } from "@/types/resources";
import { cn } from "@/lib/utils";
import { useHeartedResources } from "@/hooks/useHeartedResources";
import AudioPlayer from "@/components/AudioPlayer";

interface ResourceCardProps {
  resource: Resource;
  onClick: (resource: Resource) => void;
}

const ResourceCard = ({ resource, onClick }: ResourceCardProps) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverToPlayEnabled] = useState(() => {
    const stored = localStorage.getItem('hoverToPlay');
    return stored === null ? true : stored === 'true';
  });
  // Reset image loaded state when resource changes
  useEffect(() => {
    setIsImageLoaded(false);
  }, [resource.id]);

  const { toggleHeart, isHearted } = useHeartedResources();
  const resourceUrl = getResourceUrl(resource);
  const isFavorite = isHearted(resourceUrl);

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
    if (document.fonts.check(`1em "${fontName}"`)) return;

    const font = new FontFace(fontName, `url(${fontUrl})`);
    font
      .load()
      .then((loadedFont) => {
        document.fonts.add(loadedFont);
      })
      .catch((err) => {
        console.error(`Failed to load font "${fontName}":`, err);
      });
  }, [resource, isInView]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "music":
        return <IconMusic className="h-5 w-5" />;
      case "sfx":
        return <IconFileMusic className="h-5 w-5" />;
      case "images":
        return <IconPhoto className="h-5 w-5" />;
      case "animations":
        return <IconVideo className="h-5 w-5" />;
      case "fonts":
      case "presets":
        return <IconFileText className="h-5 w-5" />;
      case "minecraft-icons":
        return <IconBoxModel className="h-5 w-5" />;
      case "mcsounds":
        return <IconFileMusic className="h-5 w-5" />;
      default:
        return <IconFileText className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "music":
        return "bg-blue-500/10 text-blue-500";
      case "sfx":
        return "bg-yellow-500/10 text-yellow-500";
      case "images":
        return "bg-purple-500/10 text-purple-500";
      case "animations":
        return "bg-red-500/10 text-red-500";
      case "fonts":
        return "bg-green-500/10 text-green-500";
      case "presets":
        return "bg-gray-500/10 text-gray-500";
      case "minecraft-icons":
        return "bg-green-500/10 text-green-600";
      case "mcsounds":
        return "bg-teal-500/10 text-teal-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleHeart(resourceUrl);
    },
    [toggleHeart, resourceUrl],
  );

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
            <div
              className="absolute inset-0 flex items-center justify-center text-lg font-medium"
              style={{ fontFamily: resource.title }}
            >
              Aa Bb Cc
            </div>
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
      case "animations":
        return (isHovered && hoverToPlayEnabled) ? (
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
