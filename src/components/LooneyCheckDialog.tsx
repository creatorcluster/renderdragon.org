import { Resource } from '@/types/resources';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LooneyCheckForm from '@/components/LooneyCheckForm';
import { IconShieldCheck } from '@tabler/icons-react';
import { useState } from 'react';
import LooneyRunningCheckDialog from '@/components/LooneyRunningCheckDialog';
import { LooneyHistoryRecord } from '@/types/looney';

interface LooneyCheckDialogProps {
  resource: Resource | null;
  onClose: () => void;
}

const LooneyCheckDialog = ({ resource, onClose }: LooneyCheckDialogProps) => {
  const navigate = useNavigate();
  const [existingJob, setExistingJob] = useState<LooneyHistoryRecord | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  return <><Dialog open={!!resource} onOpenChange={(open) => { if (!open) { setLimitReached(false); onClose(); } }}>
    <DialogContent className="max-h-[92vh] overflow-y-auto custom-scrollbar sm:max-w-4xl  border-2 border-primary">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl">
          <IconShieldCheck className="h-5 w-5 text-primary" /> Check for copyright
        </DialogTitle>
        <DialogDescription>
          Looney will identify the track and research licensing signals before returning its findings.
        </DialogDescription>
      </DialogHeader>
      <LooneyCheckForm initialResource={resource} autoStart onResult={(_, __, ___, jobId) => { onClose(); if (jobId) navigate(`/gappa/check/${encodeURIComponent(jobId)}`); }} onExistingJob={setExistingJob} onLimitReached={() => setLimitReached(true)} onCheckStart={() => setLimitReached(false)} />
       {limitReached && <p className=" border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-300">Two checks are already running. Wait for one to finish before starting another.</p>}
    </DialogContent>
  </Dialog><LooneyRunningCheckDialog record={existingJob} onClose={() => setExistingJob(null)} /></>;
};

export default LooneyCheckDialog;
