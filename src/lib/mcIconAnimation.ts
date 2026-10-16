export type EnterKind = 'none' | 'pop' | 'drop' | 'spin' | 'zoom' | 'slide';
export type IdleKind = 'still' | 'float' | 'sway' | 'pulse' | 'spin3d' | 'flip';
export type ExitKind = 'none' | 'pop' | 'shrink' | 'spin' | 'fall' | 'fade';
export type BackgroundKind = 'transparent' | 'black' | 'white' | 'chroma';

export interface AnimationSettings {
  enter: EnterKind;
  idle: IdleKind;
  exit: ExitKind;
  shine: boolean;
  ground: boolean;
}

export interface Frame {
  opacity: number;
  scale: number;
  scaleX: number;
  rotate: number;
  y: number;
}

export const DEFAULT_SETTINGS: AnimationSettings = {
  enter: 'pop',
  idle: 'float',
  exit: 'fade',
  shine: true,
  ground: true,
};

export const ENTER_OPTIONS: { value: EnterKind; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'pop', label: 'Pop' },
  { value: 'drop', label: 'Drop' },
  { value: 'spin', label: 'Spin' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'slide', label: 'Rise' },
];

export const IDLE_OPTIONS: { value: IdleKind; label: string }[] = [
  { value: 'still', label: 'Still' },
  { value: 'float', label: 'Float' },
  { value: 'sway', label: 'Sway' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'spin3d', label: 'Spin 3D' },
  { value: 'flip', label: 'Flip' },
];

export const EXIT_OPTIONS: { value: ExitKind; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'pop', label: 'Pop' },
  { value: 'shrink', label: 'Shrink' },
  { value: 'spin', label: 'Spin' },
  { value: 'fall', label: 'Fall' },
  { value: 'fade', label: 'Fade' },
];

export const BACKGROUND_OPTIONS: { value: BackgroundKind; label: string; color: string }[] = [
  { value: 'transparent', label: 'Transparent', color: 'transparent' },
  { value: 'black', label: 'Black', color: '#000000' },
  { value: 'white', label: 'White', color: '#ffffff' },
  { value: 'chroma', label: 'Chroma', color: '#00ff00' },
];

export const EXPORT_SIZES = [256, 512, 1024] as const;

const IDENTITY: Frame = { opacity: 1, scale: 1, scaleX: 1, rotate: 0, y: 0 };
const TAU = Math.PI * 2;

const ENTER_DURATION: Record<EnterKind, number> = {
  none: 0,
  pop: 0.5,
  drop: 0.85,
  spin: 0.7,
  zoom: 0.55,
  slide: 0.6,
};

const EXIT_DURATION: Record<ExitKind, number> = {
  none: 0,
  pop: 0.45,
  shrink: 0.5,
  spin: 0.6,
  fall: 0.9,
  fade: 0.5,
};

const IDLE_TOTAL = 2.4;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) =>
  1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
const easeOutBounce = (t: number) => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
};

const idleCycles = (kind: IdleKind, total: number) =>
  Math.max(1, Math.round(total / (kind === 'spin3d' || kind === 'flip' ? 3.2 : 1.6)));

const enterFrame = (kind: EnterKind, t: number): Frame => {
  const frame: Frame = { ...IDENTITY };
  switch (kind) {
    case 'pop':
      frame.opacity = clamp01(3 * t);
      frame.scale = easeOutBack(t);
      break;
    case 'drop':
      frame.opacity = clamp01(5 * t);
      frame.y = -(1.4 * (1 - easeOutBounce(t)));
      break;
    case 'spin':
      frame.opacity = clamp01(3 * t);
      frame.scale = 0.2 + 0.8 * easeOutBack(t);
      frame.rotate = (easeOutCubic(t) - 1) * TAU;
      break;
    case 'zoom':
      frame.opacity = easeOutCubic(t);
      frame.scale = 2.4 - 1.4 * easeOutCubic(t);
      break;
    case 'slide':
      frame.opacity = easeOutCubic(t);
      frame.y = (1 - easeOutCubic(t)) * 0.9;
      break;
    default:
      break;
  }
  return frame;
};

