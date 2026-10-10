import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { breadcrumbSchema } from "@/lib/structuredData";
import { SITE_URL } from "@/lib/site";
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
            } catch (e: unknown) {
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
                <main className="flex-grow flex items-center justify-center">
                    <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !blog) {
        return (
            <div className="min-h-screen flex flex-col">
                <main className="flex-grow pt-24 pb-16 cow-grid-bg">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="text-2xl text-red-400">Error</h1>
                        <p className="text-muted-foreground">{error || "Blog post not found"}</p>
                        <Link to="/blogs" className="text-primary hover:underline mt-4 inline-block">Back to Blogs</Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Seo
                title={`${blog.title} - Renderdragon Blog`}
                description={`Read ${blog.title} on the Renderdragon blog — free tools and resources for Minecraft content creators.`}
                path={`/blogs/${slug}`}
                type="article"
                jsonLd={[
                    {
                        "@context": "https://schema.org",
                        "@type": "BlogPosting",
                        headline: blog.title,
                        url: `${SITE_URL}/blogs/${slug}`,
                        datePublished: blog.created_at,
                        dateModified: blog.created_at,
                        image: `${SITE_URL}/ogimg.png`,
                        author: { "@type": "Person", name: author?.display_name || "Renderdragon" },
                        publisher: { "@id": `${SITE_URL}/#organization` },
                        mainEntityOfPage: `${SITE_URL}/blogs/${slug}`,
                    },
                    breadcrumbSchema([
                        { name: "Home", path: "/" },
                        { name: "Blog", path: "/blogs" },
                        { name: blog.title, path: `/blogs/${slug}` },
                    ]),
                ]}
            />


            <main className="flex-grow pt-24 pb-16 cow-grid-bg">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Link
                        to="/blogs"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
                    >
                        <IconArrowLeft className="h-4 w-4 mr-2" />
                        Back to Blogs
                    </Link>

                    <article className="bg-background backdrop-blur border border-border/50  p-6 md:p-10">
                        <header className="mb-8 border-b border-border/50 pb-8">
                            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground tracking-tight">{blog.title}</h1>
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

                         <div className="prose prose-invert max-w-none font-geist leading-relaxed
                 [&>p]:my-3 [&>p]:leading-7 [&>p:first-child]:mt-0
                 [&>h1]:hidden
                 [&>h2]:mt-8 [&>h2]:mb-3 [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:
                 [&>h3]:mt-6 [&>h3]:mb-2 [&>h3]:text-xl [&>h3]:font-medium [&>h3]:
                [&>ul]:my-6 [&>ol]:my-6 [&_li]:mb-2
                [&_a]:text-primary [&_a]:underline hover:[&_a]:text-primary/80
                [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-md [&_pre]:
                [&_code]:font-geist-mono [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded
                [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
                [&_img]:rounded-none [&_img]: [&_img]:border [&_img]:border-white/10
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
