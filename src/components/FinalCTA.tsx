import React from "react"
import { Link } from "react-router-dom"
import { motion } from 'framer-motion'
import { IconArrowRight, IconBrandDiscord } from '@tabler/icons-react'

const FinalCTA = () => {
  return (
    <section className="relative py-20 md:py-28 bg-background">
      <div className="absolute inset-0 pointer-events-none cow-grid-bg opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative container mx-auto px-4"
      >
        <div className="max-w-4xl mx-auto bg-cow-dark border-2 border-cow-purple pixel-corners p-10 md:p-16 text-center">
          <h2 className="font-minecraftia text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-6 text-foreground leading-tight">
            Your next video
            <br />
            <span className="text-cow-purple">starts here.</span>
          </h2>

          <p className="font-vt323 text-xl md:text-2xl text-foreground/80 mb-10 max-w-2xl mx-auto leading-tight">
            Browse the hub, run a tool, or hang out with the community. No strings, no waitlist, no watermarks.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/resources"
              className="pixel-btn-primary group flex items-center gap-2 text-base md:text-lg"
            >
              <span>Browse Resources</span>
              <IconArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="https://discord.renderdragon.org"
              target="_blank"
              rel="noopener noreferrer"
              className="pixel-btn-secondary group flex items-center gap-2 text-base md:text-lg"
            >
              <IconBrandDiscord className="w-5 h-5" />
              <span>Join Discord</span>
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

export default React.memo(FinalCTA)
