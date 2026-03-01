import React, { useEffect, useState } from 'react';
import { useCreatorPacks } from '@/hooks/useCreatorPacks';
import { Button } from '@/components/ui/button';
import { IconCheck, IconX, IconPackage, IconExternalLink } from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const AdminCreatorPacksManager = () => {
    const { fetchPendingPacks, reviewPack } = useCreatorPacks();
    const [pendingPacks, setPendingPacks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [rejectionReason, setRejectionReason] = useState("");
    const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        loadPendingPacks();
    }, []);

    const loadPendingPacks = async () => {
        setIsLoading(true);
        const packs = await fetchPendingPacks();
        setPendingPacks(packs);
        setIsLoading(false);
    };

    const handleApprove = async (id: string) => {
        const approvedPack = await reviewPack(id, 'approved');
        if (approvedPack) {
            setPendingPacks(prev => prev.filter(p => p.id !== id));
        }
    };

    const handleReject = async () => {
        if (!selectedPackId) return;

        const rejectedPack = await reviewPack(selectedPackId, 'rejected', rejectionReason);
        if (rejectedPack) {
            setPendingPacks(prev => prev.filter(p => p.id !== selectedPackId));
            setIsDialogOpen(false);
            setRejectionReason("");
            setSelectedPackId(null);
        }
    };

    const openRejectDialog = (id: string) => {
        setSelectedPackId(id);
        setRejectionReason("");
        setIsDialogOpen(true);
    };

    if (isLoading) {
        return <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted/20 rounded-xl" />
            <div className="h-20 bg-muted/20 rounded-xl" />
        </div>;
    }

    return (
        <section className="mt-12 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cow-purple/5 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <IconPackage className="h-6 w-6 text-cow-purple" />
                    <h2 className="text-2xl font-vt323">Pending Creator Packs</h2>
                </div>
                <div className="bg-muted px-3 py-1 rounded-full text-sm font-medium">
                    {pendingPacks.length} Pending
                </div>
            </div>

            {pendingPacks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-border/50">
                    <IconPackage className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p>No creator packs are pending review.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {pendingPacks.map(pack => (
                        <div key={pack.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-background border border-border/50 rounded-lg hover:border-cow-purple/30 transition-colors">
                            <div className="flex-1 min-w-0 mb-4 md:mb-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium text-lg truncate">{pack.title}</h3>
                                    <span className="text-xs text-muted-foreground">
                                        by {pack.profiles?.username || 'Unknown'}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                                    {pack.small_description}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>Submitted {formatDistanceToNow(new Date(pack.created_at), { addSuffix: true })}</span>
                                    {pack.external_link && (
                                        <a href={pack.external_link} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-cow-purple transition-colors">
                                            <IconExternalLink className="w-3 h-3 mr-1" />
                                            View Source
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 md:pl-4">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-green-500/30 hover:bg-green-500/10 text-green-500"
                                    onClick={() => handleApprove(pack.id)}
                                >
                                    <IconCheck className="w-4 h-4 mr-1" />
                                    Approve
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-500/30 hover:bg-red-500/10 text-red-500"
                                    onClick={() => openRejectDialog(pack.id)}
                                >
                                    <IconX className="w-4 h-4 mr-1" />
                                    Reject
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="pixel-corners">
                    <DialogHeader>
                        <DialogTitle className="font-vt323 text-2xl">Reject Creator Pack</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this pack. The creator will see this message and can resubmit after making changes.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Textarea
                            placeholder="e.g., The external link is invalid, or the cover image violates our guidelines..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="pixel-input min-h-[100px]"
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="pixel-corners">
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={!rejectionReason.trim()}
                            className="pixel-corners"
                        >
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </section>
    );
};

export default AdminCreatorPacksManager;
