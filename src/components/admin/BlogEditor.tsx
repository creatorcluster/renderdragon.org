import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { IconLoader2, IconDeviceFloppy, IconEye, IconArrowLeft } from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";
import { Link, useNavigate, useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
};

export default function BlogEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Hooks must stay above authorization returns so their order is stable.
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [content, setContent] = useState("");
    const [published, setPublished] = useState(false);
    const [preview, setPreview] = useState(false);

    const loadBlog = useCallback(async (blogId: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from("blogs").select("*").eq("id", blogId).single();
            if (error) {
                toast.error("Failed to load blog");
                console.error(error);
                navigate("/admin");
            } else if (data) {
                setTitle(data.title); setSlug(data.slug); setContent(data.content || ""); setPublished(data.published || false);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load blog");
            navigate("/admin");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => { if (id) loadBlog(id); }, [id, loadBlog]);
    useEffect(() => { if (!id && title) setSlug(slugify(title)); }, [title, id]);

    // Admin Authorization Check
    const authorizedEmails = ['yamura@duck.com', 'theckie@protonmail.com', 'vovoplaygame3@gmail.com'];
    const isAuthorized = user && authorizedEmails.includes(user?.email || '');

    if (authLoading) return <div className="p-10 flex justify-center"><IconLoader2 className="animate-spin" /></div>;

    if (!user || !isAuthorized) {
        return <Navigate to="/" replace />;
    }


    const handleSave = async () => {
        if (!title || !slug || !user) {
            toast.error("Title and slug are required");
            return;
        }
        setSaving(true);

        const payload = {
            title,
            slug,
            content,
            published,
            author_id: user.id,
            updated_at: new Date().toISOString(),
        };

        try {
            if (id) {
                // Update
                const { error } = await supabase
                    .from("blogs")
                    .update(payload)
                    .eq("id", id);
                if (error) throw error;
                toast.success("Blog updated saved");
            } else {
                // Create
                const { error } = await supabase
                    .from("blogs")
                    .insert([payload]);
                if (error) throw error;
                toast.success("Blog created successfully");
                navigate("/admin"); // Redirect or clear form
            }
        } catch (e: unknown) {
            console.error("Error saving blog:", e);
            toast.error(`Error saving: ${e instanceof Error ? e.message : "Unknown error"}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><IconLoader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/admin" className="text-muted-foreground hover:text-foreground"><IconArrowLeft /></Link>
                    <h2 className="text-2xl ">{id ? "Edit Blog" : "New Blog"}</h2>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPreview(!preview)}>
                        <IconEye className="mr-2 h-4 w-4" /> {preview ? "Edit" : "Preview"}
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
                        {saving ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : <IconDeviceFloppy className="mr-2 h-4 w-4" />}
                        Save
                    </Button>
                </div>
            </div>

            {!preview ? (
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Blog Post Title" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="blog-post-slug" />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch id="published" checked={published} onCheckedChange={setPublished} />
                        <Label htmlFor="published">Published</Label>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="content">Content (Markdown)</Label>
                        <Textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="# Hello World"
                            className="font-mono min-h-[400px]"
                        />
                    </div>
                </div>
            ) : (
                <div className="border border-border p-6 rounded-md bg-background min-h-[400px]">
                    <div className="prose prose-invert max-w-none font-geist">
                        <h1>{title}</h1>
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
}
