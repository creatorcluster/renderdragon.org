
import { Resource } from '@/types/resources';
import AudioPlayer from '@/components/AudioPlayer';
import { useState, useEffect } from 'react';
import VideoPlayer from '@/components/VideoPlayer';
import { resolvePlayableUrl } from '@/lib/resourcesRepo';

interface ResourcePreviewProps {
  resource: Resource;
}

const ResourcePreview = ({ resource }: ResourcePreviewProps) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [resource]);

  const downloadURL = resource?.filetype ? resolvePlayableUrl(resource) || '' : '';

  if (!downloadURL) {
    return <p>No preview available</p>;
  }

  if (resource.category === 'music' || resource.category === 'sfx' || resource.category === 'mcsounds') {
    return <AudioPlayer src={downloadURL} />;
  }

  if (resource.category === 'animations') {
    return (
      <VideoPlayer
        src={downloadURL}
        className="w-full aspect-video"
      />
    );
  }

  if (resource.category === 'images' || resource.category === 'minecraft-icons') {
    return (
      <div className="rounded-md overflow-hidden bg-muted border border-border">
        <img
          src={resource.image_url || downloadURL}
          alt={resource.title}
          className="w-full h-full object-contain max-h-[400px]"
          loading="lazy"
        />
      </div>
    );
  }

  if (resource.category === 'fonts') {
    return (
      <div
        style={{
          fontFamily: resource.title,
          fontSize: '2rem',
          textAlign: 'center',
          padding: '1rem',
          color: 'white',
          backgroundColor: '#374151',
          borderRadius: 0,
        }}
      >
        The quick brown fox jumps over the lazy dog.
        <div className="text-xs mt-2 opacity-70">
          Font: {resource.title}
        </div>
      </div>
    );
  }

  if (resource.category === 'presets') {
    if (hasError) {
      return (
        <div className="p-4 text-center rounded-md bg-muted border border-border">
          <p>Sorry, there's no preview for this preset.</p>
          <p className="text-sm text-muted-foreground mt-2">
            You can help out creating previews for presets by joining our Discord!
          </p>
          <div className="flex gap-4 justify-center mt-4 pt-3">
            <a
              href="https://discord.renderdragon.org"
              target="_blank"
              rel="noopener"
              className="px-4 py-2 bg-primary text-primary-foreground chamfer font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <img className='w-5 h-5' src="/assets/discord_icon.png" alt="Discord"></img>
              Join our Discord
            </a>
          </div>
        </div>
      );
    }

    return (
      <VideoPlayer
        src={downloadURL}
        className="w-full aspect-video"
      />
    );
  }

  return <p>Preview not available for this type.</p>;
};

export default ResourcePreview;