import { Skeleton } from "@/components/ui/skeleton";

const GuideCardSkeleton = () => (
  <div className=" border border-border p-4 space-y-3">
    <div className="flex justify-between items-start mb-2">
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-6 w-24 rounded-md" />
      </div>
    </div>
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <div className="pt-2">
      <Skeleton className="h-5 w-28" />
    </div>
  </div>
);

export default GuideCardSkeleton;