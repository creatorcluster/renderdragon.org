import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const AdminPageSkeleton = () => (
  <div className="space-y-8">
    <div className="flex items-center gap-3">
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-10 w-64" />
    </div>

    <Skeleton className="h-10 w-full max-w-2xl" />

    <Card>
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-full max-w-md" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-[280px] w-full" />
      </CardContent>
    </Card>
  </div>
);

export default AdminPageSkeleton;
