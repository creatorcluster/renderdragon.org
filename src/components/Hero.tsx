import React from "react"
import { Link } from "react-router-dom"
import { IconArrowRight, IconBolt } from '@tabler/icons-react'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } }
}

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background px-6 py-20 md:py-28">
      <div className="absolute inset-0 pointer-events-none cow-grid-bg opacity-50" />

      <motion.div
        className="relative z-10 max-w-5xl mx-auto text-center"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.h1
          variants={fadeUp}
          className="font-minecraftia text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.2] mb-8 text-foreground"
        >
          Stop hunting for assets.
          <br />
          <span className="text-cow-purple">Start making videos.</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="font-vt323 text-xl md:text-2xl text-foreground/80 max-w-2xl mx-auto mb-10 leading-tight"
        >
          Free music, SFX, fonts, presets, and editing tools — all in one place.
          Built for Minecraft YouTubers who'd rather film than file-cabinet.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link
            to="/resources"
            className="pixel-btn-primary group flex items-center gap-2 text-base md:text-lg"
          >
            <span>Browse Resources</span>
            <IconArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/generators"
            className="pixel-btn-secondary group flex items-center gap-2 text-base md:text-lg"
          >
            <IconBolt className="w-5 h-5" />
            <span>Try a Tool</span>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}

export default React.memo(Hero)
