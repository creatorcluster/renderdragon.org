import React from "react"
import { motion } from 'framer-motion'

const stats = [
  { value: "500+", label: "Free Resources", sub: "music, SFX, fonts, presets, more" },
  { value: "12+", label: "Creator Tools", sub: "generators, checkers, renderers" },
  { value: "0", label: "Ads. Paywalls.", sub: "just open and use" },
]

const WhySection = () => {
  return (
    <section className="py-20 md:py-28 bg-background border-y-4 border-cow-purple cow-grid-bg">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14 md:mb-20 max-w-3xl mx-auto">
          <h2
            className="font-minecraftia text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-6 text-foreground leading-tight"
          >
            Why <span className="text-cow-purple">RenderDragon</span>?
          </h2>
          <p className="font-vt323 text-xl md:text-2xl text-foreground/70 leading-tight">
            Every other "free resource" site makes you sign up, watch an ad, or sit through a download timer. We don't.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-background border-2 border-cow-purple/40 pixel-corners p-7 md:p-8"
            >
              <div className="font-minecraftia text-4xl md:text-5xl text-cow-purple mb-3 leading-none">
                {stat.value}
              </div>
              <div className="font-vt323 text-lg md:text-xl text-foreground uppercase tracking-wider mb-1">
                {stat.label}
              </div>
              <div className="font-vt323 text-base text-foreground/60 leading-tight">
                {stat.sub}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default React.memo(WhySection)
