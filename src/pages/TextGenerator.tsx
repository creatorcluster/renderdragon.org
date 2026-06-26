import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { IconDownload, IconUpload } from '@tabler/icons-react';
import { useResources } from '@/hooks/useResources';
import { Resource } from '@/types/resources';
import { TextSettings } from '@/types/textGenerator';
import TextPreview from '@/components/text-generator/TextPreview';
import { toast } from 'sonner';
import TextGeneratorControlsSkeleton from '@/components/skeletons/TextGeneratorControlsSkeleton';

const TextGenerator = () => {
  const { resources, isLoading: isLoadingResources, handleCategoryChange } = useResources();
  const [fonts, setFonts] = useState<Resource[]>([]);

  // Load fonts on mount
  useEffect(() => {
    handleCategoryChange('fonts');
  }, [handleCategoryChange]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [settings, setSettings] = useState<TextSettings>({
    text: 'Renderdragon',
    font: 'Minecraft',
    fontSize: 21,
    lineHeight: 1.2,
    characterSpacing: 0,
    rotation: 0,
    curve: 0,
    shadow: {
      enabled: false,
      offsetX: 2,
      offsetY: 2,
      blur: 2,
      color: '#000000',
    },
    outline: {
      enabled: false,
      width: 1,
      color: '#000000',
    },
    color: {
      type: 'solid',
      value: '#ffffff',
      gradientType: 'linear',
      gradientStart: '#ffffff',
      gradientEnd: '#000000',
      opacity: 1,
    },
  });

  useEffect(() => {
    // Filter fonts from resources
    const fontResources = resources.filter(r => r.category === 'fonts');
    setFonts(fontResources);
  }, [resources]);

  const handleTextChange = (value: string) => {
    setSettings(prev => ({ ...prev, text: value }));
  };

  const handleFontChange = (value: string) => {
    setSettings(prev => ({ ...prev, font: value }));
  };

  const handleColorTypeChange = (value: 'solid' | 'gradient') => {
    setSettings(prev => ({
      ...prev,
      color: { ...prev.color, type: value }
    }));
  };

  const handleDownload = async () => {
    if (!canvasRef.current) return;

    try {
      // Create a temporary link element
      const link = document.createElement('a');
      link.download = 'minecraft-text.png';
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.current?.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      });

      // Create object URL and trigger download
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.click();

      // Clean up
      URL.revokeObjectURL(url);
      
      toast.success('Text downloaded successfully!');
    } catch (error) {
      console.error('Error downloading text:', error);
      toast.error('Failed to download text. Please try again.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Minecraft Text Generator</title>
        <meta name="description" content="Generate custom Minecraft text with various styles and effects" />
      </Helmet>

      <Navbar />
      
      <main className="flex-grow pt-24 pb-16 cow-grid-bg custom-scrollbar">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-minecraftia mb-8 text-center">
              <span className="text-cow-purple">Minecraft</span> Text Generator
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Preview Section */}
              <div className="pixel-card p-6 bg-black/50 min-h-[400px] flex items-center ">
                <TextPreview settings={settings} canvasRef={canvasRef} />
              </div>

              {/* Controls Section */}
              {isLoadingResources ? <TextGeneratorControlsSkeleton /> : (
              <div className="space-y-6">
                {/* Text Input */}
                <div className="space-y-2">
                  <Label>Text</Label>
                  <Input
                    value={settings.text}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="Enter your text..."
                  />
                </div>

                {/* Font Selection */}
                <div className="space-y-2">
                  <Label>Font</Label>
                  <Select value={settings.font} onValueChange={handleFontChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a font" />
                    </SelectTrigger>
                    <SelectContent>
                      {fonts.map((font) => (
                        <SelectItem key={font.id} value={font.title}>
                          {font.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Font Size */}
                <div className="space-y-2">
                  <Label>Font Size: {settings.fontSize}px</Label>
                  <Slider
                    value={[settings.fontSize]}
                    onValueChange={([value]) => setSettings(prev => ({ ...prev, fontSize: value }))}
                    min={8}
                    max={128}
                    step={1}
                  />
                </div>

                {/* Line Height */}
                <div className="space-y-2">
                  <Label>Line Height: {settings.lineHeight}</Label>
                  <Slider
                    value={[settings.lineHeight]}
                    onValueChange={([value]) => setSettings(prev => ({ ...prev, lineHeight: value }))}
                    min={0.8}
                    max={2}
                    step={0.1}
                  />
                </div>

                {/* Character Spacing */}
                <div className="space-y-2">
                  <Label>Character Spacing: {settings.characterSpacing}px</Label>
                  <Slider
                    value={[settings.characterSpacing]}
                    onValueChange={([value]) => setSettings(prev => ({ ...prev, characterSpacing: value }))}
                    min={-5}
                    max={20}
                    step={1}
                  />
                </div>

                {/* Rotation */}
                <div className="space-y-2">
                  <Label>Rotation: {settings.rotation}°</Label>
                  <Slider
                    value={[settings.rotation]}
                    onValueChange={([value]) => setSettings(prev => ({ ...prev, rotation: value }))}
                    min={-180}
                    max={180}
                    step={1}
                  />
                </div>

                {/* Curve */}
                <div className="space-y-2">
                  <Label>Curve: {settings.curve}°</Label>
                  <Slider
                    value={[settings.curve]}
                    onValueChange={([value]) => setSettings(prev => ({ ...prev, curve: value }))}
                    min={-180}
                    max={180}
                    step={1}
                  />
                </div>

                {/* Shadow Controls */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.shadow.enabled}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({
                          ...prev,
                          shadow: { ...prev.shadow, enabled: checked }
                        }))
                      }
                    />
                    <Label>Shadow</Label>
                  </div>

                  {settings.shadow.enabled && (
                    <div className="space-y-4 pl-6">
                      <div className="space-y-2">
                        <Label>Shadow Offset X: {settings.shadow.offsetX}px</Label>
                        <Slider
                          value={[settings.shadow.offsetX]}
                          onValueChange={([value]) =>
                            setSettings(prev => ({
                              ...prev,
                              shadow: { ...prev.shadow, offsetX: value }
                            }))
                          }
                          min={-20}
                          max={20}
                          step={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Shadow Offset Y: {settings.shadow.offsetY}px</Label>
                        <Slider
                          value={[settings.shadow.offsetY]}
                          onValueChange={([value]) =>
                            setSettings(prev => ({
                              ...prev,
                              shadow: { ...prev.shadow, offsetY: value }
                            }))
                          }
                          min={-20}
                          max={20}
                          step={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Shadow Blur: {settings.shadow.blur}px</Label>
                        <Slider
                          value={[settings.shadow.blur]}
                          onValueChange={([value]) =>
                            setSettings(prev => ({
                              ...prev,
                              shadow: { ...prev.shadow, blur: value }
                            }))
                          }
                          min={0}
                          max={20}
                          step={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Shadow Color</Label>
                        <Input
                          type="color"
                          value={settings.shadow.color}
                          onChange={(e) =>
                            setSettings(prev => ({
                              ...prev,
                              shadow: { ...prev.shadow, color: e.target.value }
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Outline Controls */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.outline.enabled}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({
                          ...prev,
                          outline: { ...prev.outline, enabled: checked }
                        }))
                      }
                    />
                    <Label>Outline</Label>
                  </div>

                  {settings.outline.enabled && (
                    <div className="space-y-4 pl-6">
                      <div className="space-y-2">
                        <Label>Outline Width: {settings.outline.width}px</Label>
                        <Slider
                          value={[settings.outline.width]}
                          onValueChange={([value]) =>
                            setSettings(prev => ({
                              ...prev,
                              outline: { ...prev.outline, width: value }
                            }))
                          }
                          min={1}
                          max={10}
                          step={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Outline Color</Label>
                        <Input
                          type="color"
                          value={settings.outline.color}
                          onChange={(e) =>
                            setSettings(prev => ({
                              ...prev,
                              outline: { ...prev.outline, color: e.target.value }
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Color Controls */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Color Type</Label>
                    <Select
                      value={settings.color.type}
                      onValueChange={(value: 'solid' | 'gradient') => handleColorTypeChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select color type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Solid Color</SelectItem>
                        <SelectItem value="gradient">Gradient</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {settings.color.type === 'solid' && (
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Input
                        type="color"
                        value={settings.color.value}
                        onChange={(e) =>
                          setSettings(prev => ({
                            ...prev,
                            color: { ...prev.color, value: e.target.value }
                          }))
                        }
                      />
                    </div>
                  )}

                  {settings.color.type === 'gradient' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Label>Gradient Type</Label>
                        <Select
                          value={settings.color.gradientType || 'linear'}
                          onValueChange={(value) => setSettings(prev => ({
                            ...prev,
                            color: {
                              ...prev.color,
                              gradientType: value as 'linear' | 'radial' | 'conic'
                            }
                          }))}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select gradient type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="linear">Linear</SelectItem>
                            <SelectItem value="radial">Radial</SelectItem>
                            <SelectItem value="conic">Conic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={settings.color.gradientStart || '#ffffff'}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                color: {
                                  ...prev.color,
                                  gradientStart: e.target.value
                                }
                              }))}
                              className="w-12 h-10 p-1"
                            />
                            <Input
                              type="text"
                              value={settings.color.gradientStart || '#ffffff'}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                color: {
                                  ...prev.color,
                                  gradientStart: e.target.value
                                }
                              }))}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>End Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={settings.color.gradientEnd || '#000000'}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                color: {
                                  ...prev.color,
                                  gradientEnd: e.target.value
                                }
                              }))}
                              className="w-12 h-10 p-1"
                            />
                            <Input
                              type="text"
                              value={settings.color.gradientEnd || '#000000'}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                color: {
                                  ...prev.color,
                                  gradientEnd: e.target.value
                                }
                              }))}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Opacity: {settings.color.opacity}</Label>
                    <Slider
                      value={[settings.color.opacity]}
                      onValueChange={([value]) =>
                        setSettings(prev => ({
                          ...prev,
                          color: { ...prev.color, opacity: value }
                        }))
                      }
                      min={0}
                      max={1}
                      step={0.1}
                    />
                  </div>
                </div>

                {/* Download Button */}
                <Button
                  className="w-full pixel-corners bg-cow-purple hover:bg-cow-purple/80"
                  onClick={handleDownload}
                >
                  <IconDownload className="h-4 w-4 mr-2" />
                  Download Text
                </Button>
              </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default TextGenerator;