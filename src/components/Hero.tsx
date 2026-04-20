import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { IconArrowRight, IconExternalLink, IconFolderOpen, IconMusic, IconPackage } from "@tabler/icons-react"
import { useIsMobile } from "@/hooks/use-mobile"
import * as motion from "motion/react-client"

const showcaseTracks = [
  {
    title: "Battle Edit Vibes",
    source: "https://music.youtube.com/watch?v=wNrEaISwpf4",
    thumbnail: "https://i.ytimg.com/vi/wNrEaISwpf4/hqdefault.jpg",
    category: "Background Music",
    channel: "background-music",
  },
  {
    title: "Cinematic Highlight",
    source: "https://music.youtube.com/watch?v=qfWn5herjoc",
    thumbnail: "https://i.ytimg.com/vi/qfWn5herjoc/hqdefault.jpg",
    category: "Background Music",
    channel: "background-music",
  },
  {
    title: "Smooth Montage Flow",
    source: "https://music.youtube.com/watch?v=3eh0LJHX3jk",
    thumbnail: "https://i.ytimg.com/vi/3eh0LJHX3jk/hqdefault.jpg",
    category: "Background Music",
    channel: "background-music",
  },
]

const Hero = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isMobile) return

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      setMousePosition({ x, y })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [isMobile])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        stiffness: 100,
        damping: 12,
      },
    },
  }

  const decorationVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.2,
        stiffness: 180,
        damping: 10,
      },
    },
  }

  return (
    <section
      className="relative min-h-screen flex items-center justify-center bg-background px-6 py-20 overflow-hidden"
      style={{ perspective: "1000px" }}
    >
      <div
        className="absolute inset-0 pointer-events-none transition-transform duration-300"
        style={{
          transform: `translate3d(${mousePosition.x * -35}px, ${mousePosition.y * -35}px, 0)`,
        }}
      >
        <motion.div
          className="absolute left-[9%] top-[14%] w-14 h-14 border-2 border-cow-purple/30 rounded-lg rotate-45"
          initial="hidden"
          animate="visible"
          variants={decorationVariants}
        />
        <motion.div
          className="absolute right-[11%] top-[18%] w-12 h-12 bg-cow-purple/15 rounded-full"
          initial="hidden"
          animate="visible"
          variants={decorationVariants}
        />
        <motion.div
          className="absolute left-[18%] bottom-[16%] w-10 h-10 bg-cow-purple/20 pixel-corners"
          initial="hidden"
          animate="visible"
          variants={decorationVariants}
        />
      </div>

      <motion.div
        className="relative z-10 max-w-7xl w-full"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 rounded-full border border-cow-purple/35 px-3 py-1.5 text-sm text-cow-purple font-geist mb-6 leading-none">
              <span className="inline-flex items-center justify-center h-6 px-3 rounded-full bg-cow-purple text-white text-[11px] font-bold tracking-wide shrink-0">
                NEW
              </span>
              <span className="leading-none">Music Packs On Resources Hub</span>
            </div>

            <h1
              className="text-4xl md:text-6xl font-bold text-foreground dark:text-white leading-tight"
              style={{ fontFamily: "'Montserrat', 'Inter', sans-serif", lineHeight: "1.1" }}
            >
              Find The Perfect
              <span className="block text-cow-purple mt-4">Music Pack Fast</span>
            </h1>

            <motion.p
              className="text-lg md:text-xl text-foreground/80 dark:text-white/80 mt-8 max-w-2xl"
              variants={itemVariants}
            >
              Browse embedded tracks from categorized packs, jump through sub categories with a file-style browser, and open every link instantly.
            </motion.p>

            <motion.div className="flex flex-col sm:flex-row gap-4 mt-8" variants={itemVariants}>
              <Link to="/resources?tab=creator-packs" className="pixel-btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 text-sm">
                <IconPackage className="w-4 h-4" />
                Creator Packs
                <IconArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/resources?tab=music-packs" className="pixel-btn-secondary inline-flex items-center justify-center gap-2 px-6 py-3 text-sm">
                <IconMusic className="w-4 h-4" />
                Music Packs
              </Link>
            </motion.div>

            <motion.div className="grid grid-cols-3 gap-3 mt-8 max-w-md" variants={itemVariants}>
              <div className="rounded-md border border-border bg-card/60 px-3 py-2 text-center">
                <p className="text-lg font-bold text-cow-purple">2,268</p>
                <p className="text-xs text-muted-foreground">Links</p>
              </div>
              <div className="rounded-md border border-border bg-card/60 px-3 py-2 text-center">
                <p className="text-lg font-bold text-cow-purple">Cato</p>
                <p className="text-xs text-muted-foreground">Organized</p>
              </div>
              <div className="rounded-md border border-border bg-card/60 px-3 py-2 text-center">
                <p className="text-lg font-bold text-cow-purple">Sub Cat</p>
                <p className="text-xs text-muted-foreground">Tree View</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants} className="relative">
            <div className="rounded-xl border border-cow-purple/30 bg-card/60 backdrop-blur-sm p-4 md:p-5 pixel-corners shadow-2xl shadow-cow-purple/10">
              <div className="flex items-center gap-2 mb-4">
                <IconFolderOpen className="h-4 w-4 text-cow-purple" />
                <p className="text-sm text-muted-foreground">background music / background-music</p>
              </div>

              <div className="space-y-3">
                {showcaseTracks.map((track, index) => (
                  <motion.a
                    key={track.source}
                    href={track.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="block rounded-lg border border-border bg-background/60 overflow-hidden hover:border-cow-purple/40 transition-colors"
                  >
                    <div className="flex gap-3 p-3">
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className="w-28 h-16 object-cover rounded-md"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{track.title}</p>
                        <p className="text-xs text-muted-foreground truncate mt-1">{track.category} / {track.channel}</p>
                        <div className="inline-flex items-center text-xs text-cow-purple mt-2 gap-1">
                          Open Link <IconExternalLink className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

export default React.memo(Hero)