const idleFrame = (kind: IdleKind, progress: number, cycles: number): Frame => {
  const frame: Frame = { ...IDENTITY };
  const s = Math.sin(TAU * progress * cycles);
  switch (kind) {
    case 'float':
      frame.y = -(0.07 * s);
      break;
    case 'sway':
      frame.rotate = 0.14 * s;
      break;
    case 'pulse':
      frame.scale = 1 + 0.08 * Math.abs(s);
      break;
    case 'spin3d': {
      const s2 = Math.sin(TAU * progress * cycles * 2);
      frame.y = -(0.06 * s2);
      frame.scaleX = Math.cos(progress * cycles * TAU);
      break;
    }
    case 'flip': {
      const s2 = Math.sin(TAU * progress * cycles * 2);
      frame.y = -(0.06 * s2);
      frame.rotate = progress * cycles * TAU;
      break;
    }
    default:
      break;
  }
  return frame;
};

const exitFrame = (kind: ExitKind, t: number): Frame => {
  const frame: Frame = { ...IDENTITY };
  switch (kind) {
    case 'pop':
      frame.scale = Math.max(0, 1 - (2.70158 * Math.pow(t, 3) - 1.70158 * Math.pow(t, 2)));
      frame.opacity = t > 0.9 ? 0 : 1;
      break;
    case 'shrink':
      frame.scale = 1 - Math.pow(t, 3);
      frame.opacity = 1 - Math.pow(t, 3);
      break;
    case 'spin':
      frame.scale = 1 - Math.pow(t, 3);
      frame.rotate = Math.pow(t, 3) * TAU;
      break;
    case 'fall':
      frame.y = 1.6 * Math.pow(t, 3);
      frame.rotate = 0.6 * Math.pow(t, 3);
      frame.opacity = 1 - Math.pow(t, 4);
      break;
    case 'fade':
      frame.opacity = 1 - t;
      break;
    default:
      break;
  }
  return frame;
};

export const getLoopDuration = (settings: AnimationSettings): number => {
  const enter = settings.enter === 'none' ? 0 : ENTER_DURATION[settings.enter];
  const exit = settings.exit === 'none' ? 0 : EXIT_DURATION[settings.exit];
  return Math.max(0.4, enter + IDLE_TOTAL + exit);
};

const transformFor = (settings: AnimationSettings, time: number): Frame => {
  const enter = settings.enter === 'none' ? 0 : ENTER_DURATION[settings.enter];
  const idle = IDLE_TOTAL;
  const exit = settings.exit === 'none' ? 0 : EXIT_DURATION[settings.exit];
  const total = enter + idle + exit;
  const t = total > 0 ? ((time % total) + total) % total : 0;

  if (t < enter) {
    return enterFrame(settings.enter, enter ? t / enter : 1);
  }
  if (t < enter + idle) {
    const progress = (t - enter) / idle;
    return idleFrame(settings.idle, progress, idleCycles(settings.idle, idle));
  }
  return exitFrame(settings.exit, exit ? (t - enter - idle) / exit : 1);
};

