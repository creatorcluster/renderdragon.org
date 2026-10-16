import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface DiscordPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onNeverShowAgain: () => void;
}

const DiscordPopup = ({ isOpen, onClose, onNeverShowAgain }: DiscordPopupProps) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background border-border">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary">Join our Discord</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Join our Discord server to get the latest updates, share your creations, and connect with other creators.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 flex justify-center">
            <img src="/assets/discord_icon.png" alt="Discord Icon" className="w-16 h-16" />
          </div>
          <DialogFooter className="gap-2 sm:justify-center">
            <Button 
              onClick={() => window.open('https://discord.renderdragon.org', '_blank', 'noopener,noreferrer')}
              className=" bg-primary hover:bg-primary/90"
            >
              Join Now
            </Button>
            <Button onClick={onNeverShowAgain} variant="outline" className="">
              Never Show Again
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default DiscordPopup;
