import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IconPlus, IconEdit, IconTrash, IconEye } from "@tabler/icons-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { IconLoader2 } from "@tabler/icons-react";

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    published: boolean;
    created_at: string;
    author_id: string; // could fetch profile name if needed
}

export default function AdminBlogsManager() {
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBlogs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("blogs")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching blogs:", error);
            toast.error("Failed to fetch blogs");
        } else {
            setBlogs(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBlogs();
    }, []);

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from("blogs").delete().eq("id", id);
        if (error) {
            toast.error("Failed to delete blog");
            console.error(error);
        } else {
            toast.success("Blog deleted");
            fetchBlogs();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl mb-2">Blog Posts</h2>
                    <p className="text-muted-foreground text-sm">Manage your blog content.</p>
                </div>
                <Button asChild className="bg-primary hover:bg-primary/90 ">
                    <Link to="/admin/blogs/new">
                        <IconPlus className="mr-2 h-4 w-4" /> New Post
                    </Link>
                </Button>
            </div>

            <Card className=" bg-card">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 flex justify-center"><IconLoader2 className="animate-spin" /></div>
                    ) : blogs.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">No blog posts found.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border/50 hover:bg-transparent">
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {blogs.map(blog => (
                                    <TableRow key={blog.id} className="border-border/50 group hover:bg-muted">
                                        <TableCell className="font-medium">
                                            <Link to={`/admin/blogs/${blog.id}`} className="hover:underline hover:text-primary">
                                                {blog.title}
                                            </Link>
                                            <div className="text-xs text-muted-foreground font-mono">{blog.slug}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={blog.published ? "default" : "secondary"} className={blog.published ? "bg-green-600 hover:bg-green-700" : ""}>
                                                {blog.published ? "Published" : "Draft"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {format(new Date(blog.created_at), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link to={`/blogs/${blog.slug}`} target="_blank" rel="noopener noreferrer">
                                                        <IconEye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link to={`/admin/blogs/${blog.id}`}>
                                                        <IconEdit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                                    </Link>
                                                </Button>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <IconTrash className="h-4 w-4 text-red-400 hover:text-red-500" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Blog Post?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete "{blog.title}"? This cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(blog.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
