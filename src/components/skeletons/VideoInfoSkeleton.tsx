import { Skeleton } from "@/components/ui/skeleton";

const VideoInfoSkeleton = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-4 mt-8">
      <div className="flex flex-col md:flex-row gap-6">
        <Skeleton className="w-full md:w-1/3 h-48 md:h-auto rounded-lg" />
        <div className="w-full md:w-2/3 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-1/4" />
        </div>
      </div>
      <div className="mt-6">
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <Skeleton className="h-12 w-full mt-6" />
      </div>
    </div>
  );
};

export default VideoInfoSkeleton; 