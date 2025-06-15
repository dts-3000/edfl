import AdminLayout from "@/components/admin/AdminLayout"

export default function Loading() {
  return (
    <AdminLayout>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading debug collections...</p>
        </div>
      </div>
    </AdminLayout>
  )
}
