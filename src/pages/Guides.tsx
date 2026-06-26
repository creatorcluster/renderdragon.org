import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { IconBook } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

import GuideCardSkeleton from "@/components/skeletons/GuideCardSkeleton";

interface Guide {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  markdownUrl: string;
}

const Guides: Guide[] = [
  {
    id: 1,
    title: "Advanced Scriptwriting Guide",
    description:
      "Learn how to write ideal scripts including hooks, retains, informs, satisfies, and finally persuades the audience towards an action.",
    category: "scriptwriting",
    difficulty: "advanced",
    markdownUrl: "/guides/scriptwriting.md",
  },
  {
    id: 2,
    title: "How to use AI in Content creation",
    description:
      "Learn how to use AI tools to enhance your content creation process for free.",
    category: "artificial intelligence",
    difficulty: "intermediate",
    markdownUrl: "/guides/AI.md",
  },
  {
    id: 3,
    title: "Good question, bad question",
    description:
      "Learn how to properly ask for help and get people to notice you.",
    category: "communication",
    difficulty: "beginner",
    markdownUrl: "/guides/questions.md",
  },
  {
    id: 4,
    title: "Copyright, what's that?",
    description:
      "Learn how copyright works and how it affects your content creation process.",
    category: "copyright",
    difficulty: "intermediate",
    markdownUrl: "/guides/copyright.md",
  },
  {
    id: 5,
    title: "Things you should ask yourself when Creating Content",
    description:
      "Learn how to ask yourself the right questions to improve your content creation process.",
    category: "content creation",
    difficulty: "beginner",
    markdownUrl: "/guides/thingstoask.md",
  },
  {
    id: 6,
    title: "How to find your voice",
    description: "Learn how to find your voice and style in content creation.",
    category: "content creation",
    difficulty: "intermediate",
    markdownUrl: "/guides/voice.md",
  },
];

const GuidesPage = () => {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setGuides(Guides);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const slugFromUrl = (url: string) => {
    const parts = url.split("/");
    const file = parts[parts.length - 1];
    return file.replace(/\.md$/i, "");
  };

  const handleOpenGuide = (guide: Guide) => {
    const slug = slugFromUrl(guide.markdownUrl);
    navigate(`/guides/${slug}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-500/10 text-green-500";
      case "intermediate":
        return "bg-yellow-500/10 text-yellow-500";
      case "advanced":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Guides - Renderdragon</title>
        <meta
          name="description"
          content="Access comprehensive guides and tutorials for Minecraft content creation, including scriptwriting, editing, and AI tools."
        />
        <meta property="og:title" content="Guides - Renderdragon" />
        <meta
          property="og:description"
          content="Access comprehensive guides and tutorials for Minecraft content creation, including scriptwriting, editing, and AI tools."
        />
        <meta
          property="og:image"
          content="https://renderdragon.org/ogimg/guides.png"
        />
        <meta property="og:url" content="https://renderdragon.org/guides" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Guides - Renderdragon" />
        <meta
          name="twitter:image"
          content="https://renderdragon.org/ogimg/guides.png"
        />
      </Helmet>

      <Navbar />

      <main className="flex-grow pt-24 pb-16 cow-grid-bg">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
<h1 className="text-4xl md:text-5xl font-minecraftia mb-8 text-center">
               <span className="text-cow-purple">Minecraft</span> Guides
            </h1>

            <p
              className="text-center text-muted-foreground mb-12 max-w-xl mx-auto leading-relaxed"
              style={{ wordSpacing: "0.05em" }}
            >
              Step-by-step tutorials to help you level up your Minecraft content
              creation skills. From beginner basics to advanced techniques.
            </p>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <GuideCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {guides.map((guide) => (
                  <Card
                    key={guide.id}
                    className="pixel-corners border border-border hover:border-primary transition-all cursor-pointer"
                    onClick={() => handleOpenGuide(guide)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2">
                          <span className="px-2 py-1 rounded-md text-xs bg-blue-500/10 text-blue-500">
                            {guide.category}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-md text-xs ${getDifficultyColor(guide.difficulty)}`}
                          >
                            {guide.difficulty}
                          </span>
                        </div>
                      </div>
                      <CardTitle className="font-minecraftia text-xl">
                        {guide.title}
                      </CardTitle>
                      <CardDescription
                        className="leading-relaxed"
                        style={{ wordSpacing: "0.03em" }}
                      >
                        {guide.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-muted-foreground text-sm">
                        <IconBook className="h-4 w-4 mr-2" />
                        <span>Open Guide</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

    </div>
  );
};

export default GuidesPage;
