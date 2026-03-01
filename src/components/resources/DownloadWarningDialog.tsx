import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { IconAlertTriangle, IconExternalLink } from '@tabler/icons-react';

interface DownloadWarningDialogProps {
    isOpen: boolean;
    onClose: () => void;
    downloadUrl: string;
}

const DownloadWarningDialog: React.FC<DownloadWarningDialogProps> = ({ isOpen, onClose, downloadUrl }) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive font-geist">
                        <IconAlertTriangle className="h-5 w-5" />
                        External Link Warning
                    </DialogTitle>
                    <DialogDescription className="space-y-4 pt-4">
                        <p>
                            You are about to leave RenderDragon and visit an external site to download this creator pack.
                        </p>
                        <div className="bg-muted p-3 rounded-md border border-border/50 text-sm font-mono break-all leading-tight">
                            {downloadUrl}
                        </div>
                        <p className="text-sm">
                            We cannot guarantee the safety of external content. Please exercise caution and ensure you trust the source before downloading any files.
                        </p>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                    <Button variant="outline" onClick={onClose} className="pixel-corners w-full sm:w-auto">
                        Cancel
                    </Button>
                    <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto" onClick={onClose}>
                        <Button className="pixel-corners bg-cow-purple hover:bg-cow-purple/90 w-full sm:w-auto">
                            <IconExternalLink className="mr-2 h-4 w-4" />
                            Continue to Download
                        </Button>
                    </a>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DownloadWarningDialog;
