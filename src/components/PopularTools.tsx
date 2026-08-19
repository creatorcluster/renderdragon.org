import React from "react"
import { Link } from "react-router-dom"
import { motion } from 'framer-motion'
import { IconArrowRight, IconBrandYoutube, IconDownload, IconMusic, IconPhoto, IconUser } from '@tabler/icons-react'

type Tool = {
  id: number;
  title: string;
  description: string;
  icon: typeof IconMusic;
  path: string;
  hoverIcon?: typeof IconBrandYoutube;
  hoverImage?: string;
  backgroundImage?: string;
};

const tools: Tool[] = [
  {
    id: 1,
    title: 'YouTube Tools',
    description: 'Grab thumbnails, peek at analytics, and download videos for reference.',
    icon: IconDownload,
    hoverIcon: IconBrandYoutube,
    path: '/youtube-downloader',
  },
  {
    id: 2,
    title: 'Background Gen',
    description: 'Generate stunning, unique backgrounds for your thumbnails in seconds.',
    icon: IconPhoto,
    backgroundImage: '/assets/minecraft-pattern-background-1920x1080.png',
    path: '/background-generator',
  },
  {
    id: 3,
    title: 'Player Renderer',
    description: 'Render a 3D model of any Minecraft player skin. Pose it. Screenshot it.',
    icon: IconUser,
    hoverImage: 'https://vzge.me/face/1024/codersoft',
    path: '/player-renderer',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } }
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
          <p className="font-jetbrains-mono text-xl md:text-2xl text-foreground/70 leading-tight">
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
                   className={`group relative block h-full pixel-card bg-card hover:bg-cow-purple/5 border-2 border-border hover:border-cow-purple p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cow-purple/20 ${tool.backgroundImage ? 'overflow-hidden' : ''}`}
                 >
                   {tool.backgroundImage && <>
                     <img src={tool.backgroundImage} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                     <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.55)_100%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                   </>}
                  <div className="flex items-start justify-between mb-5">
                   <div className="relative z-10 w-12 h-12 bg-cow-purple/15 border-2 border-cow-purple pixel-corners flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
                     <tool.icon className={`h-6 w-6 text-cow-purple transition-opacity duration-150 ${tool.hoverIcon || tool.hoverImage ? 'group-hover:opacity-0' : ''}`} stroke={2.5} />
                    {'hoverIcon' in tool && tool.hoverIcon && <tool.hoverIcon className="absolute h-6 w-6 text-red-500 opacity-0 transition-opacity duration-150 group-hover:opacity-100" stroke={2.5} />}
                    {'hoverImage' in tool && tool.hoverImage && <img src={tool.hoverImage} alt="" className="absolute h-7 w-7 rounded-sm object-cover opacity-0 transition-opacity duration-150 group-hover:opacity-100" />}
                  </div>
                   <IconArrowRight className="relative z-10 w-5 h-5 text-cow-purple opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>

                 <h3 className="relative z-10 font-jetbrains-mono text-xl md:text-2xl text-foreground mb-2 tracking-wide uppercase">
                  {tool.title}
                </h3>
                 <p className="relative z-10 font-jetbrains-mono text-base text-foreground/70 leading-snug">
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
