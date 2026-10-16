import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse chamfer bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