export const loadIconImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load ${src}`));
    image.src = src;
  });

export const drawMcIconFrame = (
  ctx: CanvasRenderingContext2D,
  size: number,
  time: number,
  settings: AnimationSettings,
  image: HTMLImageElement,
): void => {
  const frame = transformFor(settings, time);
  const pad = size * 0.14;
  const box = size - pad * 2;
  const iw = image.naturalWidth || 1;
  const ih = image.naturalHeight || 1;
  const fit = Math.min(box / iw, box / ih);
  const drawWidth = iw * fit;
  const drawHeight = ih * fit;
  const centerX = size / 2;
  const centerY = size / 2;
  const unit = box;

  ctx.imageSmoothingEnabled = iw > 64 || ih > 64;
  if (ctx.imageSmoothingEnabled) ctx.imageSmoothingQuality = 'high';

  const lifted = Math.max(0, -frame.y) + Math.max(0, frame.scale - 1);
  if (settings.ground && (settings.idle === 'float' || settings.idle === 'pulse' || settings.idle === 'spin3d')) {
    const lift = clamp01(lifted / 0.4);
    const radiusX = box * 0.32 * (1 - 0.35 * lift);
    const radiusY = radiusX * 0.24;
    const groundY = centerY + box * 0.42;
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radiusX);
    gradient.addColorStop(0, `rgba(0, 0, 0, ${0.35 * (1 - 0.5 * lift)})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.save();
    ctx.translate(centerX, groundY);
    ctx.scale(1, radiusY / radiusX);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radiusX, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(centerX, centerY + frame.y * unit);
  ctx.rotate(frame.rotate);
  ctx.scale(frame.scale * frame.scaleX, frame.scale);
  ctx.globalAlpha = clamp01(frame.opacity);
  ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.restore();

  if (settings.shine) {
    const shinePeriod = 1.8;
    const progress = ((time % shinePeriod) + shinePeriod) % shinePeriod / shinePeriod;
    if (progress < 0.75) {
      const band = box * 0.5;
      const travel = box * 2 + band * 2;
      const position = -box - band + (progress / 0.75) * travel;
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.translate(centerX, centerY);
      ctx.rotate(-Math.PI / 6);
      const gradient = ctx.createLinearGradient(position, 0, position + band, 0);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(-box * 1.5, -box * 1.5, box * 3, box * 3);
      ctx.restore();
    }
  }
};

export const backgroundColor = (background: BackgroundKind): string | null => {
  switch (background) {
    case 'black':
      return '#000000';
    case 'white':
      return '#ffffff';
    case 'chroma':
      return '#00ff00';
    default:
      return null;
  }
};

export const pickVideoMime = (preferAlpha: boolean): string | null => {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates = preferAlpha
    ? ['video/webm;codecs=vp8', 'video/webm;codecs=vp9', 'video/webm', 'video/mp4']
    : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
};

export interface AnimationExportOptions {
  image: HTMLImageElement;
  settings: AnimationSettings;
  size: number;
  background: BackgroundKind;
  fps?: number;
  onProgress?: (progress: number) => void;
}

export interface AnimationExportResult {
  blob: Blob;
  extension: string;
}

export const exportAnimation = async ({
  image,
  settings,
  size,
  background,
  fps = 30,
  onProgress,
}: AnimationExportOptions): Promise<AnimationExportResult> => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');

  const transparent = background === 'transparent';
  const mime = pickVideoMime(transparent);
  if (!mime || typeof canvas.captureStream !== 'function') {
    throw new Error('Video export is not supported in this browser.');
  }

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType: mime });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) chunks.push(event.data);
  };
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  const duration = getLoopDuration(settings);
  const fill = backgroundColor(background);

  recorder.start();
  const start = performance.now();
  await new Promise<void>((resolve) => {
    const frame = (now: number) => {
      const time = (now - start) / 1000;
      if (time >= duration) {
        resolve();
        return;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, size, size);
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fillRect(0, 0, size, size);
      }
      drawMcIconFrame(ctx, size, time, settings, image);
      onProgress?.(Math.min(1, time / duration));
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
  recorder.stop();
  await stopped;
  stream.getTracks().forEach((track) => track.stop());

  const extension = mime.includes('mp4') ? 'mp4' : 'webm';
  return { blob: new Blob(chunks, { type: mime }), extension };
};

export const exportPng = async ({
  image,
  settings,
  size,
  background,
  time,
}: {
  image: HTMLImageElement;
  settings: AnimationSettings;
  size: number;
  background: BackgroundKind;
  time: number;
}): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');
  const fill = backgroundColor(background);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, size, size);
  }
  drawMcIconFrame(ctx, size, time, settings, image);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 0.92));
  if (!blob) throw new Error('Failed to encode PNG.');
  return blob;
};

export const saveBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const sanitizeFilename = (name: string): string =>
  name.replace(/[^a-z0-9-_ ]/gi, '').trim().replace(/\s+/g, '_') || 'icon';
