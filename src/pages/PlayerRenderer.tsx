import { useState } from 'react';
import { motion } from 'framer-motion';
import { IconDownload, IconCopy, IconRefresh, IconLoader2 } from '@tabler/icons-react';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import confetti from 'canvas-confetti';
import PlayerRenderSkeleton from '@/components/skeletons/PlayerRenderSkeleton';

interface PlayerData {
  id: string;
  username: string;
}

const PlayerRenderer = () => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [technobladeMessage, setTechnobladeMessage] = useState<string | null>(null); // New state for Technoblade message

  const fetchPlayerData = async (username: string) => {
    setIsFetching(true);
    setError(null);
    setTechnobladeMessage(null); // Clear Technoblade message on new search

    // Easter egg for "technoblade"
    if (username.toLowerCase() === 'technoblade') {
      setTechnobladeMessage('Technoblade never dies!'); // Set Technoblade message
      setPlayerData({
        id: 'b876ec32e396476ba1158438d83c67d4', // Placeholder for Technoblade's skin ID
        username: 'Technoblade',
      });

      // Trigger custom particle explosion effect
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#FF0000', '#FFC0CB', '#A020F0'], // Red, Pink, Purple colors
        shapes: ['circle', 'square'],
        scalar: 0.9,
        disableForReducedMotion: true
      });

      // Show toast notification
      toast.success('Technoblade never dies!');

      setIsFetching(false);
      return;
    }

    // Easter egg for "jeb_"
    if (username.toLowerCase() === 'jeb_') {
      document.body.style.transform = 'rotate(180deg)';
      setTimeout(() => {
        document.body.style.transform = '';
      }, 5000);
      setPlayerData({
        id: '853c80ef3c3749fdaa49938b674adae6', // Placeholder for Jeb's skin ID
        username: 'jeb_',
      });
    }

    try {
      const response = await fetch(`https://playerdb.co/api/player/minecraft/${username}`);
      const data = await response.json();

      if (!data.success || data.code !== 'player.found') {
        setError('Player not found. Please check the username and try again.');
        setPlayerData(null);
        return;
      }

      setPlayerData({
        id: data.data.player.raw_id,
        username: data.data.player.username,
      });
    } catch (error) {
      setError('Failed to fetch player data. Please try again later.');
      setPlayerData(null);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    fetchPlayerData(username);
  };

  const handleDownload = async (url: string, type: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to download image');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${playerData?.username || username}-${type}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download image');
    } finally {
      setIsLoading(false);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard!');
  };

  const renderUrls = {
    mineatar: {
      body: (id: string) => `https://api.mineatar.io/body/${id}`,
      avatar: (id: string) => `https://api.mineatar.io/avatar/${id}`,
      bust: (id: string) => `https://api.mineatar.io/armor/bust/${id}/1024`,
      full: (id: string) => `https://api.mineatar.io/body/front/${id}?scale=8&overlay=true`,
    },
    vzge: {
      full: (id: string) => `https://vzge.me/frontfull/${id}`,
      face: (id: string) => `https://vzge.me/face/1024/${username}`,
    },
    nmsr: {
      front: (id: string) => `https://nmsr.nickac.dev/profile/${id}/front`,
      back: (id: string) => `https://nmsr.nickac.dev/profile/${id}/back`,
      fullbody: (id: string) => `https://nmsr.nickac.dev/fullbody/${id}`,
      bust: (id: string) => `https://nmsr.nickac.dev/bust/${id}`,
      face: (id: string) => `https://nmsr.nickac.dev/face/${id}`,
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Player Renderer - Renderdragon</title>
        <meta name="description" content="Generate and download Minecraft player renders using different rendering services." />
        <meta property="og:title" content="Player Renderer - Renderdragon" />
        <meta property="og:description" content="Generate and download Minecraft player renders using different rendering services." />
        <meta property="og:image" content="https://renderdragon.org/ogimg/player.png" />
        <meta property="og:url" content="https://renderdragon.org/player-renderer" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Player Renderer - Renderdragon" />
        <meta name="twitter:image" content="https://renderdragon.org/ogimg/player.png" />
      </Helmet>

      <Navbar />

      <main className="flex-grow pt-24 pb-16 cow-grid-bg">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <h1 className="text-4xl md:text-5xl font-minecraftia mb-4">
                Player <span className="text-cow-purple">Renderer</span>
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Generate and download Minecraft player renders using different rendering services
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="pixel-card mb-8"
            >
              <form onSubmit={handleSubmit} className="flex gap-4">
                <Input
                  type="text"
                  placeholder="Enter Minecraft username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pixel-corners"
                  disabled={isFetching}
                />
                <Button
                  type="submit"
                  variant="default"
                  className="pixel-corners"
                  disabled={!username || isFetching}
                >
                  {isFetching ? (
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Generate'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="pixel-corners"
                  onClick={() => {
                    setUsername('');
                    setPlayerData(null);
                    setError(null);
                    setTechnobladeMessage(null); // Clear Technoblade message on reset
                  }}
                  disabled={isFetching}
                >
                  <IconRefresh className="h-4 w-4" />
                </Button>
              </form>
            </motion.div>

            {/* Standard Error Message */}
            {error && !technobladeMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-8 text-center"
              >
                {error}
              </motion.div>
            )}

            {/* Technoblade Message */}
            {technobladeMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
                className="bg-pink-600 text-white px-4 py-3 rounded-md mb-8 text-center font-bold text-xl pixel-corners" // Added pixel-corners class
              >
                {technobladeMessage}
              </motion.div>
            )}

            {isFetching ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(4)].map((_, i) => <PlayerRenderSkeleton key={i} />)}
              </div>
            ) : playerData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Mineatar Renders */}
                  <div className="pixel-card flex flex-col">
                    <h1 className='text-center'>Body</h1>
                    <div className="aspect-square relative">
                      <img
                        src={renderUrls.mineatar.full(playerData.id)}
                        alt={`${playerData.username}'s full body`}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4 flex gap-2 mt-auto">
                      <Button
                        variant="default"
                        className="flex-1"
                        onClick={() => handleDownload(renderUrls.mineatar.full(playerData.id), 'body')}
                        disabled={isLoading}
                      >
                        {isLoading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconDownload className="h-4 w-4 mr-2" />}
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => copyUrl(renderUrls.mineatar.full(playerData.id))}
                      >
                        <IconCopy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="pixel-card flex flex-col">
                    <h1 className='text-center'>Head</h1>
                    <div className="aspect-square relative">
                      <img
                        src={renderUrls.nmsr.face(playerData.id)}
                        alt={`${playerData.username}'s head`}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4 flex gap-2 mt-auto">
                      <Button
                        variant="default"
                        className="flex-1"
                        onClick={() => handleDownload(renderUrls.nmsr.face(playerData.id), 'head')}
                        disabled={isLoading}
                      >
                        {isLoading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconDownload className="h-4 w-4 mr-2" />}
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => copyUrl(renderUrls.nmsr.face(playerData.id))}
                      >
                        <IconCopy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* VZGE Render */}
                  <div className="pixel-card flex flex-col">
                    <h1 className='text-center'>Bust (isometric)</h1>
                    <div className="aspect-square relative">
                      <img
                        src={renderUrls.nmsr.bust(playerData.id)}
                        alt={`${playerData.username}'s full render`}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4 flex gap-2 mt-auto">
                      <Button
                        variant="default"
                        className="flex-1"
                        onClick={() => handleDownload(renderUrls.nmsr.bust(playerData.id), 'render')}
                        disabled={isLoading}
                      >
                        {isLoading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconDownload className="h-4 w-4 mr-2" />}
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => copyUrl(renderUrls.nmsr.bust(playerData.id))}
                      >
                        <IconCopy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* NMSR Renders */}
                  <div className="pixel-card flex flex-col">
                    <h2 className='text-center'>Full Render (isometric)</h2>
                    <div className="aspect-square relative">
                      <img
                        src={renderUrls.nmsr.fullbody(playerData.id)}
                        alt={`${playerData.username}'s full body view`}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4 flex gap-2 mt-auto">
                      <Button
                        variant="default"
                        className="flex-1"
                        onClick={() => handleDownload(renderUrls.nmsr.fullbody(playerData.id), 'fullbody')}
                        disabled={isLoading}
                      >
                        {isLoading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconDownload className="h-4 w-4 mr-2" />}
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => copyUrl(renderUrls.nmsr.fullbody(playerData.id))}
                      >
                        <IconCopy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <Footer />

    </div>
  );
};

export default PlayerRenderer;