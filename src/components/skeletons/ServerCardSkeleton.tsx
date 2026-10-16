import { Skeleton } from "@/components/ui/skeleton";

const ServerCardSkeleton = () => (
  <div className="rounded-xl border border-border bg-card p-4 overflow-hidden p-6 flex flex-col h-full space-y-4">
    <div className="flex items-center gap-4">
      <Skeleton className="w-16 h-16 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <Skeleton className="h-10 w-full mt-auto" />
  </div>
);

export default ServerCardSkeleton;