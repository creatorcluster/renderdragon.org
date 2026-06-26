import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { IconDeviceFloppy, IconPlus, IconTrash, IconGripVertical, IconEye, IconX, IconRefresh, IconShare } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ProfileThemeConfig, ProfileLink, defaultThemeConfig, predefinedThemes } from '@/types/profile';
import ProfileThemeEngine from './ProfileThemeEngine';
import ReactMarkdown from 'react-markdown';
import { getSmartIconUrl } from '@/lib/utils';
import { SvglPicker } from './SvglPicker';
import { ImageUpload } from './ImageUpload';
import { FontPicker } from './FontPicker';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DRAFT_KEY = 'profile_editor_draft';

interface SortableLinkItemProps {
    link: ProfileLink;
    updateLink: (id: string, updates: Partial<ProfileLink>) => void;
    removeLink: (id: string) => void;
    getFavicon: (url: string) => string;
}

const SortableLinkItem: React.FC<SortableLinkItemProps> = ({ link, updateLink, removeLink, getFavicon }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: link.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex flex-col gap-3 p-4 border rounded-lg bg-card/50"
        >
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted"
                    aria-label="Drag to reorder"
                    aria-roledescription="sortable link"
                >
                    <IconGripVertical className="text-muted-foreground w-4 h-4" />
                </button>

                {/* Icon Preview */}
                <div className="w-8 h-8 flex items-center justify-center bg-muted rounded overflow-hidden relative group">
                    {link.url || link.icon ? (
                        link.iconColor ? (
                            <div
                                className="w-6 h-6"
                                style={{
                                    backgroundColor: link.iconColor,
                                    maskImage: `url(${link.icon || getFavicon(link.url)})`,
                                    WebkitMaskImage: `url(${link.icon || getFavicon(link.url)})`,
                                    maskSize: 'contain',
                                    maskRepeat: 'no-repeat',
                                    maskPosition: 'center',
                                }}
                            />
                        ) : (
                            <img src={link.icon || getFavicon(link.url)} alt="" className="w-6 h-6 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        )
                    ) : (
                        <span className="text-xs">?</span>
                    )}

                    {/* Mini Color Picker Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <label className="cursor-pointer w-full h-full flex items-center justify-center text-white text-[10px] font-bold">
                            TINT
                            <input
                                type="color"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                value={link.iconColor || '#000000'}
                                onChange={(e) => updateLink(link.id, { iconColor: e.target.value })}
                            />
                        </label>
                    </div>
                </div>
                <Input
                    value={link.label}
                    onChange={(e) => updateLink(link.id, { label: e.target.value })}
                    placeholder="Link Label"
                    className="flex-1"
                />
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeLink(link.id)}>
                    <IconTrash className="w-4 h-4" />
                </Button>
            </div>
            <div className="pl-10 flex gap-2">
                <SvglPicker
                    value={link.icon}
                    onChange={(url) => updateLink(link.id, { icon: url })}
                />
                <Input
                    value={link.url}
                    onChange={(e) => updateLink(link.id, { url: e.target.value })}
                    placeholder="https://example.com"
                />
            </div>
        </div>
    );
};

const ProfileEditor: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // State
    const [bio, setBio] = useState('');
    const [links, setLinks] = useState<ProfileLink[]>([]);
    const [themeConfig, setThemeConfig] = useState<ProfileThemeConfig>(defaultThemeConfig);
    const [previewMode, setPreviewMode] = useState(false);
    const [dbProfile, setDbProfile] = useState<{ display_name: string | null, avatar_url: string | null, username: string | null } | null>(null);
    const [username, setUsername] = useState('');
    const [showShare, setShowShare] = useState(false);

    // Load initial data
    useEffect(() => {
        if (user) {
            loadProfile();
        }
    }, [user]);

    // Auto-save draft to local storage
    useEffect(() => {
        if (!loading && user) {
            const draft = { bio, links, themeConfig, timestamp: Date.now() };
            localStorage.setItem(`${DRAFT_KEY}_${user.id}`, JSON.stringify(draft));
        }
    }, [bio, links, themeConfig, loading, user]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            // Check for local draft first
            const savedDraft = localStorage.getItem(`${DRAFT_KEY}_${user!.id}`);
            let draftData = null;

            if (savedDraft) {
                try {
                    draftData = JSON.parse(savedDraft);
                } catch (e) {
                    console.error("Invalid draft data", e);
                }
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('bio, links, theme_config, updated_at, display_name, avatar_url, username')
                .eq('id', user!.id)
                .single();

            if (error) throw error;

            if (data) {
                setDbProfile({
                    display_name: data.display_name,
                    avatar_url: data.avatar_url,
                    username: data.username
                });
                setUsername(data.username || '');

                if (draftData) {
                    setBio(draftData.bio || '');
                    setLinks(draftData.links || []);
                    setThemeConfig(draftData.themeConfig || defaultThemeConfig);
                    toast.info("Restored your unsaved draft.");
                } else {
                    setBio(data.bio || '');
                    setLinks((data.links as any) || []);
                    setThemeConfig((data.theme_config as any) || defaultThemeConfig);
                }
            }
        } catch (error: any) {
            toast.error('Failed to load profile settings');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const saveProfile = async () => {
        if (!user) {
            toast.error('Not signed in');
            return;
        }
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    bio,
                    links: links as any,
                    theme_config: themeConfig as any,
                    username: username.trim().toLowerCase(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) {
                if (error.code === '23505' && error.message?.includes('profiles_username_key')) {
                    throw new Error('This username is already taken. Please choose another one.');
                }
                throw error;
            }

            // Clear draft on successful save
            localStorage.removeItem(`${DRAFT_KEY}_${user.id}`);
            toast.success('Profile published successfully!');
            setShowShare(true);
        } catch (error: any) {
            toast.error(error?.message || 'Failed to save profile');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const discardDraft = () => {
        if (!user) return;
        if (!window.confirm("Are you sure you want to discard your unsaved changes and reload from the server?")) return;
        localStorage.removeItem(`${DRAFT_KEY}_${user.id}`);
        loadProfile();
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setLinks((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const addLink = () => {
        const newLink: ProfileLink = {
            id: crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
            label: 'New Link',
            url: '',
            active: true,
        };
        setLinks([...links, newLink]);
    };

    const removeLink = (id: string) => {
        setLinks(links.filter(l => l.id !== id));
    };

    const updateLink = (id: string, updates: Partial<ProfileLink>) => {
        setLinks(links.map(l => l.id === id ? { ...l, ...updates } : l));
    };

    const handleShare = () => {
        const url = `${window.location.origin}/u/${username || user?.id}`;
        navigator.clipboard.writeText(url);
        toast.success("Profile link copied to clipboard!");
    };

    const getFavicon = (url: string) => {
        return getSmartIconUrl(url);
    };

    const applyPredefinedTheme = (themeName: string) => {
        if (predefinedThemes[themeName]) {
            setThemeConfig({
                ...predefinedThemes[themeName],
                customDisplayName: themeConfig.customDisplayName,
                customAvatarUrl: themeConfig.customAvatarUrl,
                coverImage: themeConfig.coverImage,
            });
        }
    };

    if (loading) return <div className="p-8 text-center flex items-center justify-center gap-2"><IconRefresh className="animate-spin" /> Loading settings...</div>;

    return (
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-100px)]">
            {/* Editor Column */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-6">
                <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-20 py-4 border-b rounded-t-lg mb-4">
                    <h1 className="text-2xl font-vt323 px-2">Edit Profile</h1>
                    <div className="flex gap-2 px-2">
                        <Button variant="ghost" size="icon" onClick={discardDraft} title="Discard Draft">
                            <IconRefresh className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)} className="md:hidden">
                            <IconEye className="w-4 h-4 mr-1" /> Preview
                        </Button>
                        {showShare && (
                            <Button variant="outline" size="sm" onClick={handleShare} className="pixel-btn-secondary">
                                <IconShare className="w-4 h-4 mr-2" /> Share
                            </Button>
                        )}
                        <Button onClick={saveProfile} disabled={saving} className="pixel-btn-primary">
                            <IconDeviceFloppy className="w-4 h-4 mr-2" />
                            {saving ? 'Publishing...' : 'Publish'}
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="content" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="content">Content</TabsTrigger>
                        <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="space-y-6 mt-4">
                        {/* Profile Identity */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Identity</CardTitle>
                                <CardDescription>Customize your name and avatar</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Display Name Override</Label>
                                    <Input
                                        value={themeConfig.customDisplayName || ''}
                                        onChange={(e) => setThemeConfig({ ...themeConfig, customDisplayName: e.target.value })}
                                        placeholder={`Default: ${dbProfile?.display_name || 'Not set'}`}
                                    />
                                    <p className="text-xs text-muted-foreground">Original Name: {dbProfile?.display_name || 'Not set'}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Profile Handle (@tag)</Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">@</span>
                                        <Input
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                                            placeholder="your_username"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">This is your unique URL: {window.location.origin}/u/{username || 'username'}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Profile Tag (Badge)</Label>
                                    <Input
                                        placeholder="e.g. Creator, Developer..."
                                        value={themeConfig.profileTag || ''}
                                        onChange={(e) => setThemeConfig({ ...themeConfig, profileTag: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Custom Avatar URL</Label>
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            value={themeConfig.customAvatarUrl || ''}
                                            onChange={(e) => setThemeConfig({ ...themeConfig, customAvatarUrl: e.target.value })}
                                            placeholder="https://... (Leave empty to use account avatar)"
                                            className="flex-1"
                                        />
                                        <ImageUpload
                                            onUpload={(url) => setThemeConfig({ ...themeConfig, customAvatarUrl: url })}
                                            currentImage={themeConfig.customAvatarUrl}
                                            label="Upload"
                                            folder="avatars"
                                        />
                                        <Avatar className="h-10 w-10 border">
                                            <AvatarImage src={themeConfig.customAvatarUrl || dbProfile?.avatar_url || ''} />
                                            <AvatarFallback>?</AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Original Avatar: {dbProfile?.avatar_url ? 'Set' : 'Not Set'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Bio Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Bio</CardTitle>
                                <CardDescription>Markdown Supported</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="# Hello World"
                                    className="min-h-[150px] font-mono"
                                    style={{ resize: 'none' }}
                                />
                            </CardContent>
                        </Card>

                        {/* Links Section */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Links</CardTitle>
                                    <CardDescription>Drag to reorder</CardDescription>
                                </div>
                                <Button size="sm" variant="outline" onClick={addLink}>
                                    <IconPlus className="w-4 h-4 mr-1" /> Add Link
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={links.map(l => l.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {links.map((link) => (
                                            <SortableLinkItem
                                                key={link.id}
                                                link={link}
                                                updateLink={updateLink}
                                                removeLink={removeLink}
                                                getFavicon={getFavicon}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="appearance" className="space-y-6 mt-4">
                        {/* Theme Presets */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Presets</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4 flex-wrap">
                                    {Object.keys(predefinedThemes).map((name) => (
                                        <Button
                                            key={name}
                                            variant="outline"
                                            onClick={() => applyPredefinedTheme(name)}
                                            className="capitalize"
                                        >
                                            {name}
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Cover & Layout</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Cover Image URL</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={themeConfig.coverImage || ''}
                                            onChange={(e) => setThemeConfig({ ...themeConfig, coverImage: e.target.value })}
                                            placeholder="https://..."
                                            className="flex-1"
                                        />
                                        <ImageUpload
                                            onUpload={(url) => setThemeConfig({ ...themeConfig, coverImage: url })}
                                            currentImage={themeConfig.coverImage}
                                            label="Upload"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Avatar Position</Label>
                                    <Select
                                        value={themeConfig.avatarPosition || 'center'}
                                        onValueChange={(val: any) => setThemeConfig({ ...themeConfig, avatarPosition: val })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="center">Center</SelectItem>
                                            <SelectItem value="left">Left</SelectItem>
                                            <SelectItem value="right">Right</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Link Style</Label>
                                    <Select
                                        value={themeConfig.buttonStyle}
                                        onValueChange={(val: any) => setThemeConfig({ ...themeConfig, buttonStyle: val })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="rounded">Rounded Buttons</SelectItem>
                                            <SelectItem value="pill">Pill Buttons</SelectItem>
                                            <SelectItem value="square">Square Buttons</SelectItem>
                                            <SelectItem value="pixel">Pixel Buttons</SelectItem>
                                            <SelectItem value="icon">Icon Only (No Text)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Colors & Fonts</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Background Config */}
                                <div className="space-y-2">
                                    <Label>Background Type</Label>
                                    <Select
                                        value={themeConfig.backgroundType}
                                        onValueChange={(val: any) => setThemeConfig({ ...themeConfig, backgroundType: val })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="color">Solid Color</SelectItem>
                                            <SelectItem value="gradient">Gradient</SelectItem>
                                            <SelectItem value="image">Image URL</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {themeConfig.backgroundType === 'color' && (
                                    <div className="space-y-2">
                                        <Label>Background Color</Label>
                                        <div className="flex gap-2">
                                            <Input type="color" value={themeConfig.backgroundColor} onChange={(e) => setThemeConfig({ ...themeConfig, backgroundColor: e.target.value })} className="w-12 h-10 p-1" />
                                            <Input value={themeConfig.backgroundColor} onChange={(e) => setThemeConfig({ ...themeConfig, backgroundColor: e.target.value })} />
                                        </div>
                                    </div>
                                )}
                                {themeConfig.backgroundType === 'gradient' && (
                                    <div className="space-y-2">
                                        <Label>Gradient</Label>
                                        <Input value={themeConfig.backgroundGradient || ''} onChange={(e) => setThemeConfig({ ...themeConfig, backgroundGradient: e.target.value })} placeholder="linear-gradient(...)" />
                                    </div>
                                )}
                                {themeConfig.backgroundType === 'image' && (
                                    <div className="space-y-2">
                                        <Label>Background Image URL</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={themeConfig.backgroundImage || ''}
                                                onChange={(e) => setThemeConfig({ ...themeConfig, backgroundImage: e.target.value })}
                                                placeholder="https://..."
                                                className="flex-1"
                                            />
                                            <ImageUpload
                                                onUpload={(url) => setThemeConfig({ ...themeConfig, backgroundImage: url })}
                                                currentImage={themeConfig.backgroundImage}
                                                label="Upload"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Text Color</Label>
                                        <div className="flex gap-2">
                                            <Input type="color" value={themeConfig.textColor} onChange={(e) => setThemeConfig({ ...themeConfig, textColor: e.target.value })} className="w-12 h-10 p-1" />
                                            <Input value={themeConfig.textColor} onChange={(e) => setThemeConfig({ ...themeConfig, textColor: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Accent Color</Label>
                                        <div className="flex gap-2">
                                            <Input type="color" value={themeConfig.accentColor} onChange={(e) => setThemeConfig({ ...themeConfig, accentColor: e.target.value })} className="w-12 h-10 p-1" />
                                            <Input value={themeConfig.accentColor} onChange={(e) => setThemeConfig({ ...themeConfig, accentColor: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Font Family</Label>
                                    <FontPicker
                                        value={themeConfig.fontFamily}
                                        onFontChange={(family, url) => setThemeConfig({
                                            ...themeConfig,
                                            fontFamily: family,
                                            fontUrl: url || undefined
                                        })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Preview Column */}
            <div className={`
        flex-1 bg-background/95 backdrop-blur border rounded-xl overflow-hidden shadow-2xl pixel-corners
        ${previewMode ? 'fixed inset-0 z-50 md:static md:block' : 'hidden md:block'}
      `}>
                <div className="bg-muted/80 backdrop-blur px-4 py-2 border-b flex justify-between items-center text-xs text-muted-foreground">
                    <span>Live Preview</span>
                    {previewMode && <Button size="sm" variant="ghost" onClick={() => setPreviewMode(false)}><IconX className="w-4 h-4" /></Button>}
                </div>
                <div className="h-full overflow-y-auto">
                    <ProfileThemeEngine config={themeConfig}>
                        <div className="min-h-full p-8 flex flex-col items-center gap-6 relative">
                            {/* Cover Image Preview */}
                            {themeConfig.coverImage && (
                                <div className="absolute top-0 left-0 right-0 h-32 bg-cover bg-center" style={{ backgroundImage: `url(${themeConfig.coverImage})` }} />
                            )}

                            {/* Avatar Spacer for Cover */}
                            <div style={{ marginTop: themeConfig.coverImage ? '4rem' : '0' }} className={`w-full flex ${themeConfig.avatarPosition === 'left' ? 'justify-start' : themeConfig.avatarPosition === 'right' ? 'justify-end' : 'justify-center'}`}>
                                <div className="w-24 h-24 rounded-full bg-muted border-4 border-[var(--profile-accent)] overflow-hidden relative z-10 shadow-lg">
                                    <img src={themeConfig.customAvatarUrl || dbProfile?.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.id}`} alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                            </div>

                            <div className={`text-center w-full ${themeConfig.avatarPosition === 'left' ? 'text-left' : themeConfig.avatarPosition === 'right' ? 'text-right' : ''}`}>
                                <h2 className="text-3xl font-bold" style={{ color: themeConfig.textColor }}>
                                    {themeConfig.customDisplayName || dbProfile?.display_name || `@${user?.email?.split('@')[0]}`}
                                </h2>
                                {/* Show username if using default name */}
                                {!themeConfig.customDisplayName && dbProfile?.username && (
                                    <p className="opacity-70" style={{ color: themeConfig.textColor }}>@{dbProfile.username}</p>
                                )}
                                {themeConfig.profileTag && (
                                    <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider opacity-80 mt-1 inline-block" style={{ backgroundColor: themeConfig.accentColor, color: '#fff' }}>
                                        {themeConfig.profileTag}
                                    </span>
                                )}
                                <div style={{ color: themeConfig.textColor, opacity: 0.8 }} className="mt-2 prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown allowedElements={['h1', 'h2', 'h3', 'p', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'blockquote', 'img']}>
                                        {bio || 'No bio yet.'}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            <div className={`w-full max-w-sm flex gap-4 ${themeConfig.buttonStyle === 'icon' ? 'flex-row justify-center flex-wrap items-center' : 'flex-col space-y-4'}`}>
                                {links.map(link => (
                                    <a
                                        key={link.id}
                                        href={link.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        title={link.label}
                                        className={`
                                            block transition-transform hover:scale-[1.1] active:scale-[0.9]
                                            ${themeConfig.buttonStyle === 'icon' ? 'p-2' : 'w-full py-3 px-6 text-center shadow-sm'}
                                        `}
                                        style={{
                                            backgroundColor: themeConfig.buttonStyle === 'icon' ? 'transparent' : (link.active ? (link.color || themeConfig.accentColor) : 'transparent'),
                                            color: '#fff',
                                            borderRadius: themeConfig.buttonStyle === 'pill' ? '9999px' :
                                                themeConfig.buttonStyle === 'rounded' ? '0.5rem' :
                                                    themeConfig.buttonStyle === 'icon' ? '9999px' :
                                                        '0',
                                            border: themeConfig.buttonStyle === 'pixel' ? '2px solid white' : 'none',
                                            marginBottom: themeConfig.buttonStyle === 'icon' ? '0' : '1rem',
                                            boxShadow: themeConfig.buttonStyle === 'pixel' ? '4px 4px 0 rgba(0,0,0,0.5)' :
                                                themeConfig.buttonStyle === 'icon' ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        }}
                                    >
                                        <div className="relative w-full flex items-center justify-center">
                                            {link.iconColor ? (
                                                <div
                                                    className={`
                                                        ${themeConfig.buttonStyle === 'icon' ? 'w-8 h-8' : 'w-6 h-6 absolute left-0 opacity-80'}
                                                    `}
                                                    style={{
                                                        backgroundColor: link.iconColor,
                                                        maskImage: `url(${link.icon || getFavicon(link.url)})`,
                                                        WebkitMaskImage: `url(${link.icon || getFavicon(link.url)})`,
                                                        maskSize: 'contain',
                                                        maskRepeat: 'no-repeat',
                                                        maskPosition: 'center',
                                                    }}
                                                />
                                            ) : (
                                                <img
                                                    src={link.icon || getFavicon(link.url)}
                                                    alt=""
                                                    className={`
                                                        object-contain transition-opacity
                                                        ${themeConfig.buttonStyle === 'icon' ? 'w-8 h-8' : 'w-6 h-6 absolute left-0 opacity-80'}
                                                    `}
                                                />
                                            )}
                                            {themeConfig.buttonStyle !== 'icon' && (
                                                <span>{link.label}</span>
                                            )}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </ProfileThemeEngine>
                </div>
            </div>
        </div>
    );
};

export default ProfileEditor;
