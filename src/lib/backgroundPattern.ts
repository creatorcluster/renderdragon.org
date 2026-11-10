import { createRandom } from "./textureSearch";

export type PatternType = "grid" | "staggered" | "diagonal" | "scattered" | "random";

export interface PatternImage {
  image: HTMLImageElement;
}

export interface DrawPatternOptions {
  images: PatternImage[];
  width: number;
  height: number;
  spacing: number;
  opacity: number;
  scale: number;
  type: PatternType;
  seed: number;
  rotation: number;
  color: string;
  isTransparent: boolean;
  horizontalOffset?: number;
  motionPadding?: number;
}

export const drawPattern = (
  ctx: CanvasRenderingContext2D,
  options: DrawPatternOptions,
) => {
  const {
    images,
    width: canvasWidth,
    height: canvasHeight,
    spacing: imgSpacing,
    opacity: imgOpacity,
    scale: imgScale,
    type,
    seed,
    rotation: rotationDegrees,
    color,
    isTransparent,
    horizontalOffset = 0,
    motionPadding = 0,
  } = options;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  if (!isTransparent) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  const random = createRandom(seed);
  const spacingPixels = imgSpacing;
  const baseHeight = Math.max(12, 100 * (imgScale / 100));
  const sizes = images.map((source) => {
    const aspectRatio = source.image.width / source.image.height || 1;
    return { width: baseHeight * aspectRatio, height: baseHeight };
  });
  ctx.save();
  ctx.translate(horizontalOffset, 0);

  const drawTile = (sourceIndex: number, x: number, y: number, width: number, height: number, tileRotation = 0) => {
    const source = images[sourceIndex % images.length];
    ctx.save();
    ctx.globalAlpha = imgOpacity / 100;
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate((rotationDegrees * Math.PI) / 180 + tileRotation);
    ctx.drawImage(source.image, -width / 2, -height / 2, width, height);
    ctx.restore();
  };

  const maxWidth = Math.max(...sizes.map(({ width }) => width));
  const areaScale = Math.sqrt((canvasWidth * canvasHeight) / (1920 * 1080));
  const minimumStep = Math.max(12, areaScale * 12);
  const horizontalStep = Math.max(minimumStep, maxWidth + spacingPixels);
  const verticalStep = Math.max(minimumStep, baseHeight + spacingPixels);
  const randomOrder = images.map((_, index) => index);
  for (let index = randomOrder.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [randomOrder[index], randomOrder[swapIndex]] = [randomOrder[swapIndex], randomOrder[index]];
  }
  let tileIndex = 0;

  const drawStructuredTile = (sourceIndex: number, x: number, y: number) => {
    const { width, height } = sizes[sourceIndex];
    const rotationRadians = (rotationDegrees * Math.PI) / 180;
    const rotatedWidth = Math.abs(width * Math.cos(rotationRadians)) + Math.abs(height * Math.sin(rotationRadians));
    const rotatedHeight = Math.abs(width * Math.sin(rotationRadians)) + Math.abs(height * Math.cos(rotationRadians));
    const fit = Math.min(1, maxWidth / rotatedWidth, baseHeight / rotatedHeight);
    const drawWidth = width * fit;
    const drawHeight = height * fit;
    drawTile(
      sourceIndex,
      x + (maxWidth - drawWidth) / 2,
      y + (baseHeight - drawHeight) / 2,
      drawWidth,
      drawHeight,
    );
  };

  if (type === "random") {
    for (let y = -baseHeight - motionPadding; y < canvasHeight + baseHeight + motionPadding; y += verticalStep) {
      for (let x = -maxWidth - motionPadding; x < canvasWidth + maxWidth + motionPadding; x += horizontalStep) {
        const sourceIndex = randomOrder[tileIndex % randomOrder.length];
        const { width, height } = sizes[sourceIndex];
         drawTile(sourceIndex, x, y, width, height);
        tileIndex += 1;
      }
    }
    ctx.restore();
    return;
  }

  if (type === "scattered") {
    for (let row = 0, y = -baseHeight - motionPadding; y < canvasHeight + baseHeight + motionPadding; row += 1, y += verticalStep) {
      const rowOffset = (row % 2) * horizontalStep * 0.25;
      for (let x = -maxWidth - motionPadding + rowOffset; x < canvasWidth + maxWidth + motionPadding; x += horizontalStep) {
         const sourceIndex = randomOrder[tileIndex % randomOrder.length];
         drawStructuredTile(sourceIndex, x, y);
        tileIndex += 1;
      }
    }
    ctx.restore();
    return;
  }

  for (let row = 0, y = -baseHeight - motionPadding; y < canvasHeight + baseHeight + motionPadding; row += 1, y += verticalStep) {
    const rowOffset = type === "staggered"
      ? (row % 2) * horizontalStep / 2
      : type === "diagonal"
        ? (row * horizontalStep * 0.35) % horizontalStep
        : 0;

    for (let x = -maxWidth - motionPadding + rowOffset; x < canvasWidth + maxWidth + motionPadding; x += horizontalStep) {
      const sourceIndex = randomOrder[tileIndex % randomOrder.length];
      drawStructuredTile(sourceIndex, x, y);
      tileIndex += 1;
    }
  }
  ctx.restore();
};
