import { Skeleton } from "@/components/ui/skeleton";

const VideoCardSkeleton = () => (
  <div className="min-w-[300px] max-w-[300px] rounded-xl border border-border bg-card p-4 space-y-3">
    <Skeleton className="w-full h-[168px] rounded-md" />
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

export default VideoCardSkeleton;