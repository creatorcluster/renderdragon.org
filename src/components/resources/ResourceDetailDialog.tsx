import { useState, useEffect, useCallback } from 'react';
import { Resource } from '@/types/resources';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ResourcePreview from './ResourcePreview';
import { IconDownload, IconCopy, IconCheck, IconBrandGithub, IconMusic, IconPhoto, IconVideo, IconFileText, IconFileMusic, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResourceDetailDialogProps {
  resource: Resource | null;
  onClose: () => void;
  onDownload: (resource: Resource) => void;
  loadedFonts: string[];
  setLoadedFonts: (fonts: string[]) => void;
  filteredResources: Resource[]; // Add this prop
  onSelectResource: (resource: Resource) => void; // Add this prop
  isFavoritesView?: boolean; // Added prop to indicate favorites view
}

const ResourceDetailDialog = ({
  resource,
  onClose,
  onDownload,
  loadedFonts,
  setLoadedFonts,
  filteredResources,
  onSelectResource,
  isFavoritesView = false // Added prop to indicate favorites view
}: ResourceDetailDialogProps) => {
  const [copied, setCopied] = useState(false);
  const isMobile = useIsMobile();

  const currentIndex = resource ? filteredResources.findIndex(r => r.id === resource.id) : -1;
  const hasPrevious = !isFavoritesView && currentIndex > 0;
  const hasNext = !isFavoritesView && currentIndex < filteredResources.length - 1;

  const handlePrevious = useCallback(() => {
    if (hasPrevious && resource) {
      onSelectResource(filteredResources[currentIndex - 1]);
    }
  }, [hasPrevious, resource, filteredResources, currentIndex, onSelectResource]);

  const handleNext = useCallback(() => {
    if (hasNext && resource) {
      onSelectResource(filteredResources[currentIndex + 1]);
    }
  }, [hasNext, resource, filteredResources, currentIndex, onSelectResource]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!resource || isFavoritesView) return;

      if (e.key === 'ArrowLeft' && hasPrevious) {
        handlePrevious();
      } else if (e.key === 'ArrowRight' && hasNext) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resource, hasPrevious, hasNext, handlePrevious, handleNext, isFavoritesView]);

  // Update the font URL logic to append '__{creditName}' for resources with credit
  useEffect(() => {
    if (resource?.category === 'fonts' && resource.title && !loadedFonts.includes(resource.title)) {
      const titleLowered = resource.title
        .toLowerCase()
        .replace(/ /g, '%20');

      let fontUrl = `https://raw.githubusercontent.com/Yxmura/resources_renderdragon/main/${resource.category}/${titleLowered}`;

      if (resource.credit) {
        const creditName = resource.credit.replace(/ /g, '_');
        fontUrl = `${fontUrl}__${creditName}`;
      }

      fontUrl = `${fontUrl}.${resource.filetype}`;

      const fontFace = new FontFace(resource.title, `url(${fontUrl})`);

      fontFace.load().then((loadedFont) => {
        document.fonts.add(loadedFont);
        setLoadedFonts([...loadedFonts, resource.title]);
      }).catch(err => {
        console.error('Error loading font:', err);
      });
    }
  }, [resource, loadedFonts, setLoadedFonts]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'music':
        return <IconMusic className="h-5 w-5" />;
      case 'sfx':
        return <IconFileMusic className="h-5 w-5" />;
      case 'images':
        return <IconPhoto className="h-5 w-5" />;
      case 'animations':
        return <IconVideo className="h-5 w-5" />;
      case 'fonts':
        return <IconFileText className="h-5 w-5" />;
      case 'presets':
        return <IconFileText className="h-5 w-5" />;
      case 'mcsounds':
        return <IconFileMusic className="h-5 w-5" />;
      default:
        return <IconFileText className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'music':
        return 'bg-blue-500/10 text-blue-500';
      case 'sfx':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'images':
        return 'bg-purple-500/10 text-purple-500';
      case 'animations':
        return 'bg-red-500/10 text-red-500';
      case 'fonts':
        return 'bg-green-500/10 text-green-500';
      case 'presets':
        return 'bg-gray-500/10 text-gray-500';
      case 'mcsounds':
        return 'bg-teal-500/10 text-teal-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const copyCredit = () => {
    if (!resource?.credit) return;

    const creditText = `Music by ${resource.credit}`;
    navigator.clipboard.writeText(creditText);
    setCopied(true);
    toast.success('Credit copied to clipboard!');

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const getGithubURL = (resource: Resource) => {
    if (!resource || !resource.filetype) return '';

    const titleLowered = resource.title
      .toLowerCase()
      .replace(/ /g, '%20');

    return `https://github.com/Yxmura/resources_renderdragon/blob/main/${resource.category}/${titleLowered}__${resource.credit}.${resource.filetype}`;
  };

  if (!resource) return null;

  return (
    <Dialog open={!!resource} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl pixel-corners border-2 border-cow-purple max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-2xl font-vt323">
            {resource.title}
          </DialogTitle>
          <DialogDescription asChild className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={getCategoryColor(resource.category || '')}
              >
                {getCategoryIcon(resource.category || '')}
                <span className="ml-1 capitalize">{resource.category}</span>
                {resource.subcategory && (
                  <span className="ml-1">({resource.subcategory})</span>
                )}
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="border border-border rounded-md p-4">
            <h4 className="font-vt323 text-lg mb-1">Attribution</h4>

            {resource.credit ? (
              <div className="space-y-2">
                <p className="text-sm text-orange-500 flex items-center">
                  <span className="mr-2">⚠️</span>
                  Please credit this author in your description:
                </p>

                <div className="flex items-center">
                  <code className="bg-muted px-2 py-1 rounded text-sm flex-grow">
                    Credit: {resource.credit}
                  </code>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyCredit}
                    className="ml-2 h-8 flex items-center gap-1 pixel-corners"
                  >
                    {copied ? (
                      <>
                        <IconCheck className="h-3.5 w-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <IconCopy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center text-green-500">
                <IconCheck className="h-5 w-5 mr-2" />
                <span>
                  No attribution required! You're free to use this resource
                  without crediting.
                </span>
              </div>
            )}
          </div>

          <ResourcePreview resource={resource} />

          <div className={`flex items-center gap-2 ${isFavoritesView ? 'justify-center' : 'justify-between'}`}>
            {!isFavoritesView && (
              <Button
                variant="outline"
                className={`${!hasPrevious ? 'opacity-0 pointer-events-none' : 'opacity-70 hover:opacity-100'} transition-opacity`}
                onClick={handlePrevious}
                disabled={!hasPrevious}
              >
                <IconChevronLeft className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Previous</span>
                <span className="sr-only">Previous resource</span>
              </Button>
            )}

            <Button
              onClick={() => onDownload(resource)}
              className="pixel-btn-primary flex items-center justify-center gap-2"
            >
              <IconDownload className="h-5 w-5" />
              <span>Download Resource</span>
            </Button>

            {!isFavoritesView && (
              <Button
                variant="outline"
                className={`${!hasNext ? 'opacity-0 pointer-events-none' : 'opacity-70 hover:opacity-100'} transition-opacity`}
                onClick={handleNext}
                disabled={!hasNext}
              >
                <span className="hidden md:inline">Next</span>
                <IconChevronRight className="h-4 w-4 md:ml-2" />
                <span className="sr-only">Next resource</span>
              </Button>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By downloading, you agree to our terms of use. Crediting
            "Renderdragon" is optional but appreciated!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResourceDetailDialog;