import React from 'react';
import { IconQuote } from '@tabler/icons-react';
import { motion } from 'framer-motion';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  avatar: string;
}

const testimonialsData: Testimonial[] = [
  {
    id: 1,
    name: "yFury",
    role: 'YouTuber',
    content: 'RenderDragon is a fantastic resource for any creator. I use it all the time for my videos!',
    avatar: '/assets/yFury.webp',
  },
  {
    id: 2,
    name: "Jkingnick",
    role: 'Designer',
    content: 'The assets on RenderDragon are top-notch. They save me a ton of time and effort.',
    avatar: '/assets/Jkingnick.webp',
  },
  {
    id: 3,
    name: "AlphaReturns",
    role: 'Editor',
    content: 'I love the variety of resources available. It\'s my go-to for all my editing needs.',
    avatar: '/assets/AlphaReturns.webp',
  },
  {
    id: 4,
    name: "ItsProger",
    role: 'Minecraft YouTuber and Thumbnail Designer',
    content: "I really like renderdragon, it's one of the only and best websites for Minecraft content creators. I really like the style, assets, tools and the whole team working on this amazing project. I'll use it for every single video that I make in the future",
    avatar: '/assets/ItsProger.webp',
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
            className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-foreground"
          >
            What <span className="text-primary">Creators</span> Say
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground"
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
              className="rounded-xl border border-border bg-card p-6 relative"
            >
              <IconQuote className="absolute top-4 right-4 text-primary/15 w-12 h-12" />

              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-dashed border-border relative">
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-border">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">
                    {testimonial.name}
                  </h3>
                  <p className="text-sm text-primary">
                    {testimonial.role}
                  </p>
                </div>
              </div>

              <blockquote>
                <p className="text-base md:text-lg text-foreground/90 leading-relaxed">
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
