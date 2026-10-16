import { Skeleton } from "@/components/ui/skeleton";

const ResourceCardSkeleton = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <Skeleton className="aspect-video w-full rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
};

export default ResourceCardSkeleton;