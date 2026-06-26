import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { IconArrowRight } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { Resource } from "@/types/resources";
import ResourceCard from "@/components/resources/ResourceCard";
import ResourceCardSkeleton from "./resources/ResourceCardSkeleton";

const FEATURED_CATEGORIES = ["music", "images", "sfx", "fonts"];

const FeaturedResources = () => {
  const [featuredResources, setFeaturedResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setIsLoading(true);

        const indexRes = await fetch("/resources.index.json");
        if (!indexRes.ok) throw new Error("Failed to fetch index");
        const index = await indexRes.json();

        const catKeys = Object.keys(index.categories || {}).filter(
          (c) => FEATURED_CATEGORIES.includes(c),
        );
        if (catKeys.length === 0) return;

        const catRes = await fetch(`/resources/${catKeys[0]}.json`);
        if (!catRes.ok) return;

        const rawItems = await catRes.json();
        const resources: Resource[] = (Array.isArray(rawItems) ? rawItems : [])
          .slice(0, 4)
          .map((item: any, idx: number) => ({
            id: item.id ?? `${catKeys[0]}-${idx}`,
            title: String(item?.title || "").trim() || `Resource ${idx + 1}`,
            category: catKeys[0] as Resource["category"],
            subcategory: item.subcategory || undefined,
            credit: item.credit || undefined,
            filetype: item.filetype || item.ext || undefined,
            download_url: item.download_url || item.url || undefined,
            preview_url: item.preview_url || undefined,
            image_url: item.image_url || undefined,
            software: item.software || undefined,
            description: item.description || undefined,
          }));

        setFeaturedResources(resources);
      } catch (error) {
        console.error("Error fetching featured resources:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.25,
      },
    },
  };

  return (
    <section className="py-20 md:py-28 bg-background border-y-4 border-cow-purple cow-grid-bg">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-14 md:mb-16 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2
            className="font-minecraftia text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-6 text-foreground leading-tight"
          >
            Featured <span className="text-cow-purple">Resources</span>
          </h2>
          <p className="font-vt323 text-xl md:text-2xl text-foreground/70 leading-tight">
            A taste of what's inside. Browse the full library anytime.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <ResourceCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {featuredResources.map((resource) => (
              <motion.div key={resource.id} variants={itemVariants}>
                <Link
                  to="/resources"
                  className="block group"
                >
                  <ResourceCard resource={resource} onClick={() => {}} />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          <Link
            to="/resources"
            className="pixel-btn-secondary inline-flex items-center space-x-2 group text-base md:text-lg"
          >
            <span>View All Resources</span>
            <IconArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default React.memo(FeaturedResources);
