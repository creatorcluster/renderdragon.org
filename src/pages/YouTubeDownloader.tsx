import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

import { IconDownload, IconAlertCircle, IconRefresh, IconBrandYoutube, IconInfoCircle } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import VideoInfoSkeleton from '@/components/skeletons/VideoInfoSkeleton';

// API types from mediapye YouTube Video Inspector
interface YoutubeThumbnail {
  url: string;
  width?: number;
  height?: number;
}

interface VideoStatistics {
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
}

interface ChannelInfo {
  id: string;
  title: string;
  description?: string;
  thumbnails?: Record<string, YoutubeThumbnail>;
  subscriberCount?: number;
  videoCount?: number;
}

interface ApiVideo {
  id: string;
  url: string;
  title: string;
  description: string;
  publishedAt: string; // ISO string
  channelId: string;
  channelTitle: string;
  thumbnails: Record<string, YoutubeThumbnail>;
  duration: string; // ISO 8601 duration
  tags?: string[];
  statistics?: VideoStatistics;
  channel?: ChannelInfo;
}

const YouTubeDownloader: React.FC = () => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [video, setVideo] = useState<ApiVideo | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [urlError, setUrlError] = useState(false);
  const [isDownloadingThumb, setIsDownloadingThumb] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const isValidYoutubeUrl = (url: string) => /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url);

  useEffect(() => {
    // Reset displayed info when URL changes
    setVideo(null);
    setShowFullDesc(false);
  }, [youtubeUrl]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setYoutubeUrl(value);
    const looksLikeId = /^[a-zA-Z0-9_-]{11}$/.test(value.trim());
    setUrlError(value.length > 0 && !looksLikeId && !isValidYoutubeUrl(value));
    setVideo(null);
  };

  const handleFetchInfo = async () => {
    if (!youtubeUrl) {
      toast.error('Please enter a YouTube URL or ID');
      setUrlError(true);
      return;
    }

    // Allow IDs as well; if not a full URL, don't validate URL pattern strictly
    const looksLikeId = /^[a-zA-Z0-9_-]{11}$/.test(youtubeUrl.trim());
    if (!looksLikeId && !isValidYoutubeUrl(youtubeUrl)) {
      toast.error('Please enter a valid YouTube URL or 11-character video ID');
      setUrlError(true);
      return;
    }

    setIsLoadingInfo(true);
    setVideo(null);
    setUrlError(false);

    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const base = 'https://mediapye.vercel.app';
        const url = `${base}/api/youtube?input=${encodeURIComponent(youtubeUrl.trim())}`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        clearTimeout(timeoutId);
        if (!res.ok) {
          // Handle specific HTTP status codes
          if (res.status === 504) {
            throw new Error('Server timeout - The service is temporarily unavailable. Please try again in a few minutes.');
          } else if (res.status === 503) {
            throw new Error('Service unavailable - The server is temporarily overloaded. Please try again later.');
          } else if (res.status === 429) {
            throw new Error('Rate limit exceeded - Please wait a moment before trying again.');
          } else if (res.status === 403) {
            throw new Error('Access denied - YouTube may be blocking requests. Please try again later.');
          }
          const errJson = await res.json().catch(() => ({})) as { error?: string; message?: string };
          const message = errJson?.error || errJson?.message || `Request failed (${res.status})`;
          throw new Error(message);
        }

        const data = await res.json();
        if (!data?.video) {
          throw new Error('Unexpected response format');
        }
        setVideo(data.video as ApiVideo);
        toast.success('Video information loaded successfully!');
        setIsLoadingInfo(false);
        return; // Success, exit retry loop

      } catch (err: unknown) {
        console.error(`Attempt ${attempt} failed:`, err);

        if (err instanceof Error) {
          // Handle AbortError (timeout)
          if (err.name === 'AbortError') {
            const timeoutMsg = 'Request timed out - The server is taking too long to respond. Please try again.';

            if (attempt === MAX_RETRIES) {
              toast.error(timeoutMsg);
              break;
            } else {
              toast.warning(`${timeoutMsg} Retrying... (${attempt}/${MAX_RETRIES})`);
            }
          } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
            // Network errors
            const networkMsg = 'Network error - Please check your internet connection and try again.';

            if (attempt === MAX_RETRIES) {
              toast.error(networkMsg);
              break;
            } else {
              toast.warning(`${networkMsg} Retrying... (${attempt}/${MAX_RETRIES})`);
            }
          } else {
            // Other errors
            if (attempt === MAX_RETRIES) {
              toast.error(`Failed to fetch video info: ${err.message}`);
              break;
            } else {
              toast.warning(`Attempt ${attempt} failed: ${err.message}. Retrying...`);
            }
          }
        } else {
          const genericMsg = 'An unexpected error occurred. Please try again.';

          if (attempt === MAX_RETRIES) {
            toast.error(genericMsg);
            break;
          } else {
            toast.warning(`${genericMsg} Retrying... (${attempt}/${MAX_RETRIES})`);
          }
        }

        // Wait before retrying (except on the last attempt)
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
        }
      }
    }

    setIsLoadingInfo(false);
  };

  const handleDownloadThumbnail = async () => {
    if (!video) return;
    setIsDownloadingThumb(true);
    toast.info('Preparing thumbnail download...');

    try {
      const thumbUrl = getBestThumbnailUrl(video.thumbnails);

      // Use the server-side endpoint to handle cross-origin download
      // Direct anchor downloads don't work in Firefox/Safari for cross-origin URLs
      const response = await fetch(`/api/downloadThumbnail?url=${encodeURIComponent(thumbUrl)}&title=${encodeURIComponent(video.title)}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Download failed' }));
        throw new Error(errorData.error || 'Failed to download thumbnail');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${video.title}_thumbnail.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Thumbnail downloaded successfully!');
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          toast.error('Thumbnail download timed out - Please try again.');
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          toast.error('Network error during thumbnail download - Please check your internet connection.');
        } else {
          toast.error(`Thumbnail download failed: ${err.message}`);
        }
      } else {
        toast.error('An unexpected error occurred during thumbnail download.');
      }
      console.error(err);
    } finally {
      setIsDownloadingThumb(false);
    }
  };

  const getBestThumbnailUrl = (thumbs: Record<string, YoutubeThumbnail>): string => {
    const order = ['maxres', 'standard', 'high', 'medium', 'default'];
    for (const k of order) {
      if (thumbs?.[k]?.url) return thumbs[k].url;
    }
    // fallback: first available
    const any = Object.values(thumbs || {})[0];
    return any?.url || '';
  };

  const humanizeDuration = (iso: string): string => {
    // Simple ISO 8601 duration parser for PT#H#M#S
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return iso;
    const h = m[1] ? parseInt(m[1], 10) : 0;
    const min = m[2] ? parseInt(m[2], 10) : 0;
    const s = m[3] ? parseInt(m[3], 10) : 0;
    const parts: string[] = [];
    if (h) parts.push(`${h}h`);
    if (min) parts.push(`${min}m`);
    if (s || parts.length === 0) parts.push(`${s}s`);
    return parts.join(' ');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Youtube Tools - Renderdragon</title>
        <meta
          name="description"
          content="Inspect YouTube video details for fair use and educational purposes. View channel, stats, duration, and thumbnail with quick download."
        />
      </Helmet>
      <Navbar />

      <main className="flex-grow pt-24 pb-16 cow-grid-bg">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-minecraftia mb-8 text-center">
              <span className="text-cow-purple">Youtube</span> Tools
            </h1>

            <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
              Inspect YouTube videos and download thumbnails for content creation purposes. Always respect copyright laws and only use content
              you have permission to use.
            </p>

            <Alert className="mb-8 pixel-corners">
              <IconInfoCircle className="h-4 w-4" />
              <AlertTitle>Important Notice</AlertTitle>
              <AlertDescription>
                This tool is for educational purposes only. You are responsible for ensuring you have the right to download
                and use any content.
              </AlertDescription>
            </Alert>

            <div className="pixel-card mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  placeholder="Paste YouTube URL or ID here"
                  value={youtubeUrl}
                  onChange={handleUrlChange}
                  className={`pixel-corners flex-grow ${urlError ? 'border-red-500' : ''}`}
                />
                <Button onClick={handleFetchInfo} disabled={isLoadingInfo} className="pixel-btn-primary flex items-center">
                  {isLoadingInfo ? (
                    <>
                      <IconRefresh className="h-4 w-4 mr-2 animate-spin" /> <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <IconBrandYoutube className="h-4 w-4 mr-2" /> <span>Fetch Video Info</span>
                    </>
                  )}
                </Button>
              </div>
              {urlError && (
                <p className="text-red-500 text-xs mt-2 flex items-center">
                  <IconAlertCircle className="h-3 w-3 mr-1" /> Please enter a valid YouTube URL or 11-character ID
                </p>
              )}
            </div>

            {isLoadingInfo && <VideoInfoSkeleton />}

            {video && !isLoadingInfo && (
              <div className="pixel-card space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-2/5">
                    <img src={getBestThumbnailUrl(video.thumbnails)} alt={video.title} className="rounded-md w-full h-auto" />
                  </div>
                  <div className="w-full md:w-3/5">
                    <h2 className="text-xl font-vt323 mb-2">{video.title}</h2>
                    <div className="flex flex-wrap gap-3 mb-4">
                      <div className="bg-accent text-accent-foreground px-2 py-1 rounded-md text-xs flex items-center">
                        <span className="mr-1">Duration:</span> {humanizeDuration(video.duration)}
                      </div>
                      <div className="bg-accent text-accent-foreground px-2 py-1 rounded-md text-xs flex items-center">
                        <span className="mr-1">Channel:</span> {video.channel?.title || video.channelTitle}
                      </div>
                      <div className="bg-accent text-accent-foreground px-2 py-1 rounded-md text-xs flex items-center">
                        <span className="mr-1">Published:</span> {new Date(video.publishedAt).toLocaleDateString()}
                      </div>
                      {typeof video.statistics?.viewCount !== 'undefined' && (
                        <div className="bg-accent text-accent-foreground px-2 py-1 rounded-md text-xs flex items-center">
                          <span className="mr-1">Views:</span> {video.statistics.viewCount.toLocaleString()}
                        </div>
                      )}
                      {typeof video.statistics?.likeCount !== 'undefined' && (
                        <div className="bg-accent text-accent-foreground px-2 py-1 rounded-md text-xs flex items-center">
                          <span className="mr-1">Likes:</span> {video.statistics.likeCount.toLocaleString()}
                        </div>
                      )}
                    </div>

                    <Button onClick={handleDownloadThumbnail} disabled={isDownloadingThumb} className="w-full pixel-btn-primary flex items-center justify-center">
                      {isDownloadingThumb ? (
                        <>
                          <IconRefresh className="h-5 w-5 mr-2 animate-spin" /> <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <IconDownload className="h-5 w-5 mr-2" /> <span>Download Thumbnail</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-vt323 text-lg">Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {(() => {
                      const desc = video.description || '';
                      if (!desc) return 'No description available.';
                      const half = Math.ceil(desc.length / 2);
                      if (showFullDesc || desc.length <= half) return desc;
                      return desc.slice(0, half) + '...';
                    })()}
                  </p>
                  {video.description && video.description.length > 0 && (
                    <Button variant="secondary" className="pixel-corners" onClick={() => setShowFullDesc(v => !v)}>
                      {showFullDesc ? 'Show less' : 'Show more'}
                    </Button>
                  )}
                </div>

                {/* Tags */}
                {video.tags && video.tags.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-vt323 text-lg">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {video.tags.slice(0, 20).map((t) => (
                        <span key={t} className="bg-accent text-accent-foreground px-2 py-1 rounded-md text-xs">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Channel section */}
                <div className="space-y-2">
                  <h3 className="font-vt323 text-lg">Channel</h3>
                  <div className="flex items-start gap-3">
                    {video.channel?.thumbnails && (
                      <img
                        src={getBestThumbnailUrl(video.channel.thumbnails)}
                        alt={video.channel.title}
                        className="w-12 h-12 rounded"
                      />
                    )}
                    <div className="space-y-1">
                      <p className="text-sm"><span className="font-semibold">{video.channel?.title || video.channelTitle}</span></p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {typeof video.channel?.subscriberCount !== 'undefined' && (
                          <span>Subscribers: {video.channel.subscriberCount.toLocaleString()}</span>
                        )}
                        {typeof video.channel?.videoCount !== 'undefined' && (
                          <span>Videos: {video.channel.videoCount.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

    </div>
  );
};

export default YouTubeDownloader;