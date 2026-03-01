import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IconArrowLeft, IconEdit, IconTrash, IconExternalLink, IconLoader2, IconPackage, IconAlertCircle, IconCheck, IconClock } from '@tabler/icons-react';
import { useCreatorPacks, CreatorPack } from '@/hooks/useCreatorPacks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';

const ManageCreatorPacksPage = () => {
    const navigate = useNavigate();
    const { fetchUserPacks, deletePack } = useCreatorPacks();
    const [userPacks, setUserPacks] = useState<CreatorPack[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        const loadPacks = async () => {
            setIsLoading(true);
            const packs = await fetchUserPacks();
            setUserPacks(packs);
            setIsLoading(false);
        };
        loadPacks();
    }, [fetchUserPacks]);

    const handleDelete = async (packId: string) => {
        if (!window.confirm('Are you sure you want to delete this creator pack? This action cannot be undone.')) return;

        setDeletingId(packId);
        await deletePack(packId);
        setUserPacks(prev => prev.filter(p => p.id !== packId));
        setDeletingId(null);
    };

    const getStatusBadge = (status: 'pending' | 'approved' | 'rejected') => {
        switch (status) {
            case 'approved':
                return <Badge variant="outline" className="border-green-500/50 text-green-500 bg-green-500/10"><IconCheck className="w-3 h-3 mr-1" /> Approved</Badge>;
            case 'rejected':
                return <Badge variant="outline" className="border-red-500/50 text-red-500 bg-red-500/10"><IconAlertCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
            case 'pending':
            default:
                return <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10"><IconClock className="w-3 h-3 mr-1" /> Pending Review</Badge>;
        }
    };

    return (
        <div className="min-h-screen flex flex-col relative text-foreground bg-background">
            <Helmet>
                <title>Manage My Creator Packs | RenderDragon</title>
            </Helmet>

            <Navbar />

            <main className="flex-grow pt-24 pb-16 cow-grid-bg custom-scrollbar">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <Link to="/resources?tab=creator-packs">
                                <Button variant="ghost" size="sm" className="mb-2 -ml-3">
                                    <IconArrowLeft className="mr-2 h-4 w-4" /> Back to Creator Packs
                                </Button>
                            </Link>
                            <h1 className="font-geist text-3xl font-bold">Manage My Packs</h1>
                            <p className="text-muted-foreground mt-1">View, edit, or delete creator packs you have published.</p>
                        </div>
                        <Link to="/creator-packs/new">
                            <Button className="pixel-corners bg-cow-purple hover:bg-cow-purple/90 font-geist">
                                Upload New Pack
                            </Button>
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center p-12">
                            <IconLoader2 className="w-8 h-8 animate-spin text-cow-purple" />
                        </div>
                    ) : userPacks.length === 0 ? (
                        <div className="text-center py-16 bg-card border border-border/50 rounded-xl shadow-sm">
                            <IconPackage className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-xl font-geist font-medium mb-2">No packs published yet</h3>
                            <p className="text-muted-foreground mb-6">You haven't uploaded any creator packs.</p>
                            <Link to="/creator-packs/new">
                                <Button className="pixel-corners bg-cow-purple hover:bg-cow-purple/90">
                                    Create Your First Pack
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            <AnimatePresence>
                                {userPacks.map((pack) => (
                                    <motion.div
                                        key={pack.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-card border border-border/50 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center shadow-sm hover:border-primary/50 transition-colors"
                                    >
                                        {/* Thumbnail */}
                                        <div className="w-full sm:w-48 aspect-video bg-muted/20 rounded-md overflow-hidden flex-shrink-0">
                                            {pack.cover_image_url ? (
                                                <img
                                                    src={pack.cover_image_url}
                                                    alt={pack.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                                                    <span className="text-3xl font-geist text-primary/50">{pack.title.charAt(0).toUpperCase()}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-grow min-w-0 w-full">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <Link to={`/creator-packs/${pack.slug}`} className="hover:underline">
                                                    <h3 className="text-xl font-bold font-geist truncate group-hover:text-primary transition-colors">
                                                        {pack.title}
                                                    </h3>
                                                </Link>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {getStatusBadge(pack.status)}
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(pack.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>

                                            {pack.status === 'rejected' && pack.review_reason && (
                                                <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start text-sm">
                                                    <IconAlertCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <span className="font-medium text-red-500">Reason for rejection:</span>
                                                        <p className="text-red-400/90 mt-1">{pack.review_reason}</p>
                                                    </div>
                                                </div>
                                            )}

                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                {pack.small_description || 'No short description provided.'}
                                            </p>

                                            {/* Tags preview */}
                                            {pack.tags && pack.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-4">
                                                    {pack.tags.slice(0, 4).map(tag => (
                                                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {pack.tags.length > 4 && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                            +{pack.tags.length - 4}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-border/50">
                                            <Link to={`/creator-packs/${pack.slug}/edit`} className="w-full">
                                                <Button variant="outline" size="sm" className="w-full h-8 pixel-corners font-geist text-xs">
                                                    <IconEdit size={14} className="mr-1.5" /> Edit
                                                </Button>
                                            </Link>

                                            <a href={pack.external_link} target="_blank" rel="noopener noreferrer" className="w-full">
                                                <Button variant="secondary" size="sm" className="w-full h-8 pixel-corners font-geist text-xs">
                                                    <IconExternalLink size={14} className="mr-1.5" /> Link
                                                </Button>
                                            </a>

                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="w-full h-8 pixel-corners font-geist text-xs"
                                                onClick={() => handleDelete(pack.id)}
                                                disabled={deletingId === pack.id}
                                            >
                                                {deletingId === pack.id ? (
                                                    <IconLoader2 size={14} className="animate-spin mr-1.5" />
                                                ) : (
                                                    <IconTrash size={14} className="mr-1.5" />
                                                )}
                                                Delete
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ManageCreatorPacksPage;
