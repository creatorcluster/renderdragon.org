import React from "react"
import { Link } from "react-router-dom"
import { motion } from 'framer-motion'
import {
  IconHeadphones, IconWand, IconBook2, IconArrowRight,
  IconMusic, IconWaveSine, IconPhoto, IconTypography
} from '@tabler/icons-react'

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
}

const cards = [
  {
    icon: IconHeadphones,
    title: "Free Resources",
    description: "Music, SFX, fonts, presets, and animations. Ready to drop into your project — no paywalls, no signups.",
    tags: ["Music", "SFX", "Images", "Fonts"],
    tagIcons: [IconMusic, IconWaveSine, IconPhoto, IconTypography],
    link: "/resources",
    cta: "Browse resources",
    accent: "from-cow-purple/10 to-cow-purple/5",
  },
  {
    icon: IconWand,
    title: "Powerful Tools",
    description: "Generators, copyright checkers, renderers. Built to skip the boring parts so you can focus on the fun.",
    tags: ["Generators", "Copyright", "Render Bot"],
    tagIcons: [IconWand, IconWaveSine, IconPhoto],
    link: "/generators",
    cta: "Explore tools",
    accent: "from-amber-500/10 to-amber-500/5",
  },
  {
    icon: IconBook2,
    title: "Learn & Grow",
    description: "Step-by-step guides from creators who actually make Minecraft content. No fluff, just signal.",
    tags: ["Guides", "Tutorials", "Tips"],
    tagIcons: [IconBook2, IconBook2, IconBook2],
    link: "/guides",
    cta: "Read guides",
    accent: "from-emerald-500/10 to-emerald-500/5",
  },
]

const ValueProps = () => {
  return (
    <section className="relative py-20 md:py-28 bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none cow-grid-bg opacity-30" />

      <div className="relative container mx-auto px-4">
        <div className="text-center mb-14 md:mb-20 max-w-3xl mx-auto">
          <h2
            className="font-minecraftia text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-6 text-foreground leading-tight"
          >
            Everything you need.
            <br />
            <span className="text-cow-purple">Nothing you don't.</span>
          </h2>
          <p className="font-vt323 text-xl md:text-2xl text-foreground/70 leading-tight">
            Three pillars. One hub. Built so you can stop searching and start shipping.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {cards.map((card) => (
            <motion.div key={card.title} variants={item}>
              <Link
                to={card.link}
                className="group block h-full pixel-card bg-card hover:bg-card/80 border-2 border-border hover:border-cow-purple p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cow-purple/20 relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-0 group-hover:opacity-100 transition-opacity`} />

                <div className="relative">
                  <div className="flex items-start mb-5">
                    <div className="w-14 h-14 bg-cow-purple/15 border-2 border-cow-purple pixel-corners flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <card.icon className="w-7 h-7 text-cow-purple" stroke={2} />
                    </div>
                  </div>

                  <h3 className="font-vt323 text-2xl md:text-3xl text-foreground mb-3 tracking-wide uppercase">
                    {card.title}
                  </h3>
                  <p className="font-vt323 text-base md:text-lg text-foreground/70 mb-6 leading-snug">
                    {card.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {card.tags.map((tag, i) => {
                      const Icon = card.tagIcons[i]
                      return (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 font-vt323 text-sm text-foreground/80 bg-background border-2 border-border pixel-corners px-2.5 py-1"
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {tag}
                        </span>
                      )
                    })}
                  </div>

                  <div className="flex items-center gap-2 font-vt323 text-lg text-cow-purple uppercase tracking-wider group-hover:gap-3 transition-all pt-2 border-t-2 border-dashed border-border">
                    {card.cta}
                    <IconArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default React.memo(ValueProps)
