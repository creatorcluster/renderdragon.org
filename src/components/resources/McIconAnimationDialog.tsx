import { useCallback, useEffect, useRef, useState } from 'react';
import { Resource, getResourceUrl } from '@/types/resources';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
  IconDeviceDesktopDown,
  IconPhotoDown,
} from '@tabler/icons-react';
import {
  AnimationSettings,
  BACKGROUND_OPTIONS,
  BackgroundKind,
  DEFAULT_SETTINGS,
  ENTER_OPTIONS,
  EnterKind,
  EXIT_OPTIONS,
  EXPORT_SIZES,
  ExitKind,
  IDLE_OPTIONS,
  IdleKind,
  backgroundColor,
  drawMcIconFrame,
  exportAnimation,
  exportPng,
  getLoopDuration,
  loadIconImage,
  sanitizeFilename,
  saveBlob,
} from '@/lib/mcIconAnimation';

interface McIconAnimationDialogProps {
  resource: Resource | null;
  onClose: () => void;
}

type ExportSize = (typeof EXPORT_SIZES)[number];

const AnimationStudio = ({ resource }: { resource: Resource }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const sizeRef = useRef(300);
  const dprRef = useRef(1);
  const timeRef = useRef(0);
  const settingsRef = useRef<AnimationSettings>(DEFAULT_SETTINGS);
  const playingRef = useRef(true);
  const backgroundRef = useRef<BackgroundKind>('transparent');

  const [settings, setSettings] = useState<AnimationSettings>(DEFAULT_SETTINGS);
  const [playing, setPlaying] = useState(true);
  const [background, setBackground] = useState<BackgroundKind>('transparent');
  const [exportSize, setExportSize] = useState<ExportSize>(512);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reloadKey, setReloadKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportingPng, setExportingPng] = useState(false);

  settingsRef.current = settings;
  playingRef.current = playing;
  backgroundRef.current = background;

  const imageSrc = resource.image_url || getResourceUrl(resource);
  const loopDuration = getLoopDuration(settings);
  const baseName = sanitizeFilename(resource.title);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    imageRef.current = null;
    timeRef.current = 0;
    loadIconImage(imageSrc)
      .then((image) => {
        if (!active) return;
        imageRef.current = image;
        setStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        imageRef.current = null;
        setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [imageSrc, reloadKey]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const cssSize = Math.max(120, Math.min(rect.width, rect.height || rect.width));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssSize * dpr);
      canvas.height = Math.round(cssSize * dpr);
      sizeRef.current = cssSize;
      dprRef.current = dpr;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let previous = performance.now();

    const render = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.1);
      previous = now;
      if (playingRef.current) {
        timeRef.current += delta;
      }
      const size = sizeRef.current;
      const dpr = dprRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const fill = backgroundColor(backgroundRef.current);
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fillRect(0, 0, size, size);
      }
      const image = imageRef.current;
      if (image) {
        drawMcIconFrame(ctx, size, timeRef.current, settingsRef.current, image);
      }
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  const update = useCallback((patch: Partial<AnimationSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const restart = useCallback(() => {
    timeRef.current = 0;
  }, []);

  const handleDownloadVideo = useCallback(async () => {
    const image = imageRef.current;
    if (!image || exporting) return;
    setExporting(true);
    setExportProgress(0);
    try {
      const { blob, extension } = await exportAnimation({
        image,
        settings,
        size: exportSize,
        background,
        onProgress: setExportProgress,
      });
      saveBlob(blob, `${baseName}_animated.${extension}`);
      toast.success('Animation downloaded!');
    } catch (error) {
      console.error(error);
      toast.error('Could not export the animation', {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  }, [background, baseName, exportSize, exporting, settings]);

  const handleDownloadPng = useCallback(async () => {
    const image = imageRef.current;
    if (!image || exportingPng) return;
    setExportingPng(true);
    try {
      const blob = await exportPng({
        image,
        settings,
        size: exportSize,
        background,
        time: timeRef.current,
      });
      saveBlob(blob, `${baseName}_${exportSize}px.png`);
      toast.success('PNG downloaded!');
    } catch (error) {
      console.error(error);
      toast.error('Could not export the PNG');
    } finally {
      setExportingPng(false);
    }
  }, [background, baseName, exportSize, exportingPng, settings]);

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-3">
        <div className="chamfer border border-border overflow-hidden">
          <div
            ref={wrapRef}
            className="relative w-full aspect-square"
            style={{
              backgroundColor: 'transparent',
              backgroundImage:
                'repeating-conic-gradient(from 0deg, hsl(var(--muted) / 0.25) 0deg 90deg, transparent 90deg 180deg)',
              backgroundSize: '24px 24px',
            }}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full"
              role="img"
              aria-label={`Animated preview of ${resource.title}`}
            />

            {status === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {status === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>Could not load this icon.</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setReloadKey((key) => key + 1)}
                >
                  <IconRefresh className="h-3.5 w-3.5 mr-1" />
                  Retry
                </Button>
              </div>
            )}

            {status === 'ready' && (
              <div className="absolute right-2 top-2 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-background/70 backdrop-blur hover:bg-background"
                  onClick={restart}
                  aria-label="Restart animation"
                >
                  <IconRefresh className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-background/70 backdrop-blur hover:bg-background"
                  onClick={() => setPlaying((value) => !value)}
                  aria-label={playing ? 'Pause animation' : 'Play animation'}
                >
                  {playing ? (
                    <IconPlayerPause className="h-4 w-4" />
                  ) : (
                    <IconPlayerPlay className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground font-mono">
          Loop length: {loopDuration.toFixed(1)}s · {exportSize}px export
        </p>
      </div>

      <div className="space-y-5">
        <section className="space-y-2">
          <h4 className="text-sm font-mono text-muted-foreground">Motion</h4>
          <div className="grid grid-cols-3 gap-2">
            <ControlSelect
              label="Enters"
              value={settings.enter}
              options={ENTER_OPTIONS}
              onChange={(value) => update({ enter: value as EnterKind })}
            />
            <ControlSelect
              label="Idle"
              value={settings.idle}
              options={IDLE_OPTIONS}
              onChange={(value) => update({ idle: value as IdleKind })}
            />
            <ControlSelect
              label="Exits"
              value={settings.exit}
              options={EXIT_OPTIONS}
              onChange={(value) => update({ exit: value as ExitKind })}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Switch
                checked={settings.shine}
                onCheckedChange={(checked) => update({ shine: checked })}
                aria-label="Toggle shine sweep"
              />
              Shine
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Switch
                checked={settings.ground}
                onCheckedChange={(checked) => update({ ground: checked })}
                aria-label="Toggle contact shadow"
              />
              Shadow
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Switch
                checked={playing}
                onCheckedChange={setPlaying}
                aria-label={playing ? 'Pause animation' : 'Play animation'}
              />
              {playing ? 'Playing' : 'Paused'}
            </label>
          </div>
        </section>

        <section className="space-y-2">
          <h4 className="text-sm font-mono text-muted-foreground">Export</h4>
          <div className="space-y-2">
            <span className="text-[11px] text-muted-foreground">Size</span>
            <div className="grid grid-cols-3 gap-2">
              {EXPORT_SIZES.map((size) => (
                <Button
                  key={size}
                  type="button"
                  variant={exportSize === size ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs chamfer"
                  onClick={() => setExportSize(size)}
                >
                  {size}px
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] text-muted-foreground">Background</span>
            <div className="grid grid-cols-2 gap-2">
              {BACKGROUND_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={background === option.value ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs chamfer justify-start"
                  onClick={() => setBackground(option.value)}
                >
                  <span
                    className="mr-2 inline-block h-3 w-3 rounded-sm border border-border"
                    style={{
                      backgroundColor:
                        option.value === 'transparent' ? 'transparent' : option.color,
                      backgroundImage:
                        option.value === 'transparent'
                          ? 'repeating-conic-gradient(#888 0deg 90deg, #444 90deg 180deg)'
                          : undefined,
                      backgroundSize: '6px 6px',
                    }}
                  />
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {exporting && (
            <div className="space-y-1">
              <Progress value={Math.round(exportProgress * 100)} className="h-2 chamfer" />
              <p className="text-xs text-muted-foreground text-center">
                Recording animation… {Math.round(exportProgress * 100)}%
              </p>
            </div>
          )}

          <div className="grid gap-2">
            <Button
              onClick={handleDownloadVideo}
              disabled={status !== 'ready' || exporting}
            >
              <IconDeviceDesktopDown className="h-4 w-4 mr-2" />
              {exporting ? 'Recording…' : 'Download Animation'}
            </Button>
            <Button
              variant="outline"
              className="chamfer"
              onClick={handleDownloadPng}
              disabled={status !== 'ready' || exportingPng}
            >
              <IconPhotoDown className="h-4 w-4 mr-2" />
              {exportingPng ? 'Saving…' : 'Download PNG'}
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Video exports as WebM (or MP4 where supported) and is recorded as one loop.
            {background === 'transparent' &&
              ' Transparency is preserved in browsers that support alpha video — otherwise the background renders black.'}
          </p>
        </section>
      </div>
    </div>
  );
};

const McIconAnimationDialog = ({ resource, onClose }: McIconAnimationDialogProps) => (
  <Dialog open={!!resource} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-w-5xl chamfer border border-primary max-h-[92vh] overflow-y-auto custom-scrollbar">
      <DialogHeader>
        <DialogTitle className="text-2xl font-heading">
          Animate {resource?.title}
        </DialogTitle>
        <DialogDescription>
          Build an animated icon and download it as a video or a static PNG.
        </DialogDescription>
      </DialogHeader>

      {resource && <AnimationStudio key={String(resource.id)} resource={resource} />}
    </DialogContent>
  </Dialog>
);

interface ControlSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

const ControlSelect = ({ label, value, options, onChange }: ControlSelectProps) => (
  <div className="flex flex-col gap-1">
    <span className="text-[11px] text-muted-foreground">{label}</span>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default McIconAnimationDialog;
