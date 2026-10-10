import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { IconActivity, IconArrowUpRight } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { LooneyHistoryRecord } from '@/types/looney';

interface LooneyRunningCheckDialogProps {
  record: LooneyHistoryRecord | null;
  onClose: () => void;
}

const LooneyRunningCheckDialog = ({ record, onClose }: LooneyRunningCheckDialogProps) => <Dialog open={!!record} onOpenChange={(open) => !open && onClose()}>
  <DialogContent className="w-[calc(100%-2rem)] max-w-md  border-2 border-primary">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-3 text-base leading-relaxed"><IconActivity className="h-5 w-5 text-primary" /> Check already running</DialogTitle>
      <DialogDescription className="break-words pt-2">This source already has an active Looney check. Starting another one would duplicate the work.</DialogDescription>
    </DialogHeader>
    {record && <div className="min-w-0 space-y-4"><div className=" border border-primary/30 bg-primary/5 p-4"><p className="break-words font-semibold">{record.sourceLabel}</p><p className="mt-2 break-words text-sm text-muted-foreground">{record.progress || 'Looney is researching this source.'}</p></div><Link to={`/gappa/check/${encodeURIComponent(record.jobId)}`} onClick={onClose} className=" inline-flex w-full items-center justify-center gap-2 bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90">Open running check <IconArrowUpRight className="h-4 w-4" /></Link></div>}
  </DialogContent>
</Dialog>;

export default LooneyRunningCheckDialog;
