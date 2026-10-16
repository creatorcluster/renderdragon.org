import { useState } from 'react';
import { motion } from 'framer-motion';
import { IconArrowUpRight, IconPencil, IconMovie, IconCode, IconDeviceGamepad2 } from '@tabler/icons-react';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Helmet } from 'react-helmet-async';

interface Utility {
  name: string;
  description: string;
  url: string;
  category: 'graphic-design' | 'editing' | 'minecraft-shaders' | 'minecraft-mods' | 'websites';
  isFree: boolean;
}

const utilities: Utility[] = [
  {
    name: 'SkinMC',
    description: 'Website with great tools for Minecraft skins, totems, achievement maker, and more',
    url: 'https://skinmc.net/',
    category: 'websites',
    isFree: true
  },
  {
    name: 'GIMP',
    description: 'Free and open source image editor, great Photoshop alternative',
    url: 'https://www.gimp.org/',
    category: 'graphic-design',
    isFree: true
  },
  {
    name: 'Adobe Photoshop',
    description: 'Industry-standard image editing software',
    url: 'https://www.adobe.com/products/photoshop.html',
    category: 'graphic-design',
    isFree: false
  },
  {
    name: 'Photopea',
    description: 'Free online image editor with Photoshop-like features',
    url: 'https://www.photopea.com/',
    category: 'graphic-design',
    isFree: true
  },
  {
    name: 'Affinity by Canva',
    description: 'Free graphic tool, made for every type of graphic task',
    url: 'https://www.affinity.studio/',
    category: 'graphic-design',
    isFree: true
  },
  {
    name: 'Kdenlive',
    description: 'Free and open source video editor, great Premiere Pro alternative',
    url: 'https://kdenlive.org/',
    category: 'editing',
    isFree: true
  },
  {
    name: 'DaVinci Resolve',
    description: 'Professional video editing software with a generous free version',
    url: 'https://www.blackmagicdesign.com/products/davinciresolve/',
    category: 'editing',
    isFree: true
  },
  {
    name: 'Premiere Pro',
    description: 'Industry-standard video editing software',
    url: 'https://www.adobe.com/products/premiere.html',
    category: 'editing',
    isFree: false
  },
  {
    name: 'CapCut',
    description: 'Easy-to-use basic video editing software with a free version',
    url: 'https://www.capcut.com/',
    category: 'editing',
    isFree: true
  },
  {
    name: 'Complementary Shaders',
    description: 'Complementary shaders but optimized settings for thumbnails by Proger',
    url: 'https://www.mediafire.com/file/kahvc3lduezt9v0/extract_me_and_put_all_files_in_shaderpacks_folder.zip/file',
    category: 'minecraft-shaders',
    isFree: true
  },
  {
    name: 'Bloop Shaders',
    description: 'A shader aimed at maximum speed while maintaining good visuals. Scalable from low to high end computers.',
    url: 'https://modrinth.com/shader/bloop-shaders',
    category: 'minecraft-shaders',
    isFree: true
  },
  {
    name: 'Vanilletix Shaders',
    description: 'A shader pack that improves graphics while maintaining vanilla style',
    url: 'https://modrinth.com/shader/vanilletix',
    category: 'minecraft-shaders',
    isFree: true
  },
  {
    name: 'MC VHS',
    description: 'A shader that emulates the look of old VHS recordings with realistic effects',
    url: 'https://modrinth.com/shader/mc-vhs',
    category: 'minecraft-shaders',
    isFree: true
  },
  {
    name: 'Exposa Shaders',
    description: 'Shaders that aim for a nice mix of natural and fantasy visuals',
    url: 'https://modrinth.com/shader/exposa-shaders',
    category: 'minecraft-shaders',
    isFree: true
  },
  {
    name: "Seltop's NewNPC mod",
    description: 'Adds new NPCs to Minecraft with customizable skins and behaviors - great for thumbnails',
    url: 'https://modrinth.com/mod/seltops-newnpcs-mod/',
    category: 'minecraft-mods',
    isFree: true
  },
  {
    name: '3D Skin Layers',
    description: 'Adds 3D skin layers to Minecraft',
    url: 'https://modrinth.com/mod/3dskinlayers/version/GeQIXZBw',
    category: 'minecraft-mods',
    isFree: true
  },
  {
    name: 'Easy NPC',
    description: 'Adds NPCs to Minecraft with customizable skins and behaviors - alternative to NewNPC mod',
    url: 'https://modrinth.com/mod/easy-npc',
    category: 'minecraft-mods',
    isFree: true
  }
];

