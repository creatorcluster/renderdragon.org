import { useEffect, useRef, useState } from 'react';
import { TextSettings } from '@/types/textGenerator';
import { fontUrlForName } from '@/lib/resourcesRepo';

interface TextPreviewProps {
  settings: TextSettings;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const TextPreview = ({ settings, canvasRef }: TextPreviewProps) => {
  const [fontLoaded, setFontLoaded] = useState(false);
  const patternRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const loadFont = async () => {
      try {
        const fontUrl = fontUrlForName(settings.font);
        const font = new FontFace(settings.font, `url(${fontUrl})`);
        const loadedFont = await font.load();
        document.fonts.add(loadedFont);
        setFontLoaded(true);
      } catch (error) {
        console.error('Error loading font:', error);
      }
    };

    setFontLoaded(false);
    loadFont();
  }, [settings.font]);

  useEffect(() => {
    if (!canvasRef.current || !fontLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.font = `${settings.fontSize}px "${settings.font}"`;
    const metrics = tempCtx.measureText(settings.text);
    const textWidth = metrics.width;
    const textHeight = settings.fontSize;

    canvas.width = textWidth + 300;
    canvas.height = textHeight + 300;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((settings.rotation * Math.PI) / 180);

    if (settings.shadow.enabled) {
      ctx.shadowColor = settings.shadow.color;
      ctx.shadowBlur = settings.shadow.blur;
      ctx.shadowOffsetX = settings.shadow.offsetX;
      ctx.shadowOffsetY = settings.shadow.offsetY;
    }

    ctx.font = `${settings.fontSize}px "${settings.font}"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.imageSmoothingEnabled = false;

    if (settings.color.type === 'solid') {
      ctx.fillStyle = settings.color.value;
    } else if (settings.color.type === 'gradient') {
      let gradient;
      const centerX = 0;
      const centerY = 0;
      const radius = Math.max(textWidth, textHeight) / 2;

      switch (settings.color.gradientType) {
        case 'radial':
          gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
          break;
        case 'conic':
          gradient = ctx.createConicGradient(0, centerX, centerY);
          break;
        default:
          gradient = ctx.createLinearGradient(-textWidth / 2, -textHeight / 2, textWidth / 2, textHeight / 2);
      }

      gradient.addColorStop(0, settings.color.gradientStart || '#ffffff');
      gradient.addColorStop(1, settings.color.gradientEnd || '#000000');
      ctx.fillStyle = gradient;
    } else if (settings.color.type === 'pattern' && patternRef.current) {
      const pattern = ctx.createPattern(patternRef.current, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
      }
    }

    ctx.globalAlpha = settings.color.opacity;

    if (settings.outline.enabled) {
      ctx.strokeStyle = settings.outline.color;
      ctx.lineWidth = settings.outline.width;
    }

    // Handle text curving and character spacing
    const characters = settings.text.split('');
    const totalWidth = textWidth + (characters.length - 1) * settings.characterSpacing;
    const radius = settings.curve || 0;
    const startAngle = -Math.PI / 2;
    const angleStep = (Math.PI * 2) / (characters.length - 1);

    characters.forEach((char, i) => {
      const x = (i * (settings.fontSize + settings.characterSpacing)) - totalWidth / 2;
      const y = radius ? Math.sin(startAngle + i * angleStep) * radius : 0;

      ctx.save();
      ctx.translate(x, y);
      
      if (settings.outline.enabled) {
        ctx.strokeText(char, 0, 0);
      }
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [settings, canvasRef, fontLoaded, patternRef]);

  return (
    <canvas
      ref={canvasRef}
      className="max-w-full h-auto"
      style={{ imageRendering: 'crisp-edges' }}
    />
  );
};

export default TextPreview; 