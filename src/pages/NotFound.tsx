"use client";

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { IconHome, IconCompass, IconTool, IconPick } from "@tabler/icons-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";


const NotFound = () => {
  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      typeof window !== "undefined" ? window.location.pathname : "",
    );
  }, []);

  // Staggered animation for children elements
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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6 },
    },
  };

  // Minecraft block hover effect
  const blockHover = {
    scale: 1.05,
    rotate: [0, -1, 1, -1, 0],
    transition: { duration: 0.4 },
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-20 cow-grid-bg flex items-center justify-center relative overflow-hidden">
        <motion.div
          className="absolute w-8 h-8 bg-cow-purple/20 rounded-sm"
          animate={{
            x: ["-10vw", "110vw"],
            y: ["-10vh", "110vh"],
            rotate: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          style={{ top: "15%", left: "10%" }}
        />
        <motion.div
          className="absolute w-12 h-12 bg-green-500/10 rounded-sm"
          animate={{
            x: ["110vw", "-10vw"],
            y: ["20vh", "80vh"],
            rotate: [0, -360],
          }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          style={{ top: "30%", right: "20%" }}
        />
        <motion.div
          className="absolute w-10 h-10 bg-yellow-500/10 rounded-sm"
          animate={{
            x: ["50vw", "30vw"],
            y: ["-10vh", "110vh"],
            rotate: [0, 180],
          }}
          transition={{
            duration: 18,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          style={{ top: "5%", right: "40%" }}
        />

        <motion.div
          className="container mx-auto px-6 text-center max-w-2xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="text-cow-purple mb-4 relative"
            variants={itemVariants}
          >
            <motion.div
              className="text-9xl drop-shadow-lg font-minecraftia"
              animate={{
                textShadow: [
                  "0 0 8px rgba(147, 51, 234, 0.7)",
                  "0 0 16px rgba(147, 51, 234, 0.9)",
                  "0 0 8px rgba(147, 51, 234, 0.7)",
                ],
                y: [0, -10, 0],
              }}
              transition={{
                textShadow: { duration: 2, repeat: Number.POSITIVE_INFINITY },
                y: { duration: 3, repeat: Number.POSITIVE_INFINITY },
              }}
            >
              404
            </motion.div>

            <motion.div
              className="absolute -right-16 top-1/2 -translate-y-1/2 hidden md:block"
              animate={{
                rotate: [0, -20, 0],
                x: [0, -5, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
                delay: 1,
              }}
            >
              <IconPick className="h-12 w-12 text-gray-600" />
            </motion.div>
          </motion.div>

          <motion.h1
            className="text-3xl md:text-5xl mb-4 text-foreground dark:text-white"
            variants={itemVariants}
          >
            Uh oh! This chunk failed to load.
          </motion.h1>

          <motion.p
            className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto"
            variants={itemVariants}
          >
            The page you're trying to reach doesn't exist — or it may have been
            lost in the Nether. Try heading back or explore something new.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row justify-center items-center gap-4"
            variants={itemVariants}
          >
            <motion.div whileHover={blockHover} whileTap={{ scale: 0.95 }}>
              <Link
                to="/"
                className="pixel-btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm transition-all"
              >
                <IconHome className="h-5 w-5" />
                <span>Return to Home</span>
              </Link>
            </motion.div>

            <motion.div whileHover={blockHover} whileTap={{ scale: 0.95 }}>
              <Link
                to="/resources"
                className="pixel-btn-secondary inline-flex items-center gap-2 px-6 py-3 text-sm transition-all"
              >
                <IconCompass className="h-5 w-5" />
                <span>Explore Resources</span>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="mt-6 pixel-card border-dashed border-cow-purple/30 bg-background/50 px-6 py-4 relative"
            variants={itemVariants}
            whileHover={{
              boxShadow: "0 0 15px rgba(147, 51, 234, 0.3)",
              borderColor: "rgba(147, 51, 234, 0.5)",
            }}
          >
            <motion.div
              className="absolute -top-3 -left-3 w-6 h-6 bg-cow-purple/20 rounded-sm"
              animate={{ rotate: [0, 360] }}
              transition={{
                duration: 8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />
            <motion.div
              className="absolute -bottom-3 -right-3 w-6 h-6 bg-cow-purple/20 rounded-sm"
              animate={{ rotate: [360, 0] }}
              transition={{
                duration: 8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />

            <p className="text-sm text-muted-foreground">
              If you followed a broken link, feel free to{" "}
              <motion.span
                whileHover={{
                  color: "#9333ea",
                  scale: 1.05,
                }}
              >
                <Link to="/contact" className="underline underline-offset-2">
                  contact us
                </Link>
              </motion.span>{" "}
              so we can fix it.
            </p>
          </motion.div>
        </motion.div>
      </main>

      <Footer />

    </div>
  );
};

export default NotFound;