const Utils = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('graphic-design');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'graphic-design':
        return <IconPencil className="h-5 w-5" />;
      case 'editing':
        return <IconMovie className="h-5 w-5" />;
      case 'minecraft-shaders':
        return <img className='h-5 w-5 grayscale' src="/assets/minecraft_icon.png" alt="shader" />;
      case 'minecraft-mods':
        return <img className='h-5 w-5 grayscale' src="/assets/modrinth_icon.png" alt="mods" />;
      case 'websites':
        return <img className='h-5 w-5 grayscale' src="/assets/domain_icon.png" alt="websites" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Useful Utilities - Renderdragon</title>
        <meta name="description" content="Discover essential utilities for Minecraft content creators. Find video editing, recording, and streaming software recommendations." />
        <meta property="og:title" content="Useful Utilities - Renderdragon" />
        <meta property="og:description" content="Discover essential utilities for Minecraft content creators. Find video editing, recording, and streaming software recommendations." />
        <meta property="og:image" content="https://i.ibb.co/60Mr2Psf/Document.png" />
        <meta property="og:url" content="https://renderdragon.org/utilities" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Useful Utilities - Renderdragon" />
        <meta name="twitter:image" content="https://i.ibb.co/60Mr2Psf/Document.png" />
      </Helmet>
      
      <main className="flex-grow cow-grid-bg">
        <div className="container mx-auto px-4 py-16 pt-24">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
           <h1 className="text-4xl md:text-5xl mb-4">
            Useful <span className="text-primary">Utilities</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A curated collection of free and premium utilities to enhance your content creation workflow
          </p>
        </motion.div>

        <Tabs defaultValue="graphic-design" className="w-full" onValueChange={setSelectedCategory}>
          <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-transparent h-auto p-0">
            {['graphic-design', 'editing', 'minecraft-shaders', 'minecraft-mods', 'websites'].map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className=" data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2 h-12"
              >
                {getCategoryIcon(category)}
                <span className="capitalize">{category.replace('-', ' ')}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {['graphic-design', 'editing', 'minecraft-shaders', 'minecraft-mods', 'websites'].map((category) => (
            <TabsContent key={category} value={category}>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8"
              >
                {utilities
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <motion.div
                      key={item.name}
                      variants={itemVariants}
                      onMouseEnter={() => setHoveredCard(item.name)}
                      onMouseLeave={() => setHoveredCard(null)}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block h-full"
                      >
                        <Card className="h-full transition-all duration-300 hover:shadow-xl  border-2 border-primary/20 hover:border-primary/40">
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <span className="text-xl">{item.name}</span>
                              {item.isFree && (
                                <span className="bg-green-500/10 text-green-500 text-xs px-2 py-1 rounded-md">
                                  Free
                                </span>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground mb-4">{item.description}</p>
                            <motion.div
                              className="flex items-center text-sm font-medium text-primary"
                              animate={{
                                x: hoveredCard === item.name ? 5 : 0
                              }}
                            >
                              Visit Website
                              <IconArrowUpRight className="ml-1 h-4 w-4" />
                            </motion.div>
                          </CardContent>
                        </Card>
                      </a>
                    </motion.div>
                  ))}
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Utils;
