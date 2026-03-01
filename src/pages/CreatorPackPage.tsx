import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCreatorPacks, CreatorPack } from '@/hooks/useCreatorPacks';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import DownloadWarningDialog from '@/components/resources/DownloadWarningDialog';
import { Helmet } from 'react-helmet-async';
import {
    IconArrowLeft,
    IconExternalLink,
    IconUser,
    IconCalendar,
    IconTrash,
    IconLoader2,
} from '@tabler/icons-react';
import { toast } from 'sonner';

const CreatorPackPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const { fetchPackBySlug, deletePack } = useCreatorPacks();
    const { user } = useAuth();
    const [pack, setPack] = useState<CreatorPack | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isWarningOpen, setIsWarningOpen] = useState(false);

    useEffect(() => {
        if (!slug) return;
        setIsLoading(true);
        fetchPackBySlug(slug).then((data) => {
            setPack(data);
            setIsLoading(false);
        });
    }, [slug, fetchPackBySlug]);

    const handleDelete = async () => {
        if (!pack) return;
        if (!window.confirm('Are you sure you want to delete this creator pack?')) return;
        setIsDeleting(true);
        await deletePack(pack.id);
        toast.success('Creator pack deleted.');
        window.location.href = '/resources?tab=creator-packs';
    };

    const authorName = pack?.profiles?.display_name || pack?.profiles?.username || 'Anonymous';
    const authorAvatar = pack?.profiles?.avatar_url;
    const isOwner = user && pack && user.id === pack.user_id;

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <div className="flex-grow flex items-center justify-center">
                    <IconLoader2 className="w-10 h-10 animate-spin text-cow-purple" />
                </div>
                <Footer />
            </div>
        );
    }

    if (!pack) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <div className="flex-grow flex flex-col items-center justify-center gap-4">
                    <h1 className="text-3xl font-geist">Pack Not Found</h1>
                    <Link to="/resources?tab=creator-packs">
                        <Button variant="outline" className="pixel-corners">
                            <IconArrowLeft className="mr-2 h-4 w-4" /> Back to Creator Packs
                        </Button>
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col relative">
            <Helmet>
                <title>{pack.title} - Creator Pack | RenderDragon</title>
                <meta name="description" content={pack.small_description} />
                <meta property="og:title" content={`${pack.title} - Creator Pack`} />
                <meta property="og:description" content={pack.small_description} />
                {pack.cover_image_url && <meta property="og:image" content={pack.cover_image_url} />}
            </Helmet>

            <Navbar />

            <main className="flex-grow pt-24 pb-16 cow-grid-bg custom-scrollbar">
                <div className="container mx-auto px-4 max-w-4xl">
                    {/* Back Button */}
                    <div className="mb-6">
                        <Link to="/resources?tab=creator-packs">
                            <Button variant="ghost" size="sm">
                                <IconArrowLeft className="mr-2 h-4 w-4" /> Back to Creator Packs
                            </Button>
                        </Link>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Cover Image */}
                        {pack.cover_image_url && (
                            <div className="relative aspect-video rounded-xl overflow-hidden mb-8 border border-border/50">
                                <img
                                    src={pack.cover_image_url}
                                    alt={pack.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-4xl font-geist font-bold mb-2">{pack.title}</h1>
                                {pack.small_description && (
                                    <p className="text-lg text-muted-foreground mb-4">{pack.small_description}</p>
                                )}
                                {pack.tags && pack.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {pack.tags.map(tag => (
                                            <span key={tag} className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 flex-shrink-0">
                                <Button
                                    onClick={() => setIsWarningOpen(true)}
                                    className="pixel-corners bg-cow-purple hover:bg-cow-purple/90"
                                >
                                    <IconExternalLink className="mr-2 h-4 w-4" /> Download
                                </Button>
                                {isOwner && (
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="pixel-corners"
                                    >
                                        {isDeleting ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconTrash className="h-4 w-4" />}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Author & Date */}
                        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/50">
                            <Link
                                to={pack.profiles?.username ? `/u/${pack.profiles.username}` : '#'}
                                className="flex items-center gap-2 hover:text-primary transition-colors"
                            >
                                {authorAvatar ? (
                                    <img src={authorAvatar} alt={authorName} className="w-8 h-8 rounded-full" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                        <IconUser size={16} />
                                    </div>
                                )}
                                <span className="font-medium">{authorName}</span>
                            </Link>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <IconCalendar size={14} />
                                <span>{new Date(pack.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                        </div>

                        {/* Markdown Content */}
                        <div className="max-w-none font-geist text-foreground/90 leading-relaxed">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({ children }) => <h1 className="text-3xl font-bold mt-8 mb-4 font-geist">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-2xl font-bold mt-6 mb-3 font-geist">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-xl font-semibold mt-5 mb-2 font-geist">{children}</h3>,
                                    h4: ({ children }) => <h4 className="text-lg font-semibold mt-4 mb-2 font-geist">{children}</h4>,
                                    h5: ({ children }) => <h5 className="text-base font-semibold mt-3 mb-1 font-geist">{children}</h5>,
                                    h6: ({ children }) => <h6 className="text-sm font-semibold mt-3 mb-1 font-geist">{children}</h6>,
                                    p: ({ children }) => <p className="mb-4">{children}</p>,
                                    ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                                    a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">{children}</a>,
                                    blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/50 pl-4 italic text-muted-foreground my-4">{children}</blockquote>,
                                    code: ({ children }) => <code className="bg-muted/30 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>,
                                    img: ({ src, alt }) => <img src={src} alt={alt} className="rounded-lg max-w-full my-4" />,
                                    hr: () => <hr className="border-border/50 my-6" />,
                                }}
                            >
                                {pack.description || '*No description provided.*'}
                            </ReactMarkdown>
                        </div>

                        {/* Bottom Download Button */}
                        <div className="mt-12 pt-6 border-t border-border/50 flex justify-center">
                            <Button
                                size="lg"
                                onClick={() => setIsWarningOpen(true)}
                                className="pixel-corners bg-cow-purple hover:bg-cow-purple/90"
                            >
                                <IconExternalLink className="mr-2 h-5 w-5" /> Download Creator Pack
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </main>

            <DownloadWarningDialog
                isOpen={isWarningOpen}
                onClose={() => setIsWarningOpen(false)}
                downloadUrl={pack.external_link}
            />

            <Footer />
        </div>
    );
};

export default CreatorPackPage;
