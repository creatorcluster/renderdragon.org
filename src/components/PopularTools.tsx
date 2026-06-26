import React from "react"
import { Link } from "react-router-dom"
import { motion } from 'framer-motion'
import { IconArrowRight, IconDownload, IconMusic, IconRobot, IconPhoto, IconUser } from '@tabler/icons-react'

const tools = [
  {
    id: 1,
    title: 'Copyright Checker',
    description: 'Check if a song is safe to use before it gets your video copyright-striked.',
    icon: IconMusic,
    path: '/music-copyright',
  },
  {
    id: 2,
    title: 'YouTube Tools',
    description: 'Grab thumbnails, peek at analytics, and download videos for reference.',
    icon: IconDownload,
    path: '/youtube-downloader',
  },
  {
    id: 3,
    title: 'Background Gen',
    description: 'Generate stunning, unique backgrounds for your thumbnails in seconds.',
    icon: IconPhoto,
    path: '/background-generator',
  },
  {
    id: 4,
    title: 'Player Renderer',
    description: 'Render a 3D model of any Minecraft player skin. Pose it. Screenshot it.',
    icon: IconUser,
    path: '/player-renderer',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
}

const PopularTools = () => {
  return (
    <section className="relative py-20 md:py-28 bg-background">
      <div className="absolute inset-0 pointer-events-none cow-grid-bg opacity-20" />

      <div className="relative container mx-auto px-4">
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
            Creator <span className="text-cow-purple">Tools</span>
          </h2>
          <p className="font-vt323 text-xl md:text-2xl text-foreground/70 leading-tight">
            Built for the boring parts so you can focus on the fun.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {tools.map((tool) => (
            <motion.div key={tool.id} variants={itemVariants}>
              <Link
                to={tool.path}
                className="group block h-full pixel-card bg-card hover:bg-cow-purple/5 border-2 border-border hover:border-cow-purple p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cow-purple/20"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 bg-cow-purple/15 border-2 border-cow-purple pixel-corners flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
                    <tool.icon className="w-6 h-6 text-cow-purple" stroke={2.5} />
                  </div>
                  <IconArrowRight className="w-5 h-5 text-cow-purple opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>

                <h3 className="font-vt323 text-xl md:text-2xl text-foreground mb-2 tracking-wide uppercase">
                  {tool.title}
                </h3>
                <p className="font-vt323 text-base text-foreground/70 leading-snug">
                  {tool.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default React.memo(PopularTools)
