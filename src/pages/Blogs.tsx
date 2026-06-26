import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Helmet } from "react-helmet-async";
import { IconLoader2 } from "@tabler/icons-react";

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    created_at: string;
    author_id: string;
}

interface Profile {
    id: string;
    display_name?: string | null;
    avatar_url?: string | null;
    username?: string | null;
}




const removeMarkdown = (markdown: string) => {
    if (!markdown) return "";
    return markdown
        .replace(/^#+\s+/gm, '') // headings
        .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
        .replace(/(\*|_)(.*?)\1/g, '$2') // italic
        .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '') // images
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // links
        .replace(/^>\s+/gm, '') // blockquotes
        .replace(/`{1,3}.*?`{1,3}/gs, '') // code
        .replace(/---\n/g, '') // horizontal rules
        .replace(/\n/g, ' ') // newlines to spaces
        .replace(/\s+/g, ' ') // multiple spaces to single
        .trim();
};

export default function Blogs() {
    // ... existing hook and render logic ...
    // (We will inject the function before component and use it inside)
    // Actually, let's just create the function outside the component
    // Wait, I need to be careful with replace_file_content with "export default function Blogs" context. 
    // I will place the function at the top level and update the content slice.

    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [profiles, setProfiles] = useState<Record<string, Profile>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const { data: blogsData, error } = await supabase
                    .from("blogs")
                    .select("*")
                    .eq("published", true)
                    .order("created_at", { ascending: false });

                if (error) {
                    console.error("Error loading blogs:", error);
                    return;
                }

                if (blogsData) {
                    setBlogs(blogsData);
                    const authorIds = Array.from(new Set(blogsData.map(b => b.author_id)));
                    if (authorIds.length > 0) {
                        const { data: profilesData } = await supabase
                            .from("profiles")
                            .select("id, display_name, avatar_url, username")
                            .in("id", authorIds);

                        if (profilesData) {
                            const profileMap: Record<string, Profile> = {};
                            profilesData.forEach(p => {
                                profileMap[p.id] = p;
                            });
                            setProfiles(profileMap);
                        }
                    }
                }
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            <Helmet>
                <title>Blogs - Renderdragon</title>
                <meta name="description" content="Read the latest news and guides from Renderdragon." />
            </Helmet>

            <Navbar />

            <main className="flex-grow pt-24 pb-16 cow-grid-bg">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-3 mb-8">
<h1 className="text-4xl md:text-5xl font-minecraftia">
                             Latest <span className="text-cow-purple">Blogs</span>
                        </h1>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <IconLoader2 className="h-8 w-8 animate-spin text-cow-purple" />
                        </div>
                    ) : blogs.length === 0 ? (
                        <div className="text-center text-muted-foreground py-20">
                            No blogs found.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {blogs.map(blog => {
                                const author = profiles[blog.author_id];
                                const name = author?.display_name || "Unknown";

                                return (
                                    <Link key={blog.id} to={`/blogs/${blog.slug}`} className="block group h-full">
                                        <Card className="h-full pixel-corners bg-card/60 backdrop-blur border-border/50 hover:border-cow-purple/50 transition-colors">
                                            <CardHeader>
                                                <CardTitle className="font-minecraftia text-xl leading-snug group-hover:text-cow-purple transition-colors">
                                                    {blog.title}
                                                </CardTitle>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={author?.avatar_url || undefined} alt={name} />
                                                        <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs text-muted-foreground">
                                                        {name} • {formatDistanceToNow(new Date(blog.created_at))} ago
                                                    </span>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-muted-foreground line-clamp-3 font-vt323">
                                                    {removeMarkdown(blog.content || "").slice(0, 150)}...
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
