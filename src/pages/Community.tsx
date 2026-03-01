import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { IconPlayerPlay, IconChevronRight, IconUsers, IconStar, IconTrendingUp, IconClock, IconEye } from '@tabler/icons-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import VideoCardSkeleton from "@/components/skeletons/VideoCardSkeleton";
import ServerCardSkeleton from "@/components/skeletons/ServerCardSkeleton";

interface VideoCategory {
  id: number;
  name: string;
  description: string;
  videos: Video[];
}

interface Video {
  id: string;
  title: string;
  creator: string;
  duration: string;
  url: string;
  thumbnail: string;
  views?: string;
  rating?: number;
}

type Category = "editing" | "design" | "animation" | "assets" | "tutorials";

interface DiscordServer {
  id: number;
  name: string;
  description: string;
  members: number;
  inviteUrl: string;
  image: string;
  categories: Category[];
  featured?: boolean;
  tags?: string[];
}

const SERVERS_DATA: DiscordServer[] = [
  {
    id: 1,
    name: "Creator Coaster",
    description:
      "Creator Coaster server will be your best friend through out your content creation journey, varying from assets up to professional editors & artists that are willing to help you no matter what! No matter what you need help in, we're down to help you by having active staff & helpers that would be pleased to help!",
    members: 12500,
    inviteUrl: "https://discord.gg/uvWYV82f8J",
    image:
      "https://cdn.discordapp.com/icons/1075932452842909806/a_40d64cc9e3aabcd7b42a6027a399d2e6.webp?size=100&quality=lossless",
    categories: ["editing", "design"],
    tags: ["Active", "Helpful", "Professional"],
  },
  {
    id: 2,
    name: "Minecraft Design Hub",
    description:
      "The Minecraft Design Hub is run by qualified designers with an extensive background in the GFX industry. We enjoy making designs, playing games and helping the community. In this community, you can purchase designs from our top notch designers.",
    members: 6000,
    inviteUrl: "https://discord.gg/vYprQ9sK4v",
    image:
      "https://cdn.discordapp.com/icons/972091816004444170/f4457c7980f91b0bbbc2ecb7af0f0ecf.webp?size=100&quality=lossless",
    categories: ["design"],
    tags: ["Professional", "GFX", "Commission"],
  },
  {
    id: 3,
    name: "Thumbnailers",
    description:
      "Thumbnailers is a thriving community for Minecraft thumbnail designers. Whether you're a beginner or a pro, you'll find resources, feedback, and help to improve your skills and showcase your work. Join us to elevate your designs!",
    members: 2500,
    inviteUrl: "https://discord.gg/4Q8MwTaSyh",
    image:
      "https://cdn.discordapp.com/icons/1102968474894082081/1f868f37cb129b50e27497984a7b020d.png?size=4096",
    categories: ["design"],
    tags: ["Community", "Feedback", "Learning"],
  },
  {
    id: 4,
    name: "EditHub",
    description:
      "EditHub is the ultimate content creation hub for editors, designers, and creators looking to grow and improve. Whether you're searching for high-quality presets, assets, or expert advice, this server has everything you need in one place. Connect with like-minded individuals who are passionate about editing, content creation, and digital media.",
    members: 1500,
    inviteUrl: "https://discord.gg/rrFFMAut3r",
    image:
      "https://cdn.discordapp.com/icons/1014715191075811328/a_609aa97aad2f2726480ffe8b5b15567c.webp",
    categories: ["design", "editing"],
    tags: ["Assets", "Presets", "Community"],
  },
  {
    id: 5,
    name: "Renderdragon",
    description:
      "Our official Discord server where you can suggest assets, contact us for questions or suggestions and more. We live by our community and we'd love to hear your feedback!",
    members: 500,
    inviteUrl: "https://discord.gg/d9zxkkdBWV",
    image: "/renderdragon.png",
    categories: ["editing", "design"],
    tags: ["Official", "Feedback", "Support"],
  },
];

