import React from "react"
import { motion } from 'framer-motion'

const stats = [
  { value: "5000+", label: "Free resources", sub: "music, SFX, fonts, presets, more" },
  { value: "12+", label: "Creator tools", sub: "generators, checkers, renderers" },
  { value: "0", label: "Ads. Paywalls.", sub: "just open and use" },
]

const WhySection = () => {
  return (
    <section className="py-20 md:py-28 bg-background border-y border-border">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14 md:mb-20 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-foreground">
            Why <span className="text-primary">RenderDragon</span>?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
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
              className="relative rounded-xl border border-border bg-card p-7 md:p-8"
            >
              <div className="text-4xl md:text-5xl font-semibold text-primary mb-3 leading-none tracking-tight">
                {stat.value}
              </div>
              <div className="text-lg md:text-xl font-medium text-foreground mb-1">
                {stat.label}
              </div>
              <div className="text-sm text-muted-foreground">
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
