import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  IconDownload,
  IconRefresh,
  IconUpload,
  IconTrash,
  IconPhoto,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BackgroundGenerator = () => {
  const [color, setColor] = useState("#9b87f5");
  const [size, setSize] = useState("1920x1080");
  const [spacing, setSpacing] = useState([10]);
  const [opacity, setOpacity] = useState([100]);
  const [scale, setScale] = useState([100]);
  const [isTransparent, setIsTransparent] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [textures, setTextures] = useState<any[]>([]);
  const [visibleTexturesCount, setVisibleTexturesCount] = useState(40);
  const [selectedTexture, setSelectedTexture] = useState<string | null>(null);
  const [isLoadingTextures, setIsLoadingTextures] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchTextures = async () => {
      try {
        setIsLoadingTextures(true);
        const response = await fetch('https://hamburger-api.powernplant101-c6b.workers.dev/mcicons');
        if (!response.ok) throw new Error('Failed to fetch textures');
        const data = await response.json();
        if (data && data.files) {
          const filteredTextures = data.files.filter((f: any) => f.subcategory === 'textures');
          setTextures(filteredTextures);
        }
      } catch (error) {
        console.error("Error fetching textures:", error);
        toast.error("Failed to load Minecraft Icons textures");
      } finally {
        setIsLoadingTextures(false);
      }
    };

    fetchTextures();
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      // Clear any previously generated image
      setGeneratedImage(null);
    };
    reader.readAsDataURL(file);
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    setGeneratedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const generatePattern = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    canvasWidth: number,
    canvasHeight: number,
    imgSpacing: number,
    imgOpacity: number,
    imgScale: number,
  ) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Set background color
    if (!isTransparent) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Calculate image size while maintaining aspect ratio
    const aspectRatio = img.width / img.height;
    const patternHeight = 100 * (imgScale / 100); // Base pattern size scaled
    const patternWidth = patternHeight * aspectRatio;

    // Calculate spacing
    const spacingPixels = imgSpacing;

    // Set opacity
    ctx.globalAlpha = imgOpacity / 100;

    // Draw pattern
    for (let y = 0; y < canvasHeight; y += patternHeight + spacingPixels) {
      for (let x = 0; x < canvasWidth; x += patternWidth + spacingPixels) {
        ctx.drawImage(img, x, y, patternWidth, patternHeight);
      }
    }

    // Reset opacity
    ctx.globalAlpha = 1;
  };

  // Debounced generation effect
  useEffect(() => {
    const sourceImage = selectedTexture || uploadedImage;
    if (!sourceImage) return;

    const timer = setTimeout(() => {
      handleGenerate();
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [color, size, spacing[0], opacity[0], scale[0], uploadedImage, selectedTexture, isTransparent]);

  const handleGenerate = () => {
    const sourceImage = selectedTexture || uploadedImage;
    if (!sourceImage) return;

    setIsGenerating(true);

    // Create dimensions from size string
    const [width, height] = size.split("x").map((dim) => parseInt(dim, 10));

    // Create an image element from uploaded image
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Enable CORS for canvas
    img.onload = () => {
      // Get canvas
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Get context
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Generate pattern
      generatePattern(ctx, img, width, height, spacing[0], opacity[0], scale[0]);

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL("image/png");
      setGeneratedImage(dataUrl);
      setIsGenerating(false);
    };

    img.onerror = () => {
      setIsGenerating(false);
      // Only toast on error if it's not just a transition state
      console.error("Failed to load image for generation");
    };

    img.src = sourceImage;
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    toast.info("Starting download...", {
      description: "Your background will be downloaded shortly",
    });

    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `minecraft-pattern-background-${size}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Background Generator - Renderdragon</title>
        <meta
          name="description"
          content="Create unique and engaging backgrounds for your Minecraft YouTube thumbnails and channel art with our background generator tool."
        />
        <meta
          property="og:title"
          content="Background Generator - Renderdragon"
        />
        <meta
          property="og:description"
          content="Create unique and engaging backgrounds for your Minecraft YouTube thumbnails and channel art with our background generator tool."
        />
        <meta
          property="og:image"
          content="https://renderdragon.org/ogimg/background.png"
        />
        <meta
          property="og:url"
          content="https://renderdragon.org/background-generator"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Background Generator - Renderdragon"
        />
        <meta
          name="twitter:image"
          content="https://renderdragon.org/ogimg/background.png"
        />
      </Helmet>
      <Navbar />

      <main className="flex-grow pt-24 pb-16 cow-grid-bg">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-minecraftia mb-8 text-center">
              <span className="text-cow-purple">Background</span> Generator
            </h1>

            <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
              Generate custom Minecraft-themed backgrounds for your content.
              Perfect for thumbnails, stream overlays, and channel art.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-6 pixel-card">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Texture</label>
                    <Tabs defaultValue="library" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 pixel-corners h-9 mb-2">
                        <TabsTrigger value="library" className="text-xs">Library</TabsTrigger>
                        <TabsTrigger value="upload" className="text-xs">Upload</TabsTrigger>
                      </TabsList>

                      <TabsContent value="library" className="mt-0">
                        <div className="border border-primary/20 rounded-sm bg-black/10 overflow-hidden">
                          <ScrollArea className="h-48 p-2">
                            {isLoadingTextures ? (
                              <div className="flex flex-col items-center justify-center h-full space-y-2 py-8">
                                <IconRefresh className="h-5 w-5 animate-spin text-cow-purple" />
                                <span className="text-xs text-muted-foreground">Loading icons...</span>
                              </div>
                            ) : (
                              <div className="grid grid-cols-4 gap-2">
                                {textures.slice(0, visibleTexturesCount).map((texture) => (
                                  <button
                                    key={texture.id}
                                    onClick={() => {
                                      setSelectedTexture(texture.url);
                                      setUploadedImage(null);
                                      setGeneratedImage(null);
                                    }}
                                    className={`relative aspect-square border-2 rounded-sm overflow-hidden p-1 transition-all ${selectedTexture === texture.url
                                      ? "border-cow-purple bg-cow-purple/20"
                                      : "border-transparent hover:border-cow-purple/50 bg-white/5"
                                      }`}
                                    title={texture.title}
                                  >
                                    <img
                                      src={texture.url}
                                      alt={texture.title}
                                      loading="lazy"
                                      className="w-full h-full object-contain pixelated"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                            {textures.length > visibleTexturesCount && (
                              <div className="mt-4 flex justify-center pb-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setVisibleTexturesCount(prev => prev + 40)}
                                  className="text-xs pixel-corners h-8"
                                >
                                  Load More ({textures.length - visibleTexturesCount} remaining)
                                </Button>
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                      </TabsContent>

                      <TabsContent value="upload" className="mt-0">
                        <div className="space-y-2">
                          <div className="flex space-x-2 items-center">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              ref={fileInputRef}
                              className="hidden"
                            />
                            <Button
                              onClick={() => {
                                fileInputRef.current?.click();
                                setSelectedTexture(null);
                              }}
                              className="pixel-btn-primary flex-grow flex items-center justify-center space-x-2"
                            >
                              <IconUpload className="h-5 w-5" />
                              <span>Select Image</span>
                            </Button>
                            {uploadedImage && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={clearUploadedImage}
                                className="pixel-corners"
                              >
                                <IconTrash className="h-5 w-5" />
                              </Button>
                            )}
                          </div>
                          {uploadedImage && (
                            <div className="mt-2 relative border border-primary/20 rounded-sm overflow-hidden h-24 bg-black/10">
                              <img
                                src={uploadedImage}
                                alt="Uploaded"
                                className="h-full w-full object-contain"
                              />
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label htmlFor="transparent-mode" className="text-sm font-medium">Transparent Background</label>
                      <Switch
                        id="transparent-mode"
                        checked={isTransparent}
                        onCheckedChange={setIsTransparent}
                      />
                    </div>

                    <div className={`space-y-2 ${isTransparent ? 'opacity-50 pointer-events-none' : ''}`}>
                      <label className="text-sm font-medium">
                        Background Color
                      </label>
                      <div className="flex space-x-2">
                        <Input
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="w-14 h-10 p-1 cursor-pointer border-none"
                          disabled={isTransparent}
                        />
                        <Input
                          type="text"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="pixel-corners flex-grow"
                          disabled={isTransparent}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">Spacing</label>
                      <span className="text-xs text-muted-foreground">
                        {spacing[0]}px
                      </span>
                    </div>
                    <Slider
                      value={spacing}
                      onValueChange={setSpacing}
                      min={0}
                      max={50}
                      step={1}
                      className="pixel-corners"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">Opacity</label>
                      <span className="text-xs text-muted-foreground">
                        {opacity[0]}%
                      </span>
                    </div>
                    <Slider
                      value={opacity}
                      onValueChange={setOpacity}
                      min={10}
                      max={100}
                      step={1}
                      className="pixel-corners"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">Scale</label>
                      <span className="text-xs text-muted-foreground">
                        {scale[0]}%
                      </span>
                    </div>
                    <Slider
                      value={scale}
                      onValueChange={setScale}
                      min={10}
                      max={300}
                      step={5}
                      className="pixel-corners"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Size</label>
                    <Select value={size} onValueChange={setSize}>
                      <SelectTrigger className="pixel-corners">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1920x1080">
                          1920x1080 (16:9)
                        </SelectItem>
                        <SelectItem value="1280x720">
                          1280x720 (16:9)
                        </SelectItem>
                        <SelectItem value="2560x1440">
                          2560x1440 (16:9)
                        </SelectItem>
                        <SelectItem value="3840x2160">
                          3840x2160 (16:9)
                        </SelectItem>
                        <SelectItem value="1080x1080">
                          1080x1080 (1:1)
                        </SelectItem>
                        <SelectItem value="1080x1920">
                          1080x1920 (9:16)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                </div>
              </div>

              <div className="md:col-span-2 pixel-card flex flex-col">
                <div className="mb-4 text-center">
                  <h3 className="text-lg font-vt323">Preview</h3>
                </div>

                <div className="flex-grow flex items-center justify-center bg-black/20 rounded-md overflow-hidden relative min-h-[300px]">
                  {generatedImage ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={generatedImage}
                        alt="Generated background"
                        className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${isGenerating ? 'opacity-50' : 'opacity-100'}`}
                      />
                      {isGenerating && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <IconRefresh className="h-12 w-12 animate-spin text-white drop-shadow-md" />
                        </div>
                      )}
                    </div>
                  ) : (uploadedImage || selectedTexture) ? (
                    <div className="text-center px-4 animate-pulse">
                      <IconRefresh className="h-12 w-12 mx-auto mb-4 animate-spin text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Generating preview...
                      </p>
                    </div>
                  ) : (
                    <div className="text-center px-4">
                      <IconPhoto className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Select a texture or upload an image to start
                      </p>
                    </div>
                  )}

                  <canvas ref={canvasRef} className="hidden"></canvas>
                </div>

                {generatedImage && (
                  <Button
                    onClick={handleDownload}
                    className="mt-4 pixel-btn-primary flex items-center justify-center space-x-2"
                  >
                    <IconDownload className="h-5 w-5" />
                    <span>Download Background</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-12 max-w-2xl mx-auto">
              <h2 className="text-2xl font-minecraftia mb-4 text-center">
                How to Use
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="pixel-card p-6">
                  <div className="h-12 w-12 bg-cow-purple/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="font-vt323 text-xl">1</span>
                  </div>
                  <h3 className="font-vt323 mb-2">Upload</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload your image and adjust settings
                  </p>
                </div>

                <div className="pixel-card p-6">
                  <div className="h-12 w-12 bg-cow-purple/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="font-vt323 text-xl">2</span>
                  </div>
                  <h3 className="font-vt323 mb-2">Adjust</h3>
                  <p className="text-sm text-muted-foreground">
                    Customize spacing, opacity, and color in real-time
                  </p>
                </div>

                <div className="pixel-card p-6">
                  <div className="h-12 w-12 bg-cow-purple/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="font-vt323 text-xl">3</span>
                  </div>
                  <h3 className="font-vt323 mb-2">Download</h3>
                  <p className="text-sm text-muted-foreground">
                    Download your background and use it in your content
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BackgroundGenerator;
