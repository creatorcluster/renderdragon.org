import React from 'react';
import { motion } from 'framer-motion';
import { IconArrowRight } from '@tabler/icons-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cardVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: 'easeOut',
    },
  }),
};

const partners = [
  {
    name: "Creators' Kingdom",
    description: 'A community for creators to collaborate and grow together.',
    logo: "/assets/ca.png",
    url: "https://bsky.app/profile/creatorskingdom.bsky.social",
  },
  {
    name: "Proger's Kitchen",
    description: 'A place for Minecraft content creators to share their creations and get feedback.',
    logo: "/assets/progerskitchen.webp",
    url: "https://discord.gg/wXhHe5bVgz",
  },
  {
    name: "Moon SMP",
    description: 'A friendly and welcoming Minecraft SMP server.',
    logo: "/assets/image.png",
    url: "https://discord.gg/Vj5K9efp7G",
  },
];

const Partnership = () => {
  return (
    <section className="relative py-20 md:py-28 bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none cow-grid-bg opacity-60" />

      <div className="relative container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 md:mb-16 max-w-3xl mx-auto"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-foreground">
            Our <span className="text-primary">Partners</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            Communities we work with to make RenderDragon better for everyone.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((partner, i) => (
            <motion.div
              key={partner.name}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="group"
            >
              <a
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60"
              >
                <div className="flex flex-col items-center text-center h-full">
                  <div className="relative mb-5">
                    <div className="w-24 h-24 rounded-xl border border-border overflow-hidden group-hover:scale-105 transition-transform">
                      <img
                        src={partner.logo}
                        alt={`${partner.name} logo`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 rounded-lg bg-primary p-1.5 text-primary-foreground">
                      <IconArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h3 className="text-xl font-medium text-foreground mb-2">
                    {partner.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-grow">
                    {partner.description}
                  </p>
                </div>
              </a>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-14"
        >
          <a
            href="/contact"
            className="inline-flex items-center rounded-lg border border-border px-5 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-accent"
          >
            Become a partner
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default React.memo(Partnership);
