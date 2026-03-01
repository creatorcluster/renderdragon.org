import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { IconLoader2, IconUpload, IconEye, IconEdit, IconArrowLeft } from '@tabler/icons-react';
import { useCreatorPacks, CreateCreatorPackInput } from '@/hooks/useCreatorPacks';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Helmet } from 'react-helmet-async';

const AVAILABLE_TAGS = [
    'music', 'renders', 'animations', 'images', 'sfx', 'fonts', 'presets', 'all-in-one'
];

const CreateCreatorPackPage = () => {
    const navigate = useNavigate();
    const { createPack, uploadCoverImage } = useCreatorPacks();

    const [title, setTitle] = useState('');
    const [smallDescription, setSmallDescription] = useState('');
    const [description, setDescription] = useState('');
    const [externalLink, setExternalLink] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

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
        if (!title.trim() || !externalLink.trim()) return;

        setIsSubmitting(true);

        let coverUrl: string | null = null;
        if (coverFile) {
            coverUrl = await uploadCoverImage(coverFile);
        }

        const input: CreateCreatorPackInput = {
            title: title.trim(),
            small_description: smallDescription.trim(),
            description,
            cover_image_url: coverUrl,
            external_link: externalLink.trim(),
            tags: selectedTags,
        };

        const result = await createPack(input);
        setIsSubmitting(false);

        if (result) {
            navigate(`/creator-packs/${result.slug}`);
        }
    };

    return (
        <div className="min-h-screen flex flex-col relative">
            <Helmet>
                <title>Upload Creator Pack | RenderDragon</title>
            </Helmet>

            <Navbar />

            <main className="flex-grow pt-24 pb-16 cow-grid-bg custom-scrollbar">
                <div className="container mx-auto px-4 max-w-3xl">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/resources?tab=creator-packs')}
                        className="mb-6"
                    >
                        <IconArrowLeft className="mr-2 h-4 w-4" /> Back to Creator Packs
                    </Button>

                    <div className="bg-card border border-border/50 rounded-xl p-6 sm:p-8 shadow-sm">
                        <h1 className="font-geist text-3xl font-bold mb-8">Upload Creator Pack</h1>

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
                                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${selectedTags.includes(tag)
                                                    ? 'bg-cow-purple text-white border-cow-purple'
                                                    : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
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
                                <div className="flex items-center gap-4">
                                    {coverPreview && (
                                        <img src={coverPreview} alt="Cover preview" className="w-32 h-20 object-cover rounded-md border border-border/50" />
                                    )}
                                    <label className="flex items-center gap-2 px-4 py-3 rounded-md border border-dashed border-border/60 cursor-pointer hover:bg-muted/30 transition-colors text-sm">
                                        <IconUpload size={18} className="text-muted-foreground" />
                                        <span>{coverFile ? coverFile.name : 'Choose cover image'}</span>
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

                            <div className="pt-4 flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate('/resources?tab=creator-packs')}
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
                                        <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</>
                                    ) : (
                                        'Publish Pack'
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

export default CreateCreatorPackPage;
