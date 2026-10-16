import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const AccountPageSkeleton = () => (
  <div className="max-w-2xl mx-auto">
    <div className="flex items-center gap-3 mb-8">
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-10 w-64" />
    </div>

    <Card className=" border-2 border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-5 w-52" />
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-6 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
        <Separator />
        <div className="flex justify-between gap-4 pt-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </CardContent>
    </Card>
  </div>
);

export default AccountPageSkeleton;