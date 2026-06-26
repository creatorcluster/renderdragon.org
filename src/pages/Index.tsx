import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import TrustBar from '@/components/TrustBar';
import ValueProps from '@/components/ValueProps';
import PopularTools from '@/components/PopularTools';
import FeaturedResources from '@/components/FeaturedResources';
import WhySection from '@/components/WhySection';
import Testimonials from '@/components/Testimonials';
import FinalCTA from '@/components/FinalCTA';
import Partnership from '@/components/Partnership';
import Footer from '@/components/Footer';

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.1 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
};

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>RenderDragon - Free Minecraft Creator Tools & Resources</title>
        <meta name="description" content="Free music, SFX, fonts, presets, and editing tools for Minecraft YouTubers. No signup, no paywalls, no watermarks." />
        <meta property="og:title" content="RenderDragon - Free Minecraft Creator Tools & Resources" />
        <meta property="og:description" content="Free music, SFX, fonts, presets, and editing tools for Minecraft YouTubers. No signup, no paywalls, no watermarks." />
        <meta property="og:image" content="https://renderdragon.org/ogimg.png" />
        <meta property="og:url" content="https://renderdragon.org" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="RenderDragon - Free Minecraft Creator Tools & Resources" />
        <meta name="twitter:image" content="https://renderdragon.org/ogimg.png" />
      </Helmet>
      <Navbar />
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
          <ValueProps />
        </motion.div>

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

        <motion.div {...fadeInUp}>
          <FinalCTA />
        </motion.div>

        <motion.div {...fadeInUp}>
          <Partnership />
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
