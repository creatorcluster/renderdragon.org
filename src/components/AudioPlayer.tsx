import { useState, useRef, useEffect, useCallback } from 'react';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
  IconLoader2
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const AUDIO_PLAY_EVENT = 'rd:audio-play';

interface AudioPlayerProps {
  src: string;
  className?: string;
  isInView?: boolean;
  allowPlayBeforeReady?: boolean;
}

const AudioPlayer = ({ src, className, isInView = true, allowPlayBeforeReady = false }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<import('wavesurfer.js').default | null>(null);
  const instanceId = useRef<string>(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  // Only one audio preview may play at a time: when a player starts, the others
  // pause themselves.
  useEffect(() => {
    const handleOtherPlay = (event: Event) => {
      if ((event as CustomEvent).detail === instanceId.current) return;
      const ws = wavesurfer.current;
      if (ws && ws.isPlaying()) ws.pause();
    };
    window.addEventListener(AUDIO_PLAY_EVENT, handleOtherPlay);
    return () => window.removeEventListener(AUDIO_PLAY_EVENT, handleOtherPlay);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    let ws: import('wavesurfer.js').default | null = null;
    let isMounted = true;
    setLoadError(false);
    setIsReady(false);
    import('wavesurfer.js').then(({ default: WaveSurfer }) => {
      if (!isMounted || !containerRef.current) return;
      ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(139, 92, 246, 0.2)', // Soft cow-purple
      progressColor: '#8b5cf6', // Solid cow-purple
      cursorColor: '#c4b5fd',
      cursorWidth: 2,
      barWidth: 2,
      barRadius: 4,
      height: 48,
      barGap: 3,
      normalize: true,
      hideScrollbar: true,
      });
      wavesurfer.current = ws;

    if (allowPlayBeforeReady) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
      ws.load(src).catch((err) => {
      if (err.name === 'AbortError') return;
      console.error('WaveSurfer load error:', err);
        if (isMounted) {
          setIsLoading(false);
          setLoadError(true);
        }
      });

      ws.on('ready', () => {
      if (!isMounted) return;
      setDuration(ws.getDuration());
      setIsLoading(false);
      setIsReady(true);
      });

      ws.on('audioprocess', () => {
      if (!isMounted) return;
      setCurrentTime(ws.getCurrentTime());
      });

      ws.on('play', () => {
        if (!isMounted) return;
        setIsPlaying(true);
        window.dispatchEvent(new CustomEvent(AUDIO_PLAY_EVENT, { detail: instanceId.current }));
      });
      ws.on('pause', () => isMounted && setIsPlaying(false));
      ws.on('finish', () => isMounted && setIsPlaying(false));
    }).catch((error: unknown) => {
      if (!isMounted) return;
      console.error('Failed to load WaveSurfer:', error);
      setIsLoading(false);
      setLoadError(true);
    });

    return () => {
      isMounted = false;
      setIsReady(false);
      if (wavesurfer.current === ws) wavesurfer.current = null;
      ws?.destroy();
    };
  }, [src, allowPlayBeforeReady, retryKey]);

  // Handle visibility
  useEffect(() => {
    if (!isInView && isPlaying) {
      wavesurfer.current?.pause();
    }
  }, [isInView, isPlaying]);

  const togglePlay = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!wavesurfer.current) return;
    wavesurfer.current.playPause();
  }, []);

  const skipForward = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!wavesurfer.current) return;
    wavesurfer.current.setTime(Math.min(wavesurfer.current.getCurrentTime() + 5, duration));
  }, [duration]);

  const skipBackward = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!wavesurfer.current) return;
    wavesurfer.current.setTime(Math.max(wavesurfer.current.getCurrentTime() - 5, 0));
  }, []);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "w-full rounded-xl bg-card border border-border p-5 shadow-lg group/player transition-all duration-300 hover:border-primary/30",
      className
    )}>
      <div className="flex flex-col space-y-3">
        {/* Waveform Container */}
        <div className="relative h-12 w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center">
          {isLoading && !allowPlayBeforeReady && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted">
              <IconLoader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-xs tracking-wider text-muted-foreground">LOADING WAVEFORM...</span>
            </div>
          )}
          {isLoading && allowPlayBeforeReady && (
            <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
              <IconLoader2 className="h-3 w-3 animate-spin text-primary" />
              <span className="text-[10px] tracking-wider text-muted-foreground">Loading waveform...</span>
            </div>
          )}
          <div ref={containerRef} className="w-full" />
          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-muted text-sm text-muted-foreground">
              <span>Audio preview unavailable.</span>
              <Button variant="outline" size="sm" onClick={() => setRetryKey((key) => key + 1)}>Retry</Button>
            </div>
          )}
        </div>

        {/* Controls and Info */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary transition-colors"
              onClick={skipBackward}
              disabled={!isReady && !allowPlayBeforeReady}
            >
              <IconPlayerSkipBack size={16} fill="currentColor" className="opacity-70" />
            </Button>

            <Button
              size="icon"
              className="h-11 w-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:scale-105 transition-all duration-200"
              onClick={togglePlay}
              disabled={!isReady && !allowPlayBeforeReady}
            >
              {isPlaying ? (
                <IconPlayerPause size={22} fill="currentColor" />
              ) : (
                <IconPlayerPlay size={22} fill="currentColor" className="translate-x-[1px]" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary transition-colors"
              onClick={skipForward}
              disabled={!isReady && !allowPlayBeforeReady}
            >
              <IconPlayerSkipForward size={16} fill="currentColor" className="opacity-70" />
            </Button>
          </div>

          <div className="flex items-center gap-1.5 font-geist-mono text-xs font-medium tracking-tight text-muted-foreground">
            <span className="text-foreground">{formatTime(currentTime)}</span>
            <span className="opacity-30">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
