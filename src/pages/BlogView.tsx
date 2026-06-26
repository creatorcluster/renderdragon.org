import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import { IconArrowLeft, IconLoader2, IconCalendar, IconUser } from "@tabler/icons-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BlogPost {
    id: string;
    title: string;
    content: string;
    created_at: string;
    author_id: string;
}

interface Profile {
    display_name?: string | null;
    avatar_url?: string | null;
    username?: string | null;
}

export default function BlogView() {
    const { slug } = useParams();
    const [blog, setBlog] = useState<BlogPost | null>(null);
    const [author, setAuthor] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            if (!slug) return;
            setLoading(true);
            setError(null);
            try {
                const { data, error: dbError } = await supabase
                    .from("blogs")
                    .select("*")
                    .eq("slug", slug)
                    .eq("published", true)
                    .single();

                if (dbError) {
                    if (dbError.code === "PGRST116") {
                        setError("Blog post not found or it is a draft");
                    } else {
                        throw dbError;
                    }
                } else if (data && data.published) {
                    setBlog(data);
                    // Fetch author
                    const { data: profileData } = await supabase
                        .from("profiles")
                        .select("display_name, avatar_url, username")
                        .eq("id", data.author_id)
                        .single();
                    if (profileData) setAuthor(profileData);
                } else {
                    setError("Blog post not found");
                }
            } catch (e: any) {
                console.error("Error fetching blog:", e);
                setError("Failed to load blog post");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow flex items-center justify-center">
                    <IconLoader2 className="h-8 w-8 animate-spin text-cow-purple" />
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !blog) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow pt-24 pb-16 cow-grid-bg">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="text-2xl font-minecraftia text-red-400">Error</h1>
                        <p className="text-muted-foreground">{error || "Blog post not found"}</p>
                        <Link to="/blogs" className="text-cow-purple hover:underline mt-4 inline-block">Back to Blogs</Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Helmet>
                <title>{blog.title} - Renderdragon Blog</title>
                <meta name="description" content={`Read ${blog.title} on Renderdragon.`} />
            </Helmet>

            <Navbar />

            <main className="flex-grow pt-24 pb-16 cow-grid-bg">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Link
                        to="/blogs"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
                    >
                        <IconArrowLeft className="h-4 w-4 mr-2" />
                        Back to Blogs
                    </Link>

                    <article className="bg-background/80 backdrop-blur border border-border/50 pixel-corners p-6 md:p-10">
                        <header className="mb-8 border-b border-border/50 pb-8">
                            <h1 className="text-4xl md:text-5xl font-geist font-bold mb-6 text-foreground tracking-tight">{blog.title}</h1>
                            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground font-geist-mono">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={author?.avatar_url || undefined} />
                                        <AvatarFallback><IconUser className="w-4 h-4" /></AvatarFallback>
                                    </Avatar>
                                    <span>{author?.display_name || "Unknown Author"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <IconCalendar className="w-4 h-4" />
                                    <time dateTime={blog.created_at}>{format(new Date(blog.created_at), "MMMM d, yyyy")}</time>
                                </div>
                            </div>
                        </header>

                        <div className="prose prose-invert max-w-none font-geist leading-loose 
                [&>p]:mb-6 [&>p]:leading-7 
                [&>h1]:hidden
                [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:text-2xl [&>h2]:font-semibold
                [&>h3]:mt-8 [&>h3]:mb-3 [&>h3]:text-xl [&>h3]:font-medium
                [&>ul]:my-6 [&>ol]:my-6 [&_li]:mb-2
                [&_a]:text-cow-purple [&_a]:underline hover:[&_a]:text-cow-purple/80
                [&_pre]:bg-muted/50 [&_pre]:p-4 [&_pre]:rounded-md [&_pre]:pixel-corners
                [&_code]:font-geist-mono [&_code]:bg-muted/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded
                [&_blockquote]:border-l-4 [&_blockquote]:border-cow-purple [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
                [&_img]:rounded-none [&_img]:pixel-corners [&_img]:border [&_img]:border-white/10
                "
                        >
                            <ReactMarkdown>{blog.content}</ReactMarkdown>
                        </div>
                    </article>
                </div>
            </main>

            <Footer />
        </div>
    );
}
