import { motion } from 'framer-motion';
import { IconDownload, IconClipboard, IconLayout, IconBackground, IconBolt, IconExternalLink, IconBrandGithub } from '@tabler/icons-react';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';

const features = [
  {
    icon: IconClipboard,
    title: 'Copy-Paste Anywhere',
    description: 'Seamlessly copy and paste assets into any application with a single click. Works with all major design tools and editors.'
  },
  {
    icon: IconLayout,
    title: 'Simple UI',
    description: 'Clean and intuitive interface designed for efficiency. No clutter, no confusion - just the tools you need.'
  },
  {
    icon: IconBackground,
    title: 'Background Operation',
    description: 'Runs quietly in the background without interrupting your workflow. Quick access from the system tray.'
  },
  {
    icon: IconBolt,
    title: 'Efficient & Fast',
    description: 'Lightweight application optimized for speed. Minimal resource usage with maximum performance.'
  }
];

const NativeApplication = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Native Application - Renderdragon</title>
        <meta name="description" content="Download the Renderdragon native application for seamless asset management. Copy-paste assets into any application with ease." />
        <meta property="og:title" content="Native Application - Renderdragon" />
        <meta property="og:description" content="Download the Renderdragon native application for seamless asset management. Copy-paste assets into any application with ease." />
        <meta property="og:image" content="https://i.ibb.co/60Mr2Psf/Document.png" />
        <meta property="og:url" content="https://renderdragon.org/native-application" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Native Application - Renderdragon" />
        <meta name="twitter:image" content="https://i.ibb.co/60Mr2Psf/Document.png" />
      </Helmet>
      
      <main className="flex-grow pt-24 pb-16 cow-grid-bg">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl mb-4">
              <span className="text-primary">Native</span> Application
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A powerful desktop application for seamless asset management and integration with your favorite design tools
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-12"
            >
              <Card className="overflow-hidden  border-2 border-primary/20">
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <img 
                    src="/ss.png" 
                    alt="Renderdragon Native Application" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl mb-1">Renderdragon Native</h3>
                      <p className="text-sm text-muted-foreground">Available for Windows, macOS, and Linux</p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => window.open('https://github.com/Renderdragonorg/Renderdragon-native/releases', '_blank')}
                        className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 flex items-center gap-2"
                      >
                        <IconDownload className="h-4 w-4" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.open('https://github.com/Renderdragonorg/Renderdragon-native', '_blank')}
                        className=" flex items-center gap-2"
                      >
                        <IconBrandGithub className="h-4 w-4" />
                        GitHub
                        <IconExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-8"
            >
              <h2 className="text-2xl text-center mb-8">
                Key <span className="text-primary">Features</span>
              </h2>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {features.map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <Card className="h-full  border-2 border-primary/20 hover:border-primary/40 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-primary/10 text-primary">
                          <feature.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-xl mb-2">{feature.title}</h3>
                          <p className="text-muted-foreground text-sm">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>


          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NativeApplication;
