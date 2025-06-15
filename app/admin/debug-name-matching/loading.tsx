import AdminLayout from "@/components/admin/AdminLayout"

export default function Loading() {
  return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading debug tool...</p>
        </div>
      </div>
    </AdminLayout>
  )
}
