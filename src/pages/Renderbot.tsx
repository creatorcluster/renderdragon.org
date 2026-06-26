import { motion } from 'framer-motion';
import { IconRobot, IconCommand } from '@tabler/icons-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';

interface BotCommand {
  name: string;
  description: string;
}

const commands: BotCommand[] = [
  {
    name: '!check',
    description: 'Check the copyright status of a song or YouTube video'
  },
  {
    name: '!fetch',
    description: 'Fetch detailed information about a YouTube video'
  },
  {
    name: '!thumb',
    description: 'Get the HD thumbnail of a YouTube video'
  },
  {
    name: '!youtube',
    description: 'Get detailed statistics for a YouTube channel'
  },
  {
    name: '!getid',
    description: 'Get the channel ID for a given YouTube handle and view channel stats'
  },
  {
    name: '!extract',
    description: 'Extract audio from a YouTube video and send it as an MP3 file'
  },
  {
    name: '!submit',
    description: 'Submit a file (font, SFX, music, animation) to be categorized'
  },
  {
    name: '!help',
    description: 'Show all available commands and their usage'
  },
  {
    name: '!info',
    description: 'Show information about the bot'
  }
];

const Renderbot = () => {
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
        <title>Renderbot - Discord Bot for Minecraft Content Creators</title>
        <meta name="description" content="A powerful Discord bot designed for content creators. Check copyright status, fetch video information, and manage YouTube content with simple commands." />
        <meta property="og:title" content="Renderbot - Renderdragon" />
        <meta property="og:image" content="https://renderdragon.org/ogimg/renderbot.png" />
      </Helmet>
      <Navbar />

      <main className="flex-grow pt-24 pb-16 cow-grid-bg">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              className="text-center mb-12"
              variants={itemVariants}
            >
              <div className="inline-block mb-4">
                <motion.div
                  className="p-4 bg-cow-purple/10 rounded-full"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, -5, 5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <IconRobot className="w-12 h-12 text-cow-purple" />
                </motion.div>
              </div>
              <h1 className="text-4xl md:text-5xl font-minecraftia mb-4">
                Meet <span className="text-cow-purple">Renderbot</span>
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                Your powerful Discord companion for content creation. Check copyright status, fetch video information, and manage YouTube content with simple commands.
              </p>
              <a 
                  href="https://discord.renderdragon.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="pixel-btn-primary inline-flex items-center space-x-2 pt-0 mt-0"
                >
                  <span>join discord</span>
                  <img className="w-4 h-4" src="/assets/discord_icon.png" alt="Discord" />
                </a>
            </motion.div>
            

            {/* Commands Section */}
            <motion.div variants={itemVariants}>
              <h2 className="text-2xl md:text-3xl font-minecraftia text-center mb-8">
                Available <span className="text-cow-purple">Commands</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {commands.map((command) => (
                  <motion.div
                    key={command.name}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full border-2 border-cow-purple/20 hover:border-cow-purple/40 transition-colors pixel-corners">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <IconCommand className="w-5 h-5 text-cow-purple" />
                          <span className="font-mono">{command.name}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{command.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Renderbot;