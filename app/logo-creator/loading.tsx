import { Skeleton } from "@/components/ui/skeleton"

export default function LogoCreatorLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Skeleton className="h-10 w-3/4 mx-auto mb-2" />
          <Skeleton className="h-6 w-2/4 mx-auto" />
        </div>

        <div className="flex flex-col lg:flex-row gap-6 w-full">
          {/* Logo Preview Skeleton */}
          <div className="w-full lg:w-1/2">
            <Skeleton className="h-[500px] w-full rounded-lg" />
            <div className="flex justify-center gap-3 mt-4">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>

          {/* Editor Controls Skeleton */}
          <div className="w-full lg:w-1/2">
            <Skeleton className="h-[500px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
