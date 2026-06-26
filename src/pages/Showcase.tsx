import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";

import { createShowcase, getShowcasesWithProfiles, type Showcase, type ShowcaseAsset, type ShowcaseTag, type ShowcaseWithAssets } from "@/lib/showcases";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IconCode, IconDownload, IconFileText, IconLoader2, IconPlus, IconSearch, IconTypography } from '@tabler/icons-react';
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthDialog from "@/components/auth/AuthDialog";
import AudioPlayer from "@/components/AudioPlayer";
import VideoPlayer from "@/components/VideoPlayer";



const ShowcaseCard: React.FC<{ item: ShowcaseWithAssets }> = ({ item }) => {
  const name = item.profile?.display_name || item.profile?.email || "Anonymous";
  const profileUrl = item.profile?.username ? `/u/${item.profile.username}` : undefined;
  const avatar = item.profile?.avatar_url;
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<ShowcaseAsset | null>(null);

  const renderAssetPreview = (a: ShowcaseAsset) => {
    const url = a.url;
    const filename = a.filename || url;

    // Trust the kind property if available, otherwise check filename/url extension
    const isImage = a.kind === 'image' || /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(filename);
    const isVideo = a.kind === 'video' || /\.(mp4|mov|webm)(\?|$)/i.test(filename);
    const isAudio = a.kind === 'audio' || /\.(mp3|wav|flac|ogg|aac|m4a)(\?|$)/i.test(filename);
    const isFont = /\.(ttf|otf|woff2?)(\?|$)/i.test(filename);
    const isJson = /\.(json)(\?|$)/i.test(filename);

    if (isImage) {
      return (
        <div className="w-full h-full relative group/img">
          <img src={url} alt="showcase" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300" />
        </div>
      );
    }
    if (isVideo) {
      return (
        <div className="w-full h-full bg-black relative group/vid">
          <video
            src={url}
            muted
            loop
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 group-hover/vid:bg-transparent transition-colors" />
        </div>
      );
    }
    if (isAudio) {
      return (
        <div className="w-full p-4 bg-muted/10">
          <AudioPlayer src={url} className="w-full shadow-none border-none bg-transparent" />
        </div>
      );
    }
    if (isFont) {
      const fontName = `font-${a.id}`;
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20 p-6 min-h-[14rem] relative overflow-hidden group/font">
          <style>{`
            @font-face {
              font-family: '${fontName}';
              src: url('${url}');
            }
          `}</style>
          <div className="absolute top-3 right-3 opacity-20 group-hover/font:opacity-40 transition-opacity">
            <IconTypography size={40} />
          </div>
          <div style={{ fontFamily: fontName }} className="text-5xl text-center mb-6 text-white drop-shadow-lg leading-tight">
            Aa Bb Cc<br />123
          </div>
          <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono bg-white/5 px-2 py-1 rounded">
            Font Preview
          </div>
        </div>
      );
    }
    if (isJson) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#1e1e1e] p-6 min-h-[14rem] relative group/json">
          <div className="absolute top-3 right-3 opacity-20 group-hover/json:opacity-40 transition-opacity">
            <IconCode size={40} className="text-cow-purple" />
          </div>
          <div className="font-mono text-xs text-cow-purple/80 w-full overflow-hidden opacity-60 group-hover:opacity-100 transition-opacity">
            <div className="mb-1">{"{"}</div>
            <div className="pl-4">"type": "asset",</div>
            <div className="pl-4">"format": "json",</div>
            <div className="pl-4">"status": "ready"</div>
            <div>{"}"}</div>
          </div>
          <div className="mt-6 text-xs text-white/40 uppercase tracking-widest font-mono bg-white/5 px-2 py-1 rounded">
            JSON Data
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20 p-6 min-h-[14rem]">
        <IconFileText className="h-12 w-12 text-white/20 mb-4" />
        <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
          Document File
        </div>
      </div>
    );
  };

  return (
    <Card className="pixel-corners bg-card/40 backdrop-blur-sm border-white/10 w-full flex flex-col h-full overflow-hidden hover:border-cow-purple/50 transition-all duration-300 group hover:shadow-2xl hover:shadow-cow-purple/10">
      <div className="flex-grow flex flex-col">
        {/* Asset Preview at top */}
        <div className="w-full">
          {item.assets.map((a) => {
            const filename = a.filename || a.url;
            const isAudio = a.kind === 'audio' || /\.(mp3|wav|flac|ogg|aac|m4a)(\?|$)/i.test(filename);
            return (
              <div
                key={a.id}
                role={isAudio ? undefined : "button"}
                tabIndex={isAudio ? undefined : 0}
                onClick={isAudio ? undefined : () => {
                  setPreviewAsset(a);
                  setPreviewOpen(true);
                }}
                onKeyDown={isAudio ? undefined : (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setPreviewAsset(a);
                    setPreviewOpen(true);
                  }
                }}
                className={cn(
                  "overflow-hidden transition-all duration-200 w-full",
                  isAudio ? "h-auto" : "h-64 cursor-zoom-in group-hover:bg-background/40"
                )}
              >
                {renderAssetPreview(a)}
              </div>
            );
          })}
        </div>

        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {profileUrl ? (
                <Link to={profileUrl} className="flex items-center gap-2 hover:opacity-90 transition-opacity min-w-0">
                  <Avatar className="h-7 w-7 ring-1 ring-white/10">
                    {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
                    <AvatarFallback className="bg-cow-purple/20 text-cow-purple text-[10px]">{name?.slice(0, 2)?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-sm font-vt323 truncate text-white/90 leading-none mb-1">{name}</div>
                    <div className="text-[9px] text-white/40 uppercase tracking-tighter">{formatDistanceToNow(new Date(item.created_at))} ago</div>
                  </div>
                </Link>
              ) : (
                <>
                  <Avatar className="h-7 w-7 ring-1 ring-white/10">
                    {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
                    <AvatarFallback className="bg-cow-purple/20 text-cow-purple text-[10px]">{name?.slice(0, 2)?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-sm font-vt323 truncate text-white/90 leading-none mb-1">{name}</div>
                    <div className="text-[9px] text-white/40 uppercase tracking-tighter">{formatDistanceToNow(new Date(item.created_at))} ago</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {item.description ? (
            <p className="text-xs text-white/60 whitespace-pre-wrap line-clamp-2 leading-relaxed italic">"{item.description}"</p>
          ) : null}
        </div>
      </div>
      {/* Lightbox dialog for preview */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl bg-popover/95 border-white/10">
          <DialogHeader>
            <DialogTitle className="font-minecraftia">Preview</DialogTitle>
          </DialogHeader>
          <div className="w-full max-h-[80vh] flex items-center justify-center">
            {(() => {
              if (!previewAsset) return null;
              const url = previewAsset.url;
              const filename = previewAsset.filename || url;
              const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(filename);
              const isVideo = /\.(mp4|mov|webm)(\?|$)/i.test(filename);
              const isAudio = /\.(mp3|wav|flac|ogg|aac|m4a)(\?|$)/i.test(filename);
              const baseKind = ["image", "video", "audio"].includes(previewAsset.kind) ? previewAsset.kind : "file";
              const kind = baseKind === "file" ? (isImage ? "image" : isVideo ? "video" : isAudio ? "audio" : "file") : baseKind;
              if (kind === "image") return <img src={url} alt="preview" className="max-h-[80vh] w-auto h-auto object-contain" />;
              if (kind === "video") return <video src={url} controls autoPlay className="max-h-[80vh] w-auto h-auto object-contain" />;
              if (kind === "audio") return <audio src={url} controls className="w-full" />;
              return (
                <a href={url} target="_blank" rel="noreferrer" className="underline text-cow-purple">Open file</a>
              );
            })()}
          </div>
          {/* Filename and actions */}
          {previewAsset ? (
            <div className="mt-4 w-full flex items-center justify-between gap-2 flex-wrap">
              {(() => {
                const url = previewAsset.url;
                const filename = (() => {
                  try {
                    const u = new URL(url);
                    return decodeURIComponent(u.pathname.split('/').pop() || '');
                  } catch {
                    const clean = url.split('?')[0].split('#')[0];
                    const parts = clean.split('/');
                    return decodeURIComponent(parts[parts.length - 1] || '');
                  }
                })();
                return <div className="text-xs text-white/70 break-all">{filename || url}</div>;
              })()}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="pixel-corners border border-white/10 bg-background/40 hover:bg-background/60 text-white text-sm px-3 py-1"
                  onClick={() => window.open(previewAsset.url, '_blank', 'noopener,noreferrer')}
                >
                  Open
                </button>
                <a
                  href={previewAsset.url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="pixel-btn-primary text-sm px-3 py-1"
                >
                  Download
                </a>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const ShowcasePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tag, setTag] = useState<ShowcaseTag>("All");
  const [authOpen, setAuthOpen] = useState(false);

  const [desc, setDesc] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const { data: items = [], isLoading: loading } = useQuery({
    queryKey: ['showcases', search],
    queryFn: () => getShowcasesWithProfiles(search),
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Cleanup object URL on unmount or when filePreview changes
  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    // Validate file size (e.g., 50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
      });
      return;
    }

    const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(file.name);
    const isVideo = /\.(mp4|mov|webm)(\?|$)/i.test(file.name);
    const isAudio = /\.(mp3|wav|flac|ogg|aac|m4a)(\?|$)/i.test(file.name);

    if (!(isImage || isVideo || isAudio)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image, video, or audio file.",
      });
      return;
    }

    // Revoke previous URL if exists
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }

    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
  };

  const onCreate = async () => {
    if (!user || submitting || !selectedFile) {
      if (!selectedFile) {
        toast({
          variant: "destructive",
          title: "File required",
          description: "Please select a file to upload.",
        });
      }
      return;
    }

    try {
      setSubmitting(true);
      await createShowcase({
        description: desc.trim(),
        file: selectedFile
      });

      toast({
        title: "Success",
        description: "Your showcase has been created!",
      });

      setDesc("");
      setSelectedFile(null);
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
      setFilePreview(null);
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['showcases'] });
    } catch (error: any) {
      console.error("Failed to create showcase:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create showcase. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background cow-grid-bg">
      <Navbar />
      {/* pad top to avoid content under fixed navbar */}
      <div className="container mx-auto px-4 pt-28 pb-12">
        <Helmet>
          <title>Showcase | Renderdragon</title>
          <meta name="description" content="Share your art with images and videos." />
        </Helmet>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-6">
          <h1 className="text-3xl md:text-4xl font-minecraftia">Community <span className="text-cow-purple">Assets</span></h1>
          <div className="flex-1" />
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages..."
                className="pl-9 bg-background/60"
              />
            </div>
            <Button variant="secondary" onClick={() => { }} className="pixel-btn-secondary">Search</Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <Button
                className="pixel-btn-primary"
                onClick={() => {
                  if (!user) {
                    setAuthOpen(true);
                  } else {
                    setOpen(true);
                  }
                }}
              >
                <IconPlus className="mr-2 h-4 w-4" /> Create Showcase
              </Button>
              <DialogContent className="bg-popover/90 border-white/10">
                <DialogHeader>
                  <DialogTitle className="font-minecraftia">Create Showcase</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Say something about your art..." />
                  </div>

                  <div className="space-y-2">
                    <Label>Upload file</Label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,video/*,audio/*"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      className="w-full pixel-corners border-dashed border-2 h-20 hover:bg-cow-purple/10 hover:border-cow-purple/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <IconPlus className="h-6 w-6" />
                        <span className="text-sm">Choose file (Image, Video, Audio)</span>
                      </div>
                    </Button>

                    {filePreview && (
                      <div className="mt-4">
                        <div className="relative w-full aspect-video bg-background/40 pixel-corners border border-white/10 flex items-center justify-center overflow-hidden">
                          {selectedFile?.type.startsWith('image/') ? (
                            <img src={filePreview} alt="preview" className="w-full h-full object-contain" />
                          ) : selectedFile?.type.startsWith('video/') ? (
                            <video src={filePreview} controls className="w-full h-full object-contain" />
                          ) : selectedFile?.type.startsWith('audio/') ? (
                            <audio src={filePreview} controls className="w-3/4" />
                          ) : (
                            <div className="text-white/70 text-sm">{selectedFile?.name}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                      onClick={onCreate}
                      disabled={submitting || !selectedFile}
                      className="pixel-btn-primary"
                    >
                      {submitting ? (
                        <>
                          <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        "Publish Showcase"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <IconLoader2 className="h-6 w-6 animate-spin text-cow-purple" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-white/70 min-h-[40vh] py-16">
            <div className="text-2xl font-minecraftia mb-2">No showcases yet</div>
            <p className="max-w-md">Be the first to share your art! Click "Create Showcase" to upload an image, video, or audio file.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((it) => (
              <ShowcaseCard key={it.id} item={it} />
            ))}
          </div>
        )}
      </div>
      <Footer />
      {/* Authentication dialog shown when user tries to create a post without being signed in */}
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
};

export default ShowcasePage;
