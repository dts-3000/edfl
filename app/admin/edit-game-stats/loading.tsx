import AdminLayout from "@/components/admin/AdminLayout"

export default function Loading() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="h-6 bg-gray-200 rounded w-24 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