const generateVideoData = (
  id: string,
  title: string,
  creator: string,
  duration: string,
  views?: string,
  rating?: number,
): Video => {
  return {
    id,
    title,
    creator,
    duration,
    url: `https://www.youtube.com/watch?v=${id}`,
    thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    views,
    rating,
  };
};

const defaultVideoCategories: VideoCategory[] = [
  {
    id: 1,
    name: "How to Make Thumbnails",
    description:
      "Learn how to create eye-catching Minecraft thumbnails that get clicks",
    videos: [
      generateVideoData(
        "9QkyhxA38NU",
        "How to make CLEAN Minecraft Thumbnails! (photoshop)",
        "painpega",
        "12:17",
        "125K views",
      ),
      generateVideoData(
        "BuwyONAeqqc",
        "How To Create Minecraft Thumbnails || 2022 [UPDATED]",
        "Seltop",
        "9:00",
        "89K views",
      ),
      generateVideoData(
        "t3E7hZmfN3g",
        "How To Make CLEAN Bedwars Thumbnails! (Photoshop)",
        "painpega",
        "15:43",
        "156K views",
      ),
      generateVideoData(
        "GLxrsOQj9qs",
        "How to Make INSANE Minecraft 1v1 THUMBNAILS",
        "wkso",
        "49:50",
        "234K views",
      ),
      generateVideoData(
        "XPTlycqda2o",
        "How To Make Perfect Highlights | 3 Different Methods",
        "Seltop",
        "3:46",
        "67K views",
      ),
      generateVideoData(
        "GNEAhE8c5sM",
        "How To Make FREE Minecraft PVP Texture Pack Thumbnail (Photopea)",
        "TriplePVP",
        "15:57",
        "45K views",
      ),
      generateVideoData(
        "GfSpbUOjvLA",
        "How to make Minecraft Thumbnails BETTER",
        "ItsProger",
        "7:08",
        "78K views",
      ),
      generateVideoData(
        "tTuldtj4Y9U",
        "The COMPLETE Guide To Making The BEST Minecraft Player Renders.. (PC and Mobile)",
        "Jorge Makes Thumbnails",
        "19:32",
        "112K views",
      ),
    ],
  },
  {
    id: 2,
    name: "How to Edit in Premiere Pro",
    description:
      "Tutorials for editing Minecraft videos in Adobe Premiere Pro & After Effects",
    videos: [
      generateVideoData(
        "SAOm9_hY39I",
        "How to Edit Minecraft Videos in Premiere Pro",
        "Minecraft Motion",
        "18:42",
        "89K views",
      ),
      generateVideoData(
        "yO52Tx60Keg",
        "Premiere Pro Tutorial for Beginners 2025 - Everything You NEED to KNOW! (UPDATED)",
        "Vince Opra",
        "28:58",
        "445K views",
      ),
      generateVideoData(
        "o2hX3c3A5o8",
        "How to Edit VIRAL Videos",
        "ItsProger",
        "10:26",
        "25K views",
      ),
      generateVideoData(
        "rNJMh4lHxp4",
        "After Effects For Beginners 2025 | Everything You NEED to KNOW!",
        "Vince Opra",
        "17:46",
        "234K views",
      ),
      generateVideoData(
        "Lx6c1z2z3Y",
        "How to Edit Minecraft Videos Like a PRO!",
        "ItsProger",
        "22:15",
        "189K views",
      ),
      generateVideoData(
        "Mx7c8d9e0f",
        "Advanced Color Grading for Minecraft Videos",
        "Vince Opra",
        "15:30",
        "98K views",
      ),
    ],
  },
  {
    id: 3,
    name: "Animation & Motion Graphics",
    description:
      "Learn to create stunning animations and motion graphics for your videos",
    videos: [
      generateVideoData(
        "Ab1c2d3e4f",
        "Minecraft Animation Tutorial for Beginners",
        "Black Plasma Studio",
        "25:40",
        "567K views",
      ),
      generateVideoData(
        "Gh5i6j7k8l",
        "How to Make Smooth Camera Movements",
        "Element Animation",
        "18:22",
        "234K views",
      ),
      generateVideoData(
        "Mn9o0p1q2r",
        "Cinema 4D for Minecraft Animators",
        "Slamacow",
        "32:15",
        "445K views",
      ),
    ],
  },
];

const formatMemberCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

const JoinServerIcon = () => (
  <svg className="w-5 h-5 ml-2" viewBox="0 0 127.14 96.36" fill="currentColor">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
  </svg>
);

const Community = () => {
  const [videoCategories, setVideoCategories] = useState<VideoCategory[]>([]);
  const [servers, setServers] = useState<DiscordServer[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [openCategories, setOpenCategories] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVideoCategories(defaultVideoCategories);
      setServers(SERVERS_DATA);
      setOpenCategories([1]);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const toggleCategory = (categoryId: number) => {
    setOpenCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const handleJoinServer = (server: DiscordServer) => {
    window.open(server.inviteUrl, "_blank");
    toast.success(`Opening invite to ${server.name}`, {
      description: "You'll be redirected to Discord",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Community - Renderdragon</title>
        <meta
          name="description"
          content="Join our community of Minecraft content creators. Find helpful tutorials, guides, and Discord servers to connect with other creators."
        />
        <meta property="og:title" content="Community - Renderdragon" />
        <meta
          property="og:description"
          content="Join our community of Minecraft content creators. Find helpful tutorials, guides, and Discord servers to connect with other creators."
        />
        <meta
          property="og:image"
          content="https://renderdragon.org/ogimg/community.png"
        />
        <meta property="og:url" content="https://renderdragon.org/community" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Community - Renderdragon" />
        <meta
          name="twitter:image"
          content="https://renderdragon.org/ogimg/community.png"
        />
      </Helmet>

      <Navbar />

      <main className="flex-grow pt-24 pb-16 cow-grid-bg">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Tabs defaultValue="videos" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-12 bg-background/80 backdrop-blur-sm border border-border p-1 rounded-lg">
                <TabsTrigger
                  value="videos"
                  className="text-lg font-vt323 data-[state=active]:bg-cow-purple data-[state=active]:text-white transition-all"
                >
                  <IconPlayerPlay className="w-5 h-5 mr-2" />
                  Tutorials
                </TabsTrigger>
                <TabsTrigger
                  value="servers"
                  className="text-lg font-vt323 data-[state=active]:bg-cow-purple data-[state=active]:text-white transition-all"
                >
                  <IconUsers className="w-5 h-5 mr-2" />
                  Servers
                </TabsTrigger>
              </TabsList>

              <TabsContent value="videos">
                {isLoading ? (
                  <div className="space-y-8">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="pixel-corners border border-border rounded-lg overflow-hidden bg-card/50 backdrop-blur-sm"
                      >
                        <div className="bg-card p-6">
                          <Skeleton className="h-10 w-1/3 mb-3" />
                          <Skeleton className="h-5 w-2/3" />
                        </div>
                        <div className="p-6 bg-background/60">
                          <div className="flex overflow-x-auto pb-4 space-x-4 custom-scrollbar">
                            {[...Array(4)].map((_, j) => (
                              <VideoCardSkeleton key={j} />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {videoCategories.map((category) => (
                      <div
                        key={category.id}
                        className="border border-border rounded-lg overflow-hidden bg-card/50 backdrop-blur-sm"
                      >
                        <Collapsible
                          open={openCategories.includes(category.id)}
                          onOpenChange={() => toggleCategory(category.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <div className="bg-card p-4 flex justify-between items-center cursor-pointer hover:bg-accent/30 transition-colors">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <h2 className="text-2xl font-vt323">
                                    {category.name}
                                  </h2>
                                  <Badge
                                    variant="secondary"
                                    className="bg-cow-purple/10 text-cow-purple"
                                  >
                                    {category.videos.length} videos
                                  </Badge>
                                </div>
                                <p className="text-muted-foreground text-sm mt-1">
                                  {category.description}
                                </p>
                              </div>
                              <IconChevronRight
                                className={`h-5 w-5 transition-transform duration-200 ${openCategories.includes(category.id)
                                    ? "transform rotate-90"
                                    : ""
                                  }`}
                              />
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-4 bg-background/60">
                              <div className="flex overflow-x-auto pb-4 space-x-4 custom-scrollbar">
                                {category.videos.map((video) => (
                                  <div
                                    key={video.id}
                                    className="min-w-[280px] max-w-[280px] bg-card border border-border rounded-lg overflow-hidden cursor-pointer hover:border-cow-purple transition-all group"
                                    onClick={() => setSelectedVideo(video)}
                                  >
                                    <div className="relative">
                                      <img
                                        src={video.thumbnail}
                                        alt={video.title}
                                        className="w-full h-[157px] object-cover"
                                        loading="lazy"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40"
                                        >
                                          <IconPlayerPlay
                                            className="h-5 w-5 text-white"
                                            fill="white"
                                          />
                                          <span className="sr-only">Play</span>
                                        </Button>
                                      </div>
                                      <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                                        {video.duration}
                                      </div>
                                    </div>

                                    <div className="p-3">
                                      <h3 className="font-medium line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                                        {video.title}
                                      </h3>

                                      <div className="flex items-center text-sm text-muted-foreground">
                                        <span>{video.creator}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="servers">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <ServerCardSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {servers.map((server) => (
                        <div
                          key={server.id}
                          className="bg-card border border-border rounded-lg overflow-hidden p-6 flex flex-col h-full hover:shadow-lg hover:shadow-cow-purple/10 transition-all"
                        >
                          <div className="flex items-center gap-4 mb-4">
                            {server.image && (
                              <div className="flex-shrink-0">
                                <img
                                  src={server.image}
                                  alt={server.name}
                                  className="w-16 h-16 rounded-xl object-cover ring-2 ring-border group-hover:ring-cow-purple/30 transition-all"
                                  loading="lazy"
                                />
                              </div>
                            )}

                            <div className="flex flex-col">
                              <h3 className="text-xl font-vt323">
                                {server.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex gap-2">
                                  {server.categories.map((category) => (
                                    <Badge
                                      key={category}
                                      variant="secondary"
                                      className="capitalize text-xs"
                                    >
                                      {category}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <p className="text-muted-foreground flex-grow mb-4 text-sm leading-relaxed">
                            {server.description}
                          </p>

                          <div className="flex items-center justify-between mb-4">
                            <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs flex items-center">
                              <IconUsers className="h-3 w-3 mr-1" />
                              {formatMemberCount(server.members)} members
                            </span>
                          </div>

                          <Button
                            onClick={() => handleJoinServer(server)}
                            className="w-full pixel-btn-primary flex items-center justify-center"
                          >
                            Join Server
                            <JoinServerIcon />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />


      {/* Video Dialog */}
      <Dialog
        open={!!selectedVideo}
        onOpenChange={(open) => !open && setSelectedVideo(null)}
      >
        <DialogContent className="sm:max-w-5xl pixel-corners overflow-hidden max-h-[90vh] custom-scrollbar bg-background/95 backdrop-blur-sm">
          <DialogHeader className="pb-4 border-b border-border/50">
            <DialogTitle className="text-2xl font-vt323 text-cow-purple">
              {selectedVideo?.title}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-3 text-base">
              <Badge
                variant="secondary"
                className="bg-cow-purple/10 text-cow-purple"
              >
                {selectedVideo?.creator}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <IconClock className="w-3 h-3" />
                {selectedVideo?.duration}
              </Badge>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="video-player-container rounded-lg overflow-hidden">
              <iframe
                src={selectedVideo?.url.replace("watch?v=", "embed/")}
                title={selectedVideo?.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full aspect-video rounded-lg"
              ></iframe>
            </div>

            <Button
              className="w-full pixel-btn-primary py-3 text-base"
              onClick={() => window.open(selectedVideo?.url, "_blank")}
            >
              Watch on YouTube
              <svg
                className="w-5 h-5 ml-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
              </svg>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Community;
