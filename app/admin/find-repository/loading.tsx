export default function Loading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mt-2 animate-pulse"></div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="border rounded-lg p-6">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-44 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-52 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-56 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-full mt-4 animate-pulse"></div>
        </div>

        <div className="border rounded-lg p-6">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-40 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-44 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-52 animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-6">
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-64 animate-pulse mb-4"></div>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-64 animate-pulse mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-40 animate-pulse mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-72 animate-pulse mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-56 animate-pulse"></div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 bg-gray-200 rounded w-14 animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-44 animate-pulse mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-52 animate-pulse mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
