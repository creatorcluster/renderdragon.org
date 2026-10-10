import React from "react"
import { IconCheck, IconBolt, IconCloud } from '@tabler/icons-react'

const items = [
  { icon: IconCheck, label: "100% Free", sub: "No paywalls, ever" },
  { icon: IconCloud, label: "No Signup", sub: "Open and use" },
  { icon: IconBolt, label: "500+ Assets", sub: "Music, SFX, fonts, more" },
]

const TrustBar = () => {
  return (
    <section className="relative border-y border-border bg-background">
      <div className="absolute inset-0 pointer-events-none cow-grid-bg opacity-60" />
      <div className="relative container mx-auto px-4 sm:px-6 py-6 md:py-7">
        <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-center gap-3"
            >
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary/10 border border-border flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary" stroke={2} />
              </div>
              <div className="text-left min-w-0">
                <div className="text-base sm:text-lg font-medium text-foreground leading-none truncate">
                  {item.label}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground leading-none mt-1 truncate">
                  {item.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default React.memo(TrustBar)
