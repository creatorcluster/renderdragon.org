import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { IconLoader2, IconUpload, IconEye, IconEdit, IconArrowLeft, IconAlertCircle, IconCheck, IconClock } from '@tabler/icons-react';
import { useCreatorPacks, UpdateCreatorPackInput } from '@/hooks/useCreatorPacks';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';

const AVAILABLE_TAGS = [
    'music', 'renders', 'animations', 'images', 'sfx', 'fonts', 'presets', 'all-in-one'
];

const isValidUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

const EditCreatorPackPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { fetchPackBySlug, updatePack, uploadCoverImage } = useCreatorPacks();

    const [isLoading, setIsLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [smallDescription, setSmallDescription] = useState('');
    const [description, setDescription] = useState('');
    const [externalLink, setExternalLink] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [reviewReason, setReviewReason] = useState<string | null>(null);
    const [packId, setPackId] = useState<string | null>(null);

    useEffect(() => {
        const loadPack = async () => {
            if (!slug) return;
            setIsLoading(true);
            const data = await fetchPackBySlug(slug);
            if (data) {
                setPackId(data.id);
                setTitle(data.title);
                setSmallDescription(data.small_description || '');
                setDescription(data.description || '');
                setExternalLink(data.external_link);
                setSelectedTags(data.tags || []);
                setExistingCoverUrl(data.cover_image_url);
                setStatus(data.status);
                setReviewReason(data.review_reason || null);
            } else {
                // Not found or not owned
                navigate('/creator-packs/manage');
            }
            setIsLoading(false);
        };
        loadPack();
    }, [slug, fetchPackBySlug, navigate]);

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverFile(file);
            const reader = new FileReader();
            reader.onload = () => setCoverPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!packId || !title.trim() || !externalLink.trim()) return;

        if (!isValidUrl(externalLink.trim())) {
            toast.error('Please enter a valid URL starting with http:// or https://');
            return;
        }

        setIsSubmitting(true);

        let coverUrl = existingCoverUrl;
        if (coverFile) {
            const uploaded = await uploadCoverImage(coverFile);
            if (!uploaded) {
                // Upload failed — toast is already shown by the hook; abort submit
                setIsSubmitting(false);
                return;
            }
            coverUrl = uploaded;
        }

        const input: UpdateCreatorPackInput = {
            title: title.trim(),
            small_description: smallDescription.trim(),
            description,
            cover_image_url: coverUrl,
            external_link: externalLink.trim(),
            tags: selectedTags,
        };

        const result = await updatePack(packId, input);
        setIsSubmitting(false);

        if (result) {
            navigate(`/creator-packs/manage`);
        }
    };

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
                <title>Edit Creator Pack | RenderDragon</title>
            </Helmet>

            <Navbar />

            <main className="flex-grow pt-24 pb-16 cow-grid-bg custom-scrollbar">
                <div className="container mx-auto px-4 max-w-3xl">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/creator-packs/manage')}
                        className="mb-6"
                    >
                        <IconArrowLeft className="mr-2 h-4 w-4" /> Back to Manage Packs
                    </Button>

                    <div className="bg-card border border-border/50 rounded-xl p-6 sm:p-8 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <h1 className="font-geist text-3xl font-bold">Edit Creator Pack</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground mr-1">Status:</span>
                                {getStatusBadge(status)}
                            </div>
                        </div>

                        {status === 'rejected' && reviewReason && (
                            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start text-sm">
                                <IconAlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-red-500 mb-1">Pack Rejected by Admin</h4>
                                    <p className="text-red-400/90 leading-relaxed">{reviewReason}</p>
                                    <p className="text-red-400/80 mt-2 text-xs italic">
                                        Please address this issue. Saving changes will automatically resubmit your pack for review.
                                    </p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="pack-title">Title <span className="text-destructive">*</span></Label>
                                <Input
                                    id="pack-title"
                                    placeholder="My Awesome Creator Pack"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="pixel-corners"
                                    required
                                />
                            </div>

                            {/* Small Description */}
                            <div className="space-y-2">
                                <Label htmlFor="pack-small-desc">Short Description</Label>
                                <Input
                                    id="pack-small-desc"
                                    placeholder="A brief tagline for the card preview"
                                    value={smallDescription}
                                    onChange={(e) => setSmallDescription(e.target.value)}
                                    className="pixel-corners"
                                    maxLength={200}
                                />
                            </div>

                            {/* External Link */}
                            <div className="space-y-2">
                                <Label htmlFor="pack-link">External Download Link <span className="text-destructive">*</span></Label>
                                <Input
                                    id="pack-link"
                                    placeholder="https://drive.google.com/..."
                                    value={externalLink}
                                    onChange={(e) => setExternalLink(e.target.value)}
                                    className="pixel-corners"
                                    type="url"
                                    required
                                />
                            </div>

                            {/* Tags */}
                            <div className="space-y-3">
                                <Label>Tags</Label>
                                <div className="flex flex-wrap gap-2">
                                    {AVAILABLE_TAGS.map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => toggleTag(tag)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${selectedTags.includes(tag)
                                                ? 'bg-cow-purple text-white border-cow-purple'
                                                : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted font-geist'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Cover Image */}
                            <div className="space-y-2">
                                <Label>Cover Image</Label>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    {coverPreview ? (
                                        <img src={coverPreview} alt="Cover preview" className="w-32 h-20 object-cover rounded-md border border-border/50" />
                                    ) : existingCoverUrl ? (
                                        <img src={existingCoverUrl} alt="Current cover" className="w-32 h-20 object-cover rounded-md border border-border/50" />
                                    ) : null}

                                    <label className="flex items-center gap-2 px-4 py-3 rounded-md border border-dashed border-border/60 cursor-pointer hover:bg-muted/30 transition-colors text-sm w-fit">
                                        <IconUpload size={18} className="text-muted-foreground" />
                                        <span>{coverFile ? coverFile.name : 'Change cover image'}</span>
                                        <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                                    </label>
                                </div>
                            </div>

                            {/* Description (Markdown) */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="pack-desc">Description (Markdown)</Label>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
                                        {showPreview ? <><IconEdit size={14} className="mr-1" /> Edit</> : <><IconEye size={14} className="mr-1" /> Preview</>}
                                    </Button>
                                </div>
                                {showPreview ? (
                                    <div className="border border-border/50 p-4 rounded-md bg-muted/10 min-h-[300px]">
                                        <div className="max-w-none font-geist text-sm text-foreground/90 leading-relaxed">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-3 font-geist">{children}</h1>,
                                                    h2: ({ children }) => <h2 className="text-xl font-bold mt-5 mb-2 font-geist">{children}</h2>,
                                                    h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2 font-geist">{children}</h3>,
                                                    p: ({ children }) => <p className="mb-3">{children}</p>,
                                                    ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                                                    code: ({ children }) => <code className="bg-muted/30 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
                                                }}
                                            >
                                                {description || '*Nothing to preview yet.*'}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                ) : (
                                    <Textarea
                                        id="pack-desc"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder={"# My Pack\n\nDescribe your creator pack with full **markdown** support!\n\n- Item 1\n- Item 2"}
                                        className="font-mono min-h-[300px] pixel-corners"
                                    />
                                )}
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-border/50 pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate('/creator-packs/manage')}
                                    className="pixel-corners"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !title.trim() || !externalLink.trim()}
                                    className="pixel-corners bg-cow-purple hover:bg-cow-purple/90 min-w-[140px]"
                                >
                                    {isSubmitting ? (
                                        <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default EditCreatorPackPage;
