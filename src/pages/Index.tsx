import { motion } from 'framer-motion';
import Seo from '@/components/Seo';
import { softwareApplicationSchema } from '@/lib/structuredData';
import Hero from '@/components/Hero';
import TrustBar from '@/components/TrustBar';
import PopularTools from '@/components/PopularTools';
import FeaturedResources from '@/components/FeaturedResources';
import WhySection from '@/components/WhySection';
import Testimonials from '@/components/Testimonials';
import Partnership from '@/components/Partnership';
import Footer from '@/components/Footer';

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.1 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }
};

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Seo
        title="RenderDragon - Free Minecraft Creator Tools & Resources"
        description="Free music, SFX, fonts, presets, and editing tools for Minecraft YouTubers. No signup, no paywalls, no watermarks."
        path="/"
        jsonLd={softwareApplicationSchema({
          name: "Renderdragon",
          description: "Free music, SFX, fonts, presets, and editing tools for Minecraft YouTubers. No signup, no paywalls, no watermarks.",
          path: "/",
          image: "/ogimg.png",
        })}
      />
      <main className="flex-grow">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Hero />
        </motion.div>

        <TrustBar />

        <motion.div {...fadeInUp}>
          <PopularTools />
        </motion.div>

        <motion.div {...fadeInUp}>
          <FeaturedResources />
        </motion.div>

        <motion.div {...fadeInUp}>
          <WhySection />
        </motion.div>

        <motion.div {...fadeInUp}>
          <Testimonials />
        </motion.div>

        <div className="border-t border-border" />

        <motion.div {...fadeInUp}>
          <Partnership />
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
