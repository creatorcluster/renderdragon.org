import { Skeleton } from "@/components/ui/skeleton";

const PlayerRenderSkeleton = () => (
  <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
    <Skeleton className="h-6 w-1/2 mx-auto mb-2" />
    <div className="aspect-square relative">
      <Skeleton className="w-full h-full" />
    </div>
    <div className="p-4 flex gap-2 mt-auto">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-10" />
    </div>
  </div>
);

export default PlayerRenderSkeleton;