import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Enhanced glassmorphism skeleton
function SkeletonGlass({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md glass-soft backdrop-blur-sm relative overflow-hidden",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] before:animate-[shimmer_2s_infinite]",
        className
      )}
      {...props}
    />
  )
}

// Card skeleton with glassmorphism
function SkeletonCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("glass-soft rounded-xl p-6 animate-pulse", className)} {...props}>
      <div className="space-y-4">
        <SkeletonGlass className="h-4 w-3/4" />
        <SkeletonGlass className="h-4 w-1/2" />
        <SkeletonGlass className="h-32 w-full" />
        <div className="flex space-x-4">
          <SkeletonGlass className="h-8 w-20" />
          <SkeletonGlass className="h-8 w-20" />
        </div>
      </div>
    </div>
  )
}

export { Skeleton, SkeletonGlass, SkeletonCard }