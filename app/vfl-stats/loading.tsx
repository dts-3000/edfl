export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">VFL Stats</h1>
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="w-24 h-10 bg-gray-200 animate-pulse rounded"></div>
          ))}
        </nav>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col space-y-4">
          <div className="h-10 bg-gray-200 animate-pulse rounded w-full"></div>
          <div className="h-10 bg-gray-200 animate-pulse rounded w-full"></div>
          <div className="h-64 bg-gray-200 animate-pulse rounded w-full"></div>
        </div>
      </div>
    </div>
  )
}
