import React from 'react';
import { IconQuote } from '@tabler/icons-react';
import { motion } from 'framer-motion';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
}

const testimonialsData: Testimonial[] = [
  {
    id: 1,
    name: "yFury",
    role: 'YouTuber',
    content: 'RenderDragon is a fantastic resource for any creator. I use it all the time for my videos!',
  },
  {
    id: 2,
    name: "Jkingnick",
    role: 'Designer',
    content: 'The assets on RenderDragon are top-notch. They save me a ton of time and effort.',
  },
  {
    id: 3,
    name: "AlphaReturns",
    role: 'Editor',
    content: 'I love the variety of resources available. It\'s my go-to for all my editing needs.',
  },
  {
    id: 4,
    name: "ItsProger",
    role: 'Minecraft YouTuber and Thumbnail Designer',
    content: "I really like renderdragon, it's one of the only and best websites for Minecraft content creators. I really like the style, assets, tools and the whole team working on this amazing project. I'll use it for every single video that I make in the future",
  }
];

const Testimonials = () => {

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-minecraftia text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-6 text-foreground leading-tight"
          >
            What <span className="text-cow-purple">Creators</span> Say
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-vt323 text-xl md:text-2xl text-foreground/70 leading-tight"
          >
            Don't take our word for it — hear it from the people making the content.
          </motion.p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
          {testimonialsData.map((testimonial) => (
            <motion.div
              key={testimonial.id}
              variants={item}
              className="pixel-card bg-card border-2 border-border p-6 relative"
            >
              <IconQuote className="absolute top-4 right-4 text-cow-purple/15 w-12 h-12" />

              <div className="flex items-center gap-4 mb-5 pb-5 border-b-2 border-dashed border-border relative">
                <div className="w-14 h-14 overflow-hidden border-2 border-cow-purple pixel-corners">
                  <img
                    src={`/assets/${testimonial.name}.jpg`}
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div>
                  <h3 className="font-vt323 text-xl text-foreground uppercase tracking-wider">
                    {testimonial.name}
                  </h3>
                  <p className="font-vt323 text-sm text-cow-purple">
                    {testimonial.role}
                  </p>
                </div>
              </div>

              <blockquote>
                <p className="font-vt323 text-lg md:text-xl text-foreground/85 leading-snug">
                  "{testimonial.content}"
                </p>
              </blockquote>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default React.memo(Testimonials);