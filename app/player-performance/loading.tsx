export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
        <div className="bg-gray-200 rounded h-32 mb-6"></div>
        <div className="bg-gray-200 rounded h-64"></div>
      </div>
    </div>
  )
}
