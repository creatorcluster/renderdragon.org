import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Helmet } from 'react-helmet-async';
import { IconMessage, IconBrandTwitter, IconTag } from '@tabler/icons-react';

import TweetGenerator from '@/components/generators/TweetGenerator';
import YouTubeCommentGenerator from '@/components/generators/YouTubeCommentGenerator';
import MinecraftNametagGenerator from '@/components/generators/MinecraftNametagGenerator';

const Generators = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Content Generators - Renderdragon</title>
        <meta name="description" content="Generate social media content, YouTube comments, and Minecraft nametags with our easy-to-use generators." />
        <meta property="og:title" content="Content Generators - Renderdragon" />
        <meta property="og:description" content="Generate social media content, YouTube comments, and Minecraft nametags with our easy-to-use generators." />
        <meta property="og:image" content="https://renderdragon.org/ogimg/generators.png" />
        <meta property="og:url" content="https://renderdragon.org/generators" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Content Generators - Renderdragon" />
        <meta name="twitter:image" content="https://renderdragon.org/ogimg/generators.png" />
      </Helmet>

      <Navbar />

      <main className="flex-grow pt-24 pb-16 cow-grid-bg">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-minecraftia mb-8 text-center">
              Content <span className="text-cow-purple">Generators</span>
            </h1>

            <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
              Create social media content, YouTube comments, and Minecraft nametags with our easy-to-use generators.
              Perfect for content creators and Minecraft players.
            </p>

            <Tabs defaultValue="tweet" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="tweet" className="flex items-center gap-2">
                  <IconBrandTwitter className="h-4 w-4" />
                  Tweet Generator
                </TabsTrigger>
                <TabsTrigger value="comment" className="flex items-center gap-2">
                  <IconMessage className="h-4 w-4" />
                  YouTube Comment
                </TabsTrigger>
                <TabsTrigger value="nametag" className="flex items-center gap-2">
                  <IconTag className="h-4 w-4" />
                  Minecraft Nametag
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tweet">
                <TweetGenerator />
              </TabsContent>

              <TabsContent value="comment">
                <YouTubeCommentGenerator />
              </TabsContent>

              <TabsContent value="nametag">
                <MinecraftNametagGenerator />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />

    </div>
  );
};

export default Generators;