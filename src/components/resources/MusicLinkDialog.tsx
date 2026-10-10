import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Resource } from '@/types/resources';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconCheck, IconCopy, IconExternalLink, IconLink } from '@tabler/icons-react';

interface MusicLinkDialogProps {
  resource: Resource | null;
  link: string;
  onClose: () => void;
}

const MusicLinkDialog = ({ resource, link, onClose }: MusicLinkDialogProps) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [link]);

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Music link copied');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the link. Select it manually instead.');
    }
  };

  const openLink = () => {
    if (!link) return;
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={!!resource} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className=" border border-border sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <IconLink className="h-5 w-5 text-primary" /> Music link
          </DialogTitle>
          <DialogDescription>
            Share this link with others or use RenderBot to check copyright.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={link}
              className=" font-mono text-xs"
              onFocus={(event) => event.currentTarget.select()}
              aria-label="Generated music link"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className=" shrink-0"
              onClick={copyLink}
              aria-label="Copy music link"
            >
              {copied ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
            </Button>
          </div>

          <Button type="button" className="w-full" onClick={openLink}>
            <IconExternalLink className="mr-2 h-4 w-4" /> Open link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MusicLinkDialog;
